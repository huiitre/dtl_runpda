/* const utils = require('./utils') */
import utils from './utils.js';
import { exec, spawn, execSync } from 'child_process';
import path from 'path';
import axios from 'axios'
import os from 'os';
import fs from 'fs';

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
      exec(`adb version`, { timeout: 5000 },
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
      exec(`adb devices -l`, { timeout: 500 }, async (error, stdout, stderr) => {
        if (stderr) return reject(stderr)
        if (error) return reject(error)

        const lines = stdout.split('\n')

        //* extraction serial + model depuis adb devices -l
        const devices = lines
          .map(line => {
            const serialMatch = line.match(/^(\S+)\s+device/)
            if (!serialMatch) return null

            const serialNumber = serialMatch[1]

            const modelMatch = line.match(/model:([^\s]+)/)
            const model = modelMatch ? modelMatch[1] : null

            return { serialNumber, model }
          })
          .filter(Boolean)

        //* récupération des infos lentes en parallèle
        const result = await Promise.all(
          devices.map(async ({ serialNumber, model }) => {

            const [emVersion, androidVersion] = await Promise.all([
              cli.getPdaEMVersion(serialNumber),
              cli.getPdaAndroidVersion(serialNumber)
            ])

            return {
              model,
              serialNumber,
              emVersion,
              androidVersion
            }
          })
        )

        utils.pdaList = result
        resolve(result)
      })
    })
  },

  //* lance le serveur adb
  adbStartServer: async() => {
    return new Promise(async resolve => {
      exec(`adb devices`, { timeout: 500 }, (err, stdout) => {
        resolve(true)
      })
    })
  },

  //* modèle du pda
  getPdaModel: (pda) => {
    return new Promise(async (resolve, reject) => {
      exec(`adb -s ${pda} shell getprop ro.product.model`, { timeout: 500 }, (err, stdout) => {
        // if (err) console.log(`err : ${err}`)
        const data = stdout.replace(/[\r\n]+/g, '')
        resolve(data.trim())
      })
    })
  },

  //* numéro de série
  getPdaSerialNumber: async(pda) => {
    /* return new Promise(async (resolve, reject) => {
      exec(`adb -s ${pda} shell getprop ro.serialno`, { timeout: 5000 }, (err, stdout) => {
        // if (err) console.log(`err : ${err}`)
        const data = stdout.replace(/[\r\n]+/g, '')
        resolve(data.trim())
      })
    }) */
   return pda
  },
  //* version easymobile
  getPdaEMVersion: (pda) => {
    return new Promise(async (resolve, reject) => {
      exec(`adb -s ${pda} shell dumpsys package net.distrilog.easymobile`, { timeout: 500 }, (err, stdout) => {
        // if (err) console.log(`err : ${err}`)

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
    return new Promise(async (resolve, reject) => {
      exec(`adb -s ${pda} shell getprop ro.build.version.release`, { timeout: 500 }, (err, stdout) => {
        // if (err) console.log(`err : ${err}`)
        const data = stdout.replace(/[\r\n]+/g, '')
        resolve(data.trim())
      })
    })
  },

  getPdaInfo: (pda) => {
    return new Promise((resolve) => {
      const cmd = `
        echo "__MODEL__=$(getprop ro.product.model)"
        echo "__SERIAL__=$(getprop ro.serialno)"
        echo "__ANDROID__=$(getprop ro.build.version.release)"
        dumpsys package net.distrilog.easymobile 2>/dev/null | grep versionName= || true
      `

      exec(
        `adb -s ${pda} shell sh -c '${cmd.replace(/\n/g, '; ')}'`,
        { timeout: 7000 },
        (err, stdout) => {
          if (err || !stdout) {
            return resolve({
              model: null,
              serialNumber: pda,          // ADB serial conservé
              emVersion: null,
              androidVersion: null
            })
          }

          const lines = stdout.split('\n')

          const get = (prefix) =>
            lines.find(l => l.startsWith(prefix))?.split('=')[1]?.trim() || null

          const model = get('__MODEL__')
          const serialFromProp = get('__SERIAL__')
          const androidVersion = get('__ANDROID__')
          const emVersion =
            lines.find(l => l.includes('versionName='))?.split('versionName=')[1]?.trim() || null

          // 🔒 RÈGLE CLÉ : sur émulateur, on IGNORE ro.serialno
          const isEmulator = pda.startsWith('emulator-')
          const serialNumber = isEmulator ? pda : (serialFromProp || pda)

          resolve({
            model,
            serialNumber,
            androidVersion,
            emVersion
          })
        }
      )
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
    return new Promise((resolve, reject) => {
      const child = spawn(
        'cordova',
        ['run', 'android', `--target=${serialNumber}`],
        {
          shell: true,        // important sous Windows
          stdio: ['ignore', 'pipe', 'pipe']
        }
      );

      child.stdout.on('data', (data) => {
        console.log(data.toString().trim());
      });

      child.stderr.on('data', (data) => {
        console.error(data.toString().trim());
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve('Cordova run terminé avec succès');
        } else {
          reject(new Error(`Cordova run failed (exit code ${code})`));
        }
      });

      child.on('error', (err) => {
        reject(err);
      });
    });
  },

  //* Build un apk (release / debug)
  buildApk: (type) => {
    return new Promise((resolve, reject) => {
      let args = ['build', 'android'];

      if (type === 'release') {
        args.push('--release', '--', '--packageType=apk');
      } else {
        args.push('--debug');
      }

      const child = spawn(
        'cordova',
        args,
        {
          shell: true,              // important sous Windows
          stdio: ['ignore', 'pipe', 'pipe']
        }
      );

      // Sortie standard en continu (comme avant)
      child.stdout.on('data', (data) => {
        console.log(data.toString().trim());
      });

      // Sortie d’erreur en continu (comme avant)
      child.stderr.on('data', (data) => {
        console.error(data.toString().trim());
      });

      // Fin du build
      child.on('close', (code) => {
        if (code === 0) {
          resolve('Build APK terminé avec succès');
        } else {
          reject(new Error(`Build APK échoué (exit code ${code})`));
        }
      });

      child.on('error', (err) => {
        reject(err);
      });
    });
  },

  //* clear EM du PDA
  clearEM: (serialNumber) => {
    return new Promise(async resolve => {
      exec(`adb -s ${serialNumber} shell pm clear net.distrilog.easymobile`, { timeout: 5000 }, (err, stdout) => {
        resolve(true)
      })
    })
  },

  //* lance la fenêtre du pda sur le pc
  execScrcpy: (serialNumber) => {
    console.log(
      "%c cli-commands.js #execScrcpy",
      'background:blue;color:#fff;font-weight:bold;'
    );

    return new Promise(async (resolve) => {
      const npmDir = path.normalize(utils.getConfigValue('NPM_APP_DIR'));
      const base = path.join(npmDir, 'lib', 'scrcpy-v3.3.4');

      const isWindows = os.platform() === 'win32';

      const scrcpyBin = isWindows
        ? path.join(base, 'win64', 'scrcpy.exe')
        : path.join(base, 'linux', 'scrcpy');

      const adbBundled = isWindows
        ? path.join(base, 'win64', 'adb.exe')
        : path.join(base, 'linux', 'adb');

      const argsBase = ['-s', serialNumber];

      const spawnScrcpy = (adbPath = null) => {
        return new Promise((res) => {
          let args = [...argsBase];

          if (adbPath) {
            args = ['--adb', adbPath, ...args];
            console.log(
              "%c execScrcpy || using forced adb",
              'color:orange;font-weight:bold;',
              adbPath
            );
          } else {
            console.log(
              "%c execScrcpy || using system adb",
              'color:green;font-weight:bold;'
            );
          }

          const child = spawn(scrcpyBin, args, {
            detached: true,
            stdio: 'inherit'
          });

          child.on('close', (code) => {
            console.log(
              "%c execScrcpy || close",
              'background:red;color:#fff;font-weight:bold;',
              code
            );
            res({ ok: code === 0 });
          });
        });
      };

      // 1️⃣ Tentative avec ADB embarqué
      const result = await spawnScrcpy(adbBundled);

      // 2️⃣ Fallback : ADB système
      if (!result.ok) {
        console.log(
          "%c execScrcpy || fallback to system adb",
          'background:purple;color:#fff;font-weight:bold;'
        );
        await spawnScrcpy(null);
      }

      resolve();
    });
  },

  //* lance l'app easymobile du PDA
  startEM: (serialNumber) => {
    return new Promise(async resolve => {
      exec(`adb -s ${serialNumber} shell am start -n net.distrilog.easymobile/.MainActivity`, { timeout: 5000 }, (err, stdout) => {
        resolve(true)
      })
    })
  },

  //* désinstalle l'app easymobile du PDA
  uninstallEM: (serialNumber) => {
    return new Promise(async resolve => {
      exec(`adb -s ${serialNumber} uninstall net.distrilog.easymobile`, { timeout: 5000 }, (err, stdout) => {
        resolve(true)
      })
    })
  },

  //* désactive la mise en veille écran (timeout max) sur le PDA
  setInfiniteScreenTimeout: (serialNumber) => {
    return new Promise(async resolve => {
      exec(
        `adb -s ${serialNumber} shell settings put system screen_off_timeout 2147483647`, { timeout: 5000 },
        (err, stdout, stderr) => {
          resolve(true);
        }
      );
    });
  },

  //* récupère le nom du fichier sqlite de easymobile
  getDatabaseFileNameEasymobile: (serialNumber) => {
    return new Promise(async resolve => {
      exec(`adb -s ${serialNumber} shell "run-as net.distrilog.easymobile ls app_webview/Default/databases/file__0 | grep -v '-'"`, { timeout: 5000 }, (err, stdout) => {
        resolve(stdout.trim())
      })
    })
  },

  //* récupère le nom du fichier sqlite de easymobile au nouvel emplacement
  getNewDatabaseFileNameEasymobile: (serialNumber) => {
    return new Promise(async resolve => {
      exec(`adb -s ${serialNumber} shell "run-as net.distrilog.easymobile ls databases | grep -v '-'"`, { timeout: 5000 }, (err, stdout) => {
        resolve(stdout.trim())
      })
    })
  },

  //* extrait la base de donnée
  extractDatabase: async (serialNumber, filename, pdaDir, databaseRename, location) => {
    return new Promise((resolve, reject) => {

      const npmDir = utils.getConfigValue('NPM_APP_DIR')
      const isWindows = process.platform === 'win32'

      const javaCmd = isWindows
        ? `"${path.join(npmDir, 'lib', 'jre1.8.0_411', 'bin', 'java.exe')}"`
        : 'java'

      const jarPath = path.join(npmDir, 'AdbCommand.jar')

      const command = [
        javaCmd,
        '-jar',
        `"${jarPath}"`,
        serialNumber,
        filename,
        `"${pdaDir}"`,
        databaseRename,
        location
      ].join(' ')

      utils.log({
        label: 'Commande : ',
        value: command
      })

      exec(command, (error, stdout, stderr) => {
        if (stderr) return reject(stderr)
        if (error) return reject(error.message)
        resolve(stdout)
      })
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