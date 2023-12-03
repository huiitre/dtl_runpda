#!/usr/bin/env node

const utils = require('./utils')
const { version } = require('./package.json')
const functions = require('./functions')
const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const os = require('os')

const init = async() => {
  console.log("%c index.js #13 || userConfigPath : ", 'background:red;color:#fff;font-weight:bold;', userConfigPath);
  //* on lance le serveur adb
  await utils.execCommand(`adb start-server`)

  //* récupération des config
  //* chemin absolu vers le module pour créer le fichier json
  const jsonPath = path.join(os.homedir(), 'dtl_runpda', 'config.json')
  let config = {}
  if (fs.existsSync(jsonPath)) {
    try {
      const jsonFile = fs.readFileSync(jsonPath, 'utf-8')
      config = JSON.parse(jsonFile)
    } catch(err) {
      console.log(chalk.bold(chalk.red(`Erreur lors de la récupération de la configuration : ${err}`)))
    }
  } else {
    initialConfig = {
      CHANGELOG: "https://github.com/huiitre/run-pda-shell/blob/master/CHANGELOG.md",
      DEFAULT_PDA: "eda52",
      TIME_BEFORE_CHECK_UPDATE: 1,
      REQUIRE_UPDATE: false,
      LATEST_VERSION: null,
      LAST_CHECK_UPDATE: null
    }
    fs.writeFileSync(jsonPath, JSON.stringify(initialConfig, null, 2), 'utf-8');
    const jsonFile = fs.readFileSync(jsonPath, 'utf-8')
    config = JSON.parse(jsonFile)
  }

  //* pda par défaut
  const DEFAULT_PDA = config.DEFAULT_PDA
  //* url du fichier changelog
  const CHANGELOG = config.CHANGELOG
  
  //* est-ce qu'un update est requis
  //* date du dernier check de mise à jour
  const LAST_CHECK_UPDATE = new Date(config.LAST_CHECK_UPDATE)
  //* temps (en heure) avant le prochain check de version
  const TIME_BEFORE_CHECK_UPDATE = config.TIME_BEFORE_CHECK_UPDATE
  //* est-ce qu'un update est requis
  let REQUIRE_UPDATE = config.REQUIRE_UPDATE
  //* dernière version depuis le dernier check
  let LATEST_VERSION = config.LATEST_VERSION

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
          if (!REQUIRE_UPDATE) {
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
          functions.changeDefaultPda(DEFAULT_PDA, config, (args[1] || null))
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