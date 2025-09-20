// server_modules/operator.js

const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const fs = require('fs/promises');
const path = require('path');

const DATABASE_FILE_PATH = path.join(__dirname, '..', 'database.json');

// Fonction utilitaire pour lire la base de données
async function readDatabaseFile() {
    try {
        const data = await fs.readFile(DATABASE_FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lors de la lecture de la base de données:', error);
        return {};
    }
}

// Fonction utilitaire pour extraire des statistiques
function getManifestantCount(points) {
    let total = 0;
    points.forEach(point => {
        if (typeof point.count === 'number') {
            total += point.count;
        } else if (typeof point.count === 'string') {
            const numMatch = point.count.match(/\d+/);
            if (numMatch) {
                total += parseInt(numMatch[0]);
            } else if (point.count.toLowerCase().includes('milliers')) {
                total += 3000; // Estimation
            }
        } else if (typeof point.count === 'object') {
            for (const key in point.count) {
                if (typeof point.count[key] === 'number') {
                    total += point.count[key];
                }
            }
        }
    });
    return total;
}

// Nouvelle version de la fonction generateSummary
async function generateSummary() {
    try {
        const database = await readDatabaseFile();

        // 1. Réduire les données au strict minimum pour l'IA
        const recentEvents = database.chronology.slice(-3).map(event => ` - ${event.title} (${event.start_date.substring(0, 10)})`).join('\n');
        const missionsCount = database.missions.length;
        const boycottCount = database.boycotts.length;
        const manifestationCount = database.manifestation_points.length;
        const totalManifestants = getManifestantCount(database.manifestation_points);

        // 2. Construire un prompt concis avec les données résumées
        const prompt = `Génère un résumé concis de l'état actuel de notre mouvement.
        
        Faits marquants récents :
        ${recentEvents}
        
        Statistiques de la base de données :
        - Nombre total de missions actives: ${missionsCount}
        - Nombre d'entités boycottées: ${boycottCount}
        - Nombre de points de manifestation enregistrés: ${manifestationCount}
        - Estimation totale des participants: ${totalManifestants}
        
        Le résumé doit être professionnel et motivant pour les contributeurs. Ne mentionne pas de code source ou de structure de données. Limite la réponse à environ 150 mots.`;
        
        // 3. Appeler l'API avec le prompt optimisé et une limite de jetons
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gemma2-9b-it',
            temperature: 0.7,
            max_tokens: 250 // Valeur de sécurité
        });
        
        return chatCompletion.choices[0].message.content;

    } catch (error) {
        console.error('Erreur lors de la génération du résumé:', error);
        // On relance l'erreur pour qu'elle soit capturée par le serveur.js
        throw new Error('Échec de la génération du résumé: ' + error.message);
    }
}

// Exportez la fonction
module.exports = { generateSummary, /* ... autres fonctions */ };