/* const utils = require('./utils') */
import * as utils from './utils.js';

/**
 * Fonctions qui exécutent des commandes dans le terminal
 * 
 * Penser à reformater la donnée ici (en tableau/objet) si nécessaire
 */


//* retourne la liste des pda
export const getPdaList = () => {
  return new Promise(async resolve => {
    try {
      const data = await utils.execCommand(`adb devices -l | sed '1d' | awk '/device/{print $1}`)
      let pdaList = data.split('\n')
      pdaList = pdaList.filter(item => {
        if (!utils.isStringEmpty(item))
          return item
      })
      resolve(pdaList)
    } catch(err) {
      // throw new Error(`Erreur lors de la récupération des PDA`)
    }
  })
}

//* modèle du pda
export const getPdaModel = (pda) => {
  return new Promise(async resolve => {
    let data = await utils.execCommand(`adb -s ${pda} shell getprop ro.product.model | tr -d '\r' || echo "null"`)
    data = data.replace(/[\r\n]+/g, '')
    resolve(data)
  })
}

//* numéro de série
export const getPdaSerialNumber = (pda) => {
  return new Promise(async resolve => {
    let data = await utils.execCommand(`adb -s ${pda} shell getprop ro.serialno | tr -d '\r' || echo "null")`)
    data = data.replace(/[\r\n]+/g, '')
    resolve(data)
  })
}

//* version easymobile
export const getPdaEMVersion = (pda) => {
  return new Promise(async resolve => {
    let data = await utils.execCommand(`adb -s ${pda} shell dumpsys package net.distrilog.easymobile | grep versionName | sed 's/.*versionName=//;s/[" ]//g'`)
    data = data.replace(/[\r\n]+/g, '')
    resolve(data)
  })
}

//* version android du pda
export const getPdaAndroidVersion = (pda) => {
  return new Promise(async resolve => {
    let data = await utils.execCommand(`adb -s ${pda} shell getprop ro.build.version.release`)
    data = data.replace(/[\r\n]+/g, '')
    resolve(data)
  })
}

//* update l'application
export const updatePackage = () => {
  return new Promise(async resolve => {
    await utils.execCommand(`npm i -g dtl_runpda`)
    resolve(true)
  })
}

//* regarde si l'app easymobile est installée ou non
export const checkEmInstalled = (deviceList) => {
  console.log("%c cli-commands.js #69 || deviceList : ", 'background:red;color:#fff;font-weight:bold;', deviceList);
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