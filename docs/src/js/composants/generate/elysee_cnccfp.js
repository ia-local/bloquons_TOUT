// Importation des modules nécessaires
const fs = require("fs");
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Génère une liste de thématiques via le rôle system.
 * @returns {Promise<string[]>} - Liste des thématiques générées.
 */

  const escrowBoutique = "`https://boutique.elysee.fr`"

  const Emploi_fictif =  `[{
    "parnom": "ENSEMBLE ! (MAJORITÉ PRÉSIDENTIELLE)",
    "parcode": "1378",
    "parsigle": "EMP",
    "Identif_RNA_num": "W922019372",
    "Identif_RNA_url": "http://rna.dlpaj.mi/cms/index.php?mod=waldec_consult&sec=dossier&mnu=mod|waldec_consult|sec|menu&id=W922019372",
    "Identif_RNA": "W922019372#http://rna.dlpaj.mi/cms/index.php?mod=waldec_consult&sec=dossier&mnu=mod|waldec_consult|sec|menu&id=W922019372#",
    "parpost": "75008",
    "parccfp": "25/04/2022",
    "parsortieloi": "",
    "eligible_ap": "Oui",
    "decision_2022": "Respect",
    "motif_2022": "DC",
    "autoriser_a_financer": "Oui",
    "date_fin_sanctions_art_200": "",
    "date_fin_sanctions_ap": ""
    },
    {
    "parnom": "ELLES MARCHENT !",
    "parcode": "1402",
    "parsigle": "EM!",
    "Identif_RNA_num": "W751262286",
    "Identif_RNA_url": "http://rna.dlpaj.mi/cms/index.php?mod=waldec_consult&sec=dossier&mnu=mod|waldec_consult|sec|menu&id=W751262286",
    "Identif_RNA": "W751262286#http://rna.dlpaj.mi/cms/index.php?mod=waldec_consult&sec=dossier&mnu=mod|waldec_consult|sec|menu&id=W751262286#",
    "parpost": "75001",
    "parccfp": "23/05/2022",
    "parsortieloi": "",
    "eligible_ap": null,
    "decision_2022": "Non-respect",
    "motif_2022": "HD",
    "autoriser_a_financer": "Non",
    "date_fin_sanctions_art_200": "01/01/2025",
    "date_fin_sanctions_ap": ""
}],
  `

async function generateThemes() {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: `Génération d'une liste de titres thématiques pour des articles du CTF connu sous le sigle EMP Inscrit à la commission nationale, des comptes de campagne et des formations politiques cnccfp.fr Dans une affaire ${Emploi_fictif} Lutte contre les abus de pouvoir le 49 ans en récidive les fraudes aux comptes de campagne et les évasions fiscales, siegeant ${escrowBoutique}.` }
      ],
      model: "gemma2-9b-it",
      temperature: 0.5,
      max_tokens: 56, // Limiter pour obtenir une liste concise
    });

    const themes = completion.choices[0]?.message?.content.split("\n").filter(Boolean);
    console.log("✅ Thématiques générées :", themes);
    return themes;
  } catch (error) {
    console.error("❌ Erreur lors de la génération des thématiques :", error);
    return [];
  }
}

/**
 * Génère un article complet en fonction d'une thématique via le rôle assistant.
 * @param {string} theme - La thématique pour laquelle générer l'article.
 * @returns {Promise<string>} - Contenu de l'article généré.
 */
async function generateArticle(theme) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "assistant", content: `Génération de l'article en fonction des titres lier "${theme}".` }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.5,
      max_tokens: 4096, // Autoriser un contenu riche et détaillé
    });

    const articleContent = completion.choices[0]?.message?.content;
    console.log(`✅ Article généré pour le thème "${theme}" :`, articleContent);
    return articleContent;
  } catch (error) {
    console.error(`❌ Erreur lors de la génération de l'article pour "${theme}" :`, error);
    return `Erreur lors de la génération de l'article pour le thème "${theme}".`;
  }
}

/**
 * Fonction principale pour orchestrer la génération des thématiques et des articles.
 */
async function main() {
  try {
    // Génération de la liste des thématiques
    const themes = await generateThemes();

    // Génération des articles pour chaque thématique
    for (const theme of themes) {
      const articleContent = await generateArticle(theme);

      // Enregistrement de l'article dans un fichier Markdown
      const outputFilePath = `${theme.replace(/\s+/g, "_").toLowerCase()}_${new Date().toISOString().replace(/[-:TZ]/g, "")}.md`;
      fs.writeFileSync(outputFilePath, articleContent);

      console.log(`✅ Article sauvegardé : ${outputFilePath}`);
    }
  } catch (error) {
    console.error("❌ Une erreur s'est produite lors de l'exécution du script :", error);
  }
}

main();
