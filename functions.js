/* const readline = require('readline');
const cli = require('./cli-commands')
const utils = require('./utils')
const Table = require('cli-table');
const chalk = require('chalk'); */
import readline from 'readline';
import * as cli from './cli-commands.js';
import * as utils from './utils.js';
import Table from 'cli-table';
import chalk from 'chalk';


export const testReadline = (defaultPda) => {
  return new Promise(async(resolve, reject) => {
    /* const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    let modelPDA = ''
    rl.question("Veuillez cibler le PDA [défaut : $DEFAULT_PDA]: ", (name) => {
      modelPDA = name || DEFAULT_PDA;
  
      // Faites ce que vous devez faire avec le modèle PDA
      console.log(`Vous avez choisi le PDA : ${modelPDA}`);
  
      rl.close();

      resolve(modelPDA)
      
      // Fermer l'interface readline
    }); */
    try {
      const pda = await utils.getUserInput(`Veuillez cibler le PDA`, defaultPda)
      const list = pda.split(' ')
      resolve(list)
    } catch(err) {
      console.log(`ERROR : ${err}`)
    }
  })
}

//* affiche la liste des PDA
export const displayPdaList = async() => {
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
    const data = await Promise.all([
      cli.getPdaModel(item),
      cli.getPdaSerialNumber(item),
      cli.getPdaEMVersion(item),
      cli.getPdaAndroidVersion(item),
      // cli.getPdaFirstInstallEM(item),
      // cli.getPdaLastUpdateEM(item),
    ]);
    const cleanedData = data.map(item => item.replace(/[\r\n]+/g, ''));
    table.push(cleanedData);
  }

  console.log('')
  console.log(chalk.green.bold('Liste des PDA disponibles : '))
  console.log(table.toString());
}

//* Change le PDA par défaut
export const changeDefaultPda = async(defaultPda, config, args) => {
  try {
    if (args != null) {
      utils.updateConfig(config, 'DEFAULT_PDA', args)
      
      console.log('')

      console.log(`Le PDA par défaut a été changé par ${chalk.green.bold(args)} (anciennement ${chalk.red.bold(defaultPda)})`)
    } else {
      console.log('')
      const pda = await utils.getUserInput(chalk.bold(`Veuillez inscrire le nouveau PDA à utiliser par défaut`), defaultPda)

      utils.updateConfig(config, 'DEFAULT_PDA', pda)
      
      console.log('')

      console.log(`Le PDA par défaut a été changé par ${chalk.green.bold(pda)} (anciennement ${chalk.red.bold(defaultPda)})`)
    }

  } catch(err) {
    console.log(`ERROR : ${err}`)
  }
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
  //* sinon on prend le pda par défaut
  else if (defaultPda != null && defaultPda.length > 0) {
    currentPda = defaultPda
  }

  //* callback qui désinstalle le pda
  const callBackUninstall = (pdaToUninstall) => {
    console.log(chalk.bold.green(`Désinstallation de EasyMobile du PDA ${pdaToUninstall.model}`))
  }

  //* le pda demandé nettoyé
  currentPda = currentPda.toLowerCase().trim()

  //* liste filtré des pda qui correspondent à ce qu'on a demandé (dans le cas où il y aurait 2 modèles identiques)
  let pdaList = await module.exports.getPdaSelected(currentPda)

  //* pda est un tableau, si le tableau ne possède qu'une ligne, on check si em est installé et ensuite on désinstalle
  if (pdaList.length == 1) {
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
  }
}

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