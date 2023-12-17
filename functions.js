/* const readline = require('readline');
const cli = require('./cli-commands')
const utils = require('./utils')
const Table = require('cli-table');
const chalk = require('chalk'); */
import readline from 'readline';
import cli from './cli-commands.js';
import utils from './utils.js';
import Table from 'cli-table';
import chalk from 'chalk';
import boxen from 'boxen';
import commands from './commands.js';

const fn = {
  //* check si une mise à jour est disponible (en fonction de plusieurs paramètres)
  checkUpdate: async() => {
    //* date de la dernière vérification d'une mise à jour
    const lastCheckUpdate = new Date(utils.getConfigValue('LAST_CHECK_UPDATE'))
    //* temps (en heure) avant la prochaine vérification d'une mise à jour
    const timeBeforeCheckUpdate = utils.getConfigValue('TIME_BEFORE_CHECK_UPDATE')
    //* flag pour dire si on vérifie ou non qu'une mise à jour est disponible
    const requireUpdate = utils.getConfigValue('REQUIRE_UPDATE')

    //* date now
    const dateNow = new Date()

    //* prochaine vérification
    const nextCheckMaj = new Date(lastCheckUpdate.getTime() + timeBeforeCheckUpdate * 60 * 60 * 1000)

    //* si la date est dépassé ou qu'un update est déjà requis, on check la mise à jour jsuqu'à qu'il la fasse enfin
    if (dateNow > nextCheckMaj || requireUpdate) {

      //* on met à jour la date du dernier check
      utils.updateConfig('LAST_CHECK_UPDATE', dateNow)

      const latestVersion = await cli.getLatestVersion()
      const currentVersion = utils.getCurrentVersion()

      await Promise.all([
        utils.updateConfig('CURRENT_VERSION', currentVersion),
        utils.updateConfig('LATEST_VERSION', latestVersion)
      ])

      //* si la version en cours est différente de la dernière version
      if (currentVersion != latestVersion) {
        await utils.updateConfig('REQUIRE_UPDATE', true)
        return true
      } else {
        await utils.updateConfig('REQUIRE_UPDATE', false)
        return false
      }
    }
  },

  //* affiche la version en cours
  displayCurrentVersion: async() => {
    const currentVersion = utils.getConfigValue('CURRENT_VERSION')
    const changelog = utils.getConfigValue('CHANGELOG')

    console.log('')
    console.log(chalk.green.bold(currentVersion))
    console.log(chalk.magenta.bold(changelog))
  },

  //* Affichage personnalisé dans le cas où une mise à jour serait disponible
  displayUpdatePackage: async() => {
    const currentVersion = utils.getConfigValue('CURRENT_VERSION')
    const latestVersion = utils.getConfigValue('LATEST_VERSION')
    const changelog = utils.getConfigValue('CHANGELOG')

    const packageName = 'DTL_RUNPDA'
    const message = `
      ${chalk.bold(packageName)}
      ${chalk.bold(chalk.magenta.bold(changelog))}

      Mise à jour disponible ${currentVersion} -> ${chalk.green.bold(latestVersion)}
      Exécutez ${chalk.blue.bold('npm i -g dtl_runpda')} ou ${chalk.blue.bold('run --update')} pour mettre à jour le package.
    `;

    const options = {
      padding: { top: 0, right: 4, bottom: 0, left: 1 },
      margin: { top: 1, right: 0, bottom: 1, left: 1 },
      borderStyle: 'round',
      borderColor: 'yellow',
      align: 'center'
    }
    console.log(boxen(message, options))
  },

  //* affiche la liste des PDA
  displayPdaList: async() => {
    let pdaList = await cli.getPdaList()

    const table = new Table()
    table.push(
      [
        chalk.bold('Model'),
        chalk.bold('Serial number'),
        chalk.bold('EM version'),
        chalk.bold('Android version')/* ,
        'EM First install',
        'EM Last update' */
      ]
    );

    //* Récupération des informations pour chaque pda
    for (const item of pdaList) {
      const data = []
      data.push(item.model, item.serialNumber, item.emVersion, item.androidVersion)
      table.push(data)
    }

    console.log('')
    console.log(chalk.green.bold('Liste des PDA disponibles : '))
    console.log(table.toString());
  },

  //* Change le PDA par défaut
  displayChangeDefaultPda: async(args) => {
    //* récupération de l'argument
    let newPda = args[0]

    //* récupération de l'ancien pda par défaut
    let oldDefaultPda = utils.getConfigValue('DEFAULT_PDA')

    //* callback d'affichage
    const callback = () => {
      utils.updateConfig('DEFAULT_PDA', newPda)
      console.log('')
      console.log(`Le PDA par défaut a été changé par ${chalk.green.bold(newPda)} (anciennement ${chalk.red.bold(oldDefaultPda)})`)
    }

    try {
      if (newPda != null) {
        callback()  
      } else {
        console.log('')
        newPda = await utils.getUserInput(chalk.bold(`Veuillez inscrire le nouveau PDA à utiliser par défaut`), oldDefaultPda)

        callback()
      }

    } catch(err) {
      console.log(`ERROR : ${err}`)
    }
  },

  //* Affiche la liste des commandes avec éventuellement d'autres informations
  displayHelpCenter: () => {
    const table = new Table()
    table.push([
      chalk.bold(`Nom`),
      chalk.bold(`Commandes (lowerCase)`),
      chalk.bold(`Description`),
      chalk.bold(`Nécessite ADB`),
    ])

    //* on parcours la liste des commandes
    let count = 0
    //* Pour la première commande (run, run pda), on affiche pas le tiret devant la commande vu que c'est le modèle du pda qu'on vient taper
    for (const command of commands) {
      table.push([
        command.name,
        command.args.map(arg => `run ${count > 0 ? '-' : ''}${arg}`).join(', '),
        command.description,
        command.requireAdb ? 'Oui' : 'Non'
      ])
      count++
    }

    console.log('')
    console.log(`Liste des commandes disponibles : `)
    console.log(table.toString())

    //* affichage d'infos supplémentaires
    console.log('')
    console.log(chalk.italic(`Note : Toutes les commandes doivent être taper avec un ou plusieurs tirets au départ, en majuscule comme en minuscule`))
  },

  //* Lance la compilation, avec ou sans arguments
  displayRunPda: async(pda) => {
    //* on va gérer le fait d'avoir un pda sur lequel build ou non
    let pdaToBuild = ''
    if (pda)
      pdaToBuild = pda
    else {
      pdaToBuild = await utils.getUserInput(`Veuillez cibler le PDA`, utils.getConfigValue('DEFAULT_PDA'))
    }
    
    //* on est sur du modèle, on va maintenant le chercher dans la liste des pda disponibles
    //* on récupère la liste des pda
    const pdaList = await cli.getPdaList()

    if (pdaList.length === 0) {
      console.log('')
      console.log(chalk.red(`Aucun appareil n'a été trouvé`))
      return
    }
    
    //* on récupère le ou les pda qui correspondent au modèle qu'on a demandé
    const pdaSelected = pdaList.filter(pda => pda.model.toLowerCase() == pdaToBuild.toLowerCase())

    if (pdaSelected.length === 0) {
      console.log('')
      console.log(chalk.red(`Le PDA sélectionné ${chalk.bold(pdaToBuild)} n'a pas été trouvé`))
      return
    }

    const callback = async(serialNumber) => {
      console.log('')
      console.log(chalk.green(`Lancement de la compilation du PDA ${chalk.bold(pdaSelected[0].model)} - ${chalk.bold(serialNumber)} en cours ...`))
      console.log('')
      cli.runPda(serialNumber)
    }

    //* si on a trouvé plus d'un PDA
    if (pdaSelected.length > 1) {
      const objectSelected = await utils.selectValueIntoArrayObjets(pdaSelected, {
        propsToDisplay: [
          { name: 'Model', prop: 'model' },
          { name: 'Serial number', prop: 'serialNumber' },
          { name: 'EM version', prop: 'emVersion' },
          { name: 'Android version', prop: 'androidVersion' }
        ],
        question: 'Sélectionner un PDA'
      })

      //* on a notre objet sélectionné, on va donc build avec ça
      callback(objectSelected.serialNumber)
    } else {
      callback(pdaSelected[0].serialNumber)
    }

  }
}

