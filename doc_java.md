Le PATH à insérer pour pouvoir compiler le fichier java avec jar
- C:\Program Files\Java\jdk-11.0.8\bin

Pour compiler le fichier java : 
- javac AdbCommand.java

Ca crée un fichier toto.class qu'il faudra compiler en fichier jar
- jar cf AdbCommand.jar AdbCommand.class
Sinon cette commande a l'air de mieux fonctionner pour ajouter le fichier manifest
- jar cfm AdbCommand.jar Manifest.txt AdbCommand.class

Pour dev un fichier java, il suffit de le transformer en MonFicher.class
- javac MonFichier.java
Puis de l'exécuter 
- java MonFichier