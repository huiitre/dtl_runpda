#!/bin/bash

# Vérification des arguments
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

# Récupération de la version depuis l'argument
numero_de_version=$1

# Fonction pour exécuter la commande avec un délai
run_command_with_delay() {
    sleep 2
    $1
}

# Exécution des commandes
run_command_with_delay "npm version $numero_de_version" && \
run_command_with_delay "git push" && \
run_command_with_delay "git push --tags" && \
run_command_with_delay "npm publish"