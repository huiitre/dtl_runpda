import fs from 'fs'
import path from 'path'
import { format } from 'date-fns';

class DebugManager {

  //* fichier de log d'aujourd'hui
  latestLogFile = ''
  //* path vers le fichier de log
  logFileDirectory = ''
  //* nombre de fichiers de log dans le dossier
  nbLogFile = 0

  //* liste des logs à insérer dans le fichier
  logs = []

  //* récupération des paramètres dans le constructeur
  constructor() {
    console.log("%c LogManager.js #15 || constructor", 'background:blue;color:#fff;font-weight:bold;');
  }

  log(props) {
    const { label, value = '', level = 0 } = props

    let log = ''

    let date = new Date();
    date = format(date, 'yyyy-MM-dd HH:mm:ss');

    console.log("%c DebugManager.js #26 || level : ", 'background:red;color:#fff;font-weight:bold;', level);

    switch (level) {
      case 0:
        log += `
          [DEBUG] - ${date}
        `
        break;
      case 1:
        log += `
          [WARNING] - ${date}
        `
        break;
      case 2:
        log += `
          [ERROR] - ${date}
        `
        break;
    
      default:
        log += `
          [UNKNOWN LEVEL] - ${date}
        `
        break;
    }

    log += `
    Label : ${label}
    `
    if (value.length > 0)
      log += `
        Value : ${value}
      `

    this.logs.push(log)
    console.log("%c DebugManager.js #29 || this.logs : ", 'background:red;color:#fff;font-weight:bold;', this.logs);
  }
}

export default new DebugManager()