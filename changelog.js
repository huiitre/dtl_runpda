export const changelog = {
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