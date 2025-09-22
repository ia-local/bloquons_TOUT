# Affichage de l'heure et du mode de développement

# Définition des variables utilisées dans le script:
hudTensor="╔╗╚╝═║╠╣╦╩╬"         # Caractères spéciaux utilisés pour le design du menu
SCRIPT_DIR="./Users/universmc/.module_zsh"  # Répertoire contenant les scripts à exécuter

# Définition de la fonction 'menu' pour afficher le menu avec les options:

menu() {
    echo "";
    echo " ╔═════════════════════════════════════╗     ╔════════════════════════════════════════════════════════════════════════════════╗";
    echo " ╠════════{ ✨ Pi  - Console }═════════╣     ║[💫]                       🔷 Weclom tool Univers IA 🔷                    >[🛰] ║";
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
    echo " ║       [7] Réseau.                   ║     ║                                                                                ║";
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

        0)
            make menu
            ;;
        1)
            make democratie
            ;;
        2)
            make dashboard
            ;;
        3)
            make playground
            ;;
        4)
            make missions
            ;;
        5)
            make cvnu
            ;;
        6)
            make smartContract
            ;;
        7)
            make reseau
            ;;
        8)
            make journal
            ;;
        9)
            make tresorie
            ;;
        10)
            make organisation
            ;;
        11)
            make contacts
            ;;
        12)
            make map
            ;;
        13)
        make Exit
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