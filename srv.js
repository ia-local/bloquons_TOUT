// Fichier : serveur.js

const fs = require("fs/promises");
const express = require('express');
const path = require('path');
const Groq = require('groq-sdk');
const { v4: uuidv4 } = require('uuid');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const Web3 = require('web3');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const cvnuRouter = require('./routes/cvnu.js');
const reformeRouter = require('./routes/reforme.js');
const missionsRouter = require('./routes/quests.js');
const mapRouter = require('./routes/map-router.js');
const smartContractRouter = require('./routes/smartContract.js');
const ee = require('@google/earthengine');
const cors = require('cors');
const sassMiddleware = require('node-sass-middleware');
const operator = require('./server_modules/operator.js');
const { calculateDashboardInsights, calculateUtmi } = require('./server_modules/utms_calculator.js');
const reseauRouter = require('./routes/reseauRouter.js');
const journalRouter = require('./routes/journalRouter.js'); // Le routeur journal est déjà présent
const democratieRouter = require('./routes/democratie.js');
const telegramBot = require('./routes/telegramRouter.js');
const google = require('googleapis').google;
const writeQueue = Promise.resolve();
let isWriting = false;

// --- DÉFINITIONS ---
const AI_MODELS = {
    DEFAULT: 'llama-3.1-8b-instant',
    ENQUETEUR: 'gemma2-9b-it',
    AVOCAT: 'deepseek-r1-distill-llama-70b',
    CODING: 'gemma2-9b-it',
    SECRETARY: 'llama-3.1-8b-instant',
    GENERATOR: 'gemma2-9b-it'
};
const aiPersonas = {
    'generaliste': 'Tu es un assistant IA généraliste, utile et informatif. Tu es là pour aider l\'utilisateur dans le cadre du projet.',
    'enqueteur': 'Tu es un enquêteur IA spécialisé dans l\'analyse de dossiers de corruption. Ton ton est factuel, précis et basé sur des données. Tu as la persona d\'un enquêteur et tu réponds en te basant sur des faits.',
    'avocat': 'Tu es un avocat IA spécialisé dans la législation française. Tu réponds avec un ton formel et juridique, en citant des articles de loi ou des jurisprudences si nécessaire.',
    'assistant': 'Tu es un assistant IA de base. Tu aides l\'utilisateur à naviguer dans l\'application et tu réponds à des questions simples.',
    'codage': 'Tu es un assistant de codage IA. Tu génères du code, tu expliques des concepts de programmation et tu aides à déboguer. Ton ton est technique et précis.',
    'secretaire': 'Tu es une secrétaire IA. Tu aides à organiser des tâches, à rédiger des résumés et à gérer des informations. Ton ton est formel et efficace.',
    'generateur': 'Tu es un générateur IA. Tu crées du contenu sur demande, comme des articles, des descriptions ou des idées. Tu te concentres sur la génération créative et rapide.'
};

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const groq = new Groq({ apiKey: GROQ_API_KEY });
const app = express();
const port = process.env.PORT || 3000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
let chatHistory = [];
const CHAT_HISTORY_FILE = path.join(__dirname, 'data', 'chat_history.json');
const DATABASE_FILE_PATH = path.join(__dirname,'database.json');
const BOYCOTT_FILE_PATH = path.join(__dirname, 'data', 'boycott.json');
const RICS_FILE_PATH = path.join(__dirname, 'data', 'rics.json');
const STATS_FILE = path.join(__dirname, 'data', 'stats.json');
const SATELLITES_DATA_FILE = path.join(__dirname, 'data', 'satellites.json');
const LOG_FILE_PATH = path.join(__dirname, 'data', 'logs.json');

let database = {};
let boycottsData = {};
let ricsData = [];
let satellitesData = [];

// Définition des catégories de référence et de leurs textes
const CATEGORIES_TO_CLASSIFY = [
    { name: 'Manifestations & Actions', text: 'Rassemblement de personnes, grève, blocage, manifestation, opération de mobilisation' },
    { name: 'Lieux Stratégiques', text: 'Points de ronds-points, gares, aéroports, hôpitaux, universités, lieux de transport' },
    { name: 'Lieux Administratifs', text: 'Mairies, préfectures, bâtiments officiels, palais présidentiel' },
    { name: 'Secteurs d\'application', text: 'Agriculture, finance, banque, commerce, industrie, éducation, santé, télécommunications' },
    { name: 'Boycotts', text: 'Boycott d\'une enseigne, d\'une marque, d\'un produit' },
    { name: 'Surveillance & Réseaux', text: 'Caméras de surveillance, caméras fixes, agents de sécurité, tours de télécommunication, 5G' },
    { name: 'Organisations', text: 'Syndicats, partis politiques, associations' },
    { name: 'Pétitions', text: 'Pétitions en ligne, signatures, campagnes de soutien' },
    { name: 'Militants', text: 'Personnes, militants, citoyens, activistes, membres de l\'organisation' }
];

