const fs = require("fs");
const inquirer = require("inquirer");
const Groq = require("groq-sdk");

// Initialisation de `groq-sdk`
const groq = new Groq();
const db = new Groq({});

// Importer les fichiers JSON
const CTF = require("./ctf.json");
const R2D2 = require("./R2D2.json");

async function main() {
  // Utilisation d'Inquirer pour recueillir l'intention de l'utilisateur
  const userIntent = await inquirer.prompt([
    {
      type: "list",
      name: "selectedCTF",
      message: "Sélectionnez le CTF que vous souhaitez explorer :",
      choices: CTF.map(ctf => ctf.title)
    },
    {
      type: "input",
      name: "intentQuestion",
      message: "Quelle question ou intention souhaitez-vous soumettre ?"
    },
    {
      type: "confirm",
      name: "confirmExecution",
      message: "Voulez-vous exécuter cette intention avec Groq ?",
      default: true
    }
  ]);

  // Récupérer les détails du CTF sélectionné
  const selectedCTF = CTF.find(ctf => ctf.title === userIntent.selectedCTF);

  // Génération de la documentation en Markdown
  const ctfDetails = `
# ${selectedCTF.title}
# ${selectedCTF.Description}
**Objectif**: ${selectedCTF.objective}
**Phases**: ${selectedCTF.phases.join(", ")}

## Tâches
${selectedCTF.tasks.map((task, index) => `- ${index + 1}. ${task}`).join("\n")}

---
  `;

  // Si l'utilisateur confirme, exécuter l'intention avec `groq-sdk`
  if (userIntent.confirmExecution) {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          name: "[📔.codex]",
          content: "phase[00]:[DATE]:[initialisation des variables dans le contexte d'une enquête parlementaire]"
        },
        {
          role: "assistant",
          name: "alicia",
          content: `Question de l'utilisateur : ${userIntent.intentQuestion}\nCTF sélectionné : ${selectedCTF.title}\nDétails : ${ctfDetails}`
        },
        {
            role: "system",
            name: "[📔.codex]",
            content: "rédiger un plan de développement complet en fonction de la réponse à la question de l'assistant"
          },
      ],
      model: "gemma2-9b-it",
      temperature: 0.5,
      max_tokens: 2024,
      top_p: 1,
      stop: null,
      stream: false
    });

    // Extraire le contenu généré et l'enregistrer
    const mdContent = chatCompletion.choices[0]?.message?.content;
    const fileName = `CTF_${selectedCTF.id}_${selectedCTF.title.replace(/ /g, "_")}.md`;
    fs.writeFileSync(fileName, ctfDetails + mdContent);
    console.log(`Documentation générée : ${fileName}`);
  } else {
    console.log("Intention annulée.");
  }
}

main();