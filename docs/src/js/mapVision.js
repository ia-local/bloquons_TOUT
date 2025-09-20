// Fichier: public/src/js/mapVision.js
import { Groq } from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY; // Assurez-vous que cette clé est accessible
const groq = new Groq({ apiKey: GROQ_API_KEY });

/**
 * Envoie une image à un modèle d'IA pour analyse.
 * @param {string} imageUrl - L'URL de l'image à analyser.
 * @returns {Promise<string>} La réponse textuelle de l'IA.
 */
export async function analyzeImageWithAI(imageUrl) {
    try {
        const chatCompletion = await groq.chat.completions.create({
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Analyse cette image d'une manifestation. Fournis un rapport détaillé des éléments suivants: nombre de personnes estimé, éventuels drapeaux ou symboles syndicaux (comme la CGT ou FO), et une évaluation du niveau d'ordre (calme, tendu, etc.)."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": imageUrl
                            }
                        }
                    ]
                }
            ],
            "model": "llama-4-scout-17b-16e-instruct", // Assurez-vous que ce modèle supporte la vision
            "temperature": 0.5,
            "max_completion_tokens": 1024
        });

        return chatCompletion.choices[0].message.content;

    } catch (error) {
        console.error("Erreur lors de l'analyse de l'image par l'IA:", error);
        return "Échec de l'analyse de l'image. Veuillez réessayer plus tard.";
    }
}