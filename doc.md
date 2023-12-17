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

## Mise en place d'une nouvelle version
- commit et push/merge le travail en cours
- exécuter le fichier release.sh 0.2.16 (0.2.16 étant le numéro de la version à déployer)
- créer la release depuis le tag sur github et y coller la note de version en cours

## Test du package en local
Taper `npm link`
Pour annuler `npm unlink`
si l'annulation ne fonctionne pas, simplement faire `npm uninstall -g dtl_runpda`

## Liste des commandes

| Commande (lowerCase) | Description | Nécessite ADB | Etat |
|---|---|---|---|
| -h -help | Affiche la liste des commandes et informations utiles au bon fonctionnement du package | NON | V |
| -l -list | Affiche la liste des PDA connectés | OUI | V |
| -v -version | Affiche le numéro de version et le lien vers le changelog | NON | V |
| -d -default | Permet de changer le PDA par défaut | NON | V |
| -c -clear | Clear l'application EM du PDA | OUI | V |
| -u -uninstall | Désinstalle l'app EM du PDA | OUI | V |
| -b -build | Génère un apk (--debug / --release) debug par défaut sans compiler sur un PDA | ? | X |
| -e -export | Export la base de donnée EM du PDA vers le dossier du package | OUI | X |