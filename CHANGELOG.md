# Changelog

---
## Version 1.x.x

### [v1.3.6] - 18-05-2024
- CORRECTIF - Correction de la question quand on fait run -b pour sélectionner un type de build
- MODIFICATION - On récupère dorénavant la dernière version depuis le tag release de git, ce qui permet de déployer sur npm une pré-release sans qu'elle soit installée. On privilégie donc une installation via run --update ou npm install -g dtl_runpda@< tag_name > plutôt que simplement npm install -g dtl_runpda/dtl_runpda@latest

### [v1.3.5] - 13-05-2024
- CORRECTIF - Ajout du PATH complet vers le JRE du package

### [v1.3.4] - 13-05-2024
- CORRECTIF - Ajout du JRE jre1.8.0_411 dans le projet pour lire directement le fichier .jar
- CORRECTIF - Recompilation du .jar AdbCommand en java 8 au lieu de java 11 car impossible de trouver le JRE en java 11

### [v1.3.3] - 11-05-2024
- CORRECTIF - Correctif du numéro de version courant quand on est en version de développement

### [v1.3.2] - 11-05-2024
- CORRECTIF - Ajout d'une config NPM_APP_DIR afin de récupérer le chemin dans lequel l'app est installé afin de récupérer le fichier .jar
- CORRECTIF - Dans la fonction Log, correction d'une erreur avec value.length

### [v1.3.1] - 11-05-2024
- CORRECTIF - Ajout d'un fichier .jar pour extraire la BDD du PDA avec la commande run -e

### [v1.3.0] - 09-05-2024
- CORRECTIF - Compatibilité de certaines commandes avec d'autres terminaux comme CMD ou Windows PowerShell
- AJOUT - Fichier release.js qui permet de créer en une commande une release ou une pré-release
- AJOUT - Fichier prerelease_to_release.js qui permet de passer une version pre-release en release sur git et de publier la version sur NPM

### [v1.2.34] - 09-05-2024
- TEST - Test final pré-release puis release

### [v1.2.33] - 09-05-2024
- CORRECTIF - Lors du passage de pré-release à rélease, on venait modifier le nom du tag en retirant le "v" devant 

### [v1.2.32] - 09-05-2024
- AJOUT - Test de la pré-release puis de la release sur NPM 

### [v1.2.31] - 09-05-2024
- AJOUT - Test de la release 

### [v1.2.30] - 09-05-2024
- AJOUT - Mise en place du fichier changelog.js, paufinage du fichier release.js et création du fichier prerelease_to_release.js, début du développement

### [v1.2.29] - 09-05-2024
- CORRECTIF - Compatibilité de certaines commandes avec d'autres terminaux comme CMD ou Windows PowerShell
- AJOUT - Fichier release2.sh (en test) qui permettra de créer/push automatiquement les tags release/pré-release

### [1.2.2] - 09-05-2024
- CORRECTIF - Compatibilité de certaines commandes avec d'autres terminaux comme CMD ou Windows PowerShell
- AJOUT - Fichier release2.sh (en test) qui permettra de créer/push automatiquement les tags release/pré-release

### [v1.2.1] - 14-02-2023
- CORRECTIF - Récupération du path global de NPM via la commande "npm root -g" afin d'exécuter la librairie scrcpy

### [v1.2.0] - 14-02-2023
- AJOUT - Ajout de la commande -show afin d'exécuter scrcpy.exe qui ouvrira une fenêtre du pda sélectionné

### [v1.1.0] - 29-12-2023
- CORRECTIF - Modification de la commande qui récupère la liste des PDA en adb devices -l car posait soucis pour l'invit de cmd windows
- AJOUT - Ajout dans le changelog du numéro de version majeure
- CORRECTIF - Ajout d'une vérification du terminal utilisé et affiche un message d'erreur si ce dernier n'est pas GitBash
- CORRECTIF - Ajout d'une fonction qui lance le serveur adb (adb start-server) au début du script
- CORRECTIF - Mise à jour du README
- AJOUT - Ajout d'un système de log dans l'application, il n'y a pour l'instant pas de logs de partout et la gestion du niveau de log est limité
- CORRECTIF - Actuellement le build d'un apk release n'est pas géré, donc on le retire de la liste des choix lors de la commande "run -b"

### [v1.0.5] - 18-12-2023 stable
- CORRECTIF au niveau de la récupération de la version actuelle depuis un terminal NON SHELL

### [v1.0.4] - 18-12-2023
- CORRECTIF nom de la fonction qui est appelé lorsqu'on fait un --update était identique à celle qu'on appelait pour afficher la maj disponible, du coup ça faisait automatiquement la mise à jour

### [v1.0.3] - 18-12-2023
- FIX CHANGELOG
- Test de la commande --update
### [v1.0.2] - 18-12-2023
- ROLLBACK - Module extract pda génère un lien à coller dans l'invité de commande en attendant un correctif
- Ajout de la commande --update afin de faire un npm i -g dtl_runpda@latest pour mettre à jour

