const chalk = require('chalk')
const boxen = require('boxen')
const { exec } = require('child_process');
const readline = require('readline');

module.exports = {
  //* Fonction d'affiche si une mise à jour est disponible
  updatePackage: (current, latest) => {
    const packageName = 'DTL_RUNPDA'
    const message = `
      ${chalk.bold(packageName)}

      Mise à jour disponible ${current} -> ${chalk.green(latest)}
      Exécutez ${chalk.blue('npm i -g dtl_runpda')} pour mettre à jour
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

  //* récupère la dernière version du package NPM
  getLatestVersion: () => {
    return new Promise((resolve, reject) => {
      exec(`npm show dtl_runpda version`, (err, stdout) => {
        const latestVersion = stdout.trim()
        resolve(latestVersion)
      })
    })
  },

  //* exécute une commande et retourne une promesse
  execCommand: (command) => {
    return new Promise((resolve, reject) => {
      exec(command, (err, stdout, stderr) => {
        if (err) {
          console.log("%c utils.js #40 || ERROR : ", 'background:red;color:#fff;font-weight:bold;', err);
          reject(err)
        }
        if (stderr) {
          console.log("%c utils.js #44 || stderr : ", 'background:red;color:#fff;font-weight:bold;', stderr);
        }
        resolve(stdout)
      })
    })
  },

  //* check si une variable est une chaine de caractère vide ou non
  isStringEmpty: function(value) {
    return typeof value === 'string' && value.trim() === '';
  },

  //* retourne le résultat de ce que l'utilisateur a tapé dans le terminal
  getUserInput: function(message, defaultValue = '') {
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
    
        // Faites ce que vous devez faire avec le modèle PDA
        console.log(`Vous avez choisi le PDA : ${initialValue}`);
    
        rl.close();

        resolve(initialValue)
        
        // Fermer l'interface readline
      });
    })
  }
}