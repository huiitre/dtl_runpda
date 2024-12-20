export const changelog = {
  'v1.7.2': `### [v1.7.2] - 19-11-2024
    - CORRECTIF - Récupération de l'index.html de la configuration depuis le PATH npm
  `,

  'v1.7.1': `### [v1.7.1] - 18-11-2024
    - CORRECTIF - Modification du titre de la fenêtre de configuration dtl_runpda
  `,

  'v1.7.0': `### [v1.7.0] - 18-11-2024
    - AJOUT - Commande "run --config" qui permet de modifier les paramètres éditables facilement
  `,

  'v1.6.0': `### [v1.6.0] - 16-11-2024
    - AJOUT - Commande "run ema" pour ajouter automatiquement une note de version dans le fichier easymobile_about.json
  `,

  'v1.5.5': `### [v1.5.5] - 15-11-2024
  - CORRECTIF - Modification du fichier prerelease_to_release.js
  `,

  'v1.5.4': `### [v1.5.4] - 15-11-2024
  - TEST - Ajout d'une fonction qui récupère la dernière version RELEASE depuis git
  `,

  'v1.5.3': `### [v1.5.3] - 29-07-2024
  - CORRECTIF - Erreur de syntaxe lorsqu'on ne renseigne pas de pda dans une commande
  `,

  'v1.5.2': `### [v1.5.2] - 26-07-2024
  - MODIFICATION - Retrait du préfix "git" dans les commandes, maintenant on a "run checkout -ticket-", "run pull (origin optionnel)" et "run merge -ticket-" au lieu de "run git checkout -ticket-" etc
  `,

  'v1.5.1': `### [v1.5.1] - 26-05-2024
  - CORRECTIF - Erreur de syntaxe lorsqu'on voulait build sans renseigner de modèle
  `,

  'v1.5.0': `### [v1.5.0] - 25-05-2024
  - AJOUT - Ajout de la commande merge comme run git merge <branch>
  - AJOUT - Ajout de la commande pull comme run git pull qui exécute git pull, ou run git pull origin qui exécute git pull origin <branche-courante>
  `,

  'v1.4.0': `### [v1.4.0] - 24-05-2024
  - AJOUT - Ajout d'une nouvelle commande "run git checkout" afin de naviguer plus facilement de branches en branches (comme tarzan)
  `,

  'v1.3.9': `### [v1.3.9] - 23-05-2024
  - CORRECTIF - Erreur lors de la récupération des infos du PDA, si par exemple easymobile n'est pas installé ça retourne null, et ça génère une erreur dans le code
  `,

  'v1.3.8': `### [v1.3.8] - 18-05-2024
  - CORRECTIF - On vérifie plus si la dernière version est différente de celle actuelle mais plutôt si la version actuelle est inférieure à la dernière version
  - CORRECTIF - On passe de 8h à 4h le temps entre deux recherche de version (TIME_BEFORE_CHECK_UPDATE)
  `,

  'v1.3.7': `### [v1.3.7] - 18-05-2024
  - MODIFICATION - Lors d'une pré release depuis le fichier de release, ajout de cette dernière sur NPM afin de pouvoir l'installer également
  - MODIFICATION - Lors d'une modification de pré release vers une release, on ne publie plus sur npm vu que c'est censé être déjà fait via la création de la pré-release
  `,

  'v1.3.6': `### [v1.3.6] - 18-05-2024
  - CORRECTIF - Correction de la question quand on fait run -b pour sélectionner un type de build
  - MODIFICATION - On récupère dorénavant la dernière version depuis le tag release de git, ce qui permet de déployer sur npm une pré-release sans qu'elle soit installée. On privilégie donc une installation via run --update ou npm install -g dtl_runpda@<tag_name> plutôt que simplement npm install -g dtl_runpda/dtl_runpda@latest
  `,

  'v1.3.5': `### [v1.3.5] - 13-05-2024
  - CORRECTIF - Ajout du PATH complet vers le JRE du package
  `,

  'v1.3.4': `### [v1.3.4] - 13-05-2024
  - CORRECTIF - Ajout du JRE jre1.8.0_411 dans le projet pour lire directement le fichier .jar
  - CORRECTIF - Recompilation du .jar AdbCommand en java 8 au lieu de java 11 car impossible de trouver le JRE en java 11
  `,

  'v1.3.3': `### [v1.3.3] - 11-05-2024
  - CORRECTIF - Correctif du numéro de version courant quand on est en version de développement
  `,

  'v1.3.2': `### [v1.3.2] - 11-05-2024
  - CORRECTIF - Ajout d'une config NPM_APP_DIR afin de récupérer le chemin dans lequel l'app est installé afin de récupérer le fichier .jar
  - CORRECTIF - Dans la fonction Log, correction d'une erreur avec value.length
  `,

  'v1.3.1': `### [v1.3.1] - 11-05-2024
  - CORRECTIF - Ajout d'un fichier .jar pour extraire la BDD du PDA avec la commande run -e
  `,

  'v1.3.0': `### [v1.3.0] - 09-05-2024
  - CORRECTIF - Compatibilité de certaines commandes avec d'autres terminaux comme CMD ou Windows PowerShell
  - AJOUT - Fichier release.js qui permet de créer en une commande une release ou une pré-release
  - AJOUT - Fichier prerelease_to_release.js qui permet de passer une version pre-release en release sur git et de publier la version sur NPM
  `,

  'v1.2.34': `### [v1.2.34] - 09-05-2024
  - TEST - Test final pré-release puis release
  `,

  'v1.2.33': `### [v1.2.33] - 09-05-2024
  - CORRECTIF - Lors du passage de pré-release à rélease, on venait modifier le nom du tag en retirant le "v" devant 
  `,

  'v1.2.32': `### [v1.2.32] - 09-05-2024
  - AJOUT - Test de la pré-release puis de la release sur NPM 
  `,

  'v1.2.31': `### [v1.2.31] - 09-05-2024
  - AJOUT - Test de la release 
  `,

  'v1.2.30': `### [v1.2.30] - 09-05-2024
  - AJOUT - Mise en place du fichier changelog.js, paufinage du fichier release.js et création du fichier prerelease_to_release.js, début du développement
  `,

  'v1.2.29': `### [v1.2.29] - 09-05-2024
  - CORRECTIF - Compatibilité de certaines commandes avec d'autres terminaux comme CMD ou Windows PowerShell
  - AJOUT - Fichier release2.sh (en test) qui permettra de créer/push automatiquement les tags release/pré-release
  `,

  'v1.2.1': `### [v1.2.1] - 14-02-2023
  - CORRECTIF - Récupération du path global de NPM via la commande "npm root -g" afin d'exécuter la librairie scrcpy
  `,

  'v1.2.0': `### [v1.2.0] - 14-02-2023
  - AJOUT - Ajout de la commande -show afin d'exécuter scrcpy.exe qui ouvrira une fenêtre du pda sélectionné
  `,

  'v1.1.0': `### [v1.1.0] - 29-12-2023
  - CORRECTIF - Modification de la commande qui récupère la liste des PDA en adb devices -l car posait soucis pour l'invit de cmd windows
  - AJOUT - Ajout dans le changelog du numéro de version majeure
  - CORRECTIF - Ajout d'une vérification du terminal utilisé et affiche un message d'erreur si ce dernier n'est pas GitBash
  - CORRECTIF - Ajout d'une fonction qui lance le serveur adb (adb start-server) au début du script
  - CORRECTIF - Mise à jour du README
  - AJOUT - Ajout d'un système de log dans l'application, il n'y a pour l'instant pas de logs de partout et la gestion du niveau de log est limité
  - CORRECTIF - Actuellement le build d'un apk release n'est pas géré, donc on le retire de la liste des choix lors de la commande "run -b"
  `
}