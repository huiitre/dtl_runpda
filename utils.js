/* const chalk = require('chalk')
const boxen = require('boxen')
const { exec } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const os = require('os')
const path = require('path'); */

import chalk from 'chalk';
import boxen from 'boxen';
import { exec } from 'child_process';
import readline from 'readline';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

//! ne pas importer cli-commands pour éviter la référence circulaire entre les deux fichiers

const utils = {
  //* objet config
  config: {},

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

        if (this.isStringEmpty(initialValue) && !this.isStringEmpty(defaultValue))
          initialValue = defaultValue.trim()
        else if (this.isStringEmpty(initialValue) && this.isStringEmpty(defaultValue))
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

    if (fs.existsSync(jsonPath)) {
      try {
        const jsonFile = fs.readFileSync(jsonPath, 'utf-8')
        utils.config = JSON.parse(jsonFile)
      } catch(err) {
        console.log(chalk.bold(chalk.red(`Erreur lors de la récupération de la configuration : ${err}`)))
      }
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
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir)
        console.log(chalk.italic(`Note : Création du dossier ${chalk.bold('dtl_runpda')}. Chemin d'accès : ${chalk.bold(configDir)}`))
      }
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

  //* Récupère la version actuelle du package NPM
  getCurrentVersion: () => {
    const packageJsonPath = './package.json'
    const packageJsonString = fs.readFileSync(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(packageJsonString)
    const version = packageJson.version
    return version
  }
}

export default utils

//* exécute une commande et retourne une promesse
/* export const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    const child = exec(`${command}`)

    let stdout = "";
    let stderr = "";

    //* Écoute l'événement data du processus enfant pour la sortie standard
    child.stdout.on("data", (data) => {
      stdout += data;
    });

    //* Écoute l'événement data du processus enfant pour la sortie d'erreur
    child.stderr.on("data", (data) => {
      stderr += data;
    });

    //* Écoute l'événement error du processus enfant
    child.on("error", (err) => {
      reject(err);
    });

    //* Écoute l'événement exit du processus enfant
    child.on("exit", (code) => {
      if (code !== 0) {
        //* S'il y a une sortie d'erreur, la rejeter avec la sortie d'erreur
        reject(stderr || code);
      } else {
        //* Sinon, résoudre avec la sortie standard
        resolve(stdout);
      }
    });
  });
}; */