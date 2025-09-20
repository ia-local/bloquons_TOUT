const express = require('express');
const Groq = require('groq-sdk');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sassMiddleware = require('node-sass-middleware');

// Importation des modules de calcul UTMi et des scores de qualité des modèles
const { calculateUtmi, calculateDashboardInsights, COEFFICIENTS } = require('../server_modules/utms_calculator');
const { MODEL_QUALITY_SCORES } = require('../server_modules/model_quality_config');

// Modules spécifiques au générateur de CV
const { generateStructuredCvData, renderCvHtml } = require('../src/cv_processing');
const { generateProfessionalSummary } = require('../server_modules/cv_professional_analyzer');

// Création d'un routeur Express
const router = express.Router();

// --- Server and AI Configuration ---
const config = {
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: 'gemma2-9b-it',
    temperature: 0.7,
    maxTokens: 2048,
  },
  ai: {
    generalRole: "Un assistant IA expert en développement et en conseil technique.",
    generalContext: "Fournir des réponses précises, concises et utiles sur des sujets de programmation, d'architecture logicielle et de technologies web. Votre logique métier est d'être un conseiller technique fiable.",
    chatbotRole: "Un coach de carrière IA, expert en extraction de compétences et de savoir-faire pour la rédaction de CV.",
    chatbotContext: "Votre objectif est d'aider l'utilisateur à structurer son parcours professionnel. Posez des questions ciblées sur ses expériences, projets, compétences techniques (langages, outils, plateformes), défis rencontrés et solutions apportées, réalisations quantifiables, responsabilités et soft skills. Guidez-le pour qu'il exprime clairement ses aptitudes professionnelles.",
  },
  logFilePath: path.join(__dirname,'..', 'data','logs.json'),
  conversationsFilePath: path.join(__dirname, 'conversations.json'),
  lastStructuredCvFilePath: path.join(__dirname, 'data', 'last_structured_cv.json')
};

// Validate Groq API Key
if (!config.groq.apiKey) {
  console.error("❌ Erreur: La clé API Groq (GROQ_API_KEY) n'est pas configurée dans les variables d'environnement.");
}

const groq = new Groq({ apiKey: config.groq.apiKey });

// --- Global Log Management ---
const writeLog = (logEntry) => {
  const timestamp = new Date().toISOString();
  const log = { timestamp, ...logEntry };

  try {
    let logs = [];
    if (fs.existsSync(config.logFilePath)) {
      const data = fs.readFileSync(config.logFilePath, 'utf8');
      logs = JSON.parse(data.toString());
    }
    logs.push(log);
    fs.writeFileSync(config.logFilePath, JSON.stringify(logs, null, 2), 'utf8');
  } catch (error) {
    console.error("❌ Erreur lors de l'écriture du log dans logs.json:", error.message);
  }
};
// NOUVEAU: SCSS Middleware (déplacé ici pour être spécifique au routeur)
router.use(
    sassMiddleware({
        src: path.join(__dirname, 'docs'),
        dest: path.join(__dirname, 'docs'),
        debug: true,
        outputStyle: 'compressed',
        force: true
    })
);

// Initialize logs.json
if (!fs.existsSync(config.logFilePath)) {
  fs.writeFileSync(config.logFilePath, JSON.stringify([]));
  console.log(`➡️ Fichier de log créé : ${config.logFilePath}`);
} else {
  try {
    JSON.parse(fs.readFileSync(config.logFilePath, 'utf8').toString());
  } catch (parseError) {
    console.error(`⚠️ Fichier de log existant corrompu (${config.logFilePath}). Réinitialisation.`);
    fs.writeFileSync(config.logFilePath, JSON.stringify([]));
  }
}

// --- Conversation History Management (Shared) ---
let conversations = [];

