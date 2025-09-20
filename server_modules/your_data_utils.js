// server_modules/your_data_utils.js

const fs = require('fs/promises');
const path = require('path');

const DATABASE_FILE_PATH = path.join(__dirname, '..', 'database.json');

/**
 * Lit le fichier database.json.
 * @returns {Promise<Object>} Le contenu de la base de données.
 */
async function readDatabase() {
    try {
        const data = await fs.readFile(DATABASE_FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lors de la lecture de la base de données:', error);
        return {};
    }
}

/**
 * Sélectionne les données les plus pertinentes et les plus récentes pour l'analyse par l'IA.
 * Cela évite de dépasser la limite de contexte du modèle.
 * @returns {Promise<Object>} Un sous-ensemble de données pour l'IA.
 */
async function getRelevantDataForAI() {
    const database = await readDatabase();
    
    if (!database) {
        return { message: "Base de données non disponible." };
    }

    // Extraction des 10 derniers événements du journal
    const recentJournalPosts = (database.journal_posts || [])
        .slice(-10)
        .reverse()
        .map(post => ({
            title: post.title,
            date: post.date,
            summary: post.content.substring(0, 150) + "..." // Truncation pour les longs contenus
        }));
        
    // Extraction des 5 dernières transactions de la caisse
    const recentTransactions = (database.caisse_manifestation?.transactions || [])
        .slice(-5)
        .reverse();
    
    // Sélection des 5 missions en cours ou les plus récentes
    const recentMissions = (database.missions || [])
        .filter(mission => mission.status === 'en cours')
        .slice(0, 5);

    // Retourne un objet de données réduit
    return {
        recentJournalPosts: recentJournalPosts,
        recentTransactions: recentTransactions,
        recentMissions: recentMissions,
        // Vous pouvez ajouter d'autres données ici, en vous assurant de les limiter.
        // Par exemple : 'ric_propositions': database.rics?.slice(-3)
    };
}

module.exports = { getRelevantDataForAI };