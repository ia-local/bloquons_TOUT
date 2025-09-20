// server_modules/utms_calculator.js (Nouvelle Version pour 1 UTMi = 1 EUR)

// Importation des scores de qualité des modèles
const { MODEL_QUALITY_SCORES } = require('./model_quality_config');

/**
 * Moteur de calcul des Unités Temporelles Monétisables (UTMi) et d'analyse des insights.
 * Cette version intègre :
 * - La valorisation des interactions et activités.
 * - L'analyse des données historiques (logs) pour générer des rapports d'insights détaillés.
 * - La prise en compte des attributs CVNU et du contexte économique.
 * - La consolidation des logs et la détection des thématiques (marketing, affiliation, fiscale/économique).
 * - Prise en compte de la qualité des modèles d'IA.
 * - Optimisé pour collecter plus de données pour le calcul UTMi et la valorisation multi-devises.
 */

// --- Coefficients de Valorisation (ajustables) ---
const COEFFICIENTS = {
    TIME_PER_SECOND_UTMI: 0.1, // Valeur de base pour le temps de calcul / traitement

    PROMPT: {
        BASE_UTMI_PER_WORD: 0.5,
        COMPLEXITY_MULTIPLIER: 1.2, // Basé sur l'analyse NLP ou des tags
        IMPACT_MULTIPLIER: 1.5,     // Basé sur l'importance du prompt
        UNIQUE_CONCEPT_BONUS: 5,    // Pour des requêtes vraiment originales
        FISCAL_ECONOMIC_TOPIC_BONUS: 3,
        METIER_RELATED_PROMPT_BONUS: 2,
    },

    AI_RESPONSE: {
        BASE_UTMI_PER_TOKEN: 0.1,
        RELEVANCE_MULTIPLIER: 1.3,      // Qualité de la pertinence de la réponse
        COHERENCE_MULTIPLIER: 1.1,      // Qualité de la cohérence de la réponse
        COMPLETENESS_MULTIPLIER: 1.2,   // Qualité de l'exhaustivité de la réponse
        PROBLEM_SOLVED_MICRO_BONUS: 0.5,// Petit bonus si un micro-problème est résolu
        FISCAL_ECONOMIC_INSIGHT_BONUS: 7, // Gros bonus pour des insights spécifiques
        METIER_SPECIFIC_SOLUTION_BONUS: 5, // Gros bonus pour des solutions métiers
        MODEL_QUALITY_MULTIPLIER_DEFAULT: 1.0, // Valeur par défaut si non spécifiée
        // TOKEN_COST_IMPACT_FACTOR est supprimé car l'UTMi est un bénéfice net
    },

    CODE_GENERATION: {
        BASE_UTMI_PER_LINE: 0.8,
        COMPLEXITY_MULTIPLIER: 1.5,
        REUSABILITY_BONUS: 10,
        TEST_COVERAGE_BONUS: 7,
        SECURITY_FIX_BONUS: 15,
        PERFORMANCE_IMPROVEMENT_BONUS: 12,
    },

    DOCUMENT_GENERATION: {
        BASE_UTMI_PER_PAGE: 1.5,
        DETAIL_LEVEL_MULTIPLIER: 1.1,
        ACCURACY_BONUS: 8,
        LEGAL_COMPLIANCE_BONUS: 12,
        CUSTOMIZATION_BONUS: 6,
    },

    MEDIA_GENERATION: {
        BASE_UTMI_PER_ITEM: 3,
        CREATIVITY_MULTIPLIER: 1.3,
        USAGE_BONUS_PER_VIEW: 0.05,
        BRAND_ALIGNMENT_BONUS: 4,
    },

    USER_INTERACTION: {
        FEEDBACK_SUBMISSION_UTMI: 2,
        CORRECTION_UTMI: 3,
        VALIDATION_UTMI: 1.5,
        SHARING_UTMI: 2.5,
        TRAINING_DATA_CONTRIBUTION_UTMI: 4,
        // Nouveau : Valorisation des sessions
        SESSION_START_UTMI: 1,
        SESSION_DURATION_UTMI_PER_MIN: 0.1,
    },

    CVNU: { // Contexte, Valeur, Connaissance, Unicité
        CVNU_VALUE_MULTIPLIER: 0.2, // Multiplicateur appliqué à la valeur CVNU de l'utilisateur
    },

    ECONOMIC_IMPACT: {
        REVENUE_GENERATION_FACTOR: 0.0001, // Multiplieur pour la génération de revenus
        COST_SAVING_FACTOR: 0.00008,     // Multiplieur pour les économies de coûts
        EFFICIENCY_GAIN_FACTOR: 0.00015, // Multiplieur pour le gain d'efficacité (par %)
        BUDGET_SURPLUS_BONUS_PER_MILLION: 0.05, // Bonus pour chaque million de surplus budgétaire
    },

    TAX_AI_SPECIFIC: {
        TAX_VAT: 1,
        TAX_TFA: 1,
        TAX_PRODUCTION: 1,
        TAX_CAMPAGN: 1,
        TAX_ADVICE_ACCURACY_BONUS: 10,
        COMPLIANCE_RISK_REDUCTION_UTMI: 15,
        OPTIMIZATION_OPPORTUNITY_UTMI: 20,
        UTMI_PER_TAX_AMOUNT_PROCESSED: 0.1 // UTMi généré par € de taxe traitée
    },

    COGNITIVE_AXES: { // Utmi par axe cognitif
        CONCENTRATION: 0.1, // Attention soutenue
        ADAPTATION: 0.15,   // Capacité à gérer l'incertitude
        IMAGINATION: 0.2,   // Génération d'idées nouvelles
        STRATEGY: 0.25,     // Planification et prise de décision
        ANALYSIS: 0.18,     // Décomposition et compréhension
        SYNTHESIS: 0.22,    // Combinaison d'éléments
        COMMUNICATION: 0.12 // Expression claire
    },

    LOG_TYPES: {
        PROMPT: 'prompt',
        AI_RESPONSE: 'ai_response',
        FINANCIAL_FLOW: 'financial_flow', // Nouveau type
        CVNU_ANALYSIS: 'cvnu_analysis', // Nouveau type
        CODE_GENERATION: 'code_generation',
        DOCUMENT_GENERATION: 'document_generation',
        MEDIA_GENERATION: 'media_generation',
        USER_INTERACTION: 'user_interaction',
        SYSTEM_PROCESS: 'system_process',
        SESSION_START: 'session_start',
        SESSION_END: 'session_end',
    },

    THEMATIC_MULTIPLIERS: {
        MARKETING: 1.2,
        AFFILIATION: 1.1,
        FISCAL_ECONOMIC: 1.5,
        OTHER: 1.0 // Multiplicateur par défaut
    },

    // Définition des termes clés pour la détection thématique
    THEMATIC_KEYWORDS: {
        MARKETING: ['marketing', 'publicité', 'campagne', 'vente', 'promotion', 'client', 'produit', 'marque', 'seo', 'sem', 'social media', 'croissance', 'visibilité'],
        AFFILIATION: ['affiliation', 'partenaire', 'commission', 'lien affilié', 'affilié', 'revenu passif', 'parrainage', 'parrain'],
        FISCAL_ECONOMIC: ['impôt', 'fiscalité', 'économie', 'finance', 'investissement', 'budget', 'déclaration', 'crédit', 'défiscalisation', 'amortissement', 'tva', 'bilan', 'comptabilité', 'audit', 'dividende', 'cryptomonnaie', 'bourse'],
    },

    // Activités courantes et leurs coefficients
    COMMON_ACTIVITIES: {
        DATA_ANALYSIS: { utmi_bonus: 5, keywords: ['analyse données', 'rapport', 'statistiques', 'tendances', 'modèle prédictif', 'big data'] },
        REPORT_GENERATION: { utmi_bonus: 7, keywords: ['rapport', 'compte-rendu', 'synthèse', 'document', 'bilan', 'présentation'] },
        CUSTOMER_SUPPORT: { utmi_bonus: 4, keywords: ['support client', 'aide', 'faq', 'problème', 'assistance', 'ticket'] },
        CONTENT_CREATION: { utmi_bonus: 6, keywords: ['contenu', 'article', 'blog', 'rédaction', 'écriture', 'création', 'post social', 'script'] },
        CODE_DEBUGGING: { utmi_bonus: 8, keywords: ['bug', 'erreur', 'débug', 'fix', 'correction code', 'dépannage'] },
        LEGAL_RESEARCH: { utmi_bonus: 9, keywords: ['légal', 'loi', 'réglementation', 'jurisprudence', 'contrat', 'conformité', 'directive'] },
        FINANCIAL_FORECASTING: { utmi_bonus: 10, keywords: ['prévision financière', 'budget', 'projection', 'cash flow', 'planification', 'trésorerie'] },
        PROJECT_MANAGEMENT: { utmi_bonus: 6, keywords: ['projet', 'planification', 'tâche', 'jalon', 'roadmap', 'gestion'] },
    },

    ACTIVITY_SCORE_THRESHOLDS: {
        LOW: 0.1,
        MEDIUM: 0.5,
        HIGH: 1.0
    },

    ACTIVITY_SCORE_BONUS: {
        LOW: 0.5,
        MEDIUM: 2,
        HIGH: 5
    },

    // Ces valeurs sont des exemples et doivent être mises à jour avec les prix réels de l'API Groq/OpenAI, etc.
    TOKEN_COSTS_PER_MODEL: {
        "llama3-8b-8192": { input: 0.0000005, output: 0.0000015 }, // Coût par token en USD
        "llama3-70b-8192": { input: 0.0000005, output: 0.0000015 },
        "deepseek-r1-distill-llama-70b": { input: 0.0000001, output: 0.0000001 },
        "gemma2-9b-it": { input: 0.0000001, output: 0.0000001 },
        // "gpt-4o": { input: 0.000005, output: 0.000015 },
        // "claude-3-opus-20240229": { input: 0.000015, output: 0.000075 },
        "default": { input: 0.0000001, output: 0.0000001 } // Coût par défaut si le modèle n'est pas trouvé
    },

    // Taux de conversion pour les devises (Exemple: 1 EUR = X USD)
    // Ces taux doivent être mis à jour régulièrement par un service externe dans un système réel.
    EXCHANGE_RATES: {
        USD: 1.07, // 1 EUR = 1.07 USD (au 25/06/2024)
        GBP: 0.84, // 1 EUR = 0.84 GBP (au 25/06/2024)
        EUR: 1.0   // Taux pour EUR
    }
};

// Fonctions utilitaires
function getSortedUtmiByValue(obj) {
    return Object.entries(obj)
        .filter(([, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([key, value]) => ({ name: key, utmi: parseFloat(value.toFixed(2)) }));
}

function getSortedActivitiesByCount(obj) {
    return Object.entries(obj)
        .filter(([, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([key, value]) => ({ name: key, count: value }));
}

/**
 * Convertit un montant d'une devise à une autre, en utilisant l'EUR comme pivot.
 * @param {number} amount - Le montant à convertir.
 * @param {string} fromCurrency - La devise d'origine (ex: 'USD', 'EUR').
 * @param {string} toCurrency - La devise cible (ex: 'EUR', 'GBP').
 * @returns {number} Le montant converti.
 */
function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    const rates = COEFFICIENTS.EXCHANGE_RATES;
    if (!rates[fromCurrency] || !rates[toCurrency]) {
        console.warn(`Taux de change non disponible pour ${fromCurrency} ou ${toCurrency}.`);
        return amount; // Retourne le montant original si les taux ne sont pas disponibles
    }
    // Convertir d'abord en EUR, puis en toCurrency
    const amountInEUR = amount / rates[fromCurrency];
    return amountInEUR * rates[toCurrency];
}

function detectCognitiveAxis(text) {
    const axesDetected = {};
    const lowerText = text.toLowerCase();
    for (const axis in COEFFICIENTS.COGNITIVE_AXES) {
        if (lowerText.includes(axis.toLowerCase())) {
            axesDetected[axis] = (axesDetected[axis] || 0) + 1;
        }
    }
    if (Object.keys(axesDetected).length === 0) {
        axesDetected.ANALYSIS = 1; // Par défaut si rien de spécifique n'est détecté
    }
    return axesDetected;
}

function analyzeTextForThemes(text) {
    const detectedThemes = {};
    const lowerText = text.toLowerCase();

    for (const theme in COEFFICIENTS.THEMATIC_KEYWORDS) {
        const keywords = COEFFICIENTS.THEMATIC_KEYWORDS[theme];
        for (const keyword of keywords) {
            if (lowerText.includes(keyword)) {
                detectedThemes[theme] = (detectedThemes[theme] || 0) + 1;
                break;
            }
        }
    }
    return detectedThemes;
}

function calculateActivityScore(text) {
    let score = 0;
    const detectedActivities = {};
    const lowerText = text.toLowerCase();

    for (const activityName in COEFFICIENTS.COMMON_ACTIVITIES) {
        const activity = COEFFICIENTS.COMMON_ACTIVITIES[activityName];
        let activityMatchCount = 0;
        for (const keyword of activity.keywords) {
            if (lowerText.includes(keyword)) {
                activityMatchCount++;
            }
        }
        if (activityMatchCount > 0) {
            detectedActivities[activityName] = activityMatchCount;
            score += activity.utmi_bonus * activityMatchCount;
        }
    }

    let bonus = 0;
    if (score > 0) {
        if (score >= COEFFICIENTS.ACTIVITY_SCORE_THRESHOLDS.HIGH) {
            bonus = COEFFICIENTS.ACTIVITY_SCORE_BONUS.HIGH;
        } else if (score >= COEFFICIENTS.ACTIVITY_SCORE_THRESHOLDS.MEDIUM) {
            bonus = COEFFICIENTS.ACTIVITY_SCORE_BONUS.MEDIUM;
        } else {
            bonus = COEFFICIENTS.ACTIVITY_SCORE_BONUS.LOW;
        }
    }
    return { score, detectedActivities, bonus };
}

/**
 * Calcule les Unités Temporelles Monétisables (UTMi) et les coûts estimés pour une interaction donnée.
 * @param {object} interaction - L'objet interaction (type, data).
 * 'data' doit contenir les informations spécifiques au type d'interaction,
 * par ex. { text, wordCount, tokenCount, modelId, relevance, etc. }
 * @param {object} context - Contexte supplémentaire incluant userCvnuValue, economicContext, etc.
 * @param {object} modelQualityScores - Les scores de qualité des modèles d'IA.
 * @returns {{utmi: number, estimatedCostUSD: number}} La valeur UTMi calculée et le coût estimé en USD.
 */
function calculateUtmi(interaction, context = {}, modelQualityScores = MODEL_QUALITY_SCORES) {
    let utmi = 0;
    let estimatedCostUSD = 0; // Coût estimé des services tiers (ex: tokens IA)

    const type = interaction.type;
    const data = interaction.data || {};
    const { userCvnuValue, economicContext } = context;

    const modelId = data.modelId;
    const modelScores = modelQualityScores[modelId] || modelQualityScores.default || {};
    const aiModelQualityMultiplier = modelScores.quality_multiplier || COEFFICIENTS.AI_RESPONSE.MODEL_QUALITY_MULTIPLIER_DEFAULT;

    const tokenCosts = COEFFICIENTS.TOKEN_COSTS_PER_MODEL[modelId] || COEFFICIENTS.TOKEN_COSTS_PER_MODEL.default;

    switch (type) {
        case COEFFICIENTS.LOG_TYPES.PROMPT:
            const wordCount = typeof data.wordCount === 'number' ? data.wordCount : 0;
            utmi += wordCount * COEFFICIENTS.PROMPT.BASE_UTMI_PER_WORD;
            utmi *= (data.complexityMultiplier || 1);
            utmi *= (data.impactMultiplier || 1);
            if (data.isUniqueConcept) utmi += COEFFICIENTS.PROMPT.UNIQUE_CONCEPT_BONUS;
            if (data.isFiscalEconomicTopic) utmi += COEFFICIENTS.PROMPT.FISCAL_ECONOMIC_TOPIC_BONUS;
            if (data.isMetierRelated) utmi += COEFFICIENTS.PROMPT.METIER_RELATED_PROMPT_BONUS;

            // Coût du prompt (tokens d'entrée)
            if (data.inputTokens && tokenCosts.input) {
                estimatedCostUSD += data.inputTokens * tokenCosts.input;
            }
            break;

        case COEFFICIENTS.LOG_TYPES.AI_RESPONSE:
            const tokenCount = typeof data.tokenCount === 'number' ? data.tokenCount : 0;
            let baseAiUtmi = tokenCount * COEFFICIENTS.AI_RESPONSE.BASE_UTMI_PER_TOKEN;

            if (data.relevance) baseAiUtmi *= COEFFICIENTS.AI_RESPONSE.RELEVANCE_MULTIPLIER;
            if (data.coherence) baseAiUtmi *= COEFFICIENTS.AI_RESPONSE.COHERENCE_MULTIPLIER;
            if (data.completeness) baseAiUtmi *= COEFFICIENTS.AI_RESPONSE.COMPLETENESS_MULTIPLIER;
            if (data.problemSolved) baseAiUtmi += COEFFICIENTS.AI_RESPONSE.PROBLEM_SOLVED_MICRO_BONUS;
            if (data.isFiscalEconomicInsight) baseAiUtmi += COEFFICIENTS.AI_RESPONSE.FISCAL_ECONOMIC_INSIGHT_BONUS;
            if (data.isMetierSpecificSolution) baseAiUtmi += COEFFICIENTS.AI_RESPONSE.METIER_SPECIFIC_SOLUTION_BONUS;

            // Appliquer les bonus de qualité spécifiques au modèle
            if (modelScores.response_relevance_bonus && data.relevance) {
                baseAiUtmi += COEFFICIENTS.AI_RESPONSE.BASE_UTMI_PER_TOKEN * tokenCount * modelScores.response_relevance_bonus;
            }
            if (modelScores.coherence_bonus && data.coherence) {
                baseAiUtmi += COEFFICIENTS.AI_RESPONSE.BASE_UTMI_PER_TOKEN * tokenCount * modelScores.coherence_bonus;
            }
            if (modelScores.problem_solving_capability && data.problemSolved) {
                baseAiUtmi += COEFFICIENTS.AI_RESPONSE.PROBLEM_SOLVED_MICRO_BONUS * modelScores.problem_solving_capability;
            }

            utmi = baseAiUtmi * aiModelQualityMultiplier; // Appliquer le multiplicateur global du modèle

            // Coût de la réponse (tokens de sortie)
            if (data.outputTokens && tokenCosts.output) {
                estimatedCostUSD += data.outputTokens * tokenCosts.output;
            }
            break;

        case COEFFICIENTS.LOG_TYPES.CODE_GENERATION:
            const lineCount = typeof data.lineCount === 'number' ? data.lineCount : 0;
            utmi += lineCount * COEFFICIENTS.CODE_GENERATION.BASE_UTMI_PER_LINE;
            utmi *= (data.complexityMultiplier || 1);
            if (data.reusability) utmi += COEFFICIENTS.CODE_GENERATION.REUSABILITY_BONUS;
            if (data.testCoverage) utmi += COEFFICIENTS.CODE_GENERATION.TEST_COVERAGE_BONUS;
            if (data.securityFix) utmi += COEFFICIENTS.CODE_GENERATION.SECURITY_FIX_BONUS;
            if (data.performanceImprovement) utmi += COEFFICIENTS.CODE_GENERATION.PERFORMANCE_IMPROVEMENT_BONUS;
            break;

        case COEFFICIENTS.LOG_TYPES.DOCUMENT_GENERATION:
            const pageCount = typeof data.pageCount === 'number' ? data.pageCount : 0;
            utmi += pageCount * COEFFICIENTS.DOCUMENT_GENERATION.BASE_UTMI_PER_PAGE;
            utmi *= (data.detailLevelMultiplier || 1);
            if (data.accuracy) utmi += COEFFICIENTS.DOCUMENT_GENERATION.ACCURACY_BONUS;
            if (data.legalCompliance) utmi += COEFFICIENTS.DOCUMENT_GENERATION.LEGAL_COMPLIANCE_BONUS;
            if (data.customization) utmi += COEFFICIENTS.DOCUMENT_GENERATION.CUSTOMIZATION_BONUS;
            break;

        case COEFFICIENTS.LOG_TYPES.MEDIA_GENERATION:
            const itemCount = typeof data.itemCount === 'number' ? data.itemCount : 0;
            utmi += itemCount * COEFFICIENTS.MEDIA_GENERATION.BASE_UTMI_PER_ITEM;
            utmi *= (data.creativityMultiplier || 1);
            if (data.usageViews && data.usageViews > 0) {
                utmi += data.usageViews * COEFFICIENTS.MEDIA_GENERATION.USAGE_BONUS_PER_VIEW;
            }
            if (data.brandAlignment) utmi += COEFFICIENTS.MEDIA_GENERATION.BRAND_ALIGNMENT_BONUS;
            break;

        case COEFFICIENTS.LOG_TYPES.USER_INTERACTION:
            if (data.feedbackSubmitted) utmi += COEFFICIENTS.USER_INTERACTION.FEEDBACK_SUBMISSION_UTMI;
            if (data.correctionProvided) utmi += COEFFICIENTS.USER_INTERACTION.CORRECTION_UTMI;
            if (data.validationPerformed) utmi += COEFFICIENTS.USER_INTERACTION.VALIDATION_UTMI;
            if (data.sharedContent) utmi += COEFFICIENTS.USER_INTERACTION.SHARING_UTMI;
            if (data.trainingDataContributed) utmi += COEFFICIENTS.USER_INTERACTION.TRAINING_DATA_CONTRIBUTION_UTMI;
            break;

        case COEFFICIENTS.LOG_TYPES.SESSION_START:
            utmi += COEFFICIENTS.USER_INTERACTION.SESSION_START_UTMI;
            break;

        case COEFFICIENTS.LOG_TYPES.SESSION_END:
            if (data.durationMinutes && data.durationMinutes > 0) {
                utmi += data.durationMinutes * COEFFICIENTS.USER_INTERACTION.SESSION_DURATION_UTMI_PER_MIN;
            }
            break;

        case COEFFICIENTS.LOG_TYPES.SYSTEM_PROCESS:
            if (data.computeTimeSeconds) {
                utmi += data.computeTimeSeconds * COEFFICIENTS.TIME_PER_SECOND_UTMI;
                utmi *= (data.criticalityMultiplier || 1);
            }
            break;
        case COEFFICIENTS.LOG_TYPES.FINANCIAL_FLOW:
            const amount = data.amount || 0;
            const taxAmount = data.taxAmount || 0;
            if (taxAmount > 0) {
                utmi += taxAmount * COEFFICIENTS.TAX_AI_SPECIFIC.UTMI_PER_TAX_AMOUNT_PROCESSED;
            }
            if (data.isBoycotted) {
                utmi *= 1.5; // Bonus pour une transaction avec une entité boycottée
            }
            break;

        case COEFFICIENTS.LOG_TYPES.CVNU_ANALYSIS:
            const cvContentLength = data.cvContentLength || 0;
            utmi += cvContentLength * 0.05; // Base UTMi par caractère
            utmi *= (1 + (data.complexity || 0)); // Multiplicateur de complexité
            break;

        default:
            console.warn(`Type d'interaction inconnu: ${type}`);
            return { utmi: 0, estimatedCostUSD: 0 };
    }

    // Appliquer les multiplicateurs CVNU (si l'utilisateur a une valeur CVNU)
    if (typeof userCvnuValue === 'number' && userCvnuValue > 0) {
        utmi *= (1 + userCvnuValue * COEFFICIENTS.CVNU.CVNU_VALUE_MULTIPLIER);
    }

    // Appliquer l'impact économique
    if (economicContext) {
        if (typeof economicContext.revenueGenerated === 'number' && economicContext.revenueGenerated > 0) {
            // Convertir le revenu généré dans la devise d'origine en USD pour le calcul
            const revenueInEUR = convertCurrency(economicContext.revenueGenerated, economicContext.currency || 'EUR', 'EUR'); // Convertir en EUR
            utmi += revenueInEUR * COEFFICIENTS.ECONOMIC_IMPACT.REVENUE_GENERATION_FACTOR;
        }
        if (typeof economicContext.costSaved === 'number' && economicContext.costSaved > 0) {
            const costSavedInEUR = convertCurrency(economicContext.costSaved, economicContext.currency || 'EUR', 'EUR'); // Convertir en EUR
            utmi += costSavedInEUR * COEFFICIENTS.ECONOMIC_IMPACT.COST_SAVING_FACTOR;
        }
        if (typeof economicContext.efficiencyGainPercentage === 'number' && economicContext.efficiencyGainPercentage > 0) {
            utmi += economicContext.efficiencyGainPercentage * COEFFICIENTS.ECONOMIC_IMPACT.EFFICIENCY_GAIN_FACTOR;
        }
        if (typeof economicContext.currentBudgetSurplus === 'number' && economicContext.currentBudgetSurplus > 0) {
            const surplusInMillionsEUR = convertCurrency(economicContext.currentBudgetSurplus, economicContext.currency || 'EUR', 'EUR') / 1000000;
            utmi *= (1 + surplusInMillionsEUR * COEFFICIENTS.ECONOMIC_IMPACT.BUDGET_SURPLUS_BONUS_PER_MILLION);
        }
    }

    // Détection thématique et application du multiplicateur
    const interactionText = data.text || '';
    const detectedThemes = analyzeTextForThemes(interactionText);
    let thematicMultiplier = COEFFICIENTS.THEMATIC_MULTIPLIERS.OTHER;
    if (detectedThemes.MARKETING) thematicMultiplier = Math.max(thematicMultiplier, COEFFICIENTS.THEMATIC_MULTIPLIERS.MARKETING);
    if (detectedThemes.AFFILIATION) thematicMultiplier = Math.max(thematicMultiplier, COEFFICIENTS.THEMATIC_MULTIPLIERS.AFFILIATION);
    if (detectedThemes.FISCAL_ECONOMIC) thematicMultiplier = Math.max(thematicMultiplier, COEFFICIENTS.THEMATIC_MULTIPLIERS.FISCAL_ECONOMIC);
    utmi *= thematicMultiplier;

    // Calcul et bonus du score d'activité
    const activityResult = calculateActivityScore(interactionText);
    utmi += activityResult.bonus;

    return { utmi: parseFloat(utmi.toFixed(2)), estimatedCostUSD: parseFloat(estimatedCostUSD.toFixed(6)) };
}


/**
 * Calcule les insights agrégés à partir d'une liste de logs d'interactions.
 * @param {Array<object>} logs - Tableau des logs d'interactions. Chaque log doit contenir au moins { interaction, utmi, estimatedCostUSD, timestamp }
 * @returns {object} Un objet contenant divers insights.
 */
function calculateDashboardInsights(logs) {
    let totalUtmi = 0;
    let totalInteractionCount = logs.length;
    let totalProcessingTime = 0; // Not consistently logged, but kept for completeness
    let totalConversationLengthTokens = 0; // Total tokens processed by AI
    let totalEstimatedCostUSD = 0;

    const utmiByCognitiveAxis = {};
    const utmiByType = {};
    const utmiByModel = {}; // UTMi par modèle d'IA
    const commonTopicsUtmi = {};
    const commonActivities = {};
    const thematicUtmi = { marketing: 0, affiliation: 0, fiscalEconomic: 0 };
    const costByModel = {}; // Coût réel par modèle d'IA
    const utmiPerCostRatioByModel = {}; // Ratio UTMi/Coût par modèle

    // Initialize cognitive axes to 0
    for (const axis in COEFFICIENTS.COGNITIVE_AXES) {
        utmiByCognitiveAxis[axis] = 0;
    }

    logs.forEach(log => {
        const utmiForLog = log.utmi || 0;
        const estimatedCostUSDForLog = log.estimatedCostUSD || 0;
        const interactionData = log.interaction?.data || {};
        const modelId = interactionData.modelId || 'unknown';

        totalUtmi += utmiForLog;
        totalEstimatedCostUSD += estimatedCostUSDForLog;

        //  Agrégation des taxes
        if (log.interaction?.type === COEFFICIENTS.LOG_TYPES.FINANCIAL_FLOW && log.interaction.data?.taxAmount) {
            totalTaxCollected += log.interaction.data.taxAmount;
            // Vous pouvez aussi agréger par type de taxe si votre log le précise
        }

        // Agrégation par type d'interaction
        const interactionType = log.interaction?.type;
        if (interactionType) {
            utmiByType[interactionType] = (utmiByType[interactionType] || 0) + utmiForLog;
        }

        // Agrégation par modèle d'IA
        if (modelId !== 'unknown' && utmiForLog > 0) {
            utmiByModel[modelId] = (utmiByModel[modelId] || 0) + utmiForLog;
            costByModel[modelId] = (costByModel[modelId] || 0) + estimatedCostUSDForLog;
        }

        // Détection et agrégation des thématiques
        const interactionText = interactionData.text || '';
        const detectedThemes = analyzeTextForThemes(interactionText);
        if (detectedThemes.MARKETING) thematicUtmi.marketing += utmiForLog;
        if (detectedThemes.AFFILIATION) thematicUtmi.affiliation += utmiForLog;
        if (detectedThemes.FISCAL_ECONOMIC) thematicUtmi.fiscalEconomic += utmiForLog;

        // Agrégation des axes cognitifs
        const detectedAxes = detectCognitiveAxis(interactionText);
        for (const axis in detectedAxes) {
            // Apply axis specific weight (COEFFICIENTS.COGNITIVE_AXES[axis])
            utmiByCognitiveAxis[axis] += utmiForLog * (COEFFICIENTS.COGNITIVE_AXES[axis] || 0);
        }

        // Agrégation des activités
        const activityResult = calculateActivityScore(interactionText);
        for (const activity in activityResult.detectedActivities) {
            commonActivities[activity] = (commonActivities[activity] || 0) + 1;
            commonTopicsUtmi[activity] = (commonTopicsUtmi[activity] || 0) + utmiForLog;
        }

        // Total tokens processed (for AI_RESPONSE and PROMPT)
        if (log.interaction?.type === COEFFICIENTS.LOG_TYPES.AI_RESPONSE && interactionData.outputTokens) {
            totalConversationLengthTokens += interactionData.outputTokens;
        } else if (log.interaction?.type === COEFFICIENTS.LOG_TYPES.PROMPT && interactionData.inputTokens) {
            totalConversationLengthTokens += interactionData.inputTokens;
        }


        // Agrégation du temps de traitement (si loggé)
        if (log.processingTimeSeconds) {
            totalProcessingTime += log.processingTimeSeconds;
        }
    });

    const averageUtmiPerInteraction = totalInteractionCount > 0 ? totalUtmi / totalInteractionCount : 0;
    const averageCostPerInteraction = totalInteractionCount > 0 ? totalEstimatedCostUSD / totalInteractionCount : 0;
    const totalUtmiPerCostRatio = totalEstimatedCostUSD > 0 ? totalUtmi / totalEstimatedCostUSD : (totalUtmi > 0 ? Infinity : 0);

    // Calcul du ratio UTMi/Coût par modèle
    for (const model in utmiByModel) {
        if (costByModel[model] > 0) {
            utmiPerCostRatioByModel[model] = parseFloat((utmiByModel[model] / costByModel[model]).toFixed(2));
        } else {
            utmiPerCostRatioByModel[model] = utmiByModel[model] > 0 ? Infinity : 0; // Infini si coût est 0 mais UTMi > 0
        }
    }

    // Conversion des totaux UTMi et coûts USD en EUR
    const totalUtmiEUR = convertCurrency(totalUtmi, 'EUR', 'EUR'); // UTMi est déjà en EUR conceptuellement
    const totalEstimatedCostEUR = convertCurrency(totalEstimatedCostUSD, 'USD', 'EUR');

    // Simulation d'une détection de sentiment très basique
    const sentimentSummary = { positive: 0.7, neutral: 0.2, negative: 0.1 }; // Placeholder

    return {
        totalUtmi: parseFloat(totalUtmi.toFixed(2)),
        totalEstimatedCostUSD: parseFloat(totalEstimatedCostUSD.toFixed(6)), // Coût total précis en USD
        totalUtmiEUR: parseFloat(totalUtmiEUR.toFixed(2)), // UTMi en EUR (même valeur que totalUtmi si 1 UTMi = 1 EUR)
        totalEstimatedCostEUR: parseFloat(totalEstimatedCostEUR.toFixed(2)), // Coût total précis en EUR
        totalInteractionCount: totalInteractionCount,
        totalProcessingTime: parseFloat(totalProcessingTime.toFixed(2)),
        totalConversationLengthTokens: parseFloat(totalConversationLengthTokens.toFixed(2)),
        averageUtmiPerInteraction: parseFloat(averageUtmiPerInteraction.toFixed(2)),
        averageCostPerInteraction: parseFloat(averageCostPerInteraction.toFixed(6)),
        sentimentSummary: sentimentSummary,
        utmiByCognitiveAxis: getSortedUtmiByValue(utmiByCognitiveAxis),
        utmiByType: getSortedUtmiByValue(utmiByType),
        utmiByModel: getSortedUtmiByValue(utmiByModel),
        thematicUtmi: {
            marketing: parseFloat(thematicUtmi.marketing.toFixed(2)),
            affiliation: parseFloat(thematicUtmi.affiliation.toFixed(2)),
            fiscalEconomic: parseFloat(thematicUtmi.fiscalEconomic.toFixed(2))
        },
        utmiPerCostRatioByModel: utmiPerCostRatioByModel, // Ratios par modèle
        totalUtmiPerCostRatio: parseFloat(totalUtmiPerCostRatio.toFixed(2)), // Ratio global
        mostValuableTopics: getSortedUtmiByValue(commonTopicsUtmi).slice(0, 5),
        mostCommonActivities: getSortedActivitiesByCount(commonActivities).slice(0, 5),
        exchangeRates: COEFFICIENTS.EXCHANGE_RATES, // Inclure les taux de change actuels
    };
}

// Exportation des fonctions et coefficients
module.exports = {
    calculateUtmi,
    calculateDashboardInsights,
    COEFFICIENTS,
    convertCurrency,
    detectCognitiveAxis,
    analyzeTextForThemes,
    calculateActivityScore
};