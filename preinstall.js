import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const isGlobalInstall = process.env.npm_config_global === 'true'

if (!isGlobalInstall) {
  console.error(`
    ===========================================================
    Ce package doit être installé globalement.
    Veuillez utiliser la commande : npm install -g dtl_runpda
    ===========================================================
  `);
  process.exit(1);
}

// Chemin du dossier de configuration
const configDir = join(homedir(), 'dtl_runpda');

// Chemin complet du fichier config.json
const jsonPath = join(configDir, 'config.json');

console.log("%c preinstall.js #11 || PRE INSTALLATION", 'background:blue;color:#fff;font-weight:bold;');

try {
  // Vérifier si le fichier existe avant de le supprimer
  if (existsSync(jsonPath)) {
    // Supprimer le fichier
    unlinkSync(jsonPath);
    console.log('Fichier config.json supprimé avec succès.');
  } else {
    console.log('Le fichier config.json n\'existe pas.');
  }
} catch (error) {
  console.error('Erreur lors de la suppression du fichier config.json :', error);
}

const logDir = join(configDir, 'log')

try {
  if (!existsSync(logDir))
    mkdirSync(logDir)
} catch(err) {
  console.error(`Erreur lors de la création du dossier log à la racine de dtl_runpda`)
}