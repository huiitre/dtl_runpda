#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs'
import axios from 'axios'

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

if (!version_number) {
  console.log('PAS DE VERSION DE RENSEIGNE')
  process.exit(1)
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const repo_owner = 'huiitre'
const repo_name = 'dtl_runpda'
const access_token = readFileSync('./github_token.txt', 'utf-8')

const getPreRelease = (tag) => {
  console.log("%c release.js #20 || getPreRelease", 'background:blue;color:#fff;font-weight:bold;');
  return new Promise((resolve, reject) => {
    axios.get(`https://api.github.com/repos/${repo_owner}/${repo_name}/releases/tags/${tag}`, {
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

const updatePreReleaseToRelease = (releaseId) => {
  console.log("%c release.js #35 || updatePreReleaseToRelease", 'background:blue;color:#fff;font-weight:bold;');
  return new Promise((resolve, reject) => {
    const release_data = {
      tag_name: version_number,
      name: `Release ${version_number}`,
      prerelease: false,
      make_latest: true
    };
    axios.patch(`https://api.github.com/repos/${repo_owner}/${repo_name}/releases/${releaseId}`, release_data, {
      headers: {
        Authorization: `token ${access_token}`,
        "Content-Type": "application/json"
      }
    })
    .then(data => {
      resolve(data)
    })
    .catch(err => reject(err))
  })
}

const createNpmTag = async (tag) => {
  console.log("%c release.js #21 || createNpmTag", 'background:blue;color:#fff;font-weight:bold;');
  try {
    // Créer le tag et incrémenter la version dans package.json
    await execShellCommand(`npm version ${tag}`);

    // Push des modifications dans le package.json
    await execShellCommand('git push');

    // Push du tag créé
    // await execShellCommand(`git push origin v${tag}`);

    // Publication sur npm
    await execShellCommand('npm publish');

    return true
  } catch (error) {
    console.error('Une erreur est survenue lors de l\'exécution des commandes :', error);
    throw error
  }
}

(async() => {
  try {
    const { data } = await getPreRelease(`v${version_number}`)
    writeFileSync('res.json', JSON.stringify(data))

    const releaseId = data.id
    const isPrerelease = data.prerelease

    if (!isPrerelease) {
      throw (`Le tag ${version_number} n'est pas une pré-release`)
    }

    //* on push le tag sur npm
    /* const result = await createNpmTag(version_number)
    writeFileSync('res.json', JSON.stringify(result)) */

    await delay(5000)

    //* on update le tag sur git
    const { data: data2 } = await updatePreReleaseToRelease(releaseId)
    writeFileSync('res2.json', JSON.stringify(data2))

  } catch(err) {
    console.log(err.toString())
    writeFileSync('err.json', err.toString())
  }
})()