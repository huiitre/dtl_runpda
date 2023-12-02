#!/usr/bin/env node

const utils = require('./utils')
const { version } = require('./package.json')
const functions = require('./functions')
const fs = require('fs');
const chalk = require('chalk');

const init = async() => {
  //* récupération des config
  let config = {}
  try {
    const jsonFile = fs.readFileSync('./config.json', 'utf-8')
    config = JSON.parse(jsonFile)
  } catch(err) {
    console.log(chalk.bold(chalk.red(`Erreur lors de la récupération de la configuration : ${err}`)))
  }

  const DEFAULT_PDA = config.DEFAULT_PDA
  const CHANGELOG = config.CHANGELOG

  //* vérification de mise à jour
  let needUpdate = false
  const latestVersion = await utils.getLatestVersion()

  if (version != latestVersion) {
    utils.updatePackage(version, latestVersion, CHANGELOG)
    needUpdate = true
  }

  const args = process.argv.slice(2)

  if (args.length == 0) {
    try {
      const result = await utils.execCommand(`adb devices -l`)
    } catch(err) {
      console.log("%c index.js #21 || ERROR : ", 'background:red;color:#fff;font-weight:bold;', err);
    }
  } else {
    //* on prend le premier argument et si il ne commence pas par un tiret, on lance la compilation
    if (!args[0].startsWith('-')) {
      const result = await utils.execCommand(`bash run.sh ${args[0]}`)
      console.log("%c index.js #25 || result : ", 'background:red;color:#fff;font-weight:bold;', result);
    } else {
      //* nettoyage de la commande
      const command = args[0].replace(/^[-]+/, '')

      //* La liste des commandes disponibles
      switch (command) {
        case 'v':
        case 'V':
        case 'version':
        case 'VERSION':
          //* on affiche la version classique seulement si on ne nécessite pas de mise à jour, sinon ça fait doublon et c'est moche
          if (!needUpdate) {
            console.log(chalk.green.bold(version))
            console.log(chalk.magenta.bold(CHANGELOG))
          }
          break;

        case 'h':
        case 'H':
        case 'help':
        case 'HELP':
          console.log("%c index.js #39 || HELP", 'background:blue;color:#fff;font-weight:bold;');
          break;
        
        case 'd':
        case 'D':
        case 'default':
        case 'DEFAULT':
        case 'defaut':
        case 'DEFAUT':
          functions.changeDefaultPda(DEFAULT_PDA, config)
          break;

        case 'c':
        case 'C':
        case 'clear':
        case 'CLEAR':
          console.log("%c index.js #39 || CLEAR APP", 'background:blue;color:#fff;font-weight:bold;');
          break;
          
        case 'u':
        case 'U':
        case 'uninstall':
        case 'UNINSTALL':
          console.log("%c index.js #39 || UNINSTALL APP", 'background:blue;color:#fff;font-weight:bold;');
          break;
          
        case 'e':
        case 'E':
        case 'export':
        case 'EXPORT':
          console.log("%c index.js #39 || EXPORT BASE PDA", 'background:blue;color:#fff;font-weight:bold;');
          break;

        case 'l':
        case 'L':
        case 'list':
        case 'LIST':
          functions.displayPdaList()
          break;
      
        case 't':
        case 'T':
        case 'test':
        case 'TEST':
          console.log("%c index.js #46 || TEST", 'background:blue;color:#fff;font-weight:bold;');
          const pdaSelected = await functions.testReadline(DEFAULT_PDA)
          console.log("%c index.js #54 || pdaSelected : ", 'background:red;color:#fff;font-weight:bold;', pdaSelected);
          break;

        default:
          break;
      }
    }
  }

}

init()

/* const command = 'bash run.sh -v'

exec(command, (err, stdout, stderr) => {
  if (err)
    return console.log("%c index.js #7 || ERROR : ", 'background:red;color:#fff;font-weight:bold;', err);

  console.log("%c index.js #10 || sortie : ", 'background:red;color:#fff;font-weight:bold;', stdout);
  console.log("%c index.js #11 || erreur standard : ", 'background:red;color:#fff;font-weight:bold;', stderr);
})

console.log("%c index.js #14 || mange ta soeur", 'background:red;color:#fff;font-weight:bold;'); */