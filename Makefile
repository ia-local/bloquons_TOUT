

COMMANDE1_MSG="✨ Menu ✨"

serveur_MSG="✨ Lancement du serveur✨"
democratie_MSG="✨ init window democratie✨"
dashboard_MSG="✨ init window dashboard✨"
playground_MSG="✨ init window playground✨"
missions_MSG="✨ init window missions ✨"
cvnu_MSG="✨ init window cvnu✨"
smartContract_MSG="✨ init window smartContract✨"
reseau_MSG="✨ init window reseau ✨"
journal_MSG="✨ init window journal✨"
tresorie_MS="✨ init window tresorie✨"
organisation_MSG="✨ init window organisation✨"
contacts_MSG="✨ init window contacts✨"
map_MSG="✨ Lancement de l'application MapAscii✨"


democratie:
	@echo "${democratie_MSG}";
dashboard:
	@echo "${dashboard_MSG}";
playground:
	@echo "${playground_MSG}"
missions:
	@echo "${missions_MSG}"
cvnu:
	@echo "${cvnu_MSG}"
smartContract:
	@echo "${smartContract_MSG}"
reseau:
	@echo "${reseau_MSG}"
journal:
	@echo "${journal_MSG}"
tresorie:
	@echo "${tresorie_MSG}"
organisation:
	@echo "${organisation_MSG}"
contacts:
	@echo "${contacts_MSG}"
map:
	@echo "${map_MSG}"
serveur:
	@echo "${serveur_MSG}"
	@node serveur.js


menu:
	@echo "Welcom To cycliq Economical system."
	@echo"",
	@echo"╔═════════════════════════════════════╗     ╔═════════════════════════════════════════════════════════════════════╗";
	@echo"╠═══════════ ✨ Pi Console ═══════════╣     ║  [💫] [💬] [📚] [🌌] [✨] [⚡️] [💰] [🌴] [📱] [📡]              [🛰]║",
	@echo"║                                     ║     ╠═════════════════════════════════════════════════════════════════════╣"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"╠═════════════════════════════════════╣     ╠═════════════════════════════════════════════════════════════════════╣"
	@echo"║(∏)                                  ║     ║[💻.📱]:/<                                                        /%>║"
	@echo"╚═════════════════════════════════════╝     ╚═════════════════════════════════════════════════════════════════════╝"	
	@echo""

brainstorm:
	@echo "✨ Initialisation de la session de brainstorming✨"
	@node groq.js
	@echo "✨ Session terminée✨"

update_MSG="✨ Mise en état du dossier sur github✨"
update:
	@echo "${update_MSG}"
	@git add .
	@git commit -m "update beta"
	@git push
	@echo "✨ Mise à jour terminée✨"