const loadConversations = () => {
  if (fs.existsSync(config.conversationsFilePath)) {
    try {
      const data = fs.readFileSync(config.conversationsFilePath, 'utf8');
      conversations = JSON.parse(data);
      console.log(`➡️ Conversations historiques chargées depuis : ${config.conversationsFilePath}`);
    } catch (error) {
      console.error("❌ Erreur lors du chargement des conversations historiques:", error.message);
      conversations = [];
    }
  } else {
    fs.writeFileSync(config.conversationsFilePath, JSON.stringify([]));
    console.log(`➡️ Fichier d'historique des conversations créé: ${config.conversationsFilePath}`);
  }
};

const saveConversations = () => {
  fs.writeFile(config.conversationsFilePath, JSON.stringify(conversations, null, 2), (err) => {
    if (err) {
      console.error("❌ Erreur lors de l'écriture de l'historique des conversations:", err.message);
    }
  });
};

loadConversations();

// NOUVEAU: SCSS Middleware
router.use(
    sassMiddleware({
        src: path.join(__dirname, 'docs'),
        dest: path.join(__dirname, 'docs'),
        debug: true,
        outputStyle: 'compressed',
        force: true
    })
);

router.use(express.static(path.join(__dirname, 'docs')));

// --- API Endpoints ---
router.post('/api/generate', async (req, res) => {
  const userPrompt = req.body.prompt;
  const modelToUse = req.body.model || config.groq.model;

  if (!userPrompt) {
    writeLog({ type: 'ERROR', message: 'Prompt manquant', prompt: userPrompt });
    return res.status(400).json({ error: 'Le champ "prompt" est requis.' });
  }

  const requestStartTime = Date.now();
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: userPrompt }],
      model: modelToUse,
      temperature: config.groq.temperature,
      max_tokens: config.groq.maxTokens,
    });

    const aiResponseContent = chatCompletion.choices[0]?.message?.content;
    const processingTime = (Date.now() - requestStartTime) / 1000;
    const responseTokenCount = chatCompletion.usage?.output_tokens || Math.ceil(aiResponseContent?.length / 4);
    const promptTokenCount = chatCompletion.usage?.prompt_tokens || Math.ceil(userPrompt.length / 4);


    if (aiResponseContent) {
        const aiResponseInteractionData = {
            type: COEFFICIENTS.LOG_TYPES.AI_RESPONSE,
            data: {
                text: aiResponseContent,
                tokenCount: responseTokenCount,
                outputTokens: responseTokenCount,
                inputTokens: promptTokenCount,
                modelId: modelToUse,
                relevance: true,
                coherence: true,
                completeness: true,
                problemSolved: false,
                isFiscalEconomicInsight: aiResponseContent.toLowerCase().includes('fiscal') || aiResponseContent.toLowerCase().includes('économie'),
                isMetierSpecificSolution: false
            }
        };
        const aiResponseUtmiResult = calculateUtmi(aiResponseInteractionData, { userCvnuValue: 0.5 }, MODEL_QUALITY_SCORES);

        writeLog({
            type: 'AI_RESPONSE_PUNCTUAL',
            prompt: userPrompt,
            response: aiResponseContent,
            model: modelToUse,
            utmi: aiResponseUtmiResult.utmi,
            estimatedCost: aiResponseUtmiResult.estimatedCostUSD,
            processingTime: processingTime
        });

        res.status(200).json({ response: aiResponseContent, utmi: aiResponseUtmiResult.utmi, estimatedCost: aiResponseUtmiResult.estimatedCostUSD });

    } else {
        writeLog({ type: 'ERROR', message: 'Réponse IA vide', prompt: userPrompt, model: modelToUse });
        res.status(500).json({ error: "L'IA n'a pas pu générer de réponse." });
    }

  } catch (error) {
    console.error('Erreur lors de l\'appel à l\'API Groq (ponctuel):', error);
    if (error.response && error.response.status === 429) {
        res.status(429).json({ error: "Trop de requêtes. Veuillez patienter un instant avant de réessayer." });
    } else {
        const errorMessage = error.response && error.response.status >= 500
            ? "Le service Groq est actuellement indisponible. Veuillez réessayer plus tard."
            : error.message;

        writeLog({ type: 'ERROR', message: `Erreur API Groq (ponctuel): ${errorMessage}`, details: error.message, prompt: userPrompt, model: modelToUse, status: error.response?.status || 'N/A' });
        res.status(500).json({ error: `Une erreur interne est survenue lors de la communication avec l'IA: ${errorMessage}` });
    }
  }
});

