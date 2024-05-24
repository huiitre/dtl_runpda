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
import fs from 'fs';
import path from 'path';

const fn = {
  //* lance un stream du pda sélectionné avec l'exécutable 
  launchStreamPda: async(args) => {
    //* on récupère le pda sur lequel on va lancer la recherche
    let pdaToStream = ''
    if (args[0])
      pdaToStream = args[0]
    else {
      pdaToStream = await utils.getUserInput(`Veuillez cibler le PDA`, utils.getConfigValue('DEFAULT_PDA'))
    }

    const pdaSelected = await fn.targetPda(pdaToStream)

    if (pdaSelected != null) {
      console.log('')
      await cli.execScrcpy(pdaSelected.serialNumber)
    }
  },

  //* check si une mise à jour est disponible (en fonction de plusieurs paramètres)
  checkUpdate: async() => {
    utils.log({
      label: `checkUpdate`,
      value: ``,
      level: 0
    })
    //* date de la dernière vérification d'une mise à jour
    const lastCheckUpdate = new Date(utils.getConfigValue('LAST_CHECK_UPDATE'))
    utils.log({
      label: `lastCheckUpdate`,
      value: lastCheckUpdate,
      level: 1
    })
    //* temps (en heure) avant la prochaine vérification d'une mise à jour
    const timeBeforeCheckUpdate = utils.getConfigValue('TIME_BEFORE_CHECK_UPDATE')
    utils.log({
      label: `timeBeforeCheckUpdate`,
      value: timeBeforeCheckUpdate,
      level: 1
    })
    //* flag pour dire si on vérifie ou non qu'une mise à jour est disponible
    const requireUpdate = utils.getConfigValue('REQUIRE_UPDATE')
    utils.log({
      label: `requireUpdate`,
      value: requireUpdate,
      level: 1
    })

    //* date now
    const dateNow = new Date()

    //* prochaine vérification
    const nextCheckMaj = new Date(lastCheckUpdate.getTime() + timeBeforeCheckUpdate * 60 * 60 * 1000)
    utils.log({
      label: `nextCheckMaj`,
      value: nextCheckMaj,
      level: 1
    })

    //* si la date est dépassé ou qu'un update est déjà requis, on check la mise à jour jsuqu'à qu'il la fasse enfin
    if (dateNow > nextCheckMaj || requireUpdate) {
      utils.log({
        label: `La date est dépassé ou requireUpdate est true, on check la maj.requireUpdate`,
        value: requireUpdate,
        level: 0
      })
      console.log('')
      console.log(chalk.blue(`Recherche d'une mise à jour ...`))

      //* on met à jour la date du dernier check
      utils.updateConfig('LAST_CHECK_UPDATE', dateNow)

      const [ latestVersion, currentVersion ] = await Promise.all([
        cli.getLatestVersionFromGit(),
        cli.getCurrentVersion()
      ])

      await Promise.all([
        utils.updateConfig('CURRENT_VERSION', currentVersion),
        utils.updateConfig('LATEST_VERSION', latestVersion)
      ])

      //* si la version en cours est différente de la dernière version
      if (currentVersion < latestVersion) {
        await utils.updateConfig('REQUIRE_UPDATE', true)
        return true
      } else {
        await utils.updateConfig('REQUIRE_UPDATE', false)
        return false
      }
    }
    utils.log({
      label: `fin checkUpdate`,
      value: ``,
      level: 0
    })
  },

  //* affiche la version en cours
  displayCurrentVersion: async() => {
    const currentVersion = await cli.getCurrentVersion()
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
      Exécutez ${chalk.blue.bold(`npm i -g dtl_runpda@${latestVersion}`)} ou ${chalk.blue.bold('run --update')} pour mettre à jour le package.
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
    let pdaList = []
    try {
      pdaList = await cli.getPdaList()
    } catch(err) {
      console.log('error : ' + err)
    }

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
    
    const pdaSelected = await fn.targetPda(pdaToBuild)

    if (pdaSelected != null) {
      console.log('')
      console.log(chalk.green(`Lancement de la compilation du PDA ${chalk.bold(pdaSelected.model)} - ${chalk.bold(pdaSelected.serialNumber)} en cours ...`))
      console.log('')
      cli.runPda(pdaSelected.serialNumber)
    }
  },

  //* permet de clear l'app EM du pda sélectionné
  displayClearEM: async(args) => {
    //* on récupère le pda sur lequel on va lancer la recherche
    let pdaToClear = ''
    if (args[0])
      pdaToClear = args[0]
    else {
      pdaToClear = await utils.getUserInput(`Veuillez cibler le PDA`, utils.getConfigValue('DEFAULT_PDA'))
    }

    const pdaSelected = await fn.targetPda(pdaToClear)

    if (pdaSelected != null) {
      console.log('')
      console.log(chalk.blue(`Clear du PDA ${chalk.bold(pdaSelected.model)} - ${chalk.bold(pdaSelected.serialNumber)} en cours ...`))
      await cli.clearEM(pdaSelected.serialNumber)
      console.log(chalk.green(`Clear du PDA ${chalk.bold(pdaSelected.model)} - ${chalk.bold(pdaSelected.serialNumber)} effectué !`))
      console.log('')
      console.log(chalk.blue(`Lancement de l'application du PDA ${chalk.bold(pdaSelected.model)} - ${chalk.bold(pdaSelected.serialNumber)} en cours ...`))
      await cli.startEM(pdaSelected.serialNumber)
      console.log(chalk.green(`Lancement de l'application du PDA ${chalk.bold(pdaSelected.model)} - ${chalk.bold(pdaSelected.serialNumber)} effectué !`))
    }
  },

  //* désinstallation de easymobile sur le PDA
  displayUninstallEM: async(args) => {
    //* on récupère le pda sur lequel on va lancer la recherche
    let pdaToUninstall = ''
    if (args[0])
      pdaToUninstall = args[0]
    else {
      pdaToUninstall = await utils.getUserInput(`Veuillez cibler le PDA`, utils.getConfigValue('DEFAULT_PDA'))
    }

    const pdaSelected = await fn.targetPda(pdaToUninstall)

    if (pdaSelected != null) {
      console.log('')
      if (pdaSelected.emVersion) {
        console.log(chalk.blue(`Désinstallation de l'application du PDA ${chalk.bold(pdaSelected.model)} - ${chalk.bold(pdaSelected.serialNumber)} en cours ...`))
        await cli.uninstallEM(pdaSelected.serialNumber)
        console.log(chalk.green(`Désinstallation de l'application du PDA ${chalk.bold(pdaSelected.model)} - ${chalk.bold(pdaSelected.serialNumber)} effectué !`))
      } else {
        console.log(chalk.red(`L'application EM n'est pas installé sur le PDA ${chalk.bold(pdaSelected.model)} - ${chalk.bold(pdaSelected.serialNumber)}`))
      }
    }
  },

  //* export la base de donnée easymobile du pda sélectionné
  displayExportEMBDD: async(args) => {
    //* on récupère le pda sur lequel on va lancer la recherche
    let pdaToTreatment = ''
    if (args[0])
      pdaToTreatment = args[0]
    else {
      pdaToTreatment = await utils.getUserInput(`Veuillez cibler le PDA`, utils.getConfigValue('DEFAULT_PDA'))
    }

    const pdaSelected = await fn.targetPda(pdaToTreatment)

    if (pdaSelected != null) {
      console.log('')
      if (pdaSelected.emVersion) {
        //* on récupère le nom du fichier sqlite
        const fileName = await cli.getDatabaseFileNameEasymobile(pdaSelected.serialNumber)

        if (utils.isStringEmpty(fileName)) {
          console.log('')
          console.log(chalk.red(`La base de donnée du PDA ${chalk.bold(pdaSelected.model)} - ${chalk.bold(pdaSelected.serialNumber)} n'a pas été trouvé`))
          return
        }

        const databaseName = `${pdaSelected.model}_${pdaSelected.serialNumber}`

        //* on check si le dossier du pda a été créé ou non
        const appDir = path.join(utils.getConfigValue('APP_DIR'))
        const databaseDir = path.join(appDir, 'database')
        const pdaDir = path.join(databaseDir, pdaSelected.model.toUpperCase())

        /* console.log(chalk.yellow(`Le module est actuellement en maintenance. Une commande a été généré afin de récupérer la base de donnée du PDA sélectionné en collant simplement la ligne dans un invité de commande gitbash (shell).`));
        console.log('') */
        const command = `adb -s ${pdaSelected.serialNumber} exec-out run-as net.distrilog.easymobile cat app_webview/Default/databases/file__0/${fileName} > "${pdaDir}\\${databaseName}"`
        // console.log(chalk.blue.bold(command))

        try {
          //* si le dossier n'est pas créé, on le crée
          if (!fs.existsSync(pdaDir)) {
            fs.mkdirSync(pdaDir)
          }

          utils.log({
            label: `Extraction de la bdd avec la commande adb suivante : `,
            value: `${command}`,
            level: 0
          })

          //* on extrait la base pour la coller dans le dossier
          console.log(chalk.blue(`Récupération de la base de donnée depuis le PDA ${pdaSelected.model} ...`))
          await cli.extractDatabase(pdaSelected.serialNumber, fileName, pdaDir, databaseName)

          console.log(chalk.green(`La base de donnée du PDA ${chalk.bold(pdaSelected.model)} - ${chalk.bold(pdaSelected.serialNumber)} a été exporté avec succès !`))
          console.log(chalk.blue(`Chemin : ${chalk.bold(`${pdaDir}\\${databaseName}`)}`))

        } catch(error) {
          console.log(chalk.red.bold(`Erreur lors de l'extraction de la base de donnée.`))
          console.log('')
          console.log(chalk.blue.bold(`Commande exécuté : `))
          console.log(chalk.blue.bold(command))
          console.log('')
          console.log(chalk.red(`Erreur : ${error}`))
        }
      } else {
        console.log(chalk.red(`L'application EM n'est pas installé sur le PDA ${chalk.bold(pdaSelected.model)} - ${chalk.bold(pdaSelected.serialNumber)}`))
      }
    }
  },

  //* permet de build un apk debug ou release (au choix)
  displayBuildApk: async() => {
    const buildSelected = await utils.selectValueIntoArray(['debug'], 'Sélectionner un type de build', 'selectBuildType')
    await cli.buildApk(buildSelected)
  },

  //* fonction qui cible un pda
  targetPda: async(pdaToTreatment) => {
    //* on récupère la liste des pda
    let pdaList = []
    try {
      pdaList = await cli.getPdaList()
    } catch(err) {

    }

    //* on lance la recherche
    if (pdaList.length === 0) {
      console.log('')
      console.log(chalk.red(`Aucun appareil n'a été trouvé`))
      return null
    }

    //* on récupère le ou les pda qui correspondent au modèle qu'on a demandé
    const pdaSelected = pdaList.filter(pda => pda.model.toLowerCase() == pdaToTreatment.toLowerCase())

    if (pdaSelected.length === 0) {
      console.log('')
      console.log(chalk.red(`Le PDA sélectionné ${chalk.bold(pdaToTreatment)} n'a pas été trouvé`))
      return null
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
      return objectSelected
    } else {
      return pdaSelected[0]
    }
  },

  //* met à jour le package
  cmdUpdatePackage: async() => {
    const requireUpdate = utils.getConfigValue('REQUIRE_UPDATE')
    const latestVersion = utils.getConfigValue('LATEST_VERSION')
    if (requireUpdate)
      await cli.updateLatestVersion(latestVersion)

    console.log(chalk.blue('Aucune mise à jour disponible'))
  },

  //* git manager
  gitManager: async(args) => {
    if (args.length === 0)
      return console.log(chalk.red(`Commande git manquante`))

    if (args.length === 1)
      return console.log(chalk.red(`Nom de la branche manquante`))

    const gitCommand = args[0]
    const branch = args[1]

    const branchList = await cli.getGitBranchList()

    const filteredBranches = branchList.filter(b => b.toLowerCase().includes(branch.toLowerCase()))

    let branchSelected = null

    if (filteredBranches.length === 0)
      return console.log(chalk.red(`La branche ${chalk.bold(branch)} n'a pas été trouvé`))
    else if (filteredBranches.length > 1)
      //* sélection de la branche voulu dans la liste
      branchSelected = await utils.selectValueIntoArray(filteredBranches, 'Sélectionner une branche', 'selectGitBranch')
    else
      branchSelected = filteredBranches[0]

    switch (gitCommand.toLowerCase()) {
      case 'checkout':
        await cli.execGitCheckout(branchSelected)
        break;

      case 'merge':
        console.log(chalk.orange(`En cours de développement ...`))
        break;
    
      default:
        console.log(chalk.red(`La commande git ${chalk.bold(gitCommand)} n'existe pas ou n'est encore géré par l'application`))
        break;
    }
  }
}

export default fn