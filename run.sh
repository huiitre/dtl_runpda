# todo variante de run qui utilise adb devices -l en checkant le modèle du pda renvoyé
run() {
  FILE_PATH="$( cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 ; pwd -P )"
	# * On récupère le résultat de la commande
	local devices=$(adb devices -l)

	# * chemin absolu du fichier de config
	local CONFIG_FILE="$FILE_PATH/config.cfg"

	# * pour l'export de la fonction, on déclare ici les variables de couleur
	local Color_Off='\033[0m'
	local Style_Off='\e[0m'
	local BRed='\033[1;31m'
	local BGreen='\033[1;32m'
	local BYellow='\033[1;33m'
	local Italic='\e[3m'

	# * on récupère la valeur par défaut
	local DEFAULT_PDA='CT60'
	# $(grep "^DEFAULT_PDA=" "$CONFIG_FILE" | cut -d= -f2)

	# * variable qui gère le mode défaut
	local defaultMode=true

	# * version
	local APP_VERSION=false

	# * date de la version
	local APP_VERSION_DATE=false

	checkConfigFile() {
		# * est-ce que le fichier existe
		if [ -f "$CONFIG_FILE" ]; then
			# * on récupère le pda par défaut si il existe
			local pda=$(grep "^DEFAULT_PDA=" "$CONFIG_FILE" | cut -d= -f2)
			if [ -n "$pda" ]; then
				DEFAULT_PDA="$pda"
			fi
		else
			touch "$CONFIG_FILE" 2> /dev/null
			if [ $? -ne 0 ]; then
				defaultMode=false
				return 1
			fi
			echo "DEFAULT_PDA=ct60" >> "$CONFIG_FILE"
		fi
	}

	# * récupération de la dernière version du script
	checkMaj() {
		curl -s "https://api.tools.huiitre.fr/run-pda/check-version" > response.json

		version=$(awk -F'"version":' '{print $2}' response.json | cut -d ',' -f1 | sed 's/[^0-9.]//g')
		date=$(powershell -command "(Get-Content -Raw response.json | ConvertFrom-Json).date")

		echo "Version: $version"
		echo "Date: $date"

		rm response.json
	}

	displayPdaList() {
		# Récupère la liste des périphériques connectés
		devices=$(adb devices -l | sed '1d' | awk '/device/{print $1}')

		# Initialise le tableau
		output=()

		# Parcours chaque périphérique et récupère les informations nécessaires
		for device in $devices
		do
			# Récupère les propriétés du périphérique
			model=$(adb -s $device shell getprop ro.product.model | tr -d '\r' || echo "null")
			serial=$(adb -s $device shell getprop ro.serialno | tr -d '\r' || echo "null")
			versionEM=$(adb -s $device shell dumpsys package net.distrilog.easymobile | grep versionName | sed 's/.*versionName=//;s/[" ]//g' || null)
			versionAndroid=$(adb -s $device shell getprop ro.build.version.release)
			output+=("$model" "$serial" "$versionEM" "$versionAndroid")
		done

		# Affiche le tableau
		printf "${BGreen}Liste des pda${Color_Off}\n"
		if [ ${#output[@]} -gt 0 ]; then
			printf "%-20s %-20s %-20s %-20s\n" "Model" "Serial Number" "EM version" "Android version"
			printf "%-20s %-20s %-20s %-20s\n" "-----" "-------------" "----------" "---------------"

			for ((i=0; i<${#output[@]}; i+=4))
			do
				printf "%-20s %-20s %-20s %-20s\n" "${output[$i]}" "${output[$i+1]}" "${output[$i+2]}" "${output[$i+3]}"
			done
		else
			printf $BRed"Erreur: aucun appareil trouvé."$Color_Off
		fi
	}

	runPda() {
		# * si le résultat est vide
		if [ "$(echo "$devices" | tr -d '\r\n')" = "List of devices attached" ]; then
			adb devices -l
			printf $BRed"Erreur: aucun appareil trouvé."$Color_Off
			return 1
		fi

		# * si l'argument est vide
		if [ -z "$1" ]; then
			# * on récupère le pda demandé par l'user
			read -p "Veuillez cibler le PDA [défaut : $DEFAULT_PDA]: " name
			local name=${name:-$DEFAULT_PDA}
			# * on récupère le modèle et on converti les caractères minuscule en majuscule
			local modelPDA=$(echo "$name" | tr '[:lower:]' '[:upper:]')
			echo "modelPDA : $modelPDA"
			local result=$(echo "$devices" | grep -iw "$modelPDA")
			echo "result : $result"

			# * si le pda n'a pas été trouvé
			if [ -z "$result" ]; then
				printf $BRed"Erreur: $modelPDA non trouvé."$Color_Off
				return 1
			fi

			# * si l'id du PDA n'a pas pu être récupéré
			local device_id=$(echo "$result" | awk '{print $1}')
			if [ -z "$device_id" ]; then
				printf $BRed"Erreur: aucun appareil trouvé."$Color_Off
				return 1
			fi

			displayPdaList

			# * on check la version EM du PDA
			versionEM=$(adb -s $device_id shell dumpsys package net.distrilog.easymobile | grep versionName | sed 's/.*versionName=//;s/[" ]//g' || null)

			# * on récupère la version du fichier config.xml
			config_file="config.xml"
			versionToCompile=$(grep -oP '(?<=<widget id="net.distrilog.easymobile" version=")[^"]+' "$config_file")

			if [[ "$versionEM" && "$versionToCompile" ]]; then
				if [[ $versionToCompile == 1.2* && $versionEM == 1.1* ]]; then
					printf $BYellow"Tu cherches à installer une 1.2 sur une 1.1"
					return 1
				elif awk 'BEGIN { exit !('$versionToCompile' < '$versionEM') }'; then
					printf $BRed"La version à compiler est inférieure à la version EM installée sur le PDA."$Color_Off
					return 1
				fi
			fi

			printf "${BGreen}Lancement du build du PDA $modelPDA en cours ...${Color_Off}\n"
			cordova run android --target="$device_id"

		# * l'argument n'est pas vide, on continue
		else
			# * on récupère le modèle et on converti les caractères minuscule en majuscule
			local modelPDA=$(echo "$1" | tr '[:lower:]' '[:upper:]')
			local result=$(echo "$devices" | grep -iw "$modelPDA")

			# * si le pda n'a pas été trouvé
			if [ -z "$result" ]; then
				printf $BRed"Erreur: $1 non trouvé."$Color_Off
				return 1
			fi

			local device_id=$(echo "$result" | awk '{print $1}')
			# * si l'id du PDA n'a pas pu être récupéré
			if [ -z "$device_id" ]; then
				printf $BRed"Erreur: aucun appareil trouvé."$Color_Off
				return 1
			fi

			displayPdaList

			# * on check la version EM du PDA
			versionEM=$(adb -s $device_id shell dumpsys package net.distrilog.easymobile | grep versionName | sed 's/.*versionName=//;s/[" ]//g' || null)

			# * on récupère la version du fichier config.xml
			config_file="config.xml"
			versionToCompile=$(grep -oP '(?<=<widget id="net.distrilog.easymobile" version=")[^"]+' "$config_file")

			if [[ "$versionEM" && "$versionToCompile" ]]; then
				if [[ $versionToCompile == 1.2* && $versionEM == 1.1* ]]; then
					printf $BYellow"Tu cherches à installer une 1.2 sur une 1.1"
					return 1
				elif awk 'BEGIN { exit !('$versionToCompile' < '$versionEM') }'; then
					printf $BRed"La version à compiler est inférieure à la version EM installée sur le PDA."$Color_Off
					return 1
				fi
			fi

			printf "${BGreen}Lancement du build du PDA $modelPDA en cours ...${Color_Off}\n"
			cordova run android --target="$device_id"
		fi
	}

	displayHelp() {
		echo -e $BIBlue"==========================================="$Color_Off
		echo -e $BIBlue"Liste des commandes disponibles : $Color_Off"
		echo -e $BIBlue"==========================================="$Color_Off
		echo -e $Italic"Note : NE FONCTIONNE PAS AVEC PLUS D'UN TIRET, EXEMPLE : << -- >>."$Style_Off
		echo ""
		printf $BIBlue"%-50s %s" "Commande :" "Description :"
		echo -e $Color_Off
		printf "%-50s %s\n" "-h | -H | -help    | -HELP" "Affiche l'aide"
		printf "%-50s %s\n" "-l | -L | -list    | -LIST" "Affiche la liste des PDA"
		printf "%-50s %s\n" "-v | -V | -version | -VERSION" "Version actuelle du script"
		printf "%-50s %s\n" "-d | -D | -default | -DEFAULT" "Attribution d'un PDA par défaut"
		printf "%-50s %s\n" "-c | -C | -clear | -CLEAR" "Vide la base de donnée de l'application EM du PDA sélectionné"
		printf "%-50s %s\n" "-u | -U | -uninstall | -UNINSTALL" "Désinstalle l'application EM du PDA sélectionné"
		printf "%-50s %s\n" "-b | -B | -build | -BUILD" "Génère un build APK DEBUG ou RELEASE de l'application (PDA non obligatoire)"
		printf "%-50s %s\n" "-e | -E | -export | -EXPORT" "Permet d'exporter la base de donnée du PDA sélectionné dans le dossier /database/model-du-pda/"
	}

	displayDefault() {
		# checkConfigFile
		# * on check si le fichier existe ou si il a pu être créé
		if [ $? -eq 0 ]; then
			printf "$BIBlue========== Configuration du PDA par défaut ==========$Color_Off\n"
			printf $Italic$IPurple"PDA actuel par défaut : $BIWhite$DEFAULT_PDA\n\n"$Color_Off
			read -p "Veuillez inscrire le nom du PDA à build par défaut : " response
			pda=$response
			if [ ! -z "$pda" ]; then
				sed -i "s/DEFAULT_PDA=.*/DEFAULT_PDA=$pda/g" "$CONFIG_FILE"
				echo -e $BIGreen"Le PDA par défaut a été modifié de $BIRed$DEFAULT_PDA $BIGreenà $BICyan$pda ${BIGreen}avec success !"$Color_Off
			else
				echo -e $BIRed"ERREUR : Le champ renseigné est vide !"$Color_Off
			fi
		else
			echo -e $BIRed"ERROR : Le fichier est introuvable ou n'a pas pu être créé"$Color_Off
		fi
	}

	displayVersion() {
		echo -e $BIPurple
		echo -e "##################################################"
		echo -e "||                   RUN PDA                    ||"
		echo -e "||                 Version 1.1                  ||"
		echo -e "||                    by YDL                    ||"
		echo -e "##################################################"$Color_Off
		echo ""
		echo "CE QUI VA SUIVRE EST EN COURS DE DEVELOPPEMENT"

		# * VERSIONING
		declare -A versions

		# * VERSION 1.0
		version='1.0'
		printf -v versions["$version"] '%s\n' \
			"20-02-2023 : Ajout de la fonction de versioning" \
			"21-02-2023 : Ajout de la fonction de debug"

		# * VERSION 1.1
		version="1.1"
		printf -v versions["$version"] '%s\n' \
			"24-02-2023 : Correction de bugs mineurs" \
			"28-02-2023 : Amélioration de l'interface utilisateur"

		# * VERSION 1.2
		version="1.2"
		printf -v versions["$version"] '%s\n' \
			"29-02-2023 : Ajout de la fonction de login" \
			"29-02-2023 : Ajout de la fonction de logout" \
			"30-02-2023 : Ajout de la fonction de création de compte"

		# * Affichage du versioning
		echo ""
		echo -e "Version\t\tDate\t\t\tDescription"
		# printf "%-15s %-22s %s\n" "Version" "Date" "Description"
		echo -e '---------------------------------------------------'

		for version in "${!versions[@]}"; do
			first_modification=true
			for modification in "${versions[$version]}"; do
				if [ "$first_modification" = true ]; then
					printf "%-15s %-22s %s\n" "$version" "$modification"
					first_modification=false
				else
					printf "%-15s %-22s %s\n" "" "$(echo "$modification" | sed 's/^/                  /')"
				fi
			done
		done
	}

	checkAppInstalled() {
		# * le num de série
		SERIAL=$1
		# * est-ce que l'app est installé
		APP_INSTALLED=$(adb -s $SERIAL shell pm list packages | grep net.distrilog.easymobile)
		if [[ -n "$APP_INSTALLED" ]]; then
			echo "true"
		else
			echo "false"
		fi
	}

	displayClearApp() {

		pda=$1
		# * est-ce qu'on a des pda de branchés
		if [ "$(echo "$devices" | tr -d '\r\n')" = "List of devices attached" ]; then
			adb devices -l
			printf $BRed"Erreur: aucun appareil trouvé."$Color_Off
			return 1
		fi

		# * pas d'arguments
		if [ -z "$pda" ]; then
			# * on récupère le pda demandé par l'user
			read -p "Veuillez cibler le PDA à clear [défaut : $DEFAULT_PDA]: " name
			local name=${name:-$DEFAULT_PDA}

			# * on récupère le modèle et on converti les caractères minuscule en majuscule
			local model=$(echo "$name" | tr '[:lower:]' '[:upper:]')
			local result=$(echo "$devices" | grep -iw "$model")

			# * si le pda n'a pas été trouvé
			if [ -z "$result" ]; then
				printf $BRed"Erreur: $model non trouvé."$Color_Off
				return 1
			fi

			# * si l'id du PDA n'a pas pu être récupéré
			local device_id=$(echo "$result" | awk '{print $1}')
			if [ -z "$device_id" ]; then
				printf $BRed"Erreur: aucun appareil trouvé."$Color_Off
				return 1
			fi

			# todo on lance le clear ...
			# * est-ce que l'app est installé sur le pda
			if [ $(checkAppInstalled $device_id) = 'false' ]; then
				printf "EasyMobile n'est pas installé sur le PDA $model"
				return 1
			fi

			printf "${BBlue}Clear du stockage du pda $model en cours ...${Color_Off}\n"
			result=$(adb -s $device_id shell pm clear net.distrilog.easymobile)
			
			if [ $result = 'Success' ]; then
				printf "${BGreen}L'application du PDA $model a bien été clear !${Color_Off}\n"
				printf "${BBlue}Lancement de l'application du PDA $model ...${Color_Off}\n"
				adb -s $device_id shell am start -n net.distrilog.easymobile/.MainActivity > /dev/null 2>&1
				printf "${BGreen}L'application du PDA $model a bien été lancé !${Color_Off}\n"
			else
				printf $BRed"Erreur lors du clear de l'application du PDA $model."$Color_Off
				return 1
			fi

		# * sinon, si on a un argument
		else
			local model=$(echo "$pda" | tr '[:lower:]' '[:upper:]')
			local result=$(echo "$devices" | grep -iw "$model")

			# * si le pda demandé n'a pas été trouvé
			if [ -z "$result" ]; then
				printf $BRed"Erreur: $pda non trouvé."$Color_Off
				return 1
			fi

			local device_id=$(echo "$result" | awk '{print $1}')
			# * si l'id du pda n'a pas été trouvé
			if [ -z "$device_id" ]; then
				printf $BRed"Erreur: aucun appareil trouvé."$Color_Off
				return 1
			fi

			# * est-ce que l'app est installé sur le pda
			if [ $(checkAppInstalled $device_id) = 'false' ]; then
				printf "EasyMobile n'est pas installé sur le PDA $model"
				return 1
			fi

			printf "${BBlue}Clear du stockage du pda $model en cours ...${Color_Off}\n"
			result=$(adb -s $device_id shell pm clear net.distrilog.easymobile)
			
			if [ $result = 'Success' ]; then
				printf "${BGreen}L'application du PDA $model a bien été clear !${Color_Off}\n"
				printf "${BBlue}Lancement de l'application du PDA $model ...${Color_Off}\n"
				adb -s $device_id shell am start -n net.distrilog.easymobile/.MainActivity > /dev/null 2>&1
				printf "${BGreen}L'application du PDA $model a bien été lancé !${Color_Off}\n"
			else
				printf $BRed"Erreur lors du clear de l'application du PDA $model."$Color_Off
				return 1
			fi
		fi
	}

	displayUninstall() {
		pda=$1
		# * est-ce qu'on a des pda de branchés
		if [ "$(echo "$devices" | tr -d '\r\n')" = "List of devices attached" ]; then
			adb devices -l
			printf $BRed"Erreur: aucun appareil trouvé."$Color_Off
			return 1
		fi

		# * pas d'arguments
		if [ -z "$pda" ]; then
			# * on récupère le pda demandé par l'user
			read -p "Veuillez cibler le PDA à désinstaller [défaut : $DEFAULT_PDA]: " name
			local name=${name:-$DEFAULT_PDA}

			# * on récupère le modèle et on converti les caractères minuscule en majuscule
			local model=$(echo "$name" | tr '[:lower:]' '[:upper:]')
			local result=$(echo "$devices" | grep -iw "$model")

			# * si le pda n'a pas été trouvé
			if [ -z "$result" ]; then
				printf $BRed"Erreur: $model non trouvé."$Color_Off
				return 1
			fi

			# * si l'id du PDA n'a pas pu être récupéré
			local device_id=$(echo "$result" | awk '{print $1}')
			if [ -z "$device_id" ]; then
				printf $BRed"Erreur: aucun appareil trouvé."$Color_Off
				return 1
			fi

			# * est-ce que l'app est installé sur le pda
			if [ $(checkAppInstalled $device_id) = 'false' ]; then
				printf "EasyMobile n'est pas installé sur le PDA $model"
				return 1
			fi

			printf "${BBlue}Désinstallation de EasyMobile sur le pda $model en cours ...${Color_Off}\n"
			result=$(adb -s $device_id uninstall net.distrilog.easymobile)
			
			if [ $result = 'Success' ]; then
				printf "${BGreen}L'application du PDA $model a bien été désinstallé !${Color_Off}\n"
			else
				printf $BRed"Erreur lors de la désinstallation de l'application du PDA $model."$Color_Off
				return 1
			fi

		# * sinon, si on a un argument
		else
			local model=$(echo "$pda" | tr '[:lower:]' '[:upper:]')
			local result=$(echo "$devices" | grep -iw "$model")

			# * si le pda demandé n'a pas été trouvé
			if [ -z "$result" ]; then
				printf $BRed"Erreur: $pda non trouvé."$Color_Off
				return 1
			fi

			local device_id=$(echo "$result" | awk '{print $1}')
			# * si l'id du pda n'a pas été trouvé
			if [ -z "$device_id" ]; then
				printf $BRed"Erreur: aucun appareil trouvé."$Color_Off
				return 1
			fi

			# * est-ce que l'app est installé sur le pda
			if [ $(checkAppInstalled $device_id) = 'false' ]; then
				printf "EasyMobile n'est pas installé sur le PDA $model"
				return 1
			fi

			printf "${BBlue}Désinstallation de EasyMobile sur le pda $model en cours ...${Color_Off}\n"
			result=$(adb -s $device_id uninstall net.distrilog.easymobile)
			
			if [ $result = 'Success' ]; then
				printf "${BGreen}L'application du PDA $model a bien été clear !${Color_Off}\n"
			else
				printf $BRed"Erreur lors du clear de l'application du PDA $model."$Color_Off
				return 1
			fi
		fi
	}

	displayGenerateBuild() {
		local options=("Debug" "Release")
		local selected=0

		# Afficher les options avec un curseur à côté de l'option sélectionnée
		while true; do
			clear
			for ((i=0; i<${#options[@]}; i++)); do
				if [ $i -eq $selected ]; then
					echo "> ${options[$i]}"
				else
					echo "  ${options[$i]}"
				fi
			done

			# Attendre l'entrée de l'utilisateur
			read -s -n 1 key
			case $key in
				A)  # Flèche haut
					((selected--))
					if [ $selected -lt 0 ]; then
						selected=$((${#options[@]}-1))
					fi
					;;
				B)  # Flèche bas
					((selected++))
					if [ $selected -ge ${#options[@]} ]; then
						selected=0
					fi
					;;
				'') # Touche entrer
					break
					;;
			esac
		done

		# Exécuter la commande Cordova avec l'option sélectionnée
		if [ $selected -eq 0 ]; then
			cordova build android --debug
		else
			cordova build android --release
		fi
	}

	exportBase() {
    # * pda en paramètre
    pda=$1
    # * date et heure actuelle
    TIME=$(date +"%Y-%m-%d_%H-%M-%S")

		# * est-ce qu'on a des pda de branchés
		if [ "$(echo "$devices" | tr -d '\r\n')" = "List of devices attached" ]; then
			adb devices -l
			printf $BRed"Erreur: aucun appareil trouvé."$Color_Off
			return 1
		fi

		# * pas d'arguments
		if [ -z "$pda" ]; then
			# * on récupère le pda demandé par l'user
			read -p "Veuillez cibler le PDA à extraire [défaut : $DEFAULT_PDA]: " name
			local name=${name:-$DEFAULT_PDA}

			# * on récupère le modèle et on converti les caractères minuscule en majuscule
			local model=$(echo "$name" | tr '[:lower:]' '[:upper:]')
			local result=$(echo "$devices" | grep -iw "$model")

			# * si le pda n'a pas été trouvé
			if [ -z "$result" ]; then
				printf $BRed"Erreur: $model non trouvé."$Color_Off
				return 1
			fi

			# * si l'id du PDA n'a pas pu être récupéré
			local device_id=$(echo "$result" | awk '{print $1}')
			if [ -z "$device_id" ]; then
				printf $BRed"Erreur: aucun appareil trouvé."$Color_Off
				return 1
			fi

			# * est-ce que l'app est installé sur le pda
			if [ $(checkAppInstalled $device_id) = 'false' ]; then
				printf $BRed"EasyMobile n'est pas installé sur le PDA $model"$Color_Off
				return 1
			fi
		# * sinon, si on a un argument
		else
			local model=$(echo "$pda" | tr '[:lower:]' '[:upper:]')
			local result=$(echo "$devices" | grep -iw "$model")

			# * si le pda demandé n'a pas été trouvé
			if [ -z "$result" ]; then
				printf $BRed"Erreur: $pda non trouvé."$Color_Off
				return 1
			fi

			local device_id=$(echo "$result" | awk '{print $1}')
			# * si l'id du pda n'a pas été trouvé
			if [ -z "$device_id" ]; then
				printf $BRed"Erreur: aucun appareil trouvé."$Color_Off
				return 1
			fi

			# * est-ce que l'app est installé sur le pda
			if [ $(checkAppInstalled $device_id) = 'false' ]; then
				printf $BRed"EasyMobile n'est pas installé sur le PDA $model"$Color_Off
				return 1
			fi
		fi

    filename=$(adb -s $device_id shell "run-as net.distrilog.easymobile ls app_webview/Default/databases/file__0 | grep -v '-'")
    filename=$(echo $filename | tr -d '\r') # supprime le caractère de retour chariot ('\r')

    # database_name=$model"_"$TIME
    database_name=$model"_"$device_id

    if [ -z "$filename" ]; then
      printf $BRed"ERROR"$Color_Off
      printf $BRed"Aucun fichier trouvé dans le répertoire app_webview/Default/databases/file__0/"$Color_Off
    else
      # * on check si le dossier du pda a été créé ou non
      if [ ! -d "$FILE_PATH/database/$model" ]; then
        printf $BGreen"Le dossier n'existe pas, il va être créé."$Color_Off
        mkdir "$FILE_PATH/database/$model"
      fi

      output=$(adb -s $device_id exec-out run-as net.distrilog.easymobile cat app_webview/Default/databases/file__0/$filename > $FILE_PATH/database/$model/$database_name)
      if echo "$output" | grep -q "error"; then
        printf $BRed"Erreur lors de l'exportation de la base du PDA $model : $output"$Color_Off
      else
        printf $BGreen"La base du PDA $model a été exportée avec succès !"$Color_Off
      fi
    fi

		# adb -s 18134D8267 shell run-as net.distrilog.easymobile && 
		# cd app_webview/Default/databases/file__0
	}

	# * on lance checkConfigFile afin de créer le fichier de config
	checkConfigFile
	
	# lancement de l'appli
	# adb -s 21245B18DD shell am start -n net.distrilog.easymobile/.MainActivity
	# fermeture de l'appli
	# adb -s 21245B18DD shell am force-stop net.distrilog.easymobile
	# vidage du stockage de l'appli
	# adb -s 21245B18DD shell pm clear net.distrilog.easymobile
	# désinstaller l'appli
	# adb -s 21245B18DD uninstall net.distrilog.easymobile
	# * Liste des commandes disponibles
	case $1 in
		# ? HELP
		"-h"|"-H"|"-help"|"-HELP")
			displayHelp;;

		#? LISTE DES PDA
		"-l"|"-L"|"-list"|"-LIST")
			displayPdaList;;

		# ? PDA PAR DEFAUT
		"-d"|"-D"|"-DEFAULT"|"-DEFAULT")
			if [ $defaultMode = true ]; then
				displayDefault
			else
				echo -e $BRed"La déclaration d'un PDA par défaut est désactivée car vous n'avez pas les droits d'écriture sur $CONFIG_FILE, vous ne pouvez pas utiliser cette commande."$Color_Off
				echo -e $BRed"Pour activer la fonctionnalité, veuillez modifier la variable CONFIG_FILE en lui spécifiant un chemin correct et accessible en lecture et écriture."$Color_Off
			fi;;

		# ? VERSION DE L'APP
		"-v"|"-V"|"-version"|"-VERSION")
			displayVersion;;

		# ? CLEAR DATABASE DE L'APP
		"-c"|"-C"|"-clear"|"-CLEAR")
			displayClearApp;;

		# ? DESINSTALLATION DE L'APP
		"-u"|"-U"|"-uninstall"|"-UNINSTALL")
			displayUninstall;;

		# ? GENERATION D'UN BUILD
		"-b"|"-B"|"-build"|"-BUILD")
			displayGenerateBuild;;

		# ? EXPORT DE LA BASE
		"-e"|"-E"|"-export"|"-EXPORT")
			exportBase;;

		# ? EXPORT DE LA BASE
		"-m"|"-M"|"-maj"|"-MAJ")
			checkMaj;;

		# ? COMMANDE INCORRECT
		"-"*)
			printf $BRed"Commande introuvable"$Color_Off
			echo ""
			echo ""
			displayHelp;;

		# ? RUN
		*)
			runPda $1;;
	esac

	# if echo "$1" | grep -qiE '^-{1,2}h(elp)?$'; then
	# 	displayHelp
	# elif echo "$1" | grep -qiE '^-{1,2}d(efault)?$'; then
	# 	if [ $defaultMode = true ]; then
	# 		displayDefault
	# 	else
	# 		echo -e $BRed"La déclaration d'un PDA par défaut est désactivée car vous n'avez pas les droits d'écriture sur $CONFIG_FILE, vous ne pouvez pas utiliser cette commande."$Color_Off
	# 		echo -e $BRed"Pour activer la fonctionnalité, veuillez modifier la variable CONFIG_FILE en lui spécifiant un chemin correct et accessible en lecture et écriture."$Color_Off
	# 	fi
	# elif echo "$1" | grep -qiE '^-{1,2}l(ist)?$'; then
	# 	displayPdaList
	# elif echo "$1" | grep -qiE '^-{1,2}v(ersion)?$'; then
	# 	displayVersion
	# elif echo "$1" | grep -qiE '^-{1,2}c(lear)?$'; then	
	# 	displayClearApp $2
	# elif echo "$1" | grep -qiE '^-{1,2}u(ninstall)?$'; then	
	# 	displayUninstall $2
	# elif echo "$1" | grep -qiE '^-{1,2}b(uild)?$'; then	
	# 	displayGenerateBuild
	# elif echo "$1" | grep -qiE '^-{1,2}e(xport)?$'; then	
	# 	exportBase
	# elif echo "$1" | grep -qiE '^--?.*'; then
	# 	echo "commande inconnue"
	# else
	# 	runPda $1
	# fi
}
# todo alias run to RUN
alias RUN='run'

