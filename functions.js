const readline = require('readline');
const commands = require('./commands')
const utils = require('./utils')

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

  displayPdaList: async() => {
    const data = await commands.getPdaList()
    console.log("%c functions.js #36 || data : ", 'background:red;color:#fff;font-weight:bold;', data);
  }
}