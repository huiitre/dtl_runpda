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


//* Fonction d'affiche si une mise à jour est disponible
export const updatePackage = (current, latest, changelog) => {
  const packageName = 'DTL_RUNPDA'
  const message = `
    ${chalk.bold(packageName)}
    ${chalk.bold(chalk.magenta.bold(changelog))}

    Mise à jour disponible ${current} -> ${chalk.green.bold(latest)}
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
}

//* récupère la dernière version du package NPM
export const getLatestVersion = () => {
  return new Promise((resolve, reject) => {
    exec(`npm show dtl_runpda version`, (err, stdout) => {
      const latestVersion = stdout.trim()
      console.log("%c utils.js #46 || stdout : ", 'background:red;color:#fff;font-weight:bold;', stdout);
      resolve(latestVersion)
    })
  })
}

//* exécute une commande et retourne une promesse
export const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    const child = exec(`${command}`)

    let stdout = "";
    let stderr = "";

    // Écoute l'événement data du processus enfant pour la sortie standard
    child.stdout.on("data", (data) => {
      stdout += data;
    });

    // Écoute l'événement data du processus enfant pour la sortie d'erreur
    child.stderr.on("data", (data) => {
      stderr += data;
    });

    // Écoute l'événement error du processus enfant
    child.on("error", (err) => {
      reject(err);
    });

    // Écoute l'événement exit du processus enfant
    child.on("exit", (code) => {
      if (code !== 0) {
        // S'il y a une sortie d'erreur, la rejeter avec la sortie d'erreur
        reject(stderr || code);
      } else {
        // Sinon, résoudre avec la sortie standard
        resolve(stdout);
      }
    });
  });
};

//* check si une variable est une chaine de caractère vide ou non
export const isStringEmpty = function(value) {
  return typeof value === 'string' && value.trim() === '';
}

//* retourne le résultat de ce que l'utilisateur a tapé dans le terminal
export const getUserInput = function(message, defaultValue = '') {
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
      
      // Fermer l'interface readline
    });
  })
}

//* modifie le fichier config.json
export const updateConfig = (object, key, value) => {
  try {
    const configDir = path.join(os.homedir(), 'dtl_runpda');
    const jsonPath = path.join(configDir, 'config.json')
    object[key] = value
    const newConfig = JSON.stringify(object, null, 2)
    fs.writeFileSync(jsonPath, newConfig, 'utf-8')
    return true
  } catch(err) {
    chalk.red.bold(`Erreur lors de la modification de la config ${key}`)
    console.log(err)
    return false
  }
}

//* affiche la version en cours (si pas d'update nécessaire)
export const showCurrentVersion = (version, CHANGELOG) => {
  console.log('')
  console.log(chalk.green.bold(version))
  console.log(chalk.magenta.bold(CHANGELOG))
}
