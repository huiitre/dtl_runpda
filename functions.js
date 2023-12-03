const readline = require('readline');
const commands = require('./commands')
const utils = require('./utils')
const Table = require('cli-table');
const chalk = require('chalk')

module.exports = {
  testReadline: (defaultPda) => {
    return new Promise(async(resolve, reject) => {
      /* const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      let modelPDA = ''
      rl.question("Veuillez cibler le PDA [défaut : $DEFAULT_PDA]: ", (name) => {
        modelPDA = name || DEFAULT_PDA;
    
        // Faites ce que vous devez faire avec le modèle PDA
        console.log(`Vous avez choisi le PDA : ${modelPDA}`);
    
        rl.close();

        resolve(modelPDA)
        
        // Fermer l'interface readline
      }); */
      try {
        const pda = await utils.getUserInput(`Veuillez cibler le PDA`, defaultPda)
        const list = pda.split(' ')
        resolve(list)
      } catch(err) {
        console.log(`ERROR : ${err}`)
      }
    })
  },

  //* affiche la liste des PDA
  displayPdaList: async() => {
    const data = await commands.getPdaList()
    let pdaList = data.split('\n')
    pdaList = pdaList.filter(item => {
      if (!utils.isStringEmpty(item))
        return item
    })

    const table = new Table()
    table.push(
      [
        chalk.bold('Model'),
        chalk.bold('Serial number'),
        chalk.bold('EM version'),
        chalk.bold('Android version')/* ,
        'EM First install',
        'EM Last update' */
      ]
    );

    //* Récupération des informations pour chaque pda
    for (const item of pdaList) {
      const data = await Promise.all([
        commands.getPdaModel(item),
        commands.getPdaSerialNumber(item),
        commands.getPdaEMVersion(item),
        commands.getPdaAndroidVersion(item),
        // commands.getPdaFirstInstallEM(item),
        // commands.getPdaLastUpdateEM(item),
      ]);
      const cleanedData = data.map(item => item.replace(/[\r\n]+/g, ''));
      table.push(cleanedData);
    }

    console.log('')
    console.log(chalk.green.bold('Liste des PDA disponibles : '))
    console.log(table.toString());
  },

  //* Change le PDA par défaut
  changeDefaultPda: async(defaultPda, config, args) => {
    try {
      if (args != null) {
        utils.updateConfig(config, 'DEFAULT_PDA', args)
        
        console.log('')

        console.log(`Le PDA par défaut a été changé par ${chalk.green.bold(args)} (anciennement ${chalk.red.bold(defaultPda)})`)
      } else {
        console.log('')
        const pda = await utils.getUserInput(chalk.bold(`Veuillez inscrire le nouveau PDA à utiliser par défaut`), defaultPda)

        utils.updateConfig(config, 'DEFAULT_PDA', pda)
        
        console.log('')

        console.log(`Le PDA par défaut a été changé par ${chalk.green.bold(pda)} (anciennement ${chalk.red.bold(defaultPda)})`)
      }

    } catch(err) {
      console.log(`ERROR : ${err}`)
    }
  }
}