router.get('/api/dashboard-insights', (req, res) => {
    fs.readFile(config.logFilePath, (err, data) => {
        if (err) {
            console.error("Erreur lecture logs pour insights:", err);
            return res.status(500).json({ error: "Impossible de lire les logs pour les insights." });
        }
        try {
            const logs = JSON.parse(data.toString());
            const insights = calculateDashboardInsights(logs);
            res.status(200).json(insights);
        } catch (parseError) {
            console.error("Erreur parsing logs pour insights:", parseError);
            res.status(500).json({ error: "Erreur de format des logs, impossible de générer les insights." });
        }
    });
});

router.get('/api/conversations', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const allConversationsSorted = conversations.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const paginatedConversations = allConversationsSorted.slice(startIndex, endIndex);
  const totalCount = allConversationsSorted.length;
  const totalPages = Math.ceil(totalCount / limit);

  writeLog({ type: 'CONVERSATION_HISTORY', action: 'READ_ALL', page, limit, count: paginatedConversations.length, totalCount });

  res.status(200).json({
    conversations: paginatedConversations.map(({ id, createdAt, title, utmi_total, estimated_cost_total_usd }) => ({ id, createdAt, title, utmi_total, estimated_cost_total_usd })),
    totalCount,
    totalPages,
    currentPage: page
  });
});

router.get('/api/conversations/:id', (req, res) => {
  const { id } = req.params;
  const conversation = conversations.find(conv => conv.id === id);
  if (conversation) {
    const userVisibleMessages = conversation.messages.filter(msg => msg.role !== 'system');
    res.status(200).json({ ...conversation, messages: userVisibleMessages });
  } else {
    res.status(404).json({ error: 'Conversation non trouvée.' });
  }
});

router.post('/api/conversations/new', (req, res) => {
  const newConversationId = uuidv4();
  const systemMessage = {
    role: "system",
    content: `${config.ai.chatbotRole} ${config.ai.chatbotContext}`
  };
  const initialMessages = [systemMessage];

  const sessionStartUtmiResult = calculateUtmi({ type: COEFFICIENTS.LOG_TYPES.SESSION_START }, { userCvnuValue: 0.5 }, MODEL_QUALITY_SCORES);

  const newConversation = {
    id: newConversationId,
    createdAt: new Date().toISOString(),
    messages: initialMessages,
    title: `Conversation ${new Date().toLocaleString()}`,
    utmi_total: sessionStartUtmiResult.utmi,
    estimated_cost_total_usd: sessionStartUtmiResult.estimatedCostUSD
  };
  conversations.push(newConversation);
  saveConversations();
  writeLog({
      type: 'CONVERSATION_MANAGEMENT',
      action: 'NEW_CONVERSATION',
      conversationId: newConversationId,
      utmi_generated: newConversation.utmi_total,
      estimated_cost_usd: newConversation.estimated_cost_total_usd
  });
  res.status(201).json(newConversation);
});

