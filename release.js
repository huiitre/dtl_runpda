#!/usr/bin/env node

import axios from 'axios'
import { exec } from 'child_process'

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

const repo_id = process.env.GITLAB_PROJECT_ID
const access_token = process.env.GITLAB_API_TOKEN
const api_url = process.env.GITLAB_API_URL

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
      tag_name: `v${tag}`,
      description: `${changelog}`
    };

    axios.post(`${api_url}/projects/${repo_id}/releases`, releaseData, {
      headers: {
        "PRIVATE-TOKEN": `${access_token}`,
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

(async() => {
  try {
    //* récupération du changelog
    const changelogToVersion = changelog[`${version_number}`] || false

    if (!changelogToVersion)
      throw(`Le changelog pour la version ${version_number} est vide`)

    await createNpmTag(version_number)
    // writeFileSync('res.json', JSON.stringify(result))

    await delay(5000);

    await createRelease({ tag: `${version_number}`, changelog: changelogToVersion})
    // writeFileSync('res2.json', JSON.stringify(result2))

    // Publication sur npm
    await execShellCommand('npm publish');

  } catch(err) {
    console.log(err.toString())
    // writeFileSync('err.json', err.toString())
  }
})()