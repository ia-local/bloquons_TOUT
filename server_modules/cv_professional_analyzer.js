// server_modules/cv_professional_analyzer.js
const Groq = require('groq-sdk');
require('dotenv').config(); // S'assurer que les variables d'environnement sont chargées

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Génère un résumé professionnel au format Markdown à partir d'une conversation.
 * Ce résumé est destiné à être utilisé pour un CV, mettant en avant les compétences,
 * les réalisations et le savoir-faire de l'utilisateur.
 * @param {Array<Object>} messages - L'historique complet des messages de la conversation (rôle, contenu).
 * @returns {Promise<string>} - Le résumé professionnel au format Markdown.
 */
async function generateProfessionalSummary(messages) {
    console.log("Génération du résumé professionnel pour le CV...");

    // Filtre les messages système qui ne sont pas pertinents pour le résumé côté utilisateur
    const userRelevantMessages = messages.filter(msg => msg.role !== 'system');

    // Convertit les messages en un format textuel lisible pour l'IA
    const conversationText = userRelevantMessages.map(msg => {
        const speaker = msg.role === 'user' ? 'Utilisateur' : 'Assistant';
        return `${speaker}: ${msg.content}`;
    }).join('\n');

    // Prompt pour le modèle Groq afin d'extraire les informations du CV
    const prompt = `Vous êtes un expert en recrutement et en rédaction de CV.
Analysez la conversation suivante entre un "Utilisateur" et un "Assistant IA" qui a pour but d'extraire les compétences professionnelles de l'utilisateur.
À partir de cette conversation, rédigez un résumé professionnel détaillé pour un CV, en utilisant le format Markdown suivant :

---
## Résumé Professionnel (Extrait de Conversation IA)

### Profil
[Décrivez le profil professionnel de l'utilisateur en une phrase ou deux, basé sur le ton général de la conversation et les compétences mises en avant.]

### Compétences Techniques Clés
-   [Compétence 1 (Langage/Outil/Technologie) : Brève explication ou contexte d'utilisation]
-   [Compétence 2 : ...]
-   ...

### Expériences et Réalisations (Projets / Missions)
-   **[Titre du Projet/Défi]** : [Brève description du projet ou du défi.]
    * **Rôle/Actions :** [Actions spécifiques de l'utilisateur, son rôle dans le projet.]
    * **Résultats/Impact :** [Résultats concrets, chiffres si disponibles, impact positif.]
    * **Technologies utilisées :** [Liste des technologies/outils pertinents.]
-   **[Autre Projet/Mission]** : ...
-   ...

### Compétences Comportementales (Soft Skills)
-   [Soft Skill 1 : Justification basée sur les interactions]
-   [Soft Skill 2 : ...]
-   ...

---

Concentrez-vous uniquement sur les informations relatives à l'expérience professionnelle de l'utilisateur. Ne mentionnez pas que le résumé est généré par une IA dans le résumé lui-même. Si des sections ne contiennent pas d'informations, omettez-les ou indiquez "Non spécifié dans cette conversation".

Conversation :
${conversationText}
`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gemma2-9b-it", // Utilisation du modèle gemma2-9b-it
            temperature: 0.3, // Température basse pour une extraction factuelle et peu créative
            max_tokens: 2000, // Ajustez si les résumés peuvent être très longs
        });

        return chatCompletion.choices[0]?.message?.content || "Impossible de générer un résumé professionnel.";

    } catch (error) {
        console.error("Erreur lors de l'appel à l'API Groq pour le résumé CV:", error);
        throw new Error(`Échec de la génération du résumé professionnel : ${error.message}`);
    }
}

module.exports = { generateProfessionalSummary };