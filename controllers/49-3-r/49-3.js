const fs = require("fs");
const Groq = require("groq-sdk");
const path = require("path");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Load JSON data for the inquiry
const dossierData = JSON.parse(fs.readFileSync("dossier_49-3.json", "utf8"));

// Generate a judicial instruction for AI investigator
function genererInstructionJudiciaire(dossierData) {
    return `
Instruction judiciaire pour l'enquêteur AI :

1. **Titre de l'enquête** : Usage abusif de l'article 49.3 dans les réformes de 2017 à 2024
2. **Description de l'affaire** : ${dossierData.description || "Description indisponible"}
3. **Contexte de l'enquête** :
   - Période : ${dossierData.periode || "Non spécifiée"}
4. **Cas de recours à l'article 49.3** :
${(dossierData.utilisations || []).map(utilisation => {
    return `   - **${utilisation.annee || "Année inconnue"}** : ${utilisation.loi || "Loi non spécifiée"}\n      - Date d'utilisation : ${utilisation.date_utilisation || "Date non spécifiée"}\n      - Contexte : ${utilisation.context || "Contexte indisponible"}\n      - Motions de censure : ${(utilisation.motions_de_censure || []).map(motion => `\n         * ${motion.date || "Date inconnue"} - Partis : ${(motion.partis || []).join(", ")} - Résultat : ${motion.resultat || "Résultat non spécifié"}`).join("")}`;
}).join("\n")}
5. **Objectifs de l'enquête** :
${(dossierData.objectifs || []).map((objectif, i) => `   ${i + 1}. ${objectif}`).join("\n")}
6. **Conclusion de l'enquête** :
   - ${dossierData.conclusion || "Conclusion indisponible"}
`;
}

// Structuring sections in JSON format for dynamic presentation
function genererPipelineJSON(dossierData) {
    return (dossierData.utilisations || []).map(utilisation => ({
        titre: utilisation.loi || "Titre non spécifié",
        details: `Année : ${utilisation.annee || "Non spécifiée"}\nDate d'utilisation : ${utilisation.date_utilisation || "Non spécifiée"}\nContexte : ${utilisation.context || "Indisponible"}\nMotions de censure : ${(utilisation.motions_de_censure || []).map(motion => `${motion.date || "Date inconnue"} - Partis : ${(motion.partis || []).join(", ")} - Résultat : ${motion.resultat || "Résultat non spécifié"}`).join("\n")}`
    }));
}

// Generate HTML for the presentation
function genererHTML(enquete) {
    const formattedTitle = enquete.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${formattedTitle}</title>
      <link rel="stylesheet" href="style_${enquete}.css">
    </head>
    <body>
      <header>
        <h1>${formattedTitle}</h1>
        <nav id="sommaire"></nav>
      </header>
      <main id="content"></main>
      <footer>
        <p>&copy; ${new Date().getFullYear()} - Enquête Parlementaire sur l'Article 49.3</p>
      </footer>
      <script src="script_${enquete}.js"></script>
    </body>
    </html>`;
}

// Generate CSS for presentation styling
function genererCSS() {
    return `
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; padding: 20px; }
    header, main, footer { max-width: 900px; margin: 0 auto; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
    header h1 { font-size: 2em; }
    #sommaire { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
    .sommaire-item { font-size: 1.1em; color: #007bff; text-decoration: none; }
    .sommaire-item:hover { color: #0056b3; text-decoration: underline; }
    section h2 { color: #007bff; font-size: 1.8em; margin-bottom: 10px; }
    article h3 { font-size: 1.4em; margin-top: 10px; color: #555; }
    footer { font-size: 0.9em; text-align: center; margin-top: 20px; }
    `;
}

// Generate JavaScript for dynamic loading of JSON content
function genererJavaScript(enquete) {
    return `
    document.addEventListener('DOMContentLoaded', function() {
      fetch('pipeline_${enquete}.json')
        .then(response => response.json())
        .then(pipeline => {
          const sommaire = document.getElementById('sommaire');
          const contenuCours = document.getElementById('content');

          pipeline.forEach((section, index) => {
            let sommaireItem = document.createElement('a');
            sommaireItem.href = \`#section\${index}\`;
            sommaireItem.textContent = section.titre;
            sommaireItem.classList.add("sommaire-item");
            sommaire.appendChild(sommaireItem);

            let sectionDiv = document.createElement('section');
            sectionDiv.id = \`section\${index}\`;
            
            let titreSection = document.createElement('h2');
            titreSection.textContent = section.titre;
            sectionDiv.appendChild(titreSection);

            let contenu = document.createElement('p');
            contenu.textContent = section.details;
            sectionDiv.appendChild(contenu);

            contenuCours.appendChild(sectionDiv);
          });
        });
    });
    `;
}

// Generate presentation files
function genererFichiersPresentation(enquete) {
    const htmlFile = `dist/page_${enquete}.html`;
    fs.writeFileSync(htmlFile, genererHTML(enquete));
    console.log(`HTML sauvegardé dans ${htmlFile}`);

    const cssFile = `dist/style_${enquete}.css`;
    fs.writeFileSync(cssFile, genererCSS());
    console.log(`CSS sauvegardé dans ${cssFile}`);

    const jsFile = `dist/script_${enquete}.js`;
    fs.writeFileSync(jsFile, genererJavaScript(enquete));
    console.log(`JavaScript sauvegardé dans ${jsFile}`);

    const jsonFile = `dist/pipeline_${enquete}.json`;
    fs.writeFileSync(jsonFile, JSON.stringify(genererPipelineJSON(dossierData), null, 2));
    console.log(`JSON pipeline sauvegardé dans ${jsonFile}`);
}

// Send instruction to AI using Groq SDK
async function envoyerInstructionEnquete() {
    const instruction = genererInstructionJudiciaire(dossierData);
    try {
        const response = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "Instruction judiciaire pour l'enquêteur AI sur l'affaire de l'usage de l'article 49.3" },
                { role: "assistant", content: instruction }
            ],
            model: "gemma2-9b-it",
            temperature: 0.7,
            max_tokens: 4096,
        });
        
        console.log("Réponse de l'enquêteur :", response.choices[0]?.message?.content);
    } catch (error) {
        console.error("Erreur lors de l'envoi des résultats :", error);
    }
}

// Execute file generation and send instruction
const enquete = "dossier_49-3";
genererFichiersPresentation(enquete);
envoyerInstructionEnquete().catch(console.error);