let categoryEmbeddings = [];

async function generateCategoryEmbeddings() {
    console.log("Génération des embeddings pour les catégories...");
    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
    const results = await Promise.all(
        CATEGORIES_TO_CLASSIFY.map(cat => 
            embeddingModel.embedContent({ 
                content: { parts: [{ text: cat.text }] }
            })
        )
    );
    categoryEmbeddings = results.map((res, i) => ({
        name: CATEGORIES_TO_CLASSIFY[i].name,
        embedding: res.embedding.values
    }));
    console.log("Embeddings des catégories générés et stockés.");
}

function cosineSimilarity(v1, v2) {
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    for (let i = 0; i < v1.length; i++) {
        dotProduct += v1[i] * v2[i];
        magnitude1 += v1[i] ** 2;
        magnitude2 += v2[i] ** 2;
    }
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    return dotProduct / (magnitude1 * magnitude2);
}


// Nouvelle route API pour la classification
app.post('/api/classify', async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Le texte est manquant.' });
    }
    try {
        const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
        const textEmbedding = (await embeddingModel.embedContent({ content: text })).embedding.values;
        let bestMatch = null;
        let highestSimilarity = -Infinity;
        categoryEmbeddings.forEach(category => {
            const similarity = cosineSimilarity(textEmbedding, category.embedding);
            if (similarity > highestSimilarity) {
                highestSimilarity = similarity;
                bestMatch = category.name;
            }
        });
        res.json({ classifiedCategory: bestMatch });
    } catch (error) {
        console.error('Erreur lors de la classification IA:', error);
        res.status(500).json({ error: 'Échec de la classification.' });
    }
});


// --- FONCTIONS UTILITAIRES ---
async function readJsonFile(filePath, defaultValue = {}) {
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
            return defaultValue;
        }
        console.error(`Erreur de lecture du fichier ${filePath}:`, error);
        return defaultValue;
    }
}
async function writeJsonFile(filePath, data) {
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Erreur d'écriture du fichier ${filePath}:`, error);
    }
}
async function initializeDatabase() {
    try {
        const data = await fs.readFile(DATABASE_FILE_PATH, { encoding: 'utf8' });
        database = JSON.parse(data);
        if (!database.missions) { database.missions = []; }
        if (!database.taxes) {
            database.taxes = [
                { id: "tax_tfa", name: "Taxe sur les Transactions Financières (TFA)", description: "Taxe sur les flux financiers et les mouvements de capitaux.", rate: 0.2, applicable_to: "financial_flows" },
                { id: "tax_production", name: "Taxe sur les Facteurs de Production", description: "Taxe basée sur les coûts de production des entreprises.", rate: 0.05, applicable_to: "company_data" },
                { id: "tax_vat", name: "Taxe sur la Valeur Ajoutée", description: "Modélisation de l'impact de la TVA sur les transactions.", rate: 0.2, applicable_to: "transactions" },
                { id: "tax_campaign", name: "Taxe sur les Excédents de Comptes de Campagne", description: "Taxe sur les excédents de financement des partis politiques, d'après les données de la CNCCFP.FR.", rate: 0.5, applicable_to: "campaign_finance" }
            ];
        }
        console.log('Base de données chargée avec succès.');
        if (!database.missions) { database.missions = []; await writeDatabaseFile(); }
        if (!database.democratie_posts) { database.democratie_posts = []; }
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn('Le fichier database.json n\'existe pas, initialisation de la base de données vide.');
            database = {
                financial_flows: [], affaires: { chronology: [] }, rics: [], taxes: [], boycotts: [], entities: [],
                caisse_manifestation: { solde: 0, transactions: [] }, blockchain: { transactions: [] }, polls: [],
                affaires: { chronology: [] },
                organizers: [], beneficiaries: [], cv_contracts: [], cameras_points: [], journal_posts: [], missions: [],
                taxes: [
                    { id: "tax_tfa", name: "Taxe sur les Transactions Financières (TFA)", description: "Taxe sur les flux financiers et les mouvements de capitaux.", rate: 0.2, applicable_to: "financial_flows" },
                    { id: "tax_production", name: "Taxe sur les Facteurs de Production", description: "Taxe basée sur les coûts de production des entreprises.", rate: 0.05, applicable_to: "company_data" },
                    { id: "tax_vat", name: "Taxe sur la Valeur Ajoutée", description: "Modélisation de l'impact de la TVA sur les transactions.", rate: 0.2, applicable_to: "transactions" },
                    { id: "tax_campaign", name: "Taxe sur les Excédents de Comptes de Campagne", description: "Taxe sur les excédents de financement des partis politiques, d'après les données de la CNCCFP.FR.", rate: 0.5, applicable_to: "campaign_finance" }
                ],
                rics: [],
                boycotts: [],
                entities: [],
                blockchain: { transactions: [] },
                polls: [],
                organizers: [],
                beneficiaries: [],
                cv_contracts: [],
                cameras_points: [],
                journal_posts: [],
                missions: [],
                democratie_posts: [],

            };
            await writeDatabaseFile();
        } else {
            console.error('Erreur fatale lors du chargement de database.json:', error);
            process.exit(1);
        }
    }
}
async function writeDatabaseFile() {
    return new Promise((resolve) => {
        writeQueue.then(async () => {
            if (isWriting) return;
            isWriting = true;
            try {
                await fs.writeFile(DATABASE_FILE_PATH, JSON.stringify(database, null, 2), { encoding: 'utf8' });
                resolve();
            } finally {
                isWriting = false;
            }
        });
    });
}
async function loadChatHistoryFile() {
    try {
        const data = await fs.readFile(CHAT_HISTORY_FILE, 'utf8');
        chatHistory = JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            chatHistory = [];
            await fs.writeFile(CHAT_HISTORY_FILE, '[]', 'utf8');
        } else { console.error('Erreur de lecture de l\'historique du chat:', error); }
    }
}
async function writeChatHistoryFile() {
    try { await fs.writeFile(CHAT_HISTORY_FILE, JSON.stringify(chatHistory, null, 2), 'utf8'); } catch (error) { console.error('Erreur d\'écriture de l\'historique du chat:', error); }
}
async function readRicsFile() {
    try {
        const data = await fs.readFile(RICS_FILE_PATH, { encoding: 'utf8' });
        ricsData = JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') { ricsData = []; await writeRicsFile(); } else { console.error('Erreur fatale lors du chargement de rics.json:', error); process.exit(1); }
    }
}
async function writeRicsFile() {
    try { await fs.writeFile(RICS_FILE_PATH, JSON.stringify(ricsData, null, 2), { encoding: 'utf8' }); } catch (error) { console.error('Erreur lors de l\'écriture de rics.json:', error); }
}
async function loadBoycottData() {
    try { boycottsData = await readJsonFile(BOYCOTT_FILE_PATH, { boycotts: [] }); } catch (error) { boycottsData = { boycotts: [] }; }
}
async function loadSatellitesData() {
    try { satellitesData = await readJsonFile(SATELLITES_DATA_FILE, []); } catch (error) { satellitesData = []; }
}
async function setupGoogleAuth() {
    const CLIENT_SECRET_FILE = './client-key.json';
    try {
        const credentials = require(CLIENT_SECRET_FILE);
        const { client_secret, client_id, redirect_uris } = credentials.web;
        oAuth2Client = new google.auth.OAuth2(client_id, client_id, redirect_uris[0]);
    } catch (error) {
        console.error('Erreur lors du chargement des identifiants client OAuth2:', error);
        process.exit(1);
    }
}
async function loadEarthEnginePrivateKey() {
    const EE_PRIVATE_KEY_PATH = './private-key.json';
    try {
        const privateKeyData = await fs.readFile(EE_PRIVATE_KEY_PATH, 'utf8');
        EE_PRIVATE_KEY = JSON.parse(privateKeyData);
    } catch (error) {
        console.error('Erreur lors du chargement de la clé privée Earth Engine:', error);
        process.exit(1);
    }
}
async function authenticateEarthEngine() {
    return new Promise((resolve, reject) => {
        ee.data.authenticateViaPrivateKey(
            EE_PRIVATE_KEY,
            () => { ee.initialize(null, null, resolve, reject); },
            (err) => { reject(err); }
        );
    });
}
async function getGroqChatResponse(promptInput, model, systemMessageContent) {
    try {
        const messages = [];
        if (systemMessageContent) { messages.push({ role: 'system', content: systemMessageContent }); }
        messages.push({ role: 'user', content: promptInput });
        const chatCompletion = await groq.chat.completions.create({ messages: messages, model: model, temperature: 0.7, max_tokens: 2048 });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error(`Erreur lors de la génération de la réponse IA (Groq model: ${model}):`, error);
        return 'Une erreur est survenue lors du traitement de votre demande. Veuillez réessayer plus tard.';
    }
}
function calculateTaxAmount(transaction, taxes) {
    let totalTax = 0;
    const applicableTaxes = taxes.filter(t => t.applicable_to === 'financial_flows');
    for (const tax of applicableTaxes) {
        if (tax.id === 'tax_vat' && transaction.isVatApplicable) {
            totalTax += transaction.amount * tax.rate;
        } else {
            totalTax += transaction.amount * tax.rate;
        }
    }
    return totalTax;
}

// --- MIDDLEWARES & ROUTES EXPRESS ---
app.use(express.json());
app.use(express.json({ limit: '50mb' })); 
app.use(cors());
app.use(sassMiddleware({
    src: path.join(__dirname, 'docs', 'src', 'css'),
    dest: path.join(__dirname, 'docs', 'src', 'scss'),
    debug: true,
    outputStyle: 'compressed',
    prefix: '/src/css'
}));
app.use(express.static(path.join(__dirname, 'docs')));
app.use('/output', express.static(path.join(__dirname, 'output')));
app.use('/roles', express.static(path.join(__dirname, 'docs', 'roles')));

// Montage des routeurs spécifiques
app.use('/journal', journalRouter);
app.use('/missions', missionsRouter);
app.use('/cvnu', cvnuRouter);
app.use('/map', mapRouter);
app.use('/reforme', reformeRouter);
app.use('/smartContract', smartContractRouter);
app.use('/democratie', democratieRouter);
app.use('/reseau', reseauRouter);
// Documentation Swagger
const swaggerDocumentPath = path.join(__dirname, 'api-docs', 'swagger.yaml');
let swaggerDocument = {};
try {
    swaggerDocument = YAML.load(swaggerDocumentPath);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
    console.error('Erreur lors du chargement de la documentation Swagger:', error);
}
// Le middleware statique doit être après vos routes d'API.
app.use(express.static(path.join(__dirname, 'docs')));

// Routes pour le Chatbot
app.get('/api/chat/history', (req, res) => { res.json(chatHistory); });
app.post('/api/chat/message', async (req, res) => {
    const { message, persona } = req.body;
    if (!message) { return res.status(400).json({ error: 'Message manquant.' }); }
    const userMessage = { id: uuidv4(), role: 'user', content: message, persona: 'vous', timestamp: new Date().toISOString() };
    chatHistory.push(userMessage);
    const systemMessage = aiPersonas[persona] || aiPersonas['generaliste'];
    const aiResponse = await groq.chat.completions.create({
        messages: [{ role: 'system', content: systemMessage }, { role: 'user', content: message }],
        model: 'gemma2-9b-it',
        temperature: 0.7
    });
    const aiMessage = { id: uuidv4(), role: 'ai', content: aiResponse.choices[0].message.content, persona: persona, timestamp: new Date().toISOString() };
    chatHistory.push(aiMessage);
    await writeChatHistoryFile();
    res.status(201).json(aiMessage);
});
app.put('/api/chat/message/:id', async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const message = chatHistory.find(m => m.id === id);
    if (!message) { return res.status(404).json({ error: 'Message non trouvé.' }); }
    message.content = content;
    await writeChatHistoryFile();
    res.json(message);
});
app.delete('/api/chat/message/:id', async (req, res) => {
    const { id } = req.params;
    const initialLength = chatHistory.length;
    chatHistory = chatHistory.filter(m => m.id !== id);
    if (chatHistory.length < initialLength) {
        await writeChatHistoryFile();
        res.status(204).send();
    } else { res.status(404).json({ error: 'Message non trouvé.' }); }
});

// Routes pour les tuiles GEE
app.get('/api/gee/tiles/:id', async (req, res) => {
    const satelliteId = req.params.id;
    const { bands, cloud_percentage } = req.query;
    const satellitesData = database.satellites;
    const satellite = satellitesData.find(s => s.id === satelliteId);
    if (!satellite) { return res.status(404).json({ error: 'Satellite non trouvé.' }); }
    const bandsArray = bands ? bands.split(',') : satellite.bands;
    try {
        const collection = ee.ImageCollection(satelliteId).filterDate('2025-01-01', '2025-09-17').filter(ee.Filter.lt(satellite.sort, parseFloat(cloud_percentage || 20)));
        const image = collection.mosaic().select(bandsArray);
        const visParams = { min: 0, max: 3000, bands: bandsArray };
        image.getMap(visParams, (mapId) => {
            if (mapId.error) { return res.status(500).json({ error: mapId.error }); }
            res.json({ mapid: mapId.mapid, token: mapId.token, satelliteName: satellite.name });
        });
    } catch (error) {
        res.status(500).json({ error: 'Échec de la génération des tuiles GEE.' });
    }
});

