#!/bin/bash

# Vérification du nombre d'arguments
if [ "$#" -ne 1 ]; then
    echo "Usage : $0 <version_number>"
    exit 1
fi

version_number=$1

echo "version : $version_number"

# Crédentials API GitHub
repo_owner="huiitre"
repo_name="dtl_runpda"
api_url="https://api.github.com/repos/$repo_owner/$repo_name/releases/tags/$version_number"
access_token=$(cat github_token.txt)

echo "url : $api_url"

# Récupération des informations sur la release correspondant au tag
release_info=$(curl -s -H "Authorization: token $access_token" "$api_url")

release_id=$(echo "$release_info")

# Vérification si le tag correspond à une pré-release
if echo "$release_info" | grep -q "\"prerelease\": true"; then
    # Modification de la pré-release en release
    release_data='{
      "tag_name": "'"$version_number"'",
      "name": "'"$version_number"'",
      "prerelease": false
    }'

    response=$(curl -X PATCH \
      -H "Authorization: token $access_token" \
      -H "Content-Type: application/json" \
      -d "$release_data" \
      "https://api.github.com/repos/$repo_owner/$repo_name/releases/$version_number")

    # Réponse
    if [[ "$response" =~ .*"html_url".* ]]; then
      echo "La pré-release de la version $version_number a été transformée en release avec succès."
    else
      echo "Erreur lors de la transformation de la pré-release en release pour la version $version_number."
      echo "Réponse de l'API GitHub : $response"
      exit 1
    fi
else
    echo "Le tag $version_number ne correspond pas à une pré-release."
fi

exit 0