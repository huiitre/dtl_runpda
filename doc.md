# Documentation générale

- Un changement de version trop rapide ? voici comment faire revenir le package.json en arrière : 
```shell
git checkout -- package.json
git reset HEAD~1
```

## Mise en place d'une nouvelle version (déprécié)
- Ecriture dans le CHANGELOG (la date doit être celle de la release et non avant, au pire ajouter la date de chaque modification si besoin)
- git add + git commit les modifications apportées
- `npm version {numero-de-version}`
- `git push`
- `git push --tags`
- `npm publish`
- Aller sur Github et créer la release du même nom que le tag créé précédemment (`v{numero-de-version}`)
- Copier/coller le bloc de la version avec toutes les mise à jour et y coller lors de la création de la release

## Mise en place d'une nouvelle version (déprécié)
- commit et push/merge le travail en cours
- exécuter le fichier release.sh 0.2.16 (0.2.16 étant le numéro de la version à déployer)
- créer la release depuis le tag sur github et y coller la note de version en cours

## Mise en place d'une nouvelle version (déprécié)
- Pour créer une release : `node release.js <tag version (sans le v devant)> <prerelease (true)>`
- Si on veut une pré-release il faut renseigner `true` en second argument du fichier
- Si on souhaite passer une pré-release en release : `node prerelease_to_release.js <tag version (sans le v devant)>`

## Déploiement d'une nouvelle release sur gitlab
- Création d'une branche qui sera le numéro de version, exemple `git checkout -b 1.7.4`
- Faire ce qu'on a à faire dans la branche
- éventuellement commit + push
- Lancer `node release.js <tag version sans le v>`

## Déclarer une version comme stable
-  Depuis gitlab, suppression du tag actuel STABLE et création de ce dernier sur le tag release que l'on veut
- Pour npm, exécuter cette commande qui va déplacer le tag latest vers la version choisie, ça permettra de cibler cette dernière quand on installera le package `npm dist-tag add dtl_runpda@1.7.2 latest`

## Test du package en local
Taper `npm link`
Pour annuler `npm unlink`
si l'annulation ne fonctionne pas, simplement faire `npm uninstall -g dtl_runpda`

## Exécution du programme avec powershell
Si ça plante, taper cette commande : 
- Set-ExecutionPolicy RemoteSigned -Scope Process

## Choses à faire
- ~~Corriger le module d'export de la BDD du PDA~~
- ~~Récupérer la dernière version de l'app depuis les tags release git au lieu de faire npm show dtl_runpda version, afin de mieux gérer les pré release qui ne sont actuellement pas publiés sur npm donc ne servent à rien~~
- ~~Ajouter une commande `run --config` afin de pouvoir modifier n'importe quel paramètre via la syntaxe `run --config param1=newValue param2=newValue`~~
- Créer un module/Class spécialement pour déployer les release (utile pour d'autres projets)