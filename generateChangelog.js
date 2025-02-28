// generateChangelog.js

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// Récupère le chemin du script courant
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Transforme le chemin de changelog.js en URL file://
const changelogUrl = pathToFileURL(join(__dirname, 'changelog.js')).href;
const { changelog } = await import(changelogUrl);

/**
 * Transforme une version sous forme de chaîne en tableau de nombres.
 * Exemple : "v1.7.2" devient [1, 7, 2]
 */
function parseVersion(versionStr) {
  const clean = versionStr.startsWith('v') ? versionStr.slice(1) : versionStr;
  return clean.split('.').map(num => parseInt(num, 10));
}

/**
 * Compare deux versions (tableaux de nombres) en ordre décroissant.
 */
function compareVersions(vA, vB) {
  for (let i = 0; i < Math.max(vA.length, vB.length); i++) {
    const numA = vA[i] || 0;
    const numB = vB[i] || 0;
    if (numA !== numB) {
      return numB - numA; // décroissant
    }
  }
  return 0;
}

// Récupère et trie les clés par version décroissante
const keys = Object.keys(changelog);
keys.sort((a, b) => {
  const parsedA = parseVersion(a);
  const parsedB = parseVersion(b);
  return compareVersions(parsedA, parsedB);
});

// Sépare en deux groupes : version 1.x.x et alpha (0.x.x)
const group1 = [];
const groupAlpha = [];

for (const key of keys) {
  const [major] = parseVersion(key);
  if (major === 1) {
    group1.push({ version: key, content: changelog[key].trim() });
  } else {
    groupAlpha.push({ version: key, content: changelog[key].trim() });
  }
}

// Construit le contenu final du CHANGELOG.md
let output = '# Changelog\n\n---\n\n';

if (group1.length > 0) {
  output += '## Version 1.x.x\n\n';
  group1.forEach(item => {
    output += item.content + '\n\n';
  });
}

if (groupAlpha.length > 0) {
  output += '\n## Version alpha\n\n';
  groupAlpha.forEach(item => {
    output += item.content + '\n\n';
  });
}

// Écrit le contenu dans CHANGELOG.md à la racine
const changelogPath = join(__dirname, 'CHANGELOG.md');
writeFileSync(changelogPath, output, 'utf8');

console.log('CHANGELOG.md généré avec succès !');
