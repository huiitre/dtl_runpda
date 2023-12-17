//* fonctions
import fn from './functions.js';

//* Commandes cli
import cli from './cli-commands.js';

//* Utils
import utils from './utils.js';

const commands = [
  /* {
    name: '',
    description: '',
    args: ['', ''],
    func: () => ,
    requireAdb: false
  }, */
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
]

export default commands