# todo en cours de dev
# déconnection et connexion de dbeaver à la base de donnée
# # Chemin complet du fichier de la base de données
# db_file="/path/to/database/file"

# # Délai de surveillance en secondes
# watch_interval=5

# # Connexion à la base de données à surveiller
# # Remplacez les valeurs entre < > par les informations de connexion appropriées
# dbeaver_connection_name="<connection_name>"
# dbeaver_driver="<driver_name>"
# dbeaver_url="<jdbc_url>"
# dbeaver_username="<username>"
# dbeaver_password="<password>"

# # Fonction de déconnexion de la base de données dans DBeaver
# function disconnect_dbeaver() {
#   dbeaver-cli --command "disconnect $dbeaver_connection_name"
# }

# # Fonction de connexion à la base de données dans DBeaver
# function connect_dbeaver() {
#   dbeaver-cli --command "open --name $dbeaver_connection_name --driver $dbeaver_driver --url $dbeaver_url --user $dbeaver_username --password $dbeaver_password"
# }

# # Initialisation de la connexion à la base de données dans DBeaver
# connect_dbeaver

# # Boucle de surveillance du fichier de la base de données avec inotifywait
# while true; do
#   # Récupération de la date de modification actuelle du fichier
#   current_file_date=$(stat -c %Y "$db_file")
  
#   # Surveillance du fichier avec inotifywait pendant le délai spécifié
#   inotifywait -q -e modify -t "$watch_interval" "$db_file" > /dev/null 2>&1
  
#   # Récupération de la date de modification la plus récente du fichier
#   latest_file_date=$(stat -c %Y "$db_file")
  
#   # Si la date de modification a changé, déconnecter puis reconnecter la base de données dans DBeaver
#   if [[ "$current_file_date" != "$latest_file_date" ]]; then
#     echo "Database file has been modified. Disconnecting and reconnecting to the database..."
#     disconnect_dbeaver
#     connect_dbeaver
#   fi
# done