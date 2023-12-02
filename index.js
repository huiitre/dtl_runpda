#!/usr/bin/env node

const utils = require('./utils')
const { version } = require('./package.json')
const functions = require('./functions')

const init = async() => {
  //* vérification de mise à jour
  const latestVersion = await utils.getLatestVersion()

  if (version != latestVersion) {
    utils.updatePackage(version, latestVersion)
  }

  //* récupération des config
  /* const config = JSON.parse('./config.json')
  console.log("%c index.js #17 || config : ", 'background:red;color:#fff;font-weight:bold;', config); */

  const args = process.argv.slice(2)

  if (args.length == 0) {
    try {
      const result = await utils.execCommand(`adb devices -l`)
      console.log("%c index.js #19 || result : ", 'background:red;color:#fff;font-weight:bold;', result);
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
          console.log(version)
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
          console.log("%c index.js #39 || pda par defaut", 'background:blue;color:#fff;font-weight:bold;');
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
          const pdaSelected = await functions.testReadline('ct60')
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