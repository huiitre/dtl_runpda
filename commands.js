//* Fonctions
import fn from './functions.js';

const commands = [
  /* {
    name: '',
    description: '',
    args: ['', ''],
    func: () => ,
  }, */
  {
    name: 'Liste des PDA',
    description: 'Affiche la liste des PDA connectés sur le PC',
    args: ['l', 'list'],
    func: () => fn.displayPdaList(),
  },
  {
    name: 'Version',
    description: 'Affiche le numéro de version du package ainsi que le lien vers le CHANGELOG',
    args: ['v', 'version'],
    func: () => fn.displayCurrentVersion(),
  },
  {
    name: 'PDA par défaut',
    description: 'Change le modèle du PDA qui sera sélectionné par défaut',
    args: ['d', 'default', 'defaut'],
    func: () => fn.displayChangeDefaultPda(),
  },
]

export default commands