export default fn



//* retourne le pda sélectionné si c'est le cas, ou un tableau si il en existe plusieurs
export const getPdaSelected = function(pda) {
  return new Promise(async resolve => {
    const pdaList = []

    //* on récupère la liste des pda connectés
    const deviceList = await cli.getPdaList()

    if (deviceList.length == 0)
      resolve(false)

    for (const item of deviceList) {
      //* on récupère le modele de tous les pda
      let currentModel = await cli.getPdaModel(item)
      currentModel = currentModel.toLowerCase().trim()
      //* est-ce que le pda en cours est le même que celui qu'on a demandé
      if (currentModel.includes(pda)) {
        //* c'est bien lui, on va récupérer toutes ces informations
        const emVersion = await cli.getPdaEMVersion(item)
        const androidVersion = await cli.getPdaAndroidVersion(item)
        pdaList.push({ model: currentModel, serial: item, emVersion, androidVersion })
      }
    }
    resolve(pdaList)
  })
}

//* Désinstalle EasyMobile
export const uninstallEasyMobile = async(args, defaultPda) => {
  //* on récupère la liste des pda
  const deviceList = await cli.getPdaList()

  //* si aucuns pda n'est branché
  if (deviceList.length == 0) {
    console.log('')
    console.log(chalk.bold.red(`Aucun appareil n'a été trouvé.`))
    return false
  }

  let currentPda = ''

  //* est-ce qu'on a donné un argument
  if (args != null && args.length > 0) {
    currentPda = args
  }
  //* sinon on demande
  else {
    const pdaSelected = await utils.getUserInput(`Sur quel PDA souhaitez-vous désinstaller EasyMobile ?`, defaultPda)
    currentPda = pdaSelected
  }

  //* callback qui désinstalle le pda
  const callBackUninstall = (pdaToUninstall) => {
    console.log(chalk.bold.green(`Désinstallation de EasyMobile du PDA ${pdaToUninstall.model}`))
  }

  //* le pda demandé nettoyé
  currentPda = currentPda.toLowerCase().trim()

  //* liste filtré des pda qui correspondent à ce qu'on a demandé (dans le cas où il y aurait 2 modèles identiques)
  let pdaList = await getPdaSelected(currentPda)

  //* pda est un tableau, si le tableau ne possède qu'une ligne, on check si em est installé et ensuite on désinstalle
  /* if (pdaList.length == 1) {
    console.log("%c functions.js #133 || DANS LE IF", 'background:blue;color:#fff;font-weight:bold;');
    const isInstalled = await cli.checkEmInstalled(pdaList)
    console.log("%c functions.js #140 || isInstalled : ", 'background:red;color:#fff;font-weight:bold;', isInstalled);
  }
  //* si le tableau possède plus d'une ligne, on donne le choix à l'utilisateur sur quel pda il souhaite build
  else if (pdaList.length > 1) {
    console.log("%c functions.js #143 || DANS LE ELSE IF", 'background:blue;color:#fff;font-weight:bold;');
    const isInstalled = await cli.checkEmInstalled(pdaList)
    console.log("%c functions.js #140 || isInstalled : ", 'background:red;color:#fff;font-weight:bold;', isInstalled);
  }
  //* si le tableau est vide, on retourne une erreur
  else {
    console.log('')
    console.log(chalk.bold.red(`Le pda ${currentPda} n'a pas été trouvé.`))
    return
  } */
}