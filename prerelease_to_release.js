#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs'
import axios from 'axios'

const [ version_number ] = process.argv.slice(2)

if (!version_number) {
  console.log('PAS DE VERSION DE RENSEIGNE')
  process.exit(1)
}

const repo_owner = 'huiitre'
const repo_name = 'dtl_runpda'
const access_token = readFileSync('./github_token.txt', 'utf-8')

const api_url = `https://api.github.com/repos/${repo_owner}/${repo_name}/releases/tags/${version_number}`;

const getPreRelease = () => {
  console.log("%c release.js #20 || getPreRelease", 'background:blue;color:#fff;font-weight:bold;');
  return new Promise((resolve, reject) => {
    axios.get(`${api_url}`, {
      headers: {
        Authorization: `token ${access_token}`
      }
    })
    .then(data => {
      resolve(data)
    })
    .catch(err => reject(err))
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

(async() => {
  try {
    const { data } = await getPreRelease()
    writeFileSync('res.json', JSON.stringify(data))

    const releaseId = data.id
    const isPrerelease = data.prerelease

    if (!isPrerelease) {
      console.log(`Le tag ${version_number} n'est pas une pré-release`)
      return
    }

    console.log("%c release.js #62 || releaseId : ", 'background:red;color:#fff;font-weight:bold;', releaseId);

    const { data: data2 } = await updatePreReleaseToRelease(releaseId)
    writeFileSync('res2.json', JSON.stringify(data2))

  } catch(err) {
    console.log(err.toString())
    writeFileSync('err.json', err.toString())
  }
})()