

COMMANDE1_MSG="✨ Menu ✨"

serveur_MSG="✨ Lancement du serveur✨"
map_MSG="✨ Lancement de l'application MapAscii✨"

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
	@git commit -m "update"
	@git push
	@echo "✨ Mise à jour terminée✨"
