// Fichier : server_modules/operator.js

const Groq = require('groq-sdk');
const { getRelevantDataForAI } = require('./utils.js'); // Importez la nouvelle fonction

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ... (le reste de vos imports et configurations)
const { readJsonFile } = require('../serveur.js'); // Assurez-vous d'avoir exporté cette fonction
/**
 * Génère un résumé des données de l'application via l'IA.
 */
async function generateSummary() {
    // Utilisez la fonction utilitaire pour obtenir des données limitées
    const relevantData = await getRelevantDataForAI();

    const prompt = `En tant que Pupitre de Contrôle, analyse le rapport suivant et génère un résumé succinct pour l'opérateur. Utilise des informations claires et concises. Les données pertinentes sont : ${JSON.stringify(relevantData)}`;

    const chatCompletion = await groq.chat.completions.create({
        messages: [{
            role: "user",
            content: prompt,
        }],
        model: "mixtral-8x7b-32768", // Ou un autre modèle
        temperature: 0.5,
        max_tokens: 500, // Limite la taille de la réponse pour éviter des résumés trop longs
    });

    return chatCompletion.choices[0].message.content;
}

/**
 * Génère un plan de développement basé sur les données de l'application.
 */
async function generateDevelopmentPlan() {
    // Utilisez la même fonction pour le plan
    const relevantData = await getRelevantDataForAI();

    const prompt = `En tant que Pupitre de Contrôle, élabore un plan d'action et de développement basé sur les dernières données fournies. Concentre-toi sur les missions, les finances et la communication. Les données pertinentes sont : ${JSON.stringify(relevantData)}`;
    
    // Vous pouvez utiliser un autre modèle ou d'autres paramètres pour le plan
    const chatCompletion = await groq.chat.completions.create({
        messages: [{
            role: "user",
            content: prompt,
        }],
        model: "llama3-70b-8192", 
        temperature: 0.7,
        max_tokens: 1000,
    });

    return chatCompletion.choices[0].message.content;
}

// Assurez-vous d'exporter les fonctions
module.exports = { generateSummary, generateDevelopmentPlan, getGroqChatResponse };