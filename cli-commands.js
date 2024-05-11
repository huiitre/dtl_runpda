/* const utils = require('./utils') */
import utils from './utils.js';
import { exec, spawn, execSync } from 'child_process';
import path from 'path';

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

  //* met à jour le package
  updateLatestVersion: () => {
    return new Promise(resolve => {
      exec(`npm i -g dtl_runpda@latest`, (err, stdout) => {
        resolve(stdout.trim())
      })
    })
  },

  //* Récupère la dernière version en cours du package NPM
  getCurrentVersion: () => {
    return new Promise((resolve, reject) => {
      exec('npm list -g dtl_runpda', (err, stdout) => {
        if (err) {
          reject(err);
          return;
        }
        const match = stdout.match(/dtl_runpda@(\d+\.\d+\.\d+)/);
        const version = match ? match[1] : 'Inconnu'
        resolve(version);
      });
    });
  },

  //* retourne la liste des pda
  getPdaList: () => {
    return new Promise((resolve, reject) => {
        exec(`adb devices -l`, 
        async(error, stdout, stderr) => {
          if (stderr)
            reject(stderr)

          if (error)
            reject(error)

          const lines = stdout.split('\n')

          const pdaList = lines
            .map(line => {
              const match = line.match(/^\s*([\S]+)/);
              return match ? match[1] : null;
            })
            .filter(serialNumber => serialNumber !== null && serialNumber !== 'List');

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

  //* lance le serveur adb
  adbStartServer: async() => {
    return new Promise(async resolve => {
      exec(`adb devices`, (err, stdout) => {
        resolve(true)
      })
    })
  },

  //* modèle du pda
  getPdaModel: (pda) => {
    return new Promise(async resolve => {
      exec(`adb -s ${pda} shell getprop ro.product.model`, (err, stdout) => {
        const data = stdout.replace(/[\r\n]+/g, '')
        resolve(data.trim())
      })
    })
  },

  //* numéro de série
  getPdaSerialNumber: (pda) => {
    return new Promise(async resolve => {
      exec(`adb -s ${pda} shell getprop ro.serialno`, (err, stdout) => {
        const data = stdout.replace(/[\r\n]+/g, '')
        resolve(data.trim())
      })
    })
  },
  //* version easymobile
  getPdaEMVersion: (pda) => {
    return new Promise(async resolve => {
      exec(`adb -s ${pda} shell dumpsys package net.distrilog.easymobile`, (err, stdout) => {
        if (err) {
          resolve(null)
        }

        const lines = stdout.split('\n')
        let versionName = null
        
        for (const line of lines) {
          if (line.includes('versionName=')) {
            versionName = line.split('versionName=')[1].trim()
            break;
          }
        }
        resolve(versionName.trim())
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

  //* lance la fenêtre du pda sur le pc
  execScrcpy: (serialNumber) => {
    return new Promise(async resolve => {
      const globalPath = execSync(`npm root -g`).toString().trim()
      const executablePath = path.join(globalPath, 'dtl_runpda', 'lib', 'scrcpy', 'scrcpy.exe')
      const child = spawn(`${executablePath}`, ['-s', serialNumber], { detached: true });
      child.stdout.on('data', (data) => {
        console.log(data.toString());
        resolve()
      });

      child.stderr.on('data', (data) => {
        console.error(data.toString());
        resolve()
      });

      child.on('close', (code) => {
        console.log(`Le processus enfant a été fermé avec le code ${code}`);
        resolve()
      });
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
  extractDatabase: async(serialNumber, filename, pdaDir, databaseRename) => {
    return new Promise((resolve, reject) => {
      //* on récupère le chemin de l'app dans npm
      const npmDir = utils.getConfigValue('NPM_APP_DIR')

      exec(`java -jar ${npmDir}\\AdbCommand.jar ${serialNumber} ${filename} ${pdaDir} ${databaseRename}`, (error, stdout, stderr) => {
        if (stderr)
            reject(stderr)
        if (error)
          reject(`${error}`)
        resolve(`${stdout}`)
      });
    })
  }
}

export default cli