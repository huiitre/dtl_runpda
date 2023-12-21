//* fonctions
import fn from './functions.js';

//* Commandes cli
import cli from './cli-commands.js';

//* Utils
import utils from './utils.js';

//* debug
import debug from './DebugManager.js';

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
    func: async (args) => utils.adbIsInstalled && await fn.displayRunPda(args),
    requireAdb: true
  },
  {
    name: 'Liste des PDA',
    description: 'Affiche la liste des PDA connectés sur le PC',
    args: ['l', 'list'],
    func: async () => utils.adbIsInstalled && await fn.displayPdaList(),
    requireAdb: true
  },
  {
    name: 'Version',
    description: 'Affiche le numéro de version du package ainsi que le lien vers le CHANGELOG',
    args: ['v', 'version'],
    func: async () => await fn.displayCurrentVersion(),
    requireAdb: false
  },
  {
    name: 'PDA par défaut',
    description: 'Change le modèle du PDA qui sera sélectionné par défaut',
    args: ['d', 'default', 'defaut'],
    func: async (args) => await fn.displayChangeDefaultPda(args),
    requireAdb: false
  },
  {
    name: 'Clear EM',
    description: `Vide l'app EM du PDA sélectionné`,
    args: ['c', 'clear'],
    func: async (args) => await fn.displayClearEM(args),
    requireAdb: true
  },
  {
    name: 'Désinstallation EM',
    description: `Désinstalle l'app EM du PDA sélectionné`,
    args: ['u', 'uninstall'],
    func: async (args) => await fn.displayUninstallEM(args),
    requireAdb: true
  },
  {
    name: 'Export BDD EM',
    description: `Extrait la base de donnée de EM du PDA vers le dossier de configuration du package`,
    args: ['e', 'export'],
    func: async (args) => await fn.displayExportEMBDD(args),
    requireAdb: true
  },
  {
    name: 'Build APK',
    description: `Build un APK release ou debug`,
    args: ['b', 'build'],
    func: async (args) => await fn.displayBuildApk(args),
    requireAdb: true
  },
  {
    name: `Centre d'aide`,
    description: `Affiche l'aide et la liste des commandes disponibles`,
    args: ['h', 'help'],
    func: () => fn.displayHelpCenter(),
    requireAdb: false
  },
  {
    name: `Update package`,
    description: `Update le package avec la dernière version`,
    args: ['update'],
    func: async () => await fn.cmdUpdatePackage(),
    requireAdb: false
  },
]

export default commands