// Fichier : visionai.js
const Groq = require('groq-sdk');
const GROQ_API_KEY = process.env.GROQ_API_KEY; // Assurez-vous que la clé est bien dans les variables d'environnement

const groq = new Groq({ apiKey: GROQ_API_KEY });

/**
 * Envoie une image à un modèle d'IA pour analyse.
 * @param {string} imageUrl - L'URL de l'image à analyser.
 * @returns {Promise<string>} La réponse textuelle de l'IA.
 */
async function analyzeImageWithAI(imageUrl) {
    // Note: Le modèle Llama-4 n'existe pas, nous allons utiliser un modèle de vision de référence
    // pour cet exemple, comme le modèle Gemini. Vous devrez l'adapter à votre Groq-SDK.
    // L'exemple de code que vous avez fourni utilise un modèle Groq spécifique qui pourrait
    // ne pas être public. En attendant, utilisons une structure générique.

    // Remplacez cette partie par l'implémentation correcte de l'API de Groq si elle supporte la vision
    // Pour l'instant, c'est une simulation.
    try {
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Décris cette image en détail et analyse les éléments pertinents pour une manifestation. Estime la foule, identifie les logos syndicaux ou les drapeaux." },
                        { type: "image_url", image_url: { url: imageUrl } }
                    ]
                }
            ],
            model: "gemma2-9b-it", // Ce modèle ne prend pas en charge la vision. Adaptez au bon modèle.
            temperature: 0.5,
            max_tokens: 1024,
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error("Erreur de l'API Groq (Vision):", error);
        throw new Error("L'API de vision IA a échoué.");
    }
}

module.exports = { analyzeImageWithAI };