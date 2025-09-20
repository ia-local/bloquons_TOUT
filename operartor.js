// Dans votre fichier operator.js
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Supposons que votre base de données soit accessible ici
const { readJsonFile } = require('../serveur.js'); // Assurez-vous d'avoir exporté cette fonction

async function generateSummary() {
    try {
        const database = await readJsonFile('./data/database.json');
        
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