### [v1.0.1] - 18-12-2023
- ROLLBACK - Module extract pda génère un lien à coller dans l'invité de commande en attendant un correctif
- Ajout de la commande --update afin de faire un npm i -g dtl_runpda@latest pour mettre à jour

### [v1.0.0] - 17-12-2023
- Mise en place des différentes commandes pour une première release

---
## Version alpha

### [v0.2.18] - 17-12-2023
- Test des différentes commandes pour une première release

### [v0.2.17] - 06-12-2023
- FIX : Ajout du fichier `cli-commands.js` dans le package.json

### [v0.2.16] - 06-12-2023
- Ajout d'une commande `run --update` afin d'update le package plus facilement
- Refactorisation d'une partie du code (commands.js -> cli-commands.js)

### [v0.2.15] - 03-12-2023
- FIX création du dossier avec mkdirsync avant de créer le fichier

### [v0.2.14] - 03-12-2023
- FIX suppression d'un console.log qui fait planter l'app

### [v0.2.13] - 03-12-2023
- Modification du path du fichier de config par celui de l'utilisateur/dtl_runpda afin qu'il ne soit pas écrasé lors de l'update

### [v0.2.12] - 03-12-2023
- ROLLBACK de la création du dossier config

### [v0.2.11] - 03-12-2023
- Ajout d'un dossier config pour stocker le json

### [v0.2.10] - 03-12-2023
- TEST Ajout du npmignore dans le package.json

### [v0.2.9] - 03-12-2023
- Ajout du npmignore dans le package.json

### [v0.2.8] - 03-12-2023
- Ajout du fichier .npmignore afin d'ignorer l'écrasement du fichier config.json

### [v0.2.7] - 03-12-2023
- Retrait des console.log + test OK

### [v0.2.6] - 03-12-2023
- Fix en ajoutant le path global également dans la fonction updateConfig (oublie)

### [v0.2.5] - 03-12-2023
- Fix création du json + ajout de logs pour tester

### [v0.2.4] - 03-12-2023
- Ajout d'un path qui pointe vers le module dtl_runpda et non plus sur le dossier en cours

### [v0.2.3] - 03-12-2023
- Extraction du config.json si celui ci n'existe pas et a été créé

### [v0.2.2] - 03-12-2023
- Ajout d'un argument optionnel lors du changement du pda par défaut (run -d optionArgs) afin d'aller plus vite
- Ajout du fichier config.json dans le package.json

### [v0.2.1] - 03-12-2023
- Mise en place de la fonction qui affiche la liste des PDA
- Mise en place de la commande "list" qui utilise la fonction d'affichage des PDA
- Modification du style du numéro de version pour la commande "version"
- Ajout du lien vers le changelog lors de la commande "version" et également quand une mise à jour est disponible
- Gestion de la configuration depuis le JSON (lecture et écriture)
- Mise en place de la commande de modification du PDA par défaut

### [v0.2.0] - 02-12-2023
- Mise en place du switch qui gère les différentes commandes
- ajout de la lib cli-table afin d'afficher un tableau dans le terminal
- Mise en place de la première commande qui affiche le numéro de version

### [v0.1.4] - 02-12-2023
- Test du développement précédent avant d'aller dormir
- Ajout + test en cours du fichier release.sh

### [v0.1.3] - 02-12-2023
- CORRECTIF : Ajout des fichiers utils.js et run.sh dans le package.json

### [v0.1.2] - 02-12-2023
- Mise en place d'un fichier utils.js
- Ajout de la lib CHALK pour ajouter de la couleur au texte et BOXEN pour encadrer le texte
- Création de deux fonctions utilitaires pour aller chercher la dernière version du package + afficher si une mise à jour est disponible
- Mise en place de ces deux fonction

### [v0.1.1] - 01-12-2023
- Modification fictive afin de voir si je peux afficher un message à l'utilisateur si le package a été mis à jour

### [v0.1.0] - 01-12-2023
- Pas possible d'afficher le changelog sur NPM directement, du coup on va s'en passer
- Suppression du dossier "v"

### [v0.0.13] - 01-12-2023
- Ajout d'un dossier V et d'un fichier 0.0.13.md pour tester

### [v0.0.12] - 01-12-2023
- Ajout d'une propriété "files" dans le package.json afin d'y ajouter le CHANGELOG.md

### [v0.0.11] - 01-12-2023
- Un autre test ...

### [v0.0.10] - 01-12-2023
- Ajout du fichier .npmrc à la racine pour tester l'affichage du changelog par version sur NPM

### [v0.0.9] - 01-12-2023
- Test d'affichage du changelog sur NPM

### [v0.0.8] - 01-12-2023
- Mise en place du changelog
- Mise en place d'une doc pour release
- Test de déploiement d'une première version test mineure

### [v0.0.7] - 01-12-2023
- test

### [v0.0.6] - 01-12-2023
- test

### [v0.0.5] - 01-12-2023
- test

### [v0.0.4] - 01-12-2023
- test

### [v0.0.3] - 01-12-2023
- test

### [v0.0.2] - 01-12-2023
- test

### [v0.0.1] - 01-12-2023
- Initialisation du package NPM
- Déploiement du package vide sur NPM