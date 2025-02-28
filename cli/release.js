#!/usr/bin/env node

import axios from 'axios'
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { changelog } from './changelog.js'

import { config } from 'dotenv';
config();

const execShellCommand = (cmd) => {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout ? stdout : stderr);
    });
  });
};

const [ version_number ] = process.argv.slice(2)

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

if (!version_number) {
  console.log('PAS DE VERSION DE RENSEIGNE')
  process.exit(1)
}

const repo_name = process.env.GITHUB_REPO_NAME
const repo_owner = process.env.GITHUB_REPO_OWNER
const access_token = process.env.GITHUB_API_TOKEN
const api_url = process.env.GITHUB_API_URL

const createNpmTag = async (tag) => {
  try {
    // Créer le tag et incrémenter la version dans package.json
    await execShellCommand(`npm version ${tag}`);

    // Push des modifications dans le package.json
    await execShellCommand('git push');

    // Push du tag créé
    await execShellCommand(`git push origin v${tag}`);
    return true
  } catch (error) {
    console.error('Une erreur est survenue lors de l\'exécution des commandes :', error);
    throw error
  }
}

const createRelease = ({ tag, changelog }) => {
  return new Promise((resolve, reject) => {
    const releaseData = {
      name: `${tag}`,
      tag_name: tag,
      description: `${changelog}`,
      body: `${changelog}`,
      draft: false,
      prerelease: false
    };

    axios.post(`${api_url}/repos/${repo_owner}/${repo_name}/releases`, releaseData, {
      headers: {
        "Authorization": `token ${access_token}`,
        "Content-Type": "application/json"
      }
    })
    .then(response => {
      resolve(response.data);
    })
    .catch(error => {
      reject(error);
    });
  });
}

const getLatestStableVersionFromNpm = () => {
  return new Promise(async(resolve, reject) => {
    try {
      const result = await execShellCommand(`npm dist-tag ls dtl_runpda`);
      const latestVersionLine = result.trim().split('\n').find(line => line.startsWith('latest:'));
      const latestVersion = latestVersionLine ? latestVersionLine.split(':')[1].trim() : null;
      resolve(latestVersion);
    } catch(err) {
      reject(err)
    }
  })
}

const generateChangelog = () => {
  return new Promise((resolve, reject) => {
    exec('node generateChangelog.js', { cwd: __dirname }, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Erreur lors de l'exécution de generateChangelog.js: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`Erreur: ${stderr}`);
        return reject(stderr);
      }
      await execShellCommand('git add CHANGELOG.md');
      await execShellCommand('git commit -m "CHANGELOG.md"');
      await execShellCommand('git push');
      return resolve(stdout);
    });
  });
};

(async() => {
  try {
    console.log(`---------- Début du déploiement de la version ${version_number}`)

    const currentLatestStableVersion = await getLatestStableVersionFromNpm()

    console.log(`Version latest (stable) actuelle : ${currentLatestStableVersion}`)

    //* récupération du changelog
    console.log('Récupération du changelog pour la version')
    const changelogToVersion = changelog[`${version_number}`] || false

    if (!changelogToVersion)
      throw(`Le changelog pour la version ${version_number} est vide`)

    //* génération du fichier CHANGELOG.md
    console.log('Génération du fichier CHANGELOG.md')
    await generateChangelog()

    console.log('Création du tag npm')
    await createNpmTag(version_number)
    // writeFileSync('res.json', JSON.stringify(result))

    await delay(5000);

    console.log('Création de la release sur github')
    await createRelease({ tag: `${version_number}`, changelog: changelogToVersion})
    // writeFileSync('res2.json', JSON.stringify(result2))

    // Publication sur npm
    console.log('Publication de la version sur npm')
    await execShellCommand('npm publish');

    await delay(5000);

    //* on remet la version de base en latest, on ne veut pas que ce soit celle qui vient d'être déployé
    // console.log(`La version ${version_number} est déployé. On replace la version ${currentLatestStableVersion.trim()} en version latest (stable)`)
    await execShellCommand(`npm dist-tag add dtl_runpda@${version_number.trim()} latest`)

  } catch(err) {
    console.log(err.toString())
    // writeFileSync('err.json', err.toString())
  } finally {
    console.log('---------- Fin du script de déploiement')
  }
})()