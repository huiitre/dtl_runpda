#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs'
import axios from 'axios'
import { exec } from 'child_process'

import { changelog } from './changelog.js'

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

const [ version_number, prerelease ] = process.argv.slice(2)

let isPrerelease = false
if (prerelease) isPrerelease = true

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

if (!version_number) {
  console.log('PAS DE VERSION DE RENSEIGNE')
  process.exit(1)
}

const repo_owner = 'huiitre'
const repo_name = 'dtl_runpda'
const access_token = readFileSync('./github_token.txt', 'utf-8')

const createNpmTag = async (tag) => {
  try {
    // Créer le tag et incrémenter la version dans package.json
    await execShellCommand(`npm version ${tag}`);

    // Push des modifications dans le package.json
    await execShellCommand('git push');

    // Push du tag créé
    await execShellCommand(`git push origin v${tag}`);

    // Publication sur npm
    await execShellCommand('npm publish');

    return true
  } catch (error) {
    console.error('Une erreur est survenue lors de l\'exécution des commandes :', error);
    throw error
  }
}

const getRelease = ({ tag, changelog }) => {
  return new Promise((resolve, reject) => {
    axios.get(`https://api.github.com/repos/${repo_owner}/${repo_name}/releases/tags/${version_number}`, {
      headers: {
        Authorization: `token ${access_token}`
      }
    })
    .then(data => {
      resolve(data)
    })
    .catch(err => {
      if (err.response.status == '404')
        reject(`Le tag ${tag} n'existe pas`)
      reject(err)
    })
  })
}

const createRelease = ({ tag, changelog }) => {
  return new Promise((resolve, reject) => {
    const releaseData = {
      tag_name: tag,
      name: `Release ${tag}`,
      body: `${changelog}`, // Ajoutez une description si nécessaire
      draft: false,
      prerelease: isPrerelease // Assurez-vous que c'est false si vous ne voulez pas une pre-release
    };

    axios.post(`https://api.github.com/repos/${repo_owner}/${repo_name}/releases`, releaseData, {
      headers: {
        Authorization: `token ${access_token}`,
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
    const changelogToVersion = changelog[`v${version_number}`] || false

    if (!changelogToVersion)
      throw(`Le changelog pour la version v${version_number} est vide`)

    if (!isPrerelease) {
      const result = await createNpmTag(version_number)
      // writeFileSync('res.json', JSON.stringify(result))
    }

    await delay(5000);

    const result2 = await createRelease({ tag: `v${version_number}`, changelog: changelogToVersion})
    // writeFileSync('res2.json', JSON.stringify(result2))

  } catch(err) {
    console.log(err.toString())
    // writeFileSync('err.json', err.toString())
  }
})()