const chalk = require('chalk')
const boxen = require('boxen')
const { exec } = require('child_process');

//* Fonction d'affiche si une mise à jour est disponible
const updatePackage = (current, latest) => {
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
}

//* récupère la dernière version du package NPM
const getLatestVersion = () => {
  return new Promise((resolve, reject) => {
    exec(`npm show dtl_runpda version`, (err, stdout) => {
      const latestVersion = stdout.trim()
      resolve(latestVersion)
    })
  })
}

module.exports = {
  updatePackage,
  getLatestVersion
}