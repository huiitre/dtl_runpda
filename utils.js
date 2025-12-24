import chalk from 'chalk';
import boxen from 'boxen';
import { exec } from 'child_process';
import readline from 'readline';
import fs, { appendFileSync, existsSync, mkdirSync } from 'fs';
import os from 'os';
import path from 'path';
import inquirer from 'inquirer';
import { format, addDays } from 'date-fns';

//! ne pas importer cli-commands pour éviter la référence circulaire entre les deux fichiers

const utils = {
  //* objet config
  config: {},

  //* liste des pda
  pdaList: [],

  //* est-ce que adb est installé
  adbIsInstalled: true,

  //* check si une variable est une chaine de caractère vide ou non
  isStringEmpty: (value) => {
    return typeof value === 'string' && value.trim() === '';
  },

  //* retourne le résultat de ce que l'utilisateur a tapé dans le terminal
  getUserInput: (message, defaultValue = '') => {
    return new Promise(resolve => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      let initialValue = ''
      let question = `${message} ${defaultValue && `[défaut : ${defaultValue}]`}: `
      rl.question(question, (value) => {
        initialValue = value.trim();

        if (utils.isStringEmpty(initialValue) && !utils.isStringEmpty(defaultValue))
          initialValue = defaultValue.trim()
        else if (utils.isStringEmpty(initialValue) && utils.isStringEmpty(defaultValue))
          resolve(false)
    
        rl.close();

        resolve(initialValue)
        
        //* ferme l'interface readline
      });
    })
  },

  //* Crée la config utilisateur, si elle existe on l'extrait et on la place dans utils.config
  createConfigUser: async() => {
    utils.log({
      label: 'createConfigUser'
    })

    //* récupération des config
    //* chemin absolu vers le module pour créer le fichier json
    const configDir = path.join(os.homedir(), 'dtl_runpda');
    const jsonPath = path.join(configDir, 'config.json')

    //* est-ce que le fichier existe
    if (fs.existsSync(jsonPath)) {
      utils.log({
        label: `Le fichier jsonpath existe`,
        value: jsonPath,
        level: 0
      })
      try {
        const jsonFile = fs.readFileSync(jsonPath, 'utf-8')
        utils.config = JSON.parse(jsonFile)
        utils.log({
          label: `On a récupéré le contenu du fichier config.json`,
          value: jsonFile,
          level: 0
        })
      } catch(err) {
        console.log(chalk.bold(chalk.red(`Erreur lors de la récupération de la configuration : ${err}`)))
        utils.log({
          label: 'Erreur lors de la lecture du fichier config.json',
          value: err,
          level: 0
        })
      }
    //* le fichier n'existe pas, on va le créer avec des valeurs par défaut
    } else {
      utils.log({
        label: `Le fichier config.json n'existe pas, on le crée`,
        value: ``,
        level: 0
      })

      //* récupération du dossier npm dans lequel est installé dtl_runpda
      const getModulePath = () => {
        return new Promise((resolve, reject) => {
          exec(`npm root -g`, (err, stdout) => {
            if (err)
              resolve(err)
            resolve(path.join(stdout.trim(), 'dtl_runpda'))
          })
        })
      }
      let npmDir = ''
      npmDir = await getModulePath()

      /**
       * is_visible : Peut être visible depuis l'affichage des configurations (--config)
       * editable : Peut être modifié par l'utilisateur depuis --config
       * app_editable : Peut être modifié par l'application
       */
      let initialConfig = {
        "APP_DIR": {
          "value": configDir,
          "is_visible": true,
          "description": "Chemin vers le dossier de config dtl_runpda",
          "app_editable": false,
          "editable": false,
        },
        "CONFIGFILE_DIR": {
          "value": jsonPath,
          "is_visible": true,
          "description": "Chemin du fichier config.json à la racine de dtl_runpda",
          "app_editable": false,
          "editable": false,
        },
        "NPM_APP_DIR": {
          "value": npmDir,
          "is_visible": true,
          "description": "Chemin du dossier dtl_runpda installé globalement via NPM",
          "app_editable": false,
          "editable": false,
        },
        "CHANGELOG": {
          "value": "https://github.com/huiitre/dtl_runpda/blob/master/CHANGELOG.md",
          "is_visible": true,
          "description": "Lien vers le CHANGELOG des versions",
          "app_editable": false,
          "editable": false,
        },
        "PDALIST": {
          "value": [],
          "is_visible": false,
          "description": "Liste des PDA disponibles en USB",
          "app_editable": false,
          "editable": false,
        },
        "ADB_PATH": {
          "value": null,
          "is_visible": true,
          "description": "Chemin vers le binaire adb utilisé par dtl_runpda (null = résolution automatique)",
          "app_editable": true,
          "editable": true
        },
        "DEFAULT_PDA": {
          "value": "ct60",
          "is_visible": true,
          "description": "PDA par défaut configuré (depuis la commande --default)",
          "app_editable": true,
          "editable": true,
          "type": 'text'
        },
        "TIME_BEFORE_CHECK_UPDATE": {
          "value": 4,
          "is_visible": true,
          "description": "Temps (en heures) avant de rechercher une nouvelle mise à jour",
          "app_editable": true,
          "editable": true,
          "type": 'number'
        },
        "REQUIRE_UPDATE": {
          "value": false,
          "is_visible": false,
          "description": "Flag pour dire si on doit rechercher une mise à jour ou non",
          "app_editable": true,
          "editable": false,
        },
        "CURRENT_VERSION": {
          "value": null,
          "is_visible": true,
          "description": "Version courante de l'application",
          "app_editable": true,
          "editable": false,
        },
        "LATEST_VERSION": {
          "value": null,
          "is_visible": true,
          "description": "Dernière version en cours de l'application depuis npm",
          "app_editable": true,
          "editable": false,
        },
        "LAST_CHECK_UPDATE": {
          "value": null,
          "is_visible": true,
          "description": "Date de la dernière recherche d'une mise à jour",
          "app_editable": true,
          "editable": false,
        },
        "DEBUG_LEVEL": {
          "value": 0,
          "is_visible": true,
          "description": "Niveau de debug pour l'écriture des logs",
          "app_editable": true,
          "editable": true,
          "type": 'number'
        },
        "EMA_DEFAULT_AUTHOR": {
          "value": '',
          "is_visible": true,
          "description": "Auteur par défaut lors d'une insertion dans easymobile_about",
          "app_editable": true,
          "editable": true,
          "type": 'text'
        }
      }
      //* si le dossier n'existe pas, on le crée
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir)
        utils.log({
          label: `Le dossier dtl_runpda n'existe pas, on le crée`,
          value: ``,
          level: 0
        })
        console.log(chalk.italic(`Note : Création du dossier ${chalk.bold('dtl_runpda')}. Chemin d'accès : ${chalk.bold(configDir)}`))
      }
      //* on crée le fichier config.json à la racine du dossier
      fs.writeFileSync(jsonPath, JSON.stringify(initialConfig, null, 2), 'utf-8');
      const jsonFile = fs.readFileSync(jsonPath, 'utf-8')
      utils.config = JSON.parse(jsonFile)
      utils.log({
        label: `Création du fichier config.json et lecture de ce dernier`,
        value: jsonFile,
        level: 1
      })
      console.log(chalk.italic(`Note : Création du fichier ${chalk.bold('config.json')}. Chemin d'accès : ${chalk.bold(jsonPath)}`))
    }

    //* création du dossier database si il n'existe pas encore
    const databaseDir = path.join(configDir, 'database')
    utils.log({
      label: `path du dossier database`,
      value: databaseDir,
      level: 0
    })
    if (!fs.existsSync(databaseDir)) {
      utils.log({
        label: `Le dossier database n'existe pas, on le crée`,
        value: ``,
        level: 0
      })
      fs.mkdirSync(databaseDir)
      console.log(chalk.italic(`Note : Création du dossier ${chalk.bold('database')}. Chemin d'accès : ${chalk.bold(databaseDir)}`))
    }
    utils.log({
      label: `fin createConfigUser`,
      value: ``,
      level: 0
    })
    Promise.resolve(true)
  },

  //* check le terminal utilisé et retourne un message d'avertissement si ce dernier n'est pas shell
  checkTerminal: () => {
    utils.log({
      label: `checkTerminal`,
      value: ``,
      level: 0
    })

    const isShell = process.env.SHELL
    if (!isShell) {
      console.log(chalk.yellow(`Vous n'utilisez pas un terminal GitBash, certaines fonctionnalitées risquent de ne pas fonctionner correctement`))
    }
    utils.log({
      label: `isShell`,
      value: isShell,
      level: 0
    })
    utils.log({
      label: `fin checkTerminal`,
      value: ``,
      level: 0
    })
  },

  //* Récupère la valeur (ou autre propriété demandé) d'une configuration depuis utils.config
  getConfigValue: (key, propName = 'value') => {
    const config = utils.config

    //* est-ce que la config demandé existe
    if (config.hasOwnProperty(key) && config[key].hasOwnProperty(propName))
      return config[key][propName]
    else
      return null
  },

  //* modifie le fichier config.json
  updateConfig: (key, value) => {
    return new Promise((resolve, reject) => {
      //* est-ce que cette configuration existe
      if (utils.config.hasOwnProperty(key)) {
        //* est-ce qu'on a le droit de la modifier
        if (utils.config[key].hasOwnProperty('app_editable') && utils.config[key].app_editable === true) {
          utils.config[key].value = value
          //* on récupère le chemin du fichier config.json
          const jsonPath = utils.config['CONFIGFILE_DIR'].value
          const newConfig = JSON.stringify(utils.config, null, 2);
          fs.writeFileSync(jsonPath, newConfig, 'utf-8');
          resolve(`La configuration ${chalk.bold(key)} a été modifiée avec succès`)
        }
        else
          reject(`Vous n'avez pas le droit de modifier la valeur de la configuration ${chalk.bold(key)}`)
      } else
        reject(`La configuration ${chalk.bold(key)} n'existe pas`)
    })
  },

  //* permet de sélectionner un élèment dans un tableau dynamiquement
  selectValueIntoArray: async(array, quest = 'Sélectionner un PDA', name = 'selectedPDA') => {
    const question = {
      type: 'list',
      name: name,
      message: quest,
      choices: array
    }
    return inquirer.prompt(question).then((answers) => answers[name]);
  },

  //* permet de sélectionner un élèment dans un tableau d'objets dynamiquement
  selectValueIntoArrayObjets: async(array, props) => {
    //* les propriétés à afficher
    //? name: le nom de la colonne à afficher dans la question
    //? prop: le nom de la propriété de l'objet dont on va afficher la valeur dans la ligne
    const propsToDisplay = props.propsToDisplay

    //* la question à poser à l'utilisateur
    let questionString = props.question

    //* on va générer un nouveau tableau qui sera en fait notre affichage, en fonction des props qu'on a demandé à afficher, séparés par un tiret -
    const tempArray = array.map(item => {
      return propsToDisplay.map(prop => item[prop.prop]).join(' - ');
    })

    questionString += ` (${propsToDisplay.map(prop => prop.name).join(' - ')})`

    const question = {
      type: 'list',
      name: 'returnValue',
      message: questionString,
      choices: tempArray
    }
    return inquirer.prompt(question).then((answers) => {
      //* on va retourner l'objet sélectionner depuis les valeurs qu'on a en retour
      const selectedItemIndex = tempArray.indexOf(answers.returnValue)
      return array[selectedItemIndex]
    });
  },

  logs: [],

  //* permet de log
  log: (props) => {
    const { label, value = '', level = 0 } = props

    if (utils.getConfigValue('DEBUG_LEVEL') < level)
      return

    let log = ''

    let date = new Date();
    date = format(date, 'yyyy-MM-dd HH:mm:ss');

    switch (level) {
      case 0:
        log += `[DEBUG] - ${date}`
        break;
      case 1:
        log += `[WARNING] - ${date}`
        break;
      case 2:
        log += `[ERROR] - ${date}`
        break;
    
      default:
        log += `[UNKNOWN LEVEL] - ${date}`
        break;
    }

    log += `\nLabel : ${label}\n`
    if (value?.length > 0)
      log += `Value : ${value}`

    log += '\n'

    utils.logs.push(log)
  },

  //* écriture des logs dans un fichier
  writeLog: () => {
    let dateNow = new Date()
    dateNow = format(dateNow, 'yyyy-MM-dd');

    const fileName = `log_${dateNow}`
    const appDir = utils.getConfigValue('APP_DIR')
    const logDir = path.join(appDir, 'log')
    const fileDir = path.join(logDir, fileName)

    if (existsSync(logDir) && existsSync(fileDir)) {
      const logContent = utils.logs.join('\n')
      appendFileSync(fileDir, logContent + '\n')
    } else {
      if (!existsSync(logDir))
        mkdirSync(logDir)
      const logContent = utils.logs.join('\n')
      appendFileSync(fileDir, logContent + '\n')
    }
  }
}

export default utils