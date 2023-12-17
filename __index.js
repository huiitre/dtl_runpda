/* const utils = require('./utils')
const cli = require('./cli-commands')
const { version } = require('./package.json')
const functions = require('./functions')
const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const os = require('os');
const inquirer = require('inquirer'); */
import * as utils from './utils.js';
import * as cli from './cli-commands.js';
/* import * as packageJson from './package.json';
const { version } = packageJson; */
import * as functions from './functions.js';
import * as fs from 'fs';
import chalk from 'chalk';
import * as path from 'path';
import * as os from 'os';

const init = async() => {
  let ADB_INSTALLED = false

  //* on lance le serveur adb
  try {
    await cli.isAdbInstalled()
    ADB_INSTALLED = true
  } catch(err) {
    console.log('')
    console.log(console.log(chalk.bold.red(`ADB n'est pas installé sur votre système.`)))
    ADB_INSTALLED = false
  }


  //* récupération de la version actuelle
  const packageJsonPath = './package.json'
  const packageJsonString = fs.readFileSync(packageJsonPath, 'utf-8')
  const packageJson = JSON.parse(packageJsonString)
  const version = packageJson.version

  //* récupération des config
  //* chemin absolu vers le module pour créer le fichier json
  const configDir = path.join(os.homedir(), 'dtl_runpda');
  const jsonPath = path.join(configDir, 'config.json')
  let config = {}
  if (fs.existsSync(jsonPath)) {
    try {
      const jsonFile = fs.readFileSync(jsonPath, 'utf-8')
      config = JSON.parse(jsonFile)
    } catch(err) {
      console.log(chalk.bold(chalk.red(`Erreur lors de la récupération de la configuration : ${err}`)))
    }
  } else {
    let initialConfig = {
      "CHANGELOG": {
        "value": "https://github.com/huiitre/run-pda-shell/blob/master/CHANGELOG.md",
        "is_visible": false,
        "description": ""
      },
      "PDALIST": {
        "value": [],
        "is_visible": false,
        "description": ""
      },
      "DEFAULT_PDA": {
        "value": "ct60",
        "is_visible": false,
        "description": ""
      },
      "TIME_BEFORE_CHECK_UPDATE": {
        "value": 1,
        "is_visible": false,
        "description": ""
      },
      "REQUIRE_UPDATE": {
        "value": false,
        "is_visible": false,
        "description": ""
      },
      "LATEST_VERSION": {
        "value": null,
        "is_visible": false,
        "description": ""
      },
      "LAST_CHECK_UPDATE": {
        "value": null,
        "is_visible": false,
        "description": ""
      }
    }
    if (!fs.existsSync(configDir))
      fs.mkdirSync(configDir)
    fs.writeFileSync(jsonPath, JSON.stringify(initialConfig, null, 2), 'utf-8');
    const jsonFile = fs.readFileSync(jsonPath, 'utf-8')
    config = JSON.parse(jsonFile)
  }

  //* pda par défaut
  const DEFAULT_PDA = config.DEFAULT_PDA.value
  //* url du fichier changelog
  const CHANGELOG = config.CHANGELOG.value
  
  //* est-ce qu'un update est requis
  //* date du dernier check de mise à jour
  const LAST_CHECK_UPDATE = new Date(config.LAST_CHECK_UPDATE.value)
  //* temps (en heure) avant le prochain check de version
  const TIME_BEFORE_CHECK_UPDATE = config.TIME_BEFORE_CHECK_UPDATE.value
  //* est-ce qu'un update est requis
  let REQUIRE_UPDATE = config.REQUIRE_UPDATE.value
  //* dernière version depuis le dernier check
  let LATEST_VERSION = config.LATEST_VERSION.value

  //* date courante
  const now = new Date()

  //* vérification de mise à jour
  const nextCheck = new Date(LAST_CHECK_UPDATE.getTime() + TIME_BEFORE_CHECK_UPDATE * 60 * 60 * 1000)

  //* dans tous les cas si la date est dépassé, on check
  //* ou sinon dans tous les cas on check si une maj est requise
  if (now > nextCheck || REQUIRE_UPDATE) {
    utils.updateConfig(config, 'LAST_CHECK_UPDATE', now)

    //* on récupère la dernière version
    const latestVersion = await utils.getLatestVersion()

    //* si la dernière version est supérieure à celle en cours
    if (version != latestVersion) {
      utils.updatePackage(version, latestVersion, CHANGELOG)
      REQUIRE_UPDATE = true
      utils.updateConfig(config, 'REQUIRE_UPDATE', true)
    }
    //* finalement l'app a été mise à jour dernièrement, donc on est plus requis d'update
    else {
      REQUIRE_UPDATE = false
      utils.updateConfig(config, 'REQUIRE_UPDATE', false)
    }
  }

  const args = process.argv.slice(2)

  if (args.length == 0) {
    console.log("%c index.js #110 || icfghfghi", 'background:blue;color:#fff;font-weight:bold;');
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
      switch (command.toLowerCase()) {
        case 'v':
        case 'version':
          //* on affiche la version classique seulement si on ne nécessite pas de mise à jour, sinon ça fait doublon et c'est moche
          if (!REQUIRE_UPDATE)
            utils.showCurrentVersion(version, CHANGELOG)
          break;

        case 'h':
        case 'help':
          console.log("%c index.js #39 || HELP", 'background:blue;color:#fff;font-weight:bold;');
          break;
        
        case 'd':
        case 'default':
        case 'defaut':
          functions.changeDefaultPda(DEFAULT_PDA, config, (args[1] || null))
          break;

        case 'c':
        case 'clear':
          console.log("%c index.js #39 || CLEAR APP", 'background:blue;color:#fff;font-weight:bold;');
          break;
          
        case 'u':
        case 'uninstall':
          functions.uninstallEasyMobile(args[1], DEFAULT_PDA)
          break;
          
        case 'e':
        case 'export':
          console.log("%c index.js #39 || EXPORT BASE PDA", 'background:blue;color:#fff;font-weight:bold;');
          break;

        case 'l':
        case 'list':
          if (ADB_INSTALLED)
            functions.displayPdaList()
          break;
      
        case 't':
        case 'test':
          console.log("%c index.js #46 || TEST", 'background:blue;color:#fff;font-weight:bold;');
          const pdaSelected = await functions.testReadline(DEFAULT_PDA)
          console.log("%c index.js #54 || pdaSelected : ", 'background:red;color:#fff;font-weight:bold;', pdaSelected);
          break;

        case 'git':
          console.log("%c index.js #46 || GIT ", 'background:blue;color:#fff;font-weight:bold;');
          break;

        case 'svn':
          console.log("%c index.js #154 || SVN", 'background:blue;color:#fff;font-weight:bold;');
          /**
           * Récupération des modifications : svn diff
           *  - récupérer le path complet du fichier (en y incluant ./) depuis la clé "Index:"
           *  - voir pour coloriser les lignes (--- en rouge et +++ en vert, et pareil pour les - et +)
           * Installer et utiliser electron pour l'affichage de la diff
           */

          
          break;

      case 'update':
        await cli.updatePackage()
        utils.showCurrentVersion(version, CHANGELOG)
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