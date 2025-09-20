const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const https = require("https"); // Ajout pour gérer l'agent HTTPS
const Groq = require("groq-sdk");
const groq = new Groq();

// URL de la boutique Élysée à analyser
const url = "https://boutique.elysee.fr";

// Charger le fichier JSON pour l'investigation de la politique du prix
const pricePolicyData = JSON.parse(fs.readFileSync("politique_du_prix.json", "utf8"));

// Charger les détails de l'enquêteur
const manifest = JSON.parse(`
{
    "title": "La Démocratie en Danger : Manifeste pour la Transparence et l'Intégrité",
    "description": "Ce manifeste vise à sensibiliser et mobiliser les citoyens contre la fraude électorale, l'escroquerie financière en bande organisée, et la désinformation orchestrée par certains groupes de pouvoir, afin de défendre notre démocratie et promouvoir un système juste et transparent.",
    "introduction": {
      "content": "La démocratie, telle que nous la connaissons, est aujourd'hui menacée par une série de pratiques qui sapent ses fondements. Fraude électorale, escroquerie financière en bande organisée, et propagande orchestrée par de puissants groupes influents sont autant de dangers qui privent les citoyens de leur droit à une information transparente et à un système de gouvernance honnête. Ce manifeste a pour but de dénoncer ces pratiques et d’appeler à une mobilisation pour défendre l'intégrité de notre démocratie.",
      "appel_a_action": "Citoyens, engageons-nous pour une démocratie véritable et transparente, libre des manipulations et des influences indésirables !"
    },
    "sections": [
      {
        "title": "Fraude électorale : Une atteinte à la volonté du peuple",
        "content": "La fraude électorale sape directement la volonté des citoyens en faussant les résultats électoraux. Ces pratiques peuvent inclure la manipulation des bulletins, l'usage de listes électorales frauduleuses, et l'influence financière indue. Elles constituent une violation flagrante de la démocratie.",
        "details": [
          "Manipulations lors du comptage des votes, entraînant des résultats qui ne reflètent pas la réalité.",
          "Inscriptions et suppressions frauduleuses de noms sur les listes électorales pour influencer le résultat.",
          "Usage de moyens financiers massifs pour corrompre les campagnes et s'assurer du contrôle des institutions."
        ],
        "legal_references": [
          {
            "code": "Code électoral",
            "articles": ["L52", "L53"],
            "description": "Ces articles répriment les actes de fraude électorale et l'usage abusif de propagande."
          }
        ],
        "appel_a_action": "Exigeons des audits et des contrôles indépendants pour garantir des élections transparentes."
      },
      {
        "title": "Escroquerie financière en bande organisée",
        "content": "L'escroquerie financière en bande organisée représente une menace sérieuse pour l'économie et la confiance des citoyens. En concentrant le pouvoir financier et en exploitant des mécanismes illégaux pour détourner des fonds, certaines entités mettent en péril l'intégrité du système financier et renforcent les inégalités.",
        "details": [
          "Pratiques d'escroquerie financière impliquant des réseaux d'influence pour détourner les fonds publics et privés.",
          "Corruption généralisée au sein de certains secteurs pour favoriser des intérêts particuliers au détriment de l'intérêt public.",
          "Manipulation de la justice pour protéger les fraudeurs et garantir leur impunité."
        ],
        "legal_references": [
          {
            "code": "Code pénal",
            "articles": ["313", "314", "340", "342"],
            "description": "Ces articles criminalisent l'escroquerie, l'abus de confiance, et la corruption en bande organisée dans les finances publiques et privées."
          }
        ],
        "appel_a_action": "Demandons la transparence et une législation stricte contre l'escroquerie financière en bande organisée."
      },
      {
        "title": "Désinformation et propagande des milliardaires",
        "content": "La désinformation orchestrée par des élites économiques manipule l'opinion publique en faussant les faits et en créant une propagande favorable à leurs intérêts. Les réseaux sociaux et médias dominés par ces groupes diffusent des messages biaisés, créant des perceptions erronées et polarisant la société.",
        "details": [
          "Utilisation de fausses informations pour orienter l'opinion publique et discréditer les opposants politiques.",
          "Contrôle des médias pour propager des messages en faveur des intérêts économiques de l'élite.",
          "Utilisation de réseaux sociaux et d'algorithmes pour renforcer la visibilité de contenus propagandistes et filtrer les opinions dissidentes."
        ],
        "legal_references": [
          {
            "code": "Code pénal",
            "articles": ["431", "226"],
            "description": "Législation contre la manipulation de l'opinion publique et le non-respect du consentement et de la transparence dans la diffusion d'informations."
          }
        ],
        "appel_a_action": "Réclamons la liberté et la diversité dans les médias pour garantir une information équilibrée."
      }
    ],
    "conclusion": {
      "content": "Face à ces menaces, il est impératif de se mobiliser pour défendre la démocratie, la transparence et l'égalité. Nous devons agir pour garantir que notre système électoral et financier soit exempt de manipulations et que chaque citoyen ait accès à une information impartiale et véridique.",
      "appel_a_action_global": "Ensemble, exigeons des réformes qui protègent nos droits et préservent l'intégrité de notre démocratie."
    },
    "additional_notes": [
      "En tant que citoyens engagés, nous appelons à la création d'une commission d'enquête parlementaire pour approfondir les allégations de fraude électorale et d'escroquerie financière.",
      "Conformément à l'article 41 du code de procédure pénale et à l'article 211 du code de la sécurité intérieure, nous exerçons notre droit à organiser une manifestation pacifique pour exprimer notre volonté de réformer notre système."
    ]
}
`)


// Création d'un agent HTTPS sans vérification du certificat SSL
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Fonction pour extraire les informations des produits de la boutique
async function extractProductData(url) {
    try {
        const response = await axios.get(url, { httpsAgent });
        const htmlContent = response.data;

        const $ = cheerio.load(htmlContent);
        let productData = [];

        // Extraction des informations sur les produits
        $('.product-item').each((index, element) => {
            const productName = $(element).find('.product-item-name').text().trim();
            const productPrice = $(element).find('.product-item-price').text().trim();
            const productDescription = $(element).find('.product-item-description').text().trim();

            productData.push({
                name: productName || "Nom du produit non trouvé",
                price: productPrice || "Prix non disponible",
                description: productDescription || "Description non disponible",
                tva: extractTVA(productDescription)
            });
        });

        return productData;
    } catch (error) {
        console.error("Erreur lors de l'extraction des informations des produits :", error);
        return [];
    }
}

// Fonction pour extraire la TVA à partir de la description du produit
function extractTVA(description) {
    const tvaMatch = description.match(/tva\s*(\d{1,2})%/i);
    return tvaMatch ? `${tvaMatch[1]}%` : "TVA non mentionnée";
}

// Modèle de question pour les témoins
function generateInvestigationQuestion(question, options) {
  return {
    question: question,
    options: options,
    answer_prompt: "Veuillez choisir une option pour continuer l'enquête."
  };
}

// Fonction pour générer la documentation de l'enquête
// Fonction pour générer la documentation de l'enquête
function generateDocumentation(questions, manifest, productData) {
    const objectifsContent = manifest.objectifs ? manifest.objectifs.join("\n") : "Objectifs non définis.";
    const legalReferencesContent = manifest.legal_references
        ? manifest.legal_references.map(ref => `${ref.code}, Articles : ${ref.articles.join(", ")}, Description : ${ref.description}`).join("\n")
        : "Références légales non définies.";

    const content = `
# Documentation de l'investigation : Boutique Elysee.fr et entités politiques

## Objectifs de l'enquête
${objectifsContent}

## Références légales
${legalReferencesContent}

## Questions d'enquête et réponses
${questions.map(q => `### Question : ${q.question}\nOptions : ${q.options.join(", ")}\n`).join("\n")}

## Données des produits extraites
${productData.map(p => `- **Produit** : ${p.name}\n  - **Prix** : ${p.price}\n  - **Description** : ${p.description}\n  - **TVA** : ${p.tva}`).join("\n\n")}

## Détails supplémentaires
- Date de génération : ${new Date().toLocaleString()}
`;

    const outputFilePath = `Documentation_Investigation_${new Date().toISOString().replace(/[-:TZ]/g, "")}.md`;
    fs.writeFileSync(outputFilePath, content);
    console.log("Documentation d'investigation sauvegardée dans " + outputFilePath);
}
// Fonction principale pour exécuter l'analyse et générer le rapport
async function main() {
    // Phase 1 : Extraire les informations des produits
    const productData = await extractProductData(url);
    console.log("Données des produits extraites :", productData);

    // Phase 2 : Générer les questions d'enquête pour les témoins
    const investigationQuestions = [
        generateInvestigationQuestion("Quels produits de la boutique sont associés à des marges élevées ?", productData.map(p => p.name)),
        generateInvestigationQuestion("Quel est le pourcentage de TVA appliqué aux produits ?", ["5.5%", "10%", "20%", "Non spécifié"]),
        generateInvestigationQuestion("Les entités politiques suivantes sont-elles impliquées ?", pricePolicyData.investigation.entites_politique.liste_entites)
    ];

    // Phase 3 : Interagir avec l'IA pour générer un rapport complet de l'enquête
    const completion = await groq.chat.completions.create({
        messages: [
            { role: "assistant", content: "Phase d'enquête : analyse des flux financiers et traçabilité de la TVA sur boutique.elysee.fr." },
            { role: "system", content: JSON.stringify(manifest) },
            { role: "user", name: "investigateur", content: "Commencer l'analyse des marges et des prix pour les articles vendus par les hauts fonctionnaires." }
        ],
        model: "gemma2-9b-it",
        temperature: 0.7,
        max_tokens: 4096,
    }).then((chatCompletion) => {
        const mdContent = chatCompletion.choices[0]?.message?.content;
        const outputFilePath = "Investigation_Report_" + new Date().toISOString().replace(/[-:TZ]/g, "") + ".md";
        fs.writeFileSync(outputFilePath, mdContent);
        console.log("Rapport d'investigation généré et enregistré dans " + outputFilePath);
    });

    // Phase 4 : Générer la documentation finale
    generateDocumentation(investigationQuestions, manifest, productData);
}

main().catch(console.error);
