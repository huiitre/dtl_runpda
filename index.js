//* Core
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

//* dépendances
import chalk from 'chalk';

//* Uitlitaires
import utils from './utils.js';

//* Commandes cli
import cli from './cli-commands.js';

//* Fonctions
import fn from './functions.js';

//* Commandes
import commands from './commands.js';

const init = async() => {
  //* récupération de la configuration de l'utilisateur, la crée si elle n'existe pas
  utils.createConfigUser()

  //* check si une version est disponible
  const requireUpdate = await fn.checkUpdate()

  //* affichage du message de mise à jour si nécessaire
  if (requireUpdate)
    fn.displayUpdatePackage()

  //* récupération des arguments
  const args = process.argv.slice(2)

  //* si pas d'arguments ou alors premier argument commençant pas par un tiret --, on compile
  if (args.length === 0 || !args[0].startsWith('-'))
    return console.log('COMPILATION')

  //* commande principal
  const mainCommand = args[0].replace(/^[-]+/, '')

  //* est-ce qu'elle a match
  let matchCommand = commands.find(command => command.args.includes(mainCommand))

  //* récupération des autres arguments si il y en a
  const otherArgs = args.slice(1)

  //* on check (et pour l'instant on affiche) si adb est installé
  const adbIsNotInstalled = await cli.isAdbInstalled()
  if (adbIsNotInstalled) {
    //* on déclare un flag qui nous servira pour certaines commandes
    utils.adbIsInstalled = false
    
    //* on affiche un message d'erreur seulement si la commande a besoin d'adb pour fonctionner
    if (matchCommand?.requireAdb) {
      //* on affiche le message d'avertissement
      console.log('')
      console.log(chalk.italic.red(`${adbIsNotInstalled}`))
    }
  }

  if (matchCommand)
    matchCommand.func(otherArgs)
  else {
    console.log('')
    console.log(`La commande ${chalk.bold.red(args[0])} est introuvable`)
    fn.displayHelpCenter()
  }

}

init()