router.post('/api/conversations/:id/message', async (req, res) => {
  const { id } = req.params;
  const userMessageContent = req.body.message;
  const modelToUse = config.groq.model;

  if (!userMessageContent) {
    writeLog({ type: 'CONVERSATION_ERROR', action: 'SEND_MESSAGE_FAIL', reason: 'Missing message', conversationId: id });
    return res.status(400).json({ error: "Le champ 'message' est manquant dans le corps de la requête." });
  }

  const conversationIndex = conversations.findIndex(conv => conv.id === id);
  if (conversationIndex === -1) {
    writeLog({ type: 'CONVERSATION_ERROR', action: 'SEND_MESSAGE_FAIL', reason: 'Conversation non trouvée', conversationId: id });
    return res.status(404).json({ error: 'Conversation non trouvée.' });
  }

  const currentConversation = conversations[conversationIndex];

  const userPromptInteractionData = {
      type: COEFFICIENTS.LOG_TYPES.PROMPT,
      data: {
          text: userMessageContent,
          wordCount: userMessageContent.split(/\s+/).filter(word => word.length > 0).length,
          inputTokens: Math.ceil(userMessageContent.length / 4),
      }
  };
  const userUtmiResult = calculateUtmi(userPromptInteractionData, { userCvnuValue: 0.5 }, MODEL_QUALITY_SCORES);

  currentConversation.messages.push({
      role: 'user',
      content: userMessageContent,
      timestamp: new Date().toISOString(),
      utmi: userUtmiResult.utmi,
      estimated_cost_usd: userUtmiResult.estimatedCostUSD
  });
  currentConversation.utmi_total = (currentConversation.utmi_total || 0) + userUtmiResult.utmi;
  currentConversation.estimated_cost_total_usd = (currentConversation.estimated_cost_total_usd || 0) + userUtmiResult.estimatedCostUSD;

  writeLog({
      type: 'CONVERSATION_MESSAGE',
      action: 'USER_MESSAGE_SENT',
      conversationId: id,
      userMessage: userMessageContent.substring(0, 100) + '...',
      utmi: userUtmiResult.utmi,
      estimated_cost_usd: userUtmiResult.estimatedCostUSD,
      interaction: userPromptInteractionData
  });

  try {
    const messagesForGroq = currentConversation.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const chatCompletion = await groq.chat.completions.create({
      messages: messagesForGroq,
      model: modelToUse,
      temperature: config.groq.temperature,
      max_tokens: config.groq.maxTokens,
    });

    const aiResponseContent = chatCompletion.choices[0]?.message?.content;
    const responseTokenCount = chatCompletion.usage?.output_tokens || Math.ceil(aiResponseContent?.length / 4);
    const promptTokenCount = chatCompletion.usage?.prompt_tokens || Math.ceil(messagesForGroq.map(m => m.content).join('').length / 4);

    if (aiResponseContent) {
        const aiResponseInteractionData = {
            type: COEFFICIENTS.LOG_TYPES.AI_RESPONSE,
            data: {
                text: aiResponseContent,
                tokenCount: responseTokenCount,
                outputTokens: responseTokenCount,
                inputTokens: promptTokenCount,
                modelId: modelToUse,
                relevance: true,
                coherence: true,
                completeness: true,
                problemSolved: false,
                isFiscalEconomicInsight: aiResponseContent.toLowerCase().includes('fiscal') || aiResponseContent.toLowerCase().includes('économie'),
                isMetierSpecificSolution: false
            }
        };
        const aiUtmiResult = calculateUtmi(aiResponseInteractionData, { userCvnuValue: 0.5 }, MODEL_QUALITY_SCORES);

        currentConversation.messages.push({
            role: 'assistant',
            content: aiResponseContent,
            timestamp: new Date().toISOString(),
            utmi: aiUtmiResult.utmi,
            estimated_cost_usd: aiUtmiResult.estimatedCostUSD
        });
        currentConversation.utmi_total = (currentConversation.utmi_total || 0) + aiUtmiResult.utmi;
        currentConversation.estimated_cost_total_usd = (currentConversation.estimated_cost_total_usd || 0) + aiUtmiResult.estimatedCostUSD;

        saveConversations();

        writeLog({
            type: 'CONVERSATION_MESSAGE',
            action: 'AI_RESPONSE_RECEIVED',
            conversationId: id,
            aiResponse: aiResponseContent.substring(0, 100) + '...',
            utmi: aiUtmiResult.utmi,
            estimated_cost_usd: aiUtmiResult.estimatedCostUSD,
            interaction: aiResponseInteractionData
        });
        res.status(200).json({ aiResponse: aiResponseContent, utmi: aiUtmiResult.utmi, estimated_cost_usd: aiUtmiResult.estimatedCostUSD });
    } else {
      console.warn(`⚠️ Groq n'a pas généré de contenu pour la conversation ${id}.`);
      writeLog({ type: 'CONVERSATION_ERROR', action: 'AI_RESPONSE_EMPTY', conversationId: id });
      res.status(500).json({ error: "L'IA n'a pas pu générer de réponse." });
    }

  } catch (error) {
    console.error(`❌ Erreur lors de l'appel à l'API Groq pour la conversation ${id}:`, error);
    const errorMessage = error.response && error.response.status >= 500
        ? "Le service Groq est actuellement indisponible. Veuillez réessayer plus tard."
        : error.message;

    if (error.response && error.response.status === 429) {
        res.status(429).json({ error: "Trop de requêtes. Veuillez patienter un instant avant de réessayer." });
    } else {
        writeLog({
            type: 'CONVERSATION_ERROR',
            action: 'AI_API_ERROR',
            conversationId: id,
            errorMessage: `Erreur API Groq: ${errorMessage}`,
            stack: error.stack?.substring(0, 500) + '...' || 'N/A',
            status: error.response?.status || 'N/A'
        });
        res.status(500).json({ error: `Une erreur interne est survenue lors de la communication avec l'IA: ${errorMessage}` });
    }
  }
});

