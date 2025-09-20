# Affichage de l'heure et du mode de développement

# Définition des variables utilisées dans le script:
hudTensor="╔╗╚╝═║╠╣╦╩╬"         # Caractères spéciaux utilisés pour le design du menu
SCRIPT_DIR="./Users/universmc/.module_zsh"  # Répertoire contenant les scripts à exécuter

# Définition de la fonction 'menu' pour afficher le menu avec les options:

menu() {
    echo "";
    echo " ╔═════════════════════════════════════╗     ╔════════════════════════════════════════════════════════════════════════════════╗";
    echo " ╠════════{ ✨ Pi  - Console }═════════╣     ║[💫]                              🔷 Smart Contracts 🔷                    >[🛰] ║";
    echo " ║                                     ║     ╠════════════════════════════════════════════════════════════════════════════════╣";
    echo " ║                      💠             ║     ║                                                                                ║";
    echo " ║             ╲┈┈┈┈╱                  ║     ║                                                                                ║";      
    echo " ║             ╱▔▔▔▔╲                  ║     ║                                                                                ║";
    echo " ║            ┃┈▇┈┈▇┈┃                 ║     ║                                                                                ║";
    echo " ║          ╭╮┣━━━━━━┫╭╮               ║     ║                                                                                ║";
    echo " ║          ┃┃┃┈┈┈┈┈┈┃┃┃               ║     ║                                                                                ║";
    echo " ║          ╰╯┃┈┈┈┈┈┈┃╰╯               ║     ║                                                                                ║";
    echo " ║            ╰┓┏━━┓┏╯                 ║     ║                                                                                ║";
    echo " ║             ╰╯  ╰╯                  ║     ║                                                                                ║";
    echo " ║     ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈     ║     ║                                                                                ║";    
    echo " ║                                     ║     ║                                                                                ║";
    echo " ║                                     ║     ║                                                                                ║";
    echo " ║       [1] Democratie                ║     ║                                                                                ║";
    echo " ║       [2] Dashboard                 ║     ║                                                                                ║";
    echo " ║       [3] Playground                ║     ║                                                                                ║";
    echo " ║       [4] Missions                  ║     ║                                                                                ║";
    echo " ║                                     ║     ║                                                                                ║";
    echo " ║     ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈     ║     ║                                                                                ║";
    echo " ║       [5] Cv numérique              ║     ║                                                                                ║";
    echo " ║       [6] SmartContract             ║     ║                                                                                ║";
    echo " ║       [7] Réseau                    ║     ║                                                                                ║";
    echo " ║       [8] Journal                   ║     ║                                                                                ║";
    echo " ║                                     ║     ║                                                                                ║";
    echo " ║     ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈     ║     ║                                                                                ║";
    echo " ║       [09] Tresorie                 ║     ║                                                                                ║";
    echo " ║       [10] Organisation             ║     ║                                                                                ║";
    echo " ║       [10] Contacts                 ║     ║                                                                                ║";
    echo " ║       [11] Map                      ║     ║                                                                                ║";
    echo " ║       [12] Exit                     ║     ║                                                                                ║";
    echo " ║                                     ║     ║                                                                                ║";
    echo " ╠═════════════════════════════════════╣     ╠════════════════════════════════════════════════════════════════════════════════╣";
    echo " ║[💰]:{                              }║     ║/💻.📡/<: ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░/%>║";
    echo " ╚═════════════════════════════════════╝     ╚════════════════════════════════════════════════════════════════════════════════╝"
    echo ""

read -p "Entrez votre choix : " commande

case $commande in

        menu)
            make menu
            ;;
        update)
            make update
            ;;
        3)
            make commande3
            ;;
        4)
            make commande4
            ;;
        5)
            make commande5
            ;;
        6)
            make commande6
            ;;
        r)
            clear
            menu
            ;;

        # Règle par défaut en cas d'entrée invalide
        *)
            echo "Entrée invalide"
            ;;
    esac
}
menu  # Appel de la fonction pour afficher le menu: