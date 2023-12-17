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

  //* Récupère la dernière version en cours du package NPM
  getCurrentVersion: () => {
    return new Promise(resolve => {
      exec(`npm list -g --depth=0 dtl_runpda | grep 'dtl_runpda@' | awk '{ print $2 }' | sed 's/^dtl_runpda@//'`, (err, stdout) => {
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
  },

  //* Build un apk (release / debug)
  buildApk: (type) => {
    return new Promise(resolve => {
      let command = ''
      if (type === 'release')
        command = '--release "--" --packageType=apk'
      else
        command = '--debug'

      const childProcess = exec(`cordova build android ${command}`, (err, stdout, stderr) => {
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
  },

  //* clear EM du PDA
  clearEM: (serialNumber) => {
    return new Promise(async resolve => {
      exec(`adb -s ${serialNumber} shell pm clear net.distrilog.easymobile`, (err, stdout) => {
        resolve(true)
      })
    })
  },

  //* lance l'app easymobile du PDA
  startEM: (serialNumber) => {
    return new Promise(async resolve => {
      exec(`adb -s ${serialNumber} shell am start -n net.distrilog.easymobile/.MainActivity`, (err, stdout) => {
        resolve(true)
      })
    })
  },

  //* désinstalle l'app easymobile du PDA
  uninstallEM: (serialNumber) => {
    return new Promise(async resolve => {
      exec(`adb -s ${serialNumber} uninstall net.distrilog.easymobile`, (err, stdout) => {
        resolve(true)
      })
    })
  },

  //* récupère le nom du fichier sqlite de easymobile
  getDatabaseFileNameEasymobile: (serialNumber) => {
    return new Promise(async resolve => {
      exec(`adb -s ${serialNumber} shell "run-as net.distrilog.easymobile ls app_webview/Default/databases/file__0 | grep -v '-'"`, (err, stdout) => {
        resolve(stdout.trim())
      })
    })
  },

  //* extrait la base de donnée
  extractDatabase: (serialNumber, filename, pdaDir) => {
    return new Promise(async resolve => {
      exec(`adb -s ${serialNumber} exec-out run-as net.distrilog.easymobile cat app_webview/Default/databases/file__0/${filename} > ${pdaDir}\\${filename}`, (err, stdout) => {
        if (err)
          resolve(err)

        resolve(stdout.trim())
      })
    })
  }
}

export default cli