router.delete('/api/conversations/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = conversations.length;
  conversations = conversations.filter(conv => conv.id !== id);

  if (conversations.length < initialLength) {
    saveConversations();
    writeLog({ type: 'CONVERSATION_MANAGEMENT', action: 'CONVERSATION_DELETED', status: 'SUCCESS', conversationId: id });
    res.status(204).send();
  } else {
    writeLog({ type: 'CONVERSATION_MANAGEMENT', action: 'CONVERSATION_DELETED', status: 'NOT_FOUND', conversationId: id });
    res.status(404).json({ error: `Conversation avec l'ID ${id} non trouvée.` });
  }
});

router.post('/api/cv/parse-and-structure', async (req, res) => {
    const { cvContent } = req.body;
    if (!cvContent) {
        return res.status(400).json({ error: 'Le contenu du CV est manquant.' });
    }
    try {
        const structuredData = await generateStructuredCvData(cvContent);
        fs.writeFileSync(config.lastStructuredCvFilePath, JSON.stringify(structuredData, null, 2), 'utf8');
        writeLog({ type: 'CV_PROCESSING', action: 'PARSE_AND_STRUCTURE', status: 'SUCCESS', data: structuredData.nom || 'N/A' });
        res.status(200).json(structuredData);
    } catch (error) {
        console.error('Erreur lors du parsing et structuration du CV:', error);
        if (error.response && error.response.status === 429) {
            res.status(429).json({ error: "Trop de requêtes. Veuillez patienter un instant avant de réessayer de structurer le CV." });
        } else {
            const errorMessage = error.response && error.response.status >= 500
                ? "Le service Groq est actuellement indisponible. Veuillez réessayer plus tard."
                : error.message;

            writeLog({ type: 'CV_PROCESSING', action: 'PARSE_AND_STRUCTURE', status: 'ERROR', error: `Erreur API Groq: ${errorMessage}`, details: error.message, status_code: error.response?.status || 'N/A' });
            res.status(500).json({ error: `Échec de l'analyse et de la structuration du CV: ${errorMessage}`, details: error.message });
        }
    }
});

router.post('/api/cv/render-html', (req, res) => {
    const { cvData } = req.body;
    if (!cvData) {
        return res.status(400).json({ error: 'Les données structurées du CV sont manquantes.' });
    }
    try {
        const htmlContent = renderCvHtml(cvData);
        writeLog({ type: 'CV_PROCESSING', action: 'RENDER_HTML', status: 'SUCCESS', name: cvData.nom || 'N/A' });
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(htmlContent);
    } catch (error) {
        console.error('Erreur lors du rendu HTML du CV:', error);
        writeLog({ type: 'CV_PROCESSING', action: 'RENDER_HTML', status: 'ERROR', error: error.message });
        res.status(500).json({ error: 'Échec du rendu HTML du CV.', details: error.message });
    }
});

router.get('/api/cv/last-structured-data', (req, res) => {
    if (fs.existsSync(config.lastStructuredCvFilePath)) {
        try {
            const data = fs.readFileSync(config.lastStructuredCvFilePath, 'utf8');
            const structuredCv = JSON.parse(data);
            res.status(200).json(structuredCv);
        } catch (error) {
            console.error('Erreur lors de la lecture du dernier CV structuré:', error);
            res.status(500).json({ error: 'Impossible de lire les dernières données de CV structurées.', details: error.message });
        }
    } else {
        res.status(404).json({ error: 'Aucune donnée de CV structurée trouvée.' });
    }
});

router.post('/api/valorize-cv', async (req, res) => {
    const { cvContent } = req.body;

    if (!cvContent) {
        return res.status(400).json({ message: 'Contenu du CV manquant pour la valorisation.' });
    }

    try {
        const valorizedResult = await require('../src/groq_cv_analyse').valorizeSkillsWithGroq(cvContent);

        res.status(200).json({
            message: 'Compétences du CV valorisées avec succès.',
            valorization: valorizedResult
        });
    } catch (error) {
        console.error('Erreur lors de la valorisation du CV avec Groq (route /api/valorize-cv):', error);
        if (error.response && error.response.status === 429) {
            res.status(429).json({ error: "Trop de requêtes. Veuillez patienter un instant avant de réessayer." });
        } else {
            const errorMessage = error.response && error.response.status >= 500
                ? "Le service Groq est actuellement indisponible. Veuillez réessayer plus tard."
                : error.message;

            res.status(500).json({ message: `Erreur serveur lors de la valorisation du CV: ${errorMessage}`, error: error.message });
        }
    }
});

router.get('/api/conversations/:id/cv-professional-summary', async (req, res) => {
    const { id } = req.params;
    const conversation = conversations.find(conv => conv.id === id);

    if (!conversation) {
        return res.status(404).json({ error: 'Conversation non trouvée.' });
    }

    try {
        const professionalSummaryMarkdown = await generateProfessionalSummary(conversation.messages);

        res.setHeader('Content-Type', 'text/markdown');
        res.status(200).send(professionalSummaryMarkdown);

        writeLog({
            type: 'CV_GENERATION_FROM_CHAT',
            action: 'GENERATE_SUMMARY',
            status: 'SUCCESS',
            conversationId: id,
            summaryLength: professionalSummaryMarkdown.length
        });

    } catch (error) {
        console.error(`Erreur lors de la génération du résumé professionnel pour la conversation ${id}:`, error);
        if (error.response && error.response.status === 429) {
            res.status(429).json({ error: "Trop de requêtes. Veuillez patienter un instant avant de réessayer." });
        } else {
            const errorMessage = error.response && error.response.status >= 500
                ? "Le service Groq est actuellement indisponible. Veuillez réessayer plus tard."
                : error.message;

            writeLog({
                type: 'CV_GENERATION_FROM_CHAT',
                action: 'GENERATE_SUMMARY',
                status: 'ERROR',
                conversationId: id,
                error: `Erreur API Groq: ${errorMessage}`,
                details: error.message
            });
            res.status(500).json({ error: `Échec de la génération du résumé professionnel: ${errorMessage}`, details: error.message });
        }
    }
});

// Gestion des erreurs 404
router.use((req, res) => {
    res.status(404).send('Désolé, la page demandée ou l\'API n\'a pas été trouvée.');
});

// Exportation du routeur pour le serveur principal
module.exports = router;