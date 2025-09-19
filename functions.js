/* const readline = require('readline');
const cli = require('./cli-commands')
const utils = require('./utils')
const Table = require('cli-table');
const chalk = require('chalk'); */
import readline from 'readline';
import cli from './cli-commands.js';
import utils from './utils.js';
import Table from 'cli-table';
import chalk from 'chalk';
import boxen from 'boxen';
import commands from './commands.js';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process'

const fn = {
  //* lance un stream du pda sélectionné avec l'exécutable 
  launchStreamPda: async(args) => {
    //* on récupère le pda sur lequel on va lancer la recherche
    let pdaToStream = ''
    if (args[0])
      pdaToStream = args[0]
    else {
      pdaToStream = await utils.getUserInput(`Veuillez cibler le PDA`, utils.getConfigValue('DEFAULT_PDA'))
    }

    const pdaSelected = await fn.targetPda(pdaToStream)

    if (pdaSelected != null) {
      console.log('')
      await cli.execScrcpy(pdaSelected.serialNumber)
    }
  },

  //* check si une mise à jour est disponible (en fonction de plusieurs paramètres)
  checkUpdate: async() => {
    utils.log({
      label: `checkUpdate`,
      value: ``,
      level: 0
    })
    //* date de la dernière vérification d'une mise à jour
    const lastCheckUpdate = new Date(utils.getConfigValue('LAST_CHECK_UPDATE'))
    utils.log({
      label: `lastCheckUpdate`,
      value: lastCheckUpdate,
      level: 1
    })
    //* temps (en heure) avant la prochaine vérification d'une mise à jour
    const timeBeforeCheckUpdate = utils.getConfigValue('TIME_BEFORE_CHECK_UPDATE')
    utils.log({
      label: `timeBeforeCheckUpdate`,
      value: timeBeforeCheckUpdate,
      level: 1
    })
    //* flag pour dire si on vérifie ou non qu'une mise à jour est disponible
    const requireUpdate = utils.getConfigValue('REQUIRE_UPDATE')
    utils.log({
      label: `requireUpdate`,
      value: requireUpdate,
      level: 1
    })

    //* date now
    const dateNow = new Date()

    //* prochaine vérification
    const nextCheckMaj = new Date(lastCheckUpdate.getTime() + timeBeforeCheckUpdate * 60 * 60 * 1000)
    utils.log({
      label: `nextCheckMaj`,
      value: nextCheckMaj,
      level: 1
    })

    //* si la date est dépassé ou qu'un update est déjà requis, on check la mise à jour jsuqu'à qu'il la fasse enfin
    if (dateNow > nextCheckMaj || requireUpdate) {
      utils.log({
        label: `La date est dépassé ou requireUpdate est true, on check la maj.requireUpdate`,
        value: requireUpdate,
        level: 0
      })
      console.log('')
      console.log(chalk.blue(`Recherche d'une mise à jour ...`))

      //* on met à jour la date du dernier check
      utils.updateConfig('LAST_CHECK_UPDATE', dateNow)

      const [ latestVersion, currentVersion ] = await Promise.all([
        cli.getLatestVersionFromNpm(),
        cli.getCurrentVersion()
      ])

      await Promise.all([
        utils.updateConfig('CURRENT_VERSION', currentVersion),
        utils.updateConfig('LATEST_VERSION', latestVersion)
      ])

      utils.log({
        label: `currentVersion`,
        value: currentVersion,
        level: 0
      })
      utils.log({
        label: `latestVersion`,
        value: latestVersion,
        level: 0
      })

      // Transforme une version en tableau de nombres
      const parseVersion = (versionStr) => {
        return versionStr.split('.').map(num => parseInt(num, 10));
      };

      // Compare deux versions : retourne un nombre négatif si vA < vB, 0 si égal, positif si vA > vB
      const compareVersions = (vA, vB) => {
        const a = parseVersion(vA);
        const b = parseVersion(vB);
        for (let i = 0; i < Math.max(a.length, b.length); i++) {
          const numA = a[i] || 0;
          const numB = b[i] || 0;
          if (numA !== numB) {
            return numA - numB;
          }
        }
        return 0;
      };

      //* si la version en cours est différente de la dernière version
      if (compareVersions(currentVersion, latestVersion) < 0) {
        await utils.updateConfig('REQUIRE_UPDATE', true)
        utils.log({
          label: `REQUIRE_UPDATE`,
          value: true,
          level: 0
        })
        return true
      } else {
        await utils.updateConfig('REQUIRE_UPDATE', false)
        utils.log({
          label: `REQUIRE_UPDATE`,
          value: false,
          level: 0
        })
        return false
      }
    }
    utils.log({
      label: `fin checkUpdate`,
      value: ``,
      level: 0
    })
  },

  //* affiche la version en cours
  displayCurrentVersion: async() => {
    const currentVersion = await cli.getCurrentVersion()
    const changelog = utils.getConfigValue('CHANGELOG')

    console.log('')
    console.log(chalk.green.bold(currentVersion))
    console.log(chalk.magenta.bold(changelog))
  },

  //* Affichage personnalisé dans le cas où une mise à jour serait disponible
  displayUpdatePackage: async() => {
    const currentVersion = utils.getConfigValue('CURRENT_VERSION')
    const latestVersion = utils.getConfigValue('LATEST_VERSION')
    const changelog = utils.getConfigValue('CHANGELOG')

    const packageName = 'DTL_RUNPDA'
    const message = `
      ${chalk.bold(packageName)}
      ${chalk.bold(chalk.magenta.bold(changelog))}

      Mise à jour disponible ${currentVersion} -> ${chalk.green.bold(latestVersion)}
      Exécutez ${chalk.blue.bold(`npm i -g dtl_runpda@${latestVersion}`)} ou ${chalk.blue.bold('run --update')} pour mettre à jour le package.
    `;

    const options = {
      padding: { top: 0, right: 4, bottom: 0, left: 1 },
      margin: { top: 1, right: 0, bottom: 1, left: 1 },
      borderStyle: 'round',
      borderColor: 'yellow',
      align: 'center'
    }
    console.log(boxen(message, options))
  },

  //* affiche la liste des PDA
  displayPdaList: async() => {
    let pdaList = []
    try {
      pdaList = await cli.getPdaList()
    } catch(err) {
      console.log('error : ' + err)
    }

    const table = new Table()
    table.push(
      [
        chalk.bold('Model'),
        chalk.bold('Serial number'),
        chalk.bold('EM version'),
        chalk.bold('Android version')/* ,
        'EM First install',
        'EM Last update' */
      ]
    );

    //* Récupération des informations pour chaque pda
    for (const item of pdaList) {
      const data = []
      data.push(item.model, item.serialNumber, item.emVersion, item.androidVersion)
      table.push(data)
    }

    console.log('')
    console.log(chalk.green.bold('Liste des PDA disponibles : '))
    console.log(table.toString());
  },

  //* Change le PDA par défaut
  displayChangeDefaultPda: async(args) => {
    //* récupération de l'argument
    let newPda = args[0]

    //* récupération de l'ancien pda par défaut
    let oldDefaultPda = utils.getConfigValue('DEFAULT_PDA')

    //* callback d'affichage
    const callback = () => {
      utils.updateConfig('DEFAULT_PDA', newPda)
      console.log('')
      console.log(`Le PDA par défaut a été changé par ${chalk.green.bold(newPda)} (anciennement ${chalk.red.bold(oldDefaultPda)})`)
    }

    try {
      if (newPda != null) {
        callback()  
      } else {
        console.log('')
        newPda = await utils.getUserInput(chalk.bold(`Veuillez inscrire le nouveau PDA à utiliser par défaut`), oldDefaultPda)

        callback()
      }

    } catch(err) {
      console.log(`ERROR : ${err}`)
    }
  },

  //* Affiche la liste des commandes avec éventuellement d'autres informations
  displayHelpCenter: () => {
    const table = new Table()
    table.push([
      chalk.bold(`Nom`),
      chalk.bold(`Commandes (lowerCase)`),
      chalk.bold(`Description`),
      chalk.bold(`Nécessite ADB`),
    ])

    //* on parcours la liste des commandes
    let count = 0
    //* Pour la première commande (run, run pda), on affiche pas le tiret devant la commande vu que c'est le modèle du pda qu'on vient taper
    for (const command of commands) {
      table.push([
        command.name,
        command.args.map(arg => `run ${count > 0 ? '-' : ''}${arg}`).join(', '),
        command.description,
        command.requireAdb ? 'Oui' : 'Non'
      ])
      count++
    }

    console.log('')
    console.log(`Liste des commandes disponibles : `)
    console.log(table.toString())

    //* affichage d'infos supplémentaires
    console.log('')
    console.log(chalk.italic(`Note : Toutes les commandes doivent être taper avec un ou plusieurs tirets au départ, en majuscule comme en minuscule`))
  },

  //* Lance la compilation, avec ou sans arguments
  displayRunPda: async(pda) => {
    //* on va gérer le fait d'avoir un pda sur lequel build ou non
    let pdaToBuild = ''
    if (pda)
      pdaToBuild = pda
    else {
      pdaToBuild = await utils.getUserInput(`Veuillez cibler le PDA`, utils.getConfigValue('DEFAULT_PDA'))
    }
    
    const pdaSelected = await fn.targetPda(pdaToBuild)

    if (pdaSelected != null) {
      //* on désactive à chaque fois la mise en veille du pda (timeout max)
      cli.setInfiniteScreenTimeout(pdaSelected.serialNumber)

      console.log('')
      console.log(chalk.green(`Lancement de la compilation du PDA ${chalk.bold(pdaSelected.model)} - ${chalk.bold(pdaSelected.serialNumber)} en cours ...`))
      console.log('')
      cli.runPda(pdaSelected.serialNumber)
    }
  },

  //* permet de clear l'app EM du pda sélectionné
  displayClearEM: async(args) => {
    //* on récupère le pda sur lequel on va lancer la recherche
    let pdaToClear = ''
    if (args[0])
      pdaToClear = args[0]
    else {
      pdaToClear = await utils.getUserInput(`Veuillez cibler le PDA`, utils.getConfigValue('DEFAULT_PDA'))
    }

    const pdaSelected = await fn.targetPda(pdaToClear)

    if (pdaSelected != null) {
      //* on désactive à chaque fois la mise en veille du pda (timeout max)
      cli.setInfiniteScreenTimeout(pdaSelected.serialNumber)

      console.log('')
      console.log(chalk.blue(`Clear du PDA ${chalk.bold(pdaSelected.model)} - ${chalk.bold(pdaSelected.serialNumber)} en cours ...`))
      await cli.clearEM(pdaSelected.serialNumber)
      console.log(chalk.green(`Clear du PDA ${chalk.bold(pdaSelected.model)} - ${chalk.bold(pdaSelected.serialNumber)} effectué !`))
      console.log('')
      console.log(chalk.blue(`Lancement de l'application du PDA ${chalk.bold(pdaSelected.model)} - ${chalk.bold(pdaSelected.serialNumber)} en cours ...`))
      await cli.startEM(pdaSelected.serialNumber)
      console.log(chalk.green(`Lancement de l'application du PDA ${chalk.bold(pdaSelected.model)} - ${chalk.bold(pdaSelected.serialNumber)} effectué !`))
    }
  },

  //* désinstallation de easymobile sur le PDA
  displayUninstallEM: async(args) => {
    //* on récupère le pda sur lequel on va lancer la recherche
    let pdaToUninstall = ''
    if (args[0])
      pdaToUninstall = args[0]
    else {
      pdaToUninstall = await utils.getUserInput(`Veuillez cibler le PDA`, utils.getConfigValue('DEFAULT_PDA'))
    }

    const pdaSelected = await fn.targetPda(pdaToUninstall)

    if (pdaSelected != null) {
      console.log('')
      if (pdaSelected.emVersion) {
        console.log(chalk.blue(`Désinstallation de l'application du PDA ${chalk.bold(pdaSelected.model)} - ${chalk.bold(pdaSelected.serialNumber)} en cours ...`))
        await cli.uninstallEM(pdaSelected.serialNumber)
        console.log(chalk.green(`Désinstallation de l'application du PDA ${chalk.bold(pdaSelected.model)} - ${chalk.bold(pdaSelected.serialNumber)} effectué !`))
      } else {
        console.log(chalk.red(`L'application EM n'est pas installé sur le PDA ${chalk.bold(pdaSelected.model)} - ${chalk.bold(pdaSelected.serialNumber)}`))
      }
    }
  },

  //* export la base de donnée easymobile du pda sélectionné
  displayExportEMBDD: async(args) => {
    //* on récupère le pda sur lequel on va lancer la recherche
    let pdaToTreatment = ''
    if (args[0])
      pdaToTreatment = args[0]
    else {
      pdaToTreatment = await utils.getUserInput(`Veuillez cibler le PDA`, utils.getConfigValue('DEFAULT_PDA'))
    }

    const pdaSelected = await fn.targetPda(pdaToTreatment)

    if (pdaSelected != null) {
      console.log('')
      if (pdaSelected.emVersion) {
        //* on récupère le nom du fichier sqlite
        const [oldName, newName] = await Promise.all([cli.getDatabaseFileNameEasymobile(pdaSelected.serialNumber), cli.getNewDatabaseFileNameEasymobile(pdaSelected.serialNumber)])

        if (utils.isStringEmpty(oldName) && utils.isStringEmpty(newName)) {
          console.log('')
          console.log(chalk.red(`La base de donnée du PDA ${chalk.bold(pdaSelected.model)} - ${chalk.bold(pdaSelected.serialNumber)} n'a pas été trouvé`))
          return
        }

        //* on a trouvé au moins une base sur les deux
        const databaseName = `${pdaSelected.model}_${pdaSelected.serialNumber}`

        //* on check si le dossier du pda a été créé ou non
        const appDir = path.join(utils.getConfigValue('APP_DIR'))
        const databaseDir = path.join(appDir, 'database')
        const pdaDir = path.join(databaseDir, pdaSelected.model.toUpperCase())

        const oldDatabaseCommand = `adb -s ${pdaSelected.serialNumber} exec-out run-as net.distrilog.easymobile cat app_webview/Default/databases/file__0/${oldName} > "${pdaDir}\\${databaseName}"`
        const newDatabaseCommand = `adb -s ${pdaSelected.serialNumber} exec-out run-as net.distrilog.easymobile cat databases/${newName} > "${pdaDir}\\${databaseName}"`

        let command = ''
        let location = ''
        let fileName = ''

        //* les deux bases sont présentes
        if (!utils.isStringEmpty(oldName) && !utils.isStringEmpty(newName)) {
          const response = await utils.selectValueIntoArray(['Ancienne base', 'Nouvelle base'], 'Plusieurs bases ont été trouvés, veuillez sélectionner la base à extraire', 'selectDatabaseToExtract')
          if (response === 'Nouvelle base') {
            command = newDatabaseCommand
            location = 'new'
            fileName = newName
          }
          else if (response === 'Ancienne base') {
            command = oldDatabaseCommand
            location = 'old'
            fileName = oldName
          }
        }
        //* une seule base est présente et c'est l'ancienne
        else if (!utils.isStringEmpty(oldName)) {
          command = oldDatabaseCommand
          location = 'old'
          fileName = oldName
        }
        //* une seule base est présente et c'est la nouvelle
        else if (!utils.isStringEmpty(newName)) {
          command = newDatabaseCommand
          location = 'new'
          fileName = newName
        }

        try {
          //* si le dossier n'est pas créé, on le crée
          if (!fs.existsSync(pdaDir)) {
            fs.mkdirSync(pdaDir)
          }

          utils.log({
            label: `Extraction de la bdd avec la commande adb suivante : `,
            value: `${command}`,
            level: 0
          })

          //* on extrait la base pour la coller dans le dossier
          console.log(chalk.blue(`Récupération de la base de donnée depuis le PDA ${pdaSelected.model} ...`))
          await cli.extractDatabase(pdaSelected.serialNumber, fileName, pdaDir, databaseName, location)

          console.log(chalk.green(`La base de donnée du PDA ${chalk.bold(pdaSelected.model)} - ${chalk.bold(pdaSelected.serialNumber)} a été exporté avec succès !`))
          console.log(chalk.blue(`Chemin : ${chalk.bold(`${pdaDir}\\${databaseName}`)}`))

        } catch(error) {
          console.log(chalk.red.bold(`Erreur lors de l'extraction de la base de donnée.`))
          console.log('')
          console.log(chalk.blue.bold(`Commande exécuté : `))
          console.log(chalk.blue.bold(command))
          console.log('')
          console.log(chalk.red(`Erreur : ${error}`))
        }
      } else {
        console.log(chalk.red(`L'application EM n'est pas installé sur le PDA ${chalk.bold(pdaSelected.model)} - ${chalk.bold(pdaSelected.serialNumber)}`))
      }
    }
  },

  //* permet de build un apk debug ou release (au choix)
  displayBuildApk: async() => {
    const buildSelected = await utils.selectValueIntoArray(['debug'], 'Sélectionner un type de build', 'selectBuildType')
    await cli.buildApk(buildSelected)
  },

  configManager: () => {
    const npmDir = utils.getConfigValue('NPM_APP_DIR')
    const electronPath = path.join(npmDir, 'config-electron', 'main.js')
    exec(`npx electron ${electronPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error('Erreur lors de l\'exécution d\'Electron :', error);
      }
      console.log(stdout);
      console.log(stderr);
    });
  },

  //* fonction qui cible un pda
  targetPda: async(pdaToTreatment) => {
    //* on récupère la liste des pda
    let pdaList = []
    try {
      pdaList = await cli.getPdaList()
    } catch(err) {

    }

    //* on lance la recherche
    if (pdaList.length === 0) {
      console.log('')
      console.log(chalk.red(`Aucun appareil n'a été trouvé`))
      return null
    }

    //* on récupère le ou les pda qui correspondent au modèle qu'on a demandé
    const pdaSelected = pdaList.filter(pda => pda.model.toLowerCase() == pdaToTreatment.toLowerCase())

    if (pdaSelected.length === 0) {
      console.log('')
      console.log(chalk.red(`Le PDA sélectionné ${chalk.bold(pdaToTreatment)} n'a pas été trouvé`))
      return null
    }

    //* si on a trouvé plus d'un PDA
    if (pdaSelected.length > 1) {
      const objectSelected = await utils.selectValueIntoArrayObjets(pdaSelected, {
        propsToDisplay: [
          { name: 'Model', prop: 'model' },
          { name: 'Serial number', prop: 'serialNumber' },
          { name: 'EM version', prop: 'emVersion' },
          { name: 'Android version', prop: 'androidVersion' }
        ],
        question: 'Sélectionner un PDA'
      })

      //* on a notre objet sélectionné, on va donc build avec ça
      return objectSelected
    } else {
      return pdaSelected[0]
    }
  },

  //* met à jour le package
  cmdUpdatePackage: async() => {
    const requireUpdate = utils.getConfigValue('REQUIRE_UPDATE')
    const latestVersion = utils.getConfigValue('LATEST_VERSION')
    if (requireUpdate)
      await cli.updateLatestVersion(latestVersion)

    console.log(chalk.blue('Aucune mise à jour disponible'))
  },

  //* git manager - merge
  gitMerge: async(args) => {
    if (args.length === 0)
      return console.log(chalk.red(`Commande git manquante`))

    //* la branche à merger
    const branch = args[0]
    
    try {
      //* la branche sélectionné
      let branchSelected = await cli.selectGitBranch(branch)
      if (!branchSelected)
        return console.log(chalk.red(`La branche ${chalk.bold(branch)} n'a pas été trouvé`))

      //* la branche courante
      const currentGitBranch = await cli.getCurrentGitBranch()

      //* vérification de sécurité
      const isOk = await utils.selectValueIntoArray(['oui', 'non'], `Vous êtes sur le point de merge la branche ${branchSelected} dans la branche courante ${currentGitBranch}, vous confirmez ?`, 'confirmMergebranch')
      if (isOk === 'oui')
        await cli.execGitMerge(branchSelected)
      else
        console.log(chalk.red(`Merge ${chalk.bold(branchSelected)} -> ${chalk.bold(currentGitBranch)} annulé`))
    } catch(err) {
      console.log(err)
    }
  },

  //* git manager - pull
  gitPull: async(args) => {
    const origin = args[0]

    if (origin && origin.toLowerCase() === 'origin') {
      //* récupération de la branche en cours
      const currentGitBranch = await cli.getCurrentGitBranch()
      await cli.execGitPull(currentGitBranch)
    }
    else
      await cli.execGitPull()
  },

  //* git manager - checkout
  gitCheckout: async(args) => {
    if (args.length === 0)
      return console.log(chalk.red(`Commande git manquante`))

    //* la commande (nom d'une branche ou alors -b pour création)
    const firstCommand = args[0]

    //* création d'une branche
    if (/^-+b$/i.test(firstCommand)) {
      console.log(chalk.yellow(chalk.bold(`Création d'une branche cours de développement`)))
      /* const branch = args[1]
      if (!branch)
        return console.log(chalk.red(`Numéro de branche manquant`))

      //* la liste des branches
      const branchList = await cli.getGitBranchList()
      //* est-ce qu'elle existe
      let branchExist = branchList.filter(b => b.toLowerCase().includes(branch.toLowerCase()))
      
      if (branchExist.length > 0)
        return console.log(chalk.red(`Une branche portant le nom ${chalk.bold(branch)} existe déjà`)) */

    }
    //* changement de branche
    else {
      const branch = firstCommand
      try {
        let branchSelected = await cli.selectGitBranch(branch)
        if (!branchSelected)
          return console.log(chalk.red(`La branche ${chalk.bold(branch)} n'a pas été trouvé`))
        await cli.execGitCheckout(branchSelected)
      } catch(err) {
        console.log(err)
      }
    }
  },

  easymobileAbout: async() => {
    const finish = async () => {
      console.log('');
      console.log(chalk.yellow.bold('Récapitulatif :'));
      console.log(`Date       : ${chalk.green.bold(currentDate)}`);
      console.log(`Version EM : ${chalk.green.bold(version)}`);
      console.log(`Auteur     : ${chalk.green.bold(author)}`);
      console.log(`Ticket     : ${chalk.green.bold(`#${ticketNumber}`)}`);
      console.log(`Description: ${chalk.green.bold(ticketLibelle)}`);
      console.log('');
  
      const buildSelected = await utils.selectValueIntoArray(
        ['oui', 'non', 'modifier manuellement le numéro de version'],
        'Souhaitez-vous valider cet ajout ?',
        'validateTicket'
      );
  
      if (buildSelected === 'oui') {
        console.log(chalk.green.bold('Ajout validé.'));
        const jsonFilePath = path.join(process.cwd(), 'easymobile_about.json');

        // Lire et mettre à jour le fichier JSON
        try {
          // Charger le fichier JSON
          if (!fs.existsSync(jsonFilePath)) {
            console.log(chalk.red.bold(`Le fichier ${jsonFilePath} n'existe pas. Annulation de l'opération.`));
            return;
          }
          const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
          const jsonData = JSON.parse(fileContent);

          // Créer le nouvel objet
          const newEntry = {
            date: currentDate,
            version,
            author,
            ticket: ticketNumber,
            description: ticketLibelle,
          };

          jsonData.push(newEntry);

          jsonData.sort((a, b) => {
            const dateA = new Date(a.date.split('/').reverse().join('-'));
            const dateB = new Date(b.date.split('/').reverse().join('-'));

            if (dateA > dateB) return -1;
            if (dateA < dateB) return 1;

            return a.author.localeCompare(b.author);
          });

          fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');
          console.log(chalk.green.bold(`Le fichier ${jsonFilePath} a été mis à jour avec succès.`));
        } catch (error) {
          console.error(chalk.red.bold('Erreur lors de la mise à jour du fichier JSON:'), error);
        }
      } else if (buildSelected === 'non') {
        console.log(chalk.red.bold('Ajout du ticket annulé.'));
        return;
      } else {
        console.log(chalk.blue.bold('Modification manuelle du numéro de version...'));
        await modifyVersion();
      }
    };

    const modifyVersion = async () => {
      const oldVersion = version || 'inconnu';
      console.log(chalk.yellow(`Numéro de version actuel : ${chalk.bold(oldVersion)}`));
      version = '';
      while (!version) {
        version = await utils.getUserInput(
          chalk.bold(`Veuillez renseigner manuellement le numéro de version`),
          oldVersion
        );
        if (!version) {
          console.log(chalk.red.bold(`Numéro de version non renseigné`));
        } else {
          version = version.trim();
        }
      }
      await finish();
    };

    const currentDate = new Date().toLocaleDateString('fr-FR');
    let author = ''
    const defaultAuthor = utils.getConfigValue('EMA_DEFAULT_AUTHOR')
    while (!author) {
      author = await utils.getUserInput(chalk.bold(`Veuillez renseigner votre nom d\'auteur`), defaultAuthor)
      if (!author)
        console.log(chalk.red.bold(`Auteur non renseigné`));
      else {
        author = author.toUpperCase().trim()
        utils.updateConfig('EMA_DEFAULT_AUTHOR', author)
      }
    }

    let ticketNumber = ''
    while (!ticketNumber) {
      ticketNumber = await utils.getUserInput(chalk.bold(`Veuillez renseigner le numéro du ticket (sans le # devant)`))
      if (!ticketNumber)
        console.log(chalk.red.bold(`Numéro du ticket non renseigné`));
      else
        ticketNumber = ticketNumber.replace(/\D/g, '')
    }

    let ticketLibelle = ''
    while (!ticketLibelle) {
      ticketLibelle = await utils.getUserInput(chalk.bold(`Veuillez renseigner libellé du ticket`))
      if (!ticketLibelle)
        console.log(chalk.red.bold(`Libellé non renseigné`));
      else
        ticketLibelle = ticketLibelle.trim()
    }

    let version = fn.getVersionFromConfig();
    if (!version) {
      while (!version) {
        console.log(chalk.red.bold('Numéro de version introuvable dans le config.xml.'));
        version = await utils.getUserInput(chalk.bold('Veuillez renseigner manuellement le numéro de version'));
        if (!version)
          console.log(chalk.red.bold(`Numéro de version non renseigné`));
        else
          version = version.trim()
      }
    }

    await finish()
  },

  getVersionFromConfig: () => {
    try {
      const xmlContent = fs.readFileSync('config.xml', 'utf-8');
  
      const versionMatch = xmlContent.match(/<widget[^>]*version=["']([^"']+)["']/);
  
      if (versionMatch && versionMatch[1]) {
        return versionMatch[1];
      } else {
        console.log('Numéro de version introuvable dans config.xml.');
        return null;
      }
    } catch (err) {
      console.error('Erreur lors de la lecture ou du parsing du fichier config.xml :', err);
      return null;
    }
  }
}

export default fn