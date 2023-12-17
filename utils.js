import chalk from 'chalk';
import boxen from 'boxen';
import { exec } from 'child_process';
import readline from 'readline';
import fs from 'fs';
import os from 'os';
import path from 'path';
import inquirer from 'inquirer';

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
  createConfigUser: () => {
    //* récupération des config
    //* chemin absolu vers le module pour créer le fichier json
    const configDir = path.join(os.homedir(), 'dtl_runpda');
    const jsonPath = path.join(configDir, 'config.json')

    //* est-ce que le fichier existe
    if (fs.existsSync(jsonPath)) {
      try {
        const jsonFile = fs.readFileSync(jsonPath, 'utf-8')
        utils.config = JSON.parse(jsonFile)
      } catch(err) {
        console.log(chalk.bold(chalk.red(`Erreur lors de la récupération de la configuration : ${err}`)))
      }
    //* le fichier n'existe pas, on va le créer avec des valeurs par défaut
    } else {
      let initialConfig = {
        "APP_DIR": {
          "value": configDir,
          "is_visible": true,
          "description": "",
          "editable": false
        },
        "CONFIGFILE_DIR": {
          "value": jsonPath,
          "is_visible": true,
          "description": "",
          "editable": false
        },
        "CHANGELOG": {
          "value": "https://github.com/huiitre/run-pda-shell/blob/master/CHANGELOG.md",
          "is_visible": false,
          "description": "",
          "editable": false
        },
        "PDALIST": {
          "value": [],
          "is_visible": false,
          "description": "",
          "editable": false
        },
        "DEFAULT_PDA": {
          "value": "ct60",
          "is_visible": false,
          "description": "",
          "editable": true
        },
        "TIME_BEFORE_CHECK_UPDATE": {
          "value": 1,
          "is_visible": false,
          "description": "",
          "editable": true
        },
        "REQUIRE_UPDATE": {
          "value": false,
          "is_visible": false,
          "description": "",
          "editable": true
        },
        "CURRENT_VERSION": {
          "value": null,
          "is_visible": false,
          "description": "",
          "editable": true
        },
        "LATEST_VERSION": {
          "value": null,
          "is_visible": false,
          "description": "",
          "editable": true
        },
        "LAST_CHECK_UPDATE": {
          "value": null,
          "is_visible": false,
          "description": "",
          "editable": true
        }
      }
      //* si le dossier n'existe pas, on le crée
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir)
        console.log(chalk.italic(`Note : Création du dossier ${chalk.bold('dtl_runpda')}. Chemin d'accès : ${chalk.bold(configDir)}`))
      }
      //* on crée le fichier config.json à la racine du dossier
      fs.writeFileSync(jsonPath, JSON.stringify(initialConfig, null, 2), 'utf-8');
      const jsonFile = fs.readFileSync(jsonPath, 'utf-8')
      utils.config = JSON.parse(jsonFile)
      console.log(chalk.italic(`Note : Création du fichier ${chalk.bold('config.json')}. Chemin d'accès : ${chalk.bold(jsonPath)}`))
    }
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
        if (utils.config[key].hasOwnProperty('editable') && utils.config[key].editable === true) {
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
  selectValueIntoArray: async(array) => {
    const question = {
      type: 'list',
      name: 'selectedPDA',
      message: 'Sélectionner un PDA',
      choices: array
    }
    return inquirer.prompt(question).then((answers) => answers.selectedPDA);
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
  }
}

export default utils