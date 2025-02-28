/* const utils = require('./utils') */
import utils from './utils.js';
import { exec, spawn, execSync } from 'child_process';
import path from 'path';
import axios from 'axios'

import { config } from 'dotenv';
config();

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

  //! déprécié
  getLatestVersionFromGit: () => {
    return new Promise(async(resolve, reject) => {
      try {
        const { data } = await axios.get(`${process.env.GITLAB_API_URL}/projects/${process.env.GITLAB_PROJECT_ID}/repository/tags/STABLE`, {
          headers: {
            "PRIVATE-TOKEN": process.env.GITLAB_API_TOKEN,
            "Content-Type": "application/json"
          }
        });
        const target = data.commit.id

        const { data: releases } = await axios.get(`${process.env.GITLAB_API_URL}/projects/${process.env.GITLAB_PROJECT_ID}/releases`, {
          headers: {
            "PRIVATE-TOKEN": process.env.GITLAB_API_TOKEN,
            "Content-Type": "application/json"
          }
        });

        const matchingRelease = releases.find(release => release.commit.id === target)

        if (!matchingRelease) throw 'Release non trouvé'

        let version = matchingRelease.name

        if (version.startsWith('v'))
            version = version.slice(1)
        resolve(version)
      } catch(err) {
        console.log("%c cli-commands.js #39 || ERROR : ", 'background:red;color:#fff;font-weight:bold;', err);
        utils.log({
          label: 'getLatestVersionFromGit',
          value: err
        })
      }
    })
  },

  getLatestVersionFromNpm: () => {
    return new Promise((resolve, reject) => {
      exec(`npm dist-tag ls dtl_runpda`, (err, stdout) => {
        if (err) {
          console.error("Erreur lors de l'exécution de la commande npm dist-tag ls :", err);
          reject(err);
          return;
        }

        const latestVersionLine = stdout.trim().split('\n').find(line => line.startsWith('latest:'));
        const latestVersion = latestVersionLine ? latestVersionLine.split(':')[1].trim() : null;

        resolve(latestVersion);
      })
    })
  },

  //* met à jour le package
  updateLatestVersion: (tag) => {
    return new Promise(resolve => {
      exec(`npm i -g dtl_runpda@${tag}`, (err, stdout) => {
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
            const cleanedData = data.map(item => item ? item.replace(/[\r\n]+/g, '') : '')
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
        resolve(versionName)
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
      const npmDir = utils.getConfigValue('NPM_APP_DIR')
      const executablePath = path.join(npmDir, 'lib', 'scrcpy', 'scrcpy.exe')
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

  //* récupère le nom du fichier sqlite de easymobile au nouvel emplacement
  getNewDatabaseFileNameEasymobile: (serialNumber) => {
    return new Promise(async resolve => {
      exec(`adb -s ${serialNumber} shell "run-as net.distrilog.easymobile ls databases | grep -v '-'"`, (err, stdout) => {
        resolve(stdout.trim())
      })
    })
  },

  //* extrait la base de donnée
  extractDatabase: async(serialNumber, filename, pdaDir, databaseRename, location) => {
    return new Promise((resolve, reject) => {
      //* on récupère le chemin de l'app dans npm
      const npmDir = utils.getConfigValue('NPM_APP_DIR')

      const command = `${npmDir}\\lib\\jre1.8.0_411\\bin\\java.exe -jar ${npmDir}\\AdbCommand.jar ${serialNumber} ${filename} ${pdaDir} ${databaseRename} ${location}`

      utils.log({
        label: 'Commande : ',
        value: command
      })

      exec(`${npmDir}\\lib\\jre1.8.0_411\\bin\\java.exe -jar ${npmDir}\\AdbCommand.jar ${serialNumber} ${filename} ${pdaDir} ${databaseRename} ${location}`, (error, stdout, stderr) => {
        if (stderr)
          reject(stderr)
        if (error)
          reject(`${error}`)
        resolve(`${stdout}`)
      });
    })
  },

  //* récupère la liste des branches
  getGitBranchList: () => {
    return new Promise((resolve, reject) => {
      exec(`git branch -a`, (error, stdout, stderr) => {
        if (stderr)
          reject(stderr)
        if (error)
          reject(`${error}`)

        const brancheList = stdout.split(`\n`)
          .map(branch => branch.trim())
          .filter(branch => branch && !branch.startsWith('remotes/') && !branch.startsWith('*'));

        resolve(brancheList)
      })
    })
  },
  execGitCheckout: (branch) => {
    return new Promise((resolve, reject) => {
      const childProcess = exec(`git checkout ${branch}`, (error, stdout, stderr) => {
        if (stderr)
          resolve(stderr)
        if (error)
          resolve(`${error}`)
        resolve(stdout.trim())
      })

      childProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        console.log(output);
      })

      childProcess.stderr.on('data', (data) => {
        const errorOutput = data.toString().trim();
        console.error(errorOutput);
      });
    })
  },

  //* récupère la branche courante git
  getCurrentGitBranch: () => {
    return new Promise((resolve, reject) => {
      exec(`git rev-parse --abbrev-ref HEAD`, (error, stdout, stderr) => {
        if (stderr)
          resolve(stderr)
        if (error)
          resolve(`${error}`)
        resolve(stdout.trim())
      })
    })
  },

  //* exécute un merge d'une branche sélectionné
  execGitMerge: (branch) => {
    return new Promise((resolve, reject) => {
      const childProcess = exec(`git merge ${branch}`, (error, stdout, stderr) => {
        if (stderr)
          resolve(stderr)
        if (error)
          resolve(`${error}`)
        resolve(stdout.trim())
      })

      childProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        console.log(output);
      })

      childProcess.stderr.on('data', (data) => {
        const errorOutput = data.toString().trim();
        console.error(errorOutput);
      });
    })
  },

  //* exécute git pull
  execGitPull: (branch = null) => {
    return new Promise((resolve, reject) => {
      const command = branch ? `git pull origin ${branch}` : `git pull`
      const childProcess = exec(command, (error, stdout, stderr) => {
        if (stderr)
          resolve(stderr)
        if (error)
          resolve(`${error}`)
        resolve(stdout.trim())
      })

      childProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        console.log(output);
      })

      childProcess.stderr.on('data', (data) => {
        const errorOutput = data.toString().trim();
        console.error(errorOutput);
      });
    })
  },

  //* sélection branche git
  selectGitBranch: (branch) => {
    return new Promise(async(resolve, reject) => {
      try {
        //* la liste des branches
        const branchList = await cli.getGitBranchList()
        let branchSelected = null

        //* les branches en lien avec la demande
        const filteredBranches = branchList.filter(b => b.toLowerCase().includes(branch.toLowerCase()))

        if (filteredBranches.length === 0)
          resolve(false)
        if (filteredBranches.length > 1)
          //* sélection de la branche voulu dans la liste
          branchSelected = await utils.selectValueIntoArray(filteredBranches, 'Sélectionner une branche', 'selectGitBranch')
        else
          branchSelected = filteredBranches[0]

        resolve(branchSelected)
      } catch(err) {
        reject(err)
      }
    })
  }
}

export default cli