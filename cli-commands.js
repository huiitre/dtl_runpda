/* const utils = require('./utils') */
import utils from './utils.js';
import { exec } from 'child_process';

/**
 * Fonctions qui exécutent des commandes dans le terminal
 * 
 * Penser à reformater la donnée ici (en tableau/objet) si nécessaire
 */

const cli = {
  //* check si adb est installé
  isAdbInstalled: () => {
    return new Promise((resolve, reject) => {
      exec(`adb version`, 
      (error, stdout, stderr) => {
        if (error || stderr)
          resolve(`ADB n'est pas installé sur votre système`)
        resolve(false)
      })
    })
  },

  //* Récupère la dernière version en cours du package NPM
  getLatestVersion: () => {
    return new Promise(resolve => {
      exec(`npm show dtl_runpda version`, (err, stdout) => {
        resolve(stdout.trim())
      })
    })
  },

  //* retourne la liste des pda
  getPdaList: () => {
    return new Promise(resolve => {
        exec(`adb devices -l | sed '1d' | awk '/device/{print $1}`, 
        async(error, stdout, stderr) => {
          let pdaList = stdout.split('\n')
          pdaList = pdaList.filter(item => {
            if (!utils.isStringEmpty(item))
              return item
          })

          const result = []
          for (const item of pdaList) {
            let pda = {}
            const data = await Promise.all([
              cli.getPdaModel(item),
              cli.getPdaSerialNumber(item),
              cli.getPdaEMVersion(item),
              cli.getPdaAndroidVersion(item),
            ])
            const cleanedData = data.map(item => item.replace(/[\r\n]+/g, ''))
            pda.model = cleanedData[0]
            pda.serialNumber = cleanedData[1]
            pda.emVersion = cleanedData[2]
            pda.androidVersion = cleanedData[3]

            result.push(pda)
          }

          utils.pdaList = result

          resolve(result)
        })
    })
  },

  //* modèle du pda
  getPdaModel: (pda) => {
    return new Promise(async resolve => {
      exec(`adb -s ${pda} shell getprop ro.product.model | tr -d '\r' || echo "null"`, (err, stdout) => {
        const data = stdout.replace(/[\r\n]+/g, '')
        resolve(data.trim())
      })
    })
  },

  //* numéro de série
  getPdaSerialNumber: (pda) => {
    return new Promise(async resolve => {
      exec(`adb -s ${pda} shell getprop ro.serialno | tr -d '\r' || echo "null")`, (err, stdout) => {
        const data = stdout.replace(/[\r\n]+/g, '')
        resolve(data.trim())
      })
    })
  },

  //* version easymobile
  getPdaEMVersion: (pda) => {
    return new Promise(async resolve => {
      exec(`adb -s ${pda} shell dumpsys package net.distrilog.easymobile | grep versionName | sed 's/.*versionName=//;s/[" ]//g'`, (err, stdout) => {
        const data = stdout.replace(/[\r\n]+/g, '')
        resolve(data.trim())
      })
    })
  },

  //* version android du pda
  getPdaAndroidVersion: (pda) => {
    return new Promise(async resolve => {
      exec(`adb -s ${pda} shell getprop ro.build.version.release`, (err, stdout) => {
        const data = stdout.replace(/[\r\n]+/g, '')
        resolve(data.trim())
      })
    })
  },

  //* update l'application
  updatePackage: () => {
    return new Promise(async resolve => {
      await utils.execCommand(`npm i -g dtl_runpda`)
      resolve(true)
    })
  },

  //* compile l'app sur un PDA
  runPda: (serialNumber) => {
    return new Promise(resolve => {
      const childProcess = exec(`cordova run android --target=${serialNumber}`, (err, stdout, stderr) => {
        if (err) {
          const errorMessage = stderr ? stderr.toString().trim() : 'Erreur inconnue';
          resolve(errorMessage);
        } else {
          resolve(stdout);
        }
      });
  
      // Capturer la sortie standard en continu
      childProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        console.log(output); // Afficher la sortie en continu
      });
  
      // Capturer la sortie d'erreur en continu
      childProcess.stderr.on('data', (data) => {
        const errorOutput = data.toString().trim();
        console.error(errorOutput); // Afficher la sortie d'erreur en continu
      });
    });
  }
}

export default cli

//* regarde si l'app easymobile est installée ou non
export const checkEmInstalled = (deviceList) => {
  return new Promise(async resolve => {
    //* pour chaque pda dans la liste, on va retourner uniquement les pda où easymobile est installé
    const data = []
    for (const item of deviceList) {
      const serial = item.serial
      try {
        const isInstalled = await utils.execCommand(`adb -s ${serial} shell pm list packages | grep net.distrilog.easymobile 2> nul`)
        console.log("%c cli-commands.js #76 || item : ", 'background:red;color:#fff;font-weight:bold;', item);
        console.log("%c cli-commands.js #76 || isInstalled : ", 'background:red;color:#fff;font-weight:bold;', isInstalled);
      } catch(err) {
      }
    }
    resolve(true)
  })
}

//* date de première installation
/* export const getPdaFirstInstallEM = (pda) => {
  return new Promise(resolve => {
    const data = utils.execCommand(`adb -s ${pda} shell dumpsys package net.distrilog.easymobile | grep firstInstallTime | sed 's/.*firstInstallTime=//;s/[" ]//g' | sed 's/\(....-..-..\)\(.*\)/\x01 \x02/' || null`)
    resolve(data)
  } ) 
} */

//* date de première installation
/* export const getPdaLastUpdateEM = (pda) => {
  return new Promise(resolve => {
    const data = utils.execCommand(`adb -s ${pda} shell dumpsys package net.distrilog.easymobile | grep lastUpdateTime | sed 's/.*lastUpdateTime=//;s/[" ]//g' | sed 's/\(....-..-..\)\(.*\)/\x01 \x02/' || null`)
    resolve(data)
  })
} */