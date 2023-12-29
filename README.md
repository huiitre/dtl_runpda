# RUN PDA SHELL

  

## Sommaire

- [Installation](#installation)

- [Utilisation de la base de donnée exportée avec DBeaver](#utilisation-de-la-base-de-donnée-exportée-avec-dbeaver)

## Installation
L'installation se fait dorénavant avec la commande npm install -g dtl_runpda ou run --update.

## Utilisation de la base de donnée exportée avec DBeaver
Le but du module d'export de base de donnée est multiple.

* Pouvoir exporter et < figer > la base de donnée d'un PDA, afin d'y extraire potentiellement des données.
* Pouvoir exporter une base afin de travailler dessus sans utiliser le devtools de chrome, qui pue ces grands mort il faut bien l'avouer.

Le fichier généré ne possède pas d'extensions de fichier, mais c'est un fichier SQLite, ce qui fait qu'on a la possibilité de l'importer dans n'importe quel logiciel de gestion de base de donnée (DBeaver, heidiSQL). Pour le cas de SQLDEVELOPPER, il sera nécessaire d'y installer un plugin afin de gérer la compatibilité avec SQLite.

On va gérer pour l'instant l'importation du fichier depuis le logiciel DBeaver.

1. Click droit dans le navigateur de BDD à gauche puis créer -> Connection.
![dbeaver1](./img/create_pda_dbeaver.png)

2. Sélectionnez SQLite puis cliquez sur **Suivant** en bas de la fenêtre.

3. On clique sur **Open** et on va chercher notre fichier de BDD dans le dossier /database/...
Puis on clique sur **Terminer** en bas.
![dbeaver2](./img/dbeaver2.png)

4. Notre base est créé et disponible dans le menu de gauche.
![dbeaver3](./img/dbeaver3.png)

### Synchronisation et méthode de travail
Voici un schéma simple d'utilisation.

1. On exporte la base avec la commande *run -e* puis en sélectionnant le PDA.
2. Notre fichier est désormais stocké en local, on lance DBeaver et on double click sur la connexion afin de la lancer.

Note : Si DBeaver est déjà lancé et qu'on a déjà une connexion active avec la base, il est nécessaire de se déconnecter/reconnecter de la base. Vous pouvez cliquer sur le bouton *Rejeter/se reconnecter* dans le menu du haut.
![dbeaver4](./img/dbeaver4.png)

La nouvelle base écrase la précédente en local mais DBeaver garde encore une trace de l'ancienne version de la base du PDA, il est donc nécessaire d'effectuer cette manipulation.