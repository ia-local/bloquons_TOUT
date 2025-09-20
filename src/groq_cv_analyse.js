// groq_cv_analyse.js
const Groq = require("groq-sdk");

// Initialisation du client Groq avec la clé API de .env
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/**
 * Envoie le contenu textuel d'un CV à Groq pour une valorisation des compétences et attributs.
 * @param {string} cvContent - Le texte brut du CV ou des sections de compétences à valoriser.
 * @returns {Promise<Object>} - Un objet JSON contenant la valorisation des compétences et attributs.
 */
async function valorizeSkillsWithGroq(cvContent) {
    console.log("Envoi du CV à Groq pour valorisation...");

    const prompt = `En tant qu'expert en recrutement et en analyse de carrière, veuillez analyser le CV suivant (en texte) et :
1.  **Valoriser chaque compétence technique** en expliquant brièvement son importance ou son application concrète.
2.  **Identifier les attributs professionnels (soft skills)** implicites ou explicites, et justifier leur pertinence.
3.  **Proposer une phrase d'accroche** percutante pour le début du CV, basée sur l'ensemble des compétences et expériences suggérées.

Retournez le résultat au format JSON, avec les clés suivantes:
{
  "catch_phrase": "Votre phrase d'accroche ici.",
  "valorized_technical_skills": [
    { "skill": "Nom de la compétence", "valorization": "Description valorisante" }
  ],
  "professional_attributes": [
    { "attribute": "Nom de l'attribut", "justification": "Justification" }
  ]
}

Contenu du CV à analyser:
${cvContent}
`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "gemma2-9b-it", // Ou un modèle plus puissant si nécessaire (ex: llama3-70b-8192)
            temperature: 0.5, // Température plus basse pour des résultats plus précis et moins créatifs
            max_tokens: 1500, // Ajustez si le CV est très long
            response_format: { type: "json_object" }, // Demande un retour JSON
        });

        const rawResponse = chatCompletion.choices[0]?.message?.content;
        console.log("Réponse brute de Groq:", rawResponse);

        // Assurez-vous que Groq retourne bien du JSON valide
        try {
            return JSON.parse(rawResponse);
        } catch (jsonError) {
            console.error("Erreur de parsing JSON de la réponse Groq:", jsonError);
            console.error("Réponse Groq non-JSON reçue:", rawResponse);
            // Retourne un objet d'erreur structuré ou la réponse brute si le parsing échoue
            return { error: "Erreur de format de réponse de l'IA", raw_response: rawResponse };
        }

    } catch (error) {
        console.error("Erreur lors de l'appel à l'API Groq:", error);
        throw new Error(`Échec de la valorisation des compétences: ${error.message}`);
    }
}

module.exports = { valorizeSkillsWithGroq };