#!/bin/bash

# pour l'instant on coupe toutes les vérifications d'arguments pour les tests

run_command_with_delay() {
  sleep 2
  $1
}

# numéro de version en premier argument
version_number=$1

# création du tag
git tag -a "$version_number" -m "Version $version_number"
# on push le tag
git push origin "$version_number"

echo "Le tag de la version $version_number a été créée avec succès."

# crédentials api github
repo_owner="huiitre"
repo_name="dtl_runpda"

api_url="https://api.github.com/repos/$repo_owner/$repo_name/releases"
access_token=$(cat github_token.txt)

# si un second argument est envoyé à true, c'est une pre-release (qui ne sera pas affiché directement sur github)
if [ $# -ge 2 ] && [ "$2" == "true" ]; then
  is_prerelease=true
else
  is_prerelease=false
fi

# data de la requête
release_data='{
  "tag_name": "'$version_number'",
  "name": "Release '$version_number'",
  "prerelease": '$is_prerelease'
}'

if [ "$is_prerelease" = false ]; then
  run_command_with_delay "npm version $numero_de_version" && \
  run_command_with_delay "git push" && \
  run_command_with_delay "git push --tags" && \
  run_command_with_delay "npm publish"
fi

# call ajax
response=$(curl -X POST \
  -H "Authorization: token $access_token" \
  -H "Content-Type: application/json" \
  -d "$release_data" \
  "$api_url")

# réponse
if [[ "$response" =~ .*"html_url".* ]]; then
    echo "La release de la version $version_number a été créée avec succès."
  fi
else
  echo "Erreur lors de la création de la release pour la version $version_number."
  echo "Réponse de l'API GitHub : $response"
  exit 1
fi

exit 0