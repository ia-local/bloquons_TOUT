// Fichier : server_modules/operator.js

const Groq = require('groq-sdk');
const { getRelevantDataForAI } = require('./utils.js'); // Importez la nouvelle fonction

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const { readJsonFile } = require('../serveur.js'); // Assurez-vous d'avoir exporté cette fonction
/**
 * Génère un résumé des données de l'application via l'IA.
 */
async function generateSummary() {
    try {
        const database = await readJsonFile('../database.json');
        
        // --- NOUVEAU : Créer un résumé concis des données avant de l'envoyer à l'IA ---
        const summaryData = {
            totalMissions: database.missions.length,
            totalBoycotts: database.boycotts.length,
            totalRics: database.rics.length,
            caisseSolde: database.caisse_manifestation.solde
            // N'incluez pas tout le contenu !
        };
        
        const prompt = `Génère un résumé concis de l'état actuel de notre projet de manifestation.
        Données clés : ${JSON.stringify(summaryData, null, 2)}
        Ne dépasse pas 150 mots.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gemma2-9b-it',
            temperature: 0.7,
            max_tokens: 250 // Limitez la réponse pour éviter l'erreur
        });
        
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error('Erreur lors de la génération du résumé:', error);
        throw new Error('Échec de la génération du résumé: ' + error.message);
    }
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