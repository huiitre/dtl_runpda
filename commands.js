const utils = require('./utils')

module.exports = {
  //* retourne la liste des pda
  getPdaList: () => {
    return new Promise(resolve => {
      const data = utils.execCommand(`adb devices -l | sed '1d' | awk '/device/{print $1}`)
      resolve(data)
    })
  },

  //* modèle du pda
  getPdaModel: (pda) => {
    return new Promise(async resolve => {
      let data = await utils.execCommand(`adb -s ${pda} shell getprop ro.product.model | tr -d '\r' || echo "null"`)
      data.replace(/[\r\n]+/g, '')
      resolve(data)
    })
  },

  //* numéro de série
  getPdaSerialNumber: (pda) => {
    return new Promise(async resolve => {
      let data = await utils.execCommand(`adb -s ${pda} shell getprop ro.serialno | tr -d '\r' || echo "null")`)
      data.replace(/[\r\n]+/g, '')
      resolve(data)
    })
  },

  //* version easymobile
  getPdaEMVersion: (pda) => {
    return new Promise(async resolve => {
      let data = await utils.execCommand(`adb -s ${pda} shell dumpsys package net.distrilog.easymobile | grep versionName | sed 's/.*versionName=//;s/[" ]//g'`)
      data.replace(/[\r\n]+/g, '')
      resolve(data)
    })
  },

  //* version android du pda
  getPdaAndroidVersion: (pda) => {
    return new Promise(async resolve => {
      let data = await utils.execCommand(`adb -s ${pda} shell getprop ro.build.version.release`)
      data.replace(/[\r\n]+/g, '')
      resolve(data)
    })
  },

  //* date de première installation
  /* getPdaFirstInstallEM: (pda) => {
    return new Promise(resolve => {
      const data = utils.execCommand(`adb -s ${pda} shell dumpsys package net.distrilog.easymobile | grep firstInstallTime | sed 's/.*firstInstallTime=//;s/[" ]//g' | sed 's/\(....-..-..\)\(.*\)/\x01 \x02/' || null`)
      resolve(data)
    } ) 
  }, */

  //* date de première installation
  /* getPdaLastUpdateEM: (pda) => {
    return new Promise(resolve => {
      const data = utils.execCommand(`adb -s ${pda} shell dumpsys package net.distrilog.easymobile | grep lastUpdateTime | sed 's/.*lastUpdateTime=//;s/[" ]//g' | sed 's/\(....-..-..\)\(.*\)/\x01 \x02/' || null`)
      resolve(data)
    })
  } */
}