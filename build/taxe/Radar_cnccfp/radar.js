const fs = require("fs");
const inquirer = require("inquirer");
const Groq = require("groq-sdk");

// Initialisation de `groq-sdk`
const groq = new Groq();
const db = new Groq({});

// Importer le fichier R2D2.js contenant le contexte de Alicia
const R2D2 = require("./R2D2.json");

async function main() {
  // Présenter Alicia et le contexte
  console.log("Bienvenue dans le CTF R2D2 'ADOPT UN RADAR DOT COM': L'IA au service de la justice sociale.");
  console.log("Alicia est une intelligence artificielle implantée dans un radar automatique, élue meilleur policier de l'année, gratifiée d'un niveau 3 jusqu'au niveau 8.");
  console.log("Alicia aide à lutter contre l'évasion fiscale et les infractions routières en utilisant des principes déontologiques et anthropiques.");

  // Utilisation d'Inquirer pour poser des questions spécifiques
  const userIntent = await inquirer.prompt([
    {
      type: "list",
      name: "questionType",
      message: "Quelle question souhaitez-vous poser à propos d'Alicia et des radars automatiques ?",
      choices: [
        "Connaissez-vous les nouvelles générations de radars ?",
        "Souhaitez-vous en savoir plus sur Alicia, l'intelligence artificielle ?",
        "Voulez-vous obtenir la documentation spécifique au radar numéro 3882 ?"
      ]
    }
  ]);

  // Générer une réponse en fonction de la question sélectionnée
  let responseContent = "";

  switch (userIntent.questionType) {
    case "Connaissez-vous les nouvelles générations de radars ?":
      responseContent = `
      Les nouvelles générations de radars sont des dispositifs sophistiqués équipés d'intelligence artificielle, comme Alicia, pour détecter les infractions routières avec une précision accrue. Ils sont capables de suivre plusieurs véhicules simultanément et d'analyser les comportements des conducteurs.`;
      break;

    case "Souhaitez-vous en savoir plus sur Alicia, l'intelligence artificielle ?":
      responseContent = `
      Alicia est une IA avancée implantée dans les radars automatiques, utilisée pour lutter contre l'évasion fiscale et améliorer la sécurité routière. Étant élue meilleure policière de l'année, elle applique des principes déontologiques stricts pour assurer une justice sociale équitable.`;
      break;

    case "Voulez-vous obtenir la documentation spécifique au radar numéro 3882 ?":
      responseContent = `
      La documentation du radar numéro 3882 contient des détails techniques sur son fonctionnement, ses algorithmes d'analyse, et les spécificités de la collaboration avec l'IA Alicia pour la prévention des infractions.`;
      break;
  }

  // Générer une instance `groq-sdk` pour obtenir des compléments de documentation
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "Vous êtes un assistant intelligent aidant à présenter le contexte d'Alicia et des radars automatiques."
      },
      {
        role: "assistant",
        content: responseContent
      }
    ],
    model: "gemma2-9b-it",
    temperature: 0.5,
    max_tokens: 1024,
    top_p: 1,
    stop: null,
    stream: false
  });

  // Extraire le contenu généré par `groq-sdk`
  const mdContent = chatCompletion.choices[0]?.message?.content;
  const fileName = `R2D2_Documentation.md`;
  fs.writeFileSync(fileName, `${responseContent}\n\n---\n\n${mdContent}`);
  console.log(`Documentation générée : ${fileName}`);
}

main();