// Routes API pour le dashboard et les services
app.get('/api/dashboard/utmi-insights', async (req, res) => {
    try {
        const logsData = await fs.readFile(LOG_FILE_PATH, 'utf8');
        const logs = JSON.parse(logsData);
        const taxSummary = {};
        (database.taxes || []).forEach(tax => { taxSummary[tax.id] = { name: tax.name, utmi_value: 0 }; });
        logs.forEach(log => {
            if (log.type === 'FINANCIAL_FLOW' && log.data?.taxAmount) {
                const taxId = log.data.taxId || 'tax_vat';
                if (taxSummary[taxId]) {
                    const utmiValue = log.data.taxAmount * (database.taxes.find(t => t.id === taxId)?.utmi_per_euro || 0);
                    taxSummary[taxId].utmi_value += utmiValue;
                }
            }
        });
        const insights = calculateDashboardInsights(logs, database);
        insights.taxCollectionSummary = taxSummary;
        res.json(insights);
    } catch (error) { res.status(500).json({ error: 'Échec de la génération des insights UTMi.' }); }
});
app.get('/smartContract/api/dashboard-data', async (req, res) => {
    const db = await readDatabaseFile();
    const recettesFiscalesTotales = db.tresorerieCompteCampagne || 0;
    const depenses = db.citoyensSimules?.reduce((sum, citoyen) => sum + (citoyen.allocation || 0), 0) || 0;
    const distributionAllocation = db.citoyensSimules?.reduce((acc, citoyen) => {
        const tranche = Math.floor((citoyen.allocation || 0) / 1000) * 1000;
        acc[tranche] = (acc[tranche] || 0) + 1;
        return acc;
    }, {}) || {};
    res.json({
        totalRecettes: recettesFiscalesTotales,
        totalDepenses: depenses,
        recettesParSource: { TVA: recettesFiscalesTotales, Autres: 0 },
        nombreBeneficiaires: db.citoyensSimules?.length || 0,
        distributionAllocation,
        tresorerie: db.tresorerieCompteCampagne || 0,
    });
});
app.get('/api/operator/summary', async (req, res) => { try { const summary = await operator.generateSummary(); res.json({ summary }); } catch (error) { res.status(500).json({ error: 'Échec de la génération du résumé.' }); } });
app.get('/api/operator/plan', async (req, res) => { try { const plan = await operator.generateDevelopmentPlan(); res.json({ plan }); } catch (error) { res.status(500).json({ error: 'Échec de la génération du plan.' }); } });
app.post('/api/operator/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) { return res.status(400).json({ error: 'Message manquant.' }); }
    try { const aiResponse = await operator.getGroqChatResponse(message); res.json({ response: aiResponse }); } catch (error) { res.status(500).json({ error: 'Erreur lors de la communication avec l\'IA.' }); }
});
app.post('/api/boycotts/submit-ai-analysis', async (req, res) => {
    const { text, image } = req.body;
    if (!text && !image) { return res.status(400).json({ error: 'Un texte ou une image est requis pour l\'analyse.' }); }
    try {
        let aiPrompt;
        let aiResponse;
        if (text) {
            aiPrompt = `À partir de la phrase suivante, extrait les informations clés : le nom de l'enseigne, la ville, une description courte, et le type de commerce (parmi 'Distribution', 'Banque', 'Restauration', 'Habillement', 'Énergie'). Génère ensuite les coordonnées GPS précises (latitude et longitude) de la ville correspondante. Formatte ta réponse en un objet JSON, sans autre texte. Exemple: {"name": "Nom de l'enseigne", "city": "Nom de la ville", "lat": 48.8566, "lon": 2.3522, "type": "Distribution", "description": "Description de l'enseigne."}. Voici la phrase : "${text}"`;
            aiResponse = await groq.chat.completions.create({ messages: [{ role: 'user', content: aiPrompt }], model: 'gemma2-9b-it', temperature: 0.2, stream: false });
        } else if (image) {
            aiPrompt = `Analyse l'image du ticket de caisse et extrait le nom de l'enseigne, la ville et le montant total. Génère un objet JSON.`;
            aiResponse = await groq.chat.completions.create({
                messages: [{ role: 'user', content: [{ type: 'text', text: aiPrompt }, { type: 'image_url', image_url: { "url": image } }] }],
                model: "meta-llama/llama-4-scout-17b-16e-instruct",
                temperature: 0.2,
                stream: false
            });
        }
        const generatedJson = JSON.parse(aiResponse.choices[0].message.content);
        res.json(generatedJson);
    } catch (error) { res.status(500).json({ error: 'Échec de la génération des données via l\'IA.' }); }
});
app.get('/api/prefectures', (req, res) => { res.json(database.prefectures || []); });
app.get('/api/mairies', (req, res) => { res.json(database.mairies || []); });
app.get('/api/roundabout-points', (req, res) => { res.json(database.roundabout_points || []); });
app.get('/api/porte-points', (req, res) => { res.json(database.porte_points || []); });
app.get('/api/strategic-locations', (req, res) => { res.json(database.strategic_locations || []); });
app.get('/api/syndicats', (req, res) => { res.json(database.syndicats || []); });
app.get('/api/telecoms', (req, res) => { res.json(database.telecoms || []); });
app.get('/api/satellites', async (req, res) => { try { const satellitesData = await readJsonFile(SATELLITES_DATA_FILE, []); res.json(satellitesData); } catch (error) { res.status(500).json({ error: 'Échec du chargement des données satellitaires.' }); } });
app.get('/api/telegram-sites', (req, res) => { res.json(database.telegram_groups || []); });
app.get('/api/docs-cameras', async (req, res) => { res.json(database.cameras_points || []); });
app.get('/journal/api/journal/posts', async (req, res) => { res.json(database.journal_posts || []); });
app.post('/journal/api/journal/posts', async (req, res) => {
    const { title, content, media } = req.body;
    if (!title || !content || !media) { return res.status(400).json({ error: 'Titre, contenu ou média manquant.' }); }
    await readDatabaseFile();
    if (!database.journal_posts) { database.journal_posts = []; }
    const newPost = { id: uuidv4(), title: title, media: media, article: content, date: new Date().toISOString() };
    database.journal_posts.push(newPost);
    await writeDatabaseFile();
    res.status(201).json({ message: 'Article enregistré avec succès.', post: newPost });
});
app.get('/journal/api/journal/generate', async (req, res) => {
    const topic = req.query.topic;
    if (!topic) { return res.status(400).json({ error: 'Le paramètre "topic" est manquant.' }); }
    try {
        const titleResponse = await groq.chat.completions.create({ messages: [{ role: 'user', content: `Génère un titre d'article de journal sur le thème : ${topic}, percutant. Ta réponses doit contenir uniquement le titre et Faire moins de 10 mots.` }], model: 'gemma2-9b-it' });
        const title = titleResponse.choices[0].message.content;
        const contentResponse = await groq.chat.completions.create({ messages: [{ role: 'user', content: `Rédige un une chronique politique de journal sur pour le mouvement "bloquons TOUT" '${topic}'. Utilise un style formel et pertinent pour l'actualité citoyenne. Le contenu doit être formaté en HTML.` }], model: 'gemma2-9b-it' });
        const article = contentResponse.choices[0].message.content;
        let mediaUrl = 'https://ia-local.github.io/Manifest.910-2025/media/generated-image.jpg';
        if (genAI) {
            try {
                const imagePrompt = `Crée une image qui représente un concept clé de cet article de journal: '${title}'.`;
                const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
                const result = await model.generateContent(imagePrompt);
                const response = result.response;
                const parts = response.candidates[0].content.parts;
                for (const part of parts) { if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) { mediaUrl = `data:image/webp;base64,${part.inlineData.data}`; } }
            } catch (imageError) { console.error("Erreur lors de la génération de l'image:", imageError); }
        }
        const newPost = { id: uuidv4(), title: title, media: mediaUrl, article: article, date: new Date().toISOString() };
        res.json(newPost);
    } catch (error) { res.status(500).json({ error: 'Échec de la génération de l\'article.' }); }
});
app.post('/api/ai/generate-entity', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'La requête est vide.' });
    const aiPrompt = `À partir de la requête suivante, génère un objet JSON qui inclut le 'name' (nom), le 'type' (supermarché, banque, etc.), une 'description' et des coordonnées 'geo' (latitude et longitude) pour l'entité. Réponds uniquement avec l'objet JSON. Voici la requête: "${query}"`;
    try {
        const chatCompletion = await groq.chat.completions.create({ messages: [{ role: 'system', content: aiPrompt }, { role: 'user', content: query }], model: 'gemma2-9b-it', temperature: 0.1, stream: false });
        const responseContent = chatCompletion?.choices?.[0]?.message?.content;
        const jsonResponse = JSON.parse(responseContent);
        res.json(jsonResponse);
    } catch (error) { res.status(500).json({ error: 'Impossible de générer les données avec l\'IA.' }); }
});
app.post('/api/ai/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) { return res.status(400).json({ error: 'Message manquant.' }); }
    try { const aiResponse = await getGroqChatResponse(message, 'gemma2-9b-it', "Vous êtes un assistant utile et informatif pour un tableau de bord de manifestation. Vous répondez aux questions sur le mouvement."); res.json({ response: aiResponse }); } catch (error) { res.status(500).json({ error: 'Erreur lors de la communication avec l\'IA.' }); }
});
app.get('/api/financial-flows', (req, res) => res.json(database.financial_flows));
app.post('/api/financial-flows', async (req, res) => {
    const newFlow = { id: uuidv4(), ...req.body, timestamp: new Date().toISOString() };
    const isBoycotted = boycottsData.boycotts.some(boycott => boycott.name.toLowerCase() === newFlow.name.toLowerCase());
    const taxAmount = calculateTaxAmount(newFlow, database.taxes);
    const utmiResult = calculateUtmi({ type: 'financial_flow', data: { amount: newFlow.amount, isBoycotted, taxAmount } }, { userCvnuValue: 0.5 });
    newFlow.tax_amount = taxAmount;
    newFlow.utmi_value = utmiResult.utmi;
    if (isBoycotted) {
        const tvaAmount = newFlow.amount * (database.taxes.find(t => t.id === 'tax_vat')?.rate || 0);
        try {
            await fetch(`http://localhost:${port}/api/blockchain/recevoir-fonds`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: tvaAmount }) });
            newFlow.blockchain_status = 'TVA_AFFECTEE';
        } catch (error) { newFlow.blockchain_status = 'ECHEC_AFFECTATION'; }
    }
    database.financial_flows.push(newFlow);
    await writeDatabaseFile();
    res.status(201).json(newFlow);
});
app.put('/api/financial-flows/:id', async (req, res) => {
    const index = database.financial_flows.findIndex(f => f.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Flux non trouvé.' });
    database.financial_flows[index] = { ...database.financial_flows[index], ...req.body };
    await writeDatabaseFile();
    res.json(database.financial_flows[index]);
});
app.delete('/api/financial-flows/:id', async (req, res) => {
    const index = database.financial_flows.findIndex(f => f.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Flux non trouvé.' });
    database.financial_flows.splice(index, 1);
    await writeDatabaseFile();
    res.status(204).end();
});
app.get('/api/affaires', (req, res) => res.json(database.affaires));
app.post('/api/affaires/event', async (req, res) => {
    const newEvent = { id: uuidv4(), ...req.body };
    database.affaires.chronology.push(newEvent);
    await writeDatabaseFile();
    res.status(201).json(newEvent);
});
app.get('/api/rics', (req, res) => { res.json(ricsData); });
app.post('/api/rics', async (req, res) => {
    const { question, description, deadline, voteMethod, level, locations } = req.body;
    const newRic = { id: uuidv4(), question, description, deadline, voteMethod, level, locations, votes_for: 0, votes_against: 0, status: 'active' };
    ricsData.push(newRic);
    await writeRicsFile();
    res.status(201).json(newRic);
});
app.put('/api/rics/:id', async (req, res) => {
    const ricId = req.params.id;
    const { votes_for, votes_against } = req.body;
    const ric = ricsData.find(r => r.id === ricId);
    if (!ric) { return res.status(404).json({ error: 'Référendum non trouvé.' }); }
    if (typeof votes_for !== 'undefined') { ric.votes_for = votes_for; }
    if (typeof votes_against !== 'undefined') { ric.votes_against = votes_against; }
    await writeRicsFile();
    res.status(200).json(ric);
});
app.get('/api/taxes', (req, res) => res.json(database.taxes));
app.post('/api/taxes', async (req, res) => {
    const newTax = { id: uuidv4(), ...req.body };
    database.taxes.push(newTax);
    await writeDatabaseFile();
    res.status(201).json(newTax);
});
app.get('/api/entities', (req, res) => res.json(database.entities));
app.get('/api/boycotts', (req, res) => res.json(database.boycotts));
app.post('/api/boycotts', async (req, res) => {
    const newEntity = { id: `ent_${Date.now()}`, ...req.body };
    database.boycotts.push(newEntity);
    await writeDatabaseFile();
    res.status(201).json(newEntity);
});
app.put('/api/boycotts/:id', async (req, res) => {
    const { id } = req.params;
    const updatedEntity = req.body;
    const index = database.boycotts.findIndex(e => e.id === id);
    if (index !== -1) { database.boycotts[index] = { ...database.boycotts[index], ...updatedEntity }; await writeDatabaseFile(); res.json(database.boycotts[index]); } else { res.status(404).json({ message: "Entité non trouvée" }); }
});
app.delete('/api/boycotts/:id', async (req, res) => {
    const { id } = req.params;
    const initialLength = database.boycotts.length;
    database.boycotts = database.boycotts.filter(e => e.id !== id);
    if (database.boycotts.length < initialLength) { await writeDatabaseFile(); res.status(204).send(); } else { res.status(404).json({ message: "Entité non trouvée" }); }
});
app.get('/api/caisse-manifestation', (req, res) => res.json(database.caisse_manifestation));
app.post('/api/caisse-manifestation/transaction', async (req, res) => {
    const { type, montant, description } = req.body;
    const newTransaction = { id: uuidv4(), type, montant, description, date: new Date().toISOString() };
    database.caisse_manifestation.transactions.push(newTransaction);
    database.caisse_manifestation.solde += (type === 'entrée' ? montant : -montant);
    await writeDatabaseFile();
    res.status(201).json(newTransaction);
});
app.post('/api/blockchain/transaction', async (req, res) => {
    const newBlock = { id: uuidv4(), ...req.body, hash: '...', signature: '...', timestamp: new Date().toISOString() };
    database.blockchain.transactions.push(newBlock);
    await writeDatabaseFile();
    res.status(201).json(newBlock);
});
app.get('/api/dashboard/summary', (req, res) => {
    try {
        const totalTransactions = database.financial_flows?.length ?? 0;
        const activeAlerts = database.financial_flows?.filter(f => f.is_suspicious)?.length ?? 0;
        const riskyEntities = new Set(database.boycotts?.map(b => b.name))?.size ?? 0;
        const caisseSolde = database.caisse_manifestation?.solde ?? 0;
        const boycottCount = database.boycotts?.length ?? 0;
        const ricCount = database.rics?.length ?? 0;
        const beneficiaryCount = database.beneficiaries?.length ?? 0;
        const monthlyAllocation = beneficiaryCount > 0 ? (caisseSolde / beneficiaryCount) : 0;
        const prefectureCount = database.prefectures?.length ?? 0;
        const telegramGroupCount = database.telegram_groups?.length ?? 0;
        const mairiesCount = database.mairies?.length ?? 0;
        const roundaboutCount = database.roundabout_points?.length ?? 0;
        const carrefourCount = database.boycotts?.filter(b => b.name === 'Carrefour')?.length ?? 0;
        const universityCount = database.strategic_locations?.filter(l => l.type === 'Université')?.length ?? 0;
        const bankCount = database.boycotts?.filter(b => b.type === 'Banque')?.length ?? 0;
        const tvaCommerceCount = database.boycotts?.filter(b => b.tax_id === 'tax_vat')?.length ?? 0;
        let estimatedManifestantCount = 0;
        if (database.manifestation_points) {
            database.manifestation_points.forEach(point => {
                if (typeof point.count === 'number') { estimatedManifestantCount += point.count; } else if (typeof point.count === 'string') { const numberMatch = point.count.match(/\d+/); if (numberMatch) { estimatedManifestantCount += parseInt(numberMatch[0]); } else if (point.count.toLowerCase().includes('plusieurs milliers')) { estimatedManifestantCount += 2000; } } else if (typeof point.count === 'object' && point.count !== null) { for (const key in point.count) { if (typeof point.count[key] === 'number') { estimatedManifestantCount += point.count[key]; } } }
            });
        }
        res.json({ totalTransactions, activeAlerts, riskyEntities, caisseSolde, boycottCount, ricCount, beneficiaryCount, monthlyAllocation, prefectureCount, telegramGroupCount, estimatedManifestantCount, mairiesCount, roundaboutCount, universityCount, carrefourCount, bankCount, tvaCommerceCount });
    } catch (error) { res.status(500).json({ error: 'Erreur lors de la génération du résumé.' }); }
});
app.post('/api/blockchain/recevoir-fonds', async (req, res) => {
    const { amount } = req.body;
    if (!amount) { return res.status(400).json({ error: 'Montant manquant.' }); }
    database.blockchain.transactions.push({ id: uuidv4(), type: 'recevoirFonds', amount: amount, timestamp: new Date().toISOString() });
    database.caisse_manifestation.solde += amount;
    await writeDatabaseFile();
    res.status(200).json({ message: `Fonds de ${amount}€ reçus avec succès sur le smart contract (simulé).` });
});
app.post('/api/blockchain/decaisser-allocations', async (req, res) => { res.status(200).json({ message: 'Décaissement des allocations en cours...' }); });
app.post('/api/beneficiaries/register', async (req, res) => {
    const { name, email, cv_score } = req.body;
    if (!name || !email || cv_score === undefined) { return res.status(400).json({ error: 'Données manquantes pour l\'inscription.' }); }
    const existingBeneficiary = database.beneficiaries.find(b => b.email === email);
    if (existingBeneficiary) { return res.status(409).json({ error: 'Cet email est déjà enregistré.' }); }
    const newBeneficiary = { id: uuidv4(), name, email, cv_score: cv_score, registration_date: new Date().toISOString() };
    database.beneficiaries.push(newBeneficiary);
    await writeDatabaseFile();
    res.status(201).json({ message: 'Citoyen enregistré avec succès.', beneficiary: newBeneficiary });
});
app.get('/api/camera-points', (req, res) => res.json(database.cameras_points));
app.post('/api/camera-points', async (req, res) => {
    const { name, city, lat, lon, timestamp, video_link } = req.body;
    if (!name || !city || !lat || !lon) { return res.status(400).json({ error: 'Données manquantes pour le point de caméra.' }); }
    const newCameraPoint = { id: uuidv4(), name, city, lat, lon, timestamp: timestamp || new Date().toISOString(), video_link: video_link || null };
    database.cameras_points.push(newCameraPoint);
    await writeDatabaseFile();
    res.status(201).json(newCameraPoint);
});
app.get('/api/missions', (req, res) => { res.json(database.missions); });

// --- LANCEMENT DU SERVEUR ET DU BOT ---
initializeDatabase().then(() => {
    readRicsFile();
    loadBoycottData();
    loadChatHistoryFile();
    generateCategoryEmbeddings(); 
    // Le bot est lancé ici et est géré par telegramRouter.js
    telegramBot.launch();
    console.log('Bot Telegram démarré.');
    app.listen(port, () => {
        console.log(`Serveur d'enquête parlementaire démarré sur http://localhost:${port}`);
        console.log(`Documentation API Swagger UI disponible sur http://localhost:${port}/api-docs`);
    });
});