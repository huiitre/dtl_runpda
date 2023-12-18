#!/bin/bash

# Fonction pour construire la commande
build_command() {
  serial_number=$1
  file_name=$3
  pdaDir=$2
  databaseRename=$4

  command="adb -s $serial_number exec-out run-as net.distrilog.easymobile cat app_webview/Default/databases/file__0/$file_name > "${pdaDir}\\${databaseRename}""
  echo "$command"
}

# Vérifier le nombre d'arguments
if [ "$#" -eq 1 ]; then
  # Utilisation de la commande complète fournie
  eval "$1"
elif [ "$#" -eq 4 ]; then
  # Utilisation des variables pour construire la commande
  full_command=$(build_command "$1" "$2" "$3" "$4")
  eval "$full_command"
else
  echo "Utilisation incorrecte. Veuillez fournir la commande complète ou les variables nécessaires."
fi
