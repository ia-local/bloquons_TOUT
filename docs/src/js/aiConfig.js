// Fichier : public/src/js/aiConfig.js

/**
 * Crée la configuration de l'IA à partir des données des bots.
 * @param {Array<Object>} bots - Le tableau des bots depuis chatbot.json.
 * @returns {Object} Un objet contenant les modèles et les personas.
 */
export function createAiConfig(bots) {
    const aiModels = {};
    const aiPersonas = {};

    bots.forEach(bot => {
        aiModels[bot.persona.toUpperCase()] = bot.model;
        aiPersonas[bot.persona] = bot.description;
    });

    aiModels.DEFAULT = 'llama-3.1-8b-instant';
    aiPersonas.generaliste = aiPersonas.generaliste || bots.find(b => b.persona === 'generaliste')?.description;

    return { aiModels, aiPersonas };
}

/**
 * Détermine la persona de l'IA en fonction du message de l'utilisateur.
 * @param {string} message - Le message de l'utilisateur.
 * @returns {string} La persona correspondante.
 */
export function getPersonaFromMessage(message) {
    if (message.toLowerCase().includes('loi') || message.toLowerCase().includes('législatif')) {
        return 'avocat';
    }
    if (message.toLowerCase().includes('données') || message.toLowerCase().includes('preuve') || message.toLowerCase().includes('enquête')) {
        return 'enqueteur';
    }
    if (message.toLowerCase().includes('code') || message.toLowerCase().includes('javascript') || message.toLowerCase().includes('html')) {
        return 'codage';
    }
    return 'generaliste';
}