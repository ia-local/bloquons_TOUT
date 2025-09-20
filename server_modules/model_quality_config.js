// server_modules/model_quality_config.js
// Définissez ici vos scores de qualité pour différents modèles d'IA.
// Ces valeurs sont subjectives et devraient être ajustées en fonction de vos propres évaluations.

const MODEL_QUALITY_SCORES = {
    // Scores pour les modèles Groq
    "llama3-8b-8192": {
        quality_multiplier: 1.0, // Multiplicateur de qualité global pour ce modèle
        // Bonus spécifiques pour les attributs de la réponse AI
        response_relevance_bonus: 0.05, // Bonus additionnel si la réponse est pertinente
        coherence_bonus: 0.02,        // Bonus pour la cohérence
        problem_solving_capability: 0.1 // Contribution au bonus de résolution de problème
    },
    "llama3-70b-8192": {
        quality_multiplier: 1.5, // Supposé être de meilleure qualité
        response_relevance_bonus: 0.1,
        coherence_bonus: 0.05,
        problem_solving_capability: 0.2
    },
    "deepseek-r1-distill-llama-70b": {
        quality_multiplier: 1.3,
        response_relevance_bonus: 0.07,
        coherence_bonus: 0.03,
        problem_solving_capability: 0.15
    },
    "gemma2-9b-it": {
        quality_multiplier: 0.9,
        response_relevance_bonus: 0.03,
        coherence_bonus: 0.01,
        problem_solving_capability: 0.08
    },
    // Ajoutez d'autres modèles si vous les utilisez (ex: OpenAI, Anthropic, etc.)
    // "gpt-4o": {
    //     quality_multiplier: 1.8,
    //     response_relevance_bonus: 0.15,
    //     coherence_bonus: 0.08,
    //     problem_solving_capability: 0.3
    // },
    // "claude-3-opus-20240229": {
    //     quality_multiplier: 1.7,
    //     response_relevance_bonus: 0.14,
    //     coherence_bonus: 0.07,
    //     problem_solving_capability: 0.28
    // },

    // Modèle par défaut si aucun modelId spécifique n'est trouvé ou si la qualité n'est pas définie
    "default": {
        quality_multiplier: 0.8, // Valeur de base pour les modèles non spécifiés
        response_relevance_bonus: 0.0,
        coherence_bonus: 0.0,
        problem_solving_capability: 0.0
    }
};

// Exporter la configuration pour qu'elle puisse être importée
module.exports = { MODEL_QUALITY_SCORES };