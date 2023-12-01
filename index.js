#!/usr/bin/env node

const { exec } = require('child_process');
const { log } = require('console');

const args = process.argv.slice(2)
console.log("%c index.js #7 || BIENVENUE SUR MON SCRIPT DE LA MORT", 'background:blue;color:#fff;font-weight:bold;');
console.log("%c index.js #8 || args : ", 'background:red;color:#fff;font-weight:bold;', args);
console.log("%c index.js #9 || FIN DU SCRIPT DE LA MORT", 'background:blue;color:#fff;font-weight:bold;');

/* const command = 'bash run.sh -v'

exec(command, (err, stdout, stderr) => {
  if (err)
    return console.log("%c index.js #7 || ERROR : ", 'background:red;color:#fff;font-weight:bold;', err);

  console.log("%c index.js #10 || sortie : ", 'background:red;color:#fff;font-weight:bold;', stdout);
  console.log("%c index.js #11 || erreur standard : ", 'background:red;color:#fff;font-weight:bold;', stderr);
})

console.log("%c index.js #14 || mange ta soeur", 'background:red;color:#fff;font-weight:bold;'); */