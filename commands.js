//* fonctions
import fn from './functions.js';

//* Commandes cli
import cli from './cli-commands.js';

//* Utils
import utils from './utils.js';

const commands = [
  /* {
    name: ``,
    description: ``,
    args: ['', ''],
    func: () => ,
    requireAdb: false
  }, */
  {
    name: `Compilation de EM sur un PDA`,
    description: `Lance la compilation de EasyMobile sur un PDA sélectionné au préalable. L'argument n'est pas obligatoire`,
    args: ['', 'pdamodel'],
    func: (args) => utils.adbIsInstalled && fn.displayRunPda(args),
    requireAdb: true
  },
  {
    name: 'Liste des PDA',
    description: 'Affiche la liste des PDA connectés sur le PC',
    args: ['l', 'list'],
    func: () => utils.adbIsInstalled && fn.displayPdaList(),
    requireAdb: true
  },
  {
    name: 'Version',
    description: 'Affiche le numéro de version du package ainsi que le lien vers le CHANGELOG',
    args: ['v', 'version'],
    func: () => fn.displayCurrentVersion(),
    requireAdb: false
  },
  {
    name: 'PDA par défaut',
    description: 'Change le modèle du PDA qui sera sélectionné par défaut',
    args: ['d', 'default', 'defaut'],
    func: (args) => fn.displayChangeDefaultPda(args),
    requireAdb: false
  },
  {
    name: 'Clear EM',
    description: `Vide l'app EM du PDA sélectionné`,
    args: ['c', 'clear'],
    func: (args) => fn.displayClearEM(args),
    requireAdb: true
  },
  {
    name: 'Désinstallation EM',
    description: `Désinstalle l'app EM du PDA sélectionné`,
    args: ['u', 'uninstall'],
    func: (args) => fn.displayUninstallEM(args),
    requireAdb: true
  },
  {
    name: 'Build APK',
    description: `Build un APK release ou debug`,
    args: ['b', 'build'],
    func: (args) => fn.displayBuildApk(args),
    requireAdb: true
  },
  {
    name: `Centre d'aide`,
    description: `Affiche l'aide et la liste des commandes disponibles`,
    args: ['h', 'help'],
    func: () => fn.displayHelpCenter(),
    requireAdb: false
  },
]

export default commands