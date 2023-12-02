const utils = require('./utils')

module.exports = {
  //* retourne la liste des pda
  getPdaList: () => {
    return new Promise(resolve => {
      const data = utils.execCommand(`adb devices -l | sed '1d' | awk '/device/{print $1}`)
      resolve(data)
    })
  }
}