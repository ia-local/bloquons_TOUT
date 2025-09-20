// Fichier : serveur.js

const fs = require("fs/promises");
const express = require('express');
const path = require('path');
const Groq = require('groq-sdk');
const { Telegraf, Markup } = require('telegraf');
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
const { calculateDashboardInsights } = require('./server_modules/utms_calculator.js');

// --- NOUVEAU: Importation du routeur Journal ---
const journalRouter = require('./routes/journal.js');
const democratieRouter = require('./routes/democratie.js');
// Clés API
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const groq = new Groq({ apiKey: GROQ_API_KEY });
const app = express();
const port = process.env.PORT || 3000;
const bot = new Telegraf('7219104241:AAFj0VdUM9nsfGImhBY3zdWAUog6EV3PtnE', {
    telegram: { webhookReply: true }
});
let chatLog = {};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Définissez le chemin vers votre fichier client_secret.json
const CLIENT_SECRET_FILE = './client-key.json';

// Créez un client OAuth2
let authClient;
let oAuth2Client;

async function setupGoogleAuth() {
    try {
        const credentials = require(CLIENT_SECRET_FILE);
        const { client_secret, client_id, redirect_uris } = credentials.web;
        oAuth2Client = new google.auth.OAuth2(
            client_id,
            client_secret,
            redirect_uris[0]
        );
        console.log('Client Google OAuth2 configuré avec succès.');
    } catch (error) {
        console.error('Erreur lors du chargement des identifiants client OAuth2:', error);
        process.exit(1);
    }
}

// Nouvelle route pour démarrer le processus d'authentification
app.get('/api/auth/google', (req, res) => {
    const scopes = [
        'https://www.googleapis.com/auth/cloud-platform'
        // Vous pouvez ajouter d'autres scopes GEE si nécessaire
    ];
    const url = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
    });
    res.redirect(url);
});

// Nouvelle route pour gérer la réponse de Google après l'authentification
app.get('/api/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        authClient = oAuth2Client;

        // Ici, vous pouvez sauvegarder les jetons dans une base de données sécurisée
        console.log('Authentification Google réussie et jetons obtenus.');
        res.send('Authentification réussie ! Vous pouvez fermer cette fenêtre.');
    } catch (error) {
        console.error('Échec de l\'authentification Google:', error);
        res.status(500).send('Échec de l\'authentification.');
    }
});

const EE_PRIVATE_KEY_PATH = './private-key.json';

let EE_PRIVATE_KEY = {};
// Fonction pour charger la clé privée GEE
async function loadEarthEnginePrivateKey() {
    try {
        const privateKeyData = await fs.readFile(EE_PRIVATE_KEY_PATH, 'utf8');
        EE_PRIVATE_KEY = JSON.parse(privateKeyData);
        console.log('Clé privée Earth Engine chargée avec succès.');
    } catch (error) {
        console.error('Erreur lors du chargement de la clé privée Earth Engine:', error);
        process.exit(1);
    }
}
// Fonction pour initialiser et s'authentifier auprès de l'API GEE
async function authenticateEarthEngine() {
    return new Promise((resolve, reject) => {
        ee.data.authenticateViaPrivateKey(
            EE_PRIVATE_KEY,
            () => {
                ee.initialize(null, null, resolve, reject);
                console.log('Authentification et initialisation de Google Earth Engine réussies.');
            },
            (err) => {
                console.error('Erreur d\'authentification de Google Earth Engine:', err);
                reject(err);
            }
        );
    });
}
// Nouvelle route API pour les tuiles GEE
app.get('/api/gee/tiles/:id', async (req, res) => {
    const satelliteId = req.params.id;
    const { bands, cloud_percentage } = req.query;

    const satellitesData = database.satellites;
    const satellite = satellitesData.find(s => s.id === satelliteId);

    if (!satellite) {
        return res.status(404).json({ error: 'Satellite non trouvé.' });
    }

    // Convertir les bandes en tableau
    const bandsArray = bands ? bands.split(',') : satellite.bands;

    try {
        // Sélectionner la collection d'images GEE
        const collection = ee.ImageCollection(satelliteId)
            .filterDate('2025-01-01', '2025-09-17') // Exemple de filtre de date
            .filter(ee.Filter.lt(satellite.sort, parseFloat(cloud_percentage || 20))); // Filtrer par pourcentage de nuages

        const image = collection.mosaic().select(bandsArray);
        const visParams = {
            min: 0,
            max: 3000, // Ajustez en fonction des bandes
            bands: bandsArray
        };

        image.getMap(visParams, (mapId) => {
            if (mapId.error) {
                return res.status(500).json({ error: mapId.error });
            }
            res.json({
                mapid: mapId.mapid,
                token: mapId.token,
                satelliteName: satellite.name
            });
        });

    } catch (error) {
        console.error('Erreur lors de la génération des tuiles GEE:', error);
        res.status(500).json({ error: 'Échec de la génération des tuiles GEE.' });
    }
});

app.use(express.json());
app.use(cors());

app.use(
  sassMiddleware({
    src: path.join(__dirname, 'public', 'src', 'css'),
    dest: path.join(__dirname, 'public', 'src', 'css'),
    debug: true,
    outputStyle: 'compressed',
    prefix: '/src/css'
  })
);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/roles', express.static(path.join(__dirname, 'docs', 'roles')));

let rolesSystem = { system: { content: "Vous êtes un assistant IA généraliste." } };
let rolesAssistant = { assistant: { content: "Je suis un assistant IA utile et informatif." } };
let rolesUser = { user: { content: "Je suis un utilisateur." } };

// Montez les routeurs
app.use('/missions', missionsRouter);
app.use('/journal', journalRouter);
app.use('/cvnu', cvnuRouter);
app.use('/map', mapRouter);
app.use('/reforme', reformeRouter);
app.use('/smartContract', smartContractRouter);
app.use('/democratie', democratieRouter);

const STATS_FILE = path.join(__dirname, 'data', 'stats.json');
const SATELLITES_DATA_FILE = path.join(__dirname, 'data', 'satellites.json');
const LOG_FILE_PATH = path.join(__dirname, 'data', 'logs.json'); // <-- CORRIGÉ : Ajout du chemin des logs

const ORGANIZER_GROUP_ID = "https://ia-local.github.io/Manifest.910-2025"; 

// --- Routes pour le UTMS dans le dashboard ---
// --- Fonctions utilitaires de calcul de la TVA et d'UTMi pour les transactions ---
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
// NOUVELLE ROUTE API : Insights pour le tableau de bord
// Nouvelle route API pour les insights du tableau de bord
// --- Routes pour le UTMS dans le dashboard ---
app.get('/api/dashboard/utmi-insights', async (req, res) => {
    try {
        const logsData = await fs.readFile(LOG_FILE_PATH, 'utf8');
        const logs = JSON.parse(logsData);
        
        const taxSummary = {};
        (database.taxes || []).forEach(tax => {
            taxSummary[tax.id] = { name: tax.name, utmi_value: 0 };
        });

        logs.forEach(log => {
            if (log.type === 'FINANCIAL_FLOW' && log.data?.taxAmount) {
                const taxId = log.data.taxId || 'tax_vat';
                if (taxSummary[taxId]) {
                    const utmiValue = log.data.taxAmount * (database.taxes.find(t => t.id === taxId)?.utmi_per_euro || 0); // Utilisation d'une nouvelle propriété pour un calcul plus précis
                    taxSummary[taxId].utmi_value += utmiValue;
                }
            }
        });
        
        const insights = calculateDashboardInsights(logs, database); 
        insights.taxCollectionSummary = taxSummary;

        res.json(insights);

    } catch (error) {
        console.error('Erreur lors de la génération des insights du tableau de bord:', error);
        res.status(500).json({ error: 'Échec de la génération des insights UTMi.' });
    }
});

// --- Routes pour l'opérateur IA ---
// This is the route you're trying to reach from the client
app.get('/smartContract/api/dashboard-data', async (req, res) => {
    // This is the logic you had in smartContract.js, but it's now in the main server file
    // The correct way to handle this is to define the route in smartContractRouter
    // and call it from the client with the correct path.
    // Let's assume you want to move the logic from smartContract.js into this route.
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

// --- Routes pour l'opérateur IA ---
// --- NOUVELLES ROUTES POUR L'OPÉRATEUR IA ---
app.get('/api/operator/summary', async (req, res) => {
    try {
        const summary = await operator.generateSummary();
        res.json({ summary });
    } catch (error) {
        res.status(500).json({ error: 'Échec de la génération du résumé.' });
    }
});

app.get('/api/operator/plan', async (req, res) => {
    try {
        const plan = await operator.generateDevelopmentPlan();
        res.json({ plan });
    } catch (error) {
        res.status(500).json({ error: 'Échec de la génération du plan.' });
    }
});
app.post('/api/operator/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message manquant.' });
    }
    try {
        const aiResponse = await operator.getGroqChatResponse(message);
        res.json({ response: aiResponse });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la communication avec l\'IA.' });
    }
});
// --- NOUVELLE ROUTE API POUR LE FORMULAIRE DE BOYCOTTAGE AVEC IA ---
app.post('/api/boycotts/submit-ai-analysis', async (req, res) => {
    const { text, image } = req.body;
    if (!text && !image) {
        return res.status(400).json({ error: 'Un texte ou une image est requis pour l\'analyse.' });
    }

    try {
        let aiResponse;
        let aiPrompt;

        if (text) {
            // Logique pour le traitement du texte avec l'IA
            aiPrompt = `À partir de la phrase suivante, extrait les informations clés : le nom de l'enseigne, la ville, une description courte, et le type de commerce (parmi 'Distribution', 'Banque', 'Restauration', 'Habillement', 'Énergie'). Génère ensuite les coordonnées GPS précises (latitude et longitude) de la ville correspondante. Formatte ta réponse en un objet JSON, sans autre texte. Exemple: {"name": "Nom de l'enseigne", "city": "Nom de la ville", "lat": 48.8566, "lon": 2.3522, "type": "Distribution", "description": "Description de l'enseigne."}. Voici la phrase : "${text}"`;
            aiResponse = await groq.chat.completions.create({
                messages: [{ role: 'user', content: aiPrompt }],
                model: 'gemma2-9b-it',
                temperature: 0.2,
                stream: false
            });
            const generatedJson = JSON.parse(aiResponse.choices[0].message.content);
            res.json(generatedJson);
        } else if (image) {
            // Logique de traitement d'image (à implémenter)
            aiPrompt = `Analyse l'image du ticket de caisse et extrait le nom de l'enseigne, la ville et le montant total. Génère un objet JSON.`;
            aiResponse = await groq.chat.completions.create({
                messages: [{
                    role: 'user',
                    content: [{
                        type: 'text',
                        text: aiPrompt
                    }, {
                        type: 'image_url',
                        image_url: {
                            "url": image
                        }
                    }]
                }],
                model: "meta-llama/llama-4-scout-17b-16e-instruct",
                temperature: 0.2,
                stream: false
            });
            const generatedJson = JSON.parse(aiResponse.choices[0].message.content);
            res.json(generatedJson);
        }

    } catch (error) {
        console.error('Erreur lors de la génération IA pour le formulaire:', error);
        res.status(500).json({ error: 'Échec de la génération des données via l\'IA.' });
    }
});
// --- FIN NOUVELLE ROUTE API ---
app.get('/api/prefectures', (req, res) => {
    res.json(database.prefectures || []);
});
app.get('/api/mairies', (req, res) => {
    res.json(database.mairies || []);
});
app.get('/api/roundabout-points', (req, res) => {
    res.json(database.roundabout_points || []);
});
app.get('/api/porte-points', (req, res) => {
    res.json(database.porte_points || []);
});
app.get('/api/strategic-locations', (req, res) => {
    res.json(database.strategic_locations || []);
});
app.get('/api/syndicats', (req, res) => {
    res.json(database.syndicats || []);
});
app.get('/api/telecoms', (req, res) => {
    res.json(database.telecoms || []);
});
app.get('/api/satellites', async (req, res) => {
    try {
        const satellitesData = await readJsonFile(SATELLITES_DATA_FILE, []);
        res.json(satellitesData);
    } catch (error) {
        console.error('Erreur lors de la lecture des données satellitaires:', error);
        res.status(500).json({ error: 'Échec du chargement des données satellitaires.' });
    }
});

app.get('/api/telegram-sites', (req, res) => { res.json(database.telegram_groups || []); });

const swaggerDocumentPath = path.join(__dirname, 'api-docs', 'swagger.yaml');
let swaggerDocument = {};
try {
    swaggerDocument = YAML.load(swaggerDocumentPath);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
    console.error('Erreur lors du chargement de la documentation Swagger:', error);
}

const DATABASE_FILE_PATH = path.join(__dirname,'data', 'database.json');
const BOYCOTT_FILE_PATH = path.join(__dirname, 'data','boycott.json');
let database = {};
let boycottsData = {};
let satellitesData = [];

async function writeDatabaseFile() {
    writeQueue = writeQueue.then(async () => {
        if (isWriting) return;
        isWriting = true;
        try {
            console.log('Début de l\'écriture de database.json...');
            await fs.writeFile(DATABASE_FILE_PATH, JSON.stringify(database, null, 2), { encoding: 'utf8' });
            console.log('Écriture de database.json terminée avec succès.');
        } catch (error) {
            console.error('Erreur lors de l\'écriture de database.json:', error);
        } finally {
            isWriting = false;
        }
    });
    return writeQueue;
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
        if (!database.missions) {
            database.missions = [];
            await writeDatabaseFile();
        }
        if (!database.democratie_posts) {
            database.democratie_posts = [];
        }
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
                democratie_posts: [], // --- NOUVEAU: Ajouter le tableau pour les posts de démocratie ---

            };
            await writeDatabaseFile();
            await loadEarthEnginePrivateKey();
            await authenticateEarthEngine();
        } else {
            console.error('Erreur fatale lors du chargement de database.json:', error);
            process.exit(1);
        }
    }
}

async function readJsonFile(filePath, defaultValue = {}) {
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`Le fichier ${filePath} n'existe pas. Création d'un fichier vide/par défaut.`);
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

async function loadBoycottData() {
    try {
        boycottsData = await readJsonFile(BOYCOTT_FILE_PATH, { boycotts: [] });
        console.log('Données de boycottage chargées avec succès.');
    } catch (error) {
        console.error('Erreur lors du chargement de boycott.json:', error);
        boycottsData = { boycotts: [] };
    }
}
async function loadSatellitesData() {
    try {
        satellitesData = await readJsonFile(SATELLITES_DATA_FILE, []);
        console.log('Données satellitaires chargées avec succès.');
    } catch (error) {
        console.error('Erreur lors du chargement de satellites.json:', error);
        satellitesData = [];
    }
}
app.get('/api/public-cameras', async (req, res) => {
    const cameraPoints = database.cameras_points || [];
    res.json(cameraPoints);
});

// --- Remplacement des anciennes routes de blog par les routes journal ---
app.get('/journal/api/journal/posts', async (req, res) => { res.json(database.journal_posts || []); });
app.post('/journal/api/journal/posts', async (req, res) => {
    const { title, content, media } = req.body;
    if (!title || !content || !media) {
        return res.status(400).json({ error: 'Titre, contenu ou média manquant.' });
    }
    
    await readDatabase();
    if (!database.journal_posts) {
        database.journal_posts = [];
    }
    
    const newPost = {
        id: uuidv4(),
        title: title,
        media: media,
        article: content,
        date: new Date().toISOString()
    };
    
    database.journal_posts.push(newPost);
    await writeDatabase();
    
    res.status(201).json({ message: 'Article enregistré avec succès.', post: newPost });
});

// --- Ajout de la route pour la génération IA depuis journal.js ---
app.get('/journal/api/journal/generate', async (req, res) => {
    const topic = req.query.topic;
    if (!topic) {
        return res.status(400).json({ error: 'Le paramètre "topic" est manquant.' });
    }
    try {
        // Logique de génération de contenu avec l'IA
        const titleResponse = await groq.chat.completions.create({
            messages: [{ role: 'user', content: `Génère un titre d'article de journal sur le thème : ${topic}, percutant. T'as réponses doit contenir uniquement le titre et Faire moins de 10 mots.` }],
            model: 'gemma2-9b-it'
        });
        const title = titleResponse.choices[0].message.content;

        const contentResponse = await groq.chat.completions.create({
            messages: [{ role: 'user', content: `Rédige un une chronique politique de journal sur pour le mouvement "bloquons TOUT" '${topic}'. Utilise un style formel et pertinent pour l'actualité citoyenne. Le contenu doit être formaté en HTML.` }],
            model: 'gemma2-9b-it'
        });
        const article = contentResponse.choices[0].message.content;

        let mediaUrl = 'https://ia-local.github.io/Manifest.910-2025/media/generated-image.jpg'; // Image par défaut

        if (genAI) {
            try {
                const imagePrompt = `Crée une image qui représente un concept clé de cet article de journal: '${title}'.`;
                const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
                const result = await model.generateContent(imagePrompt);
                const response = result.response;
                const parts = response.candidates[0].content.parts;
                for (const part of parts) {
                    if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                        mediaUrl = `data:image/webp;base64,${part.inlineData.data}`;
                    }
                }
            } catch (imageError) {
                console.error("Erreur lors de la génération de l'image:", imageError);
            }
        }

        const newPost = {
            id: uuidv4(),
            title: title,
            media: mediaUrl,
            article: article,
            date: new Date().toISOString()
        };
        
        res.json(newPost);

    } catch (error) {
        console.error('Erreur lors de la génération du contenu du journal:', error);
        res.status(500).json({ error: 'Échec de la génération de l\'article.' });
    }
});


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
async function getLlmResponse(userMessage, role, conversationHistory) {
    const systemPrompt = `Tu es un assistant IA spécialisé dans l'analyse de dossiers de corruption, de blanchiment d'argent, d'évasion fiscale et de prise illégale d'intérêts. Tu as accès à une base de données de l'enquête parlementaire française. L'enquête se concentre sur les actions de hauts fonctionnaires d'État entre 2017 et 2027. Tu peux prendre plusieurs rôles en fonction des requêtes de l'utilisateur. Ton ton doit être factuel, précis, et basé sur les données de l'enquête. Les rôles possibles sont : Enquêteur, Journaliste, Avocat et Juge. Le rôle actuel est: ${role}.`;
    const chatHistory = conversationHistory.map(item => ({ role: item.role === 'user' ? 'user' : 'assistant', content: item.message }));
    chatHistory.push({ role: 'user', content: userMessage });
    try {
        const chatCompletion = await groq.chat.completions.create({ messages: [{ role: 'system', content: systemPrompt }, ...chatHistory], model: 'gemma2-9b-it', stream: false });
        if (chatCompletion?.choices?.[0]?.message?.content) { return chatCompletion.choices[0].message.content; } else { return 'Aucune réponse générée par l\'IA.'; }
    } catch (error) {
        console.error('Erreur lors de l\'appel à Groq:', error);
        return 'Une erreur est survenue lors de la communication avec l\'IA.';
    }
}
app.post('/api/ai/generate-entity', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'La requête est vide.' });
    const aiPrompt = `À partir de la requête suivante, génère un objet JSON qui inclut le 'name' (nom), le 'type' (supermarché, banque, etc.), une 'description' et des coordonnées 'geo' (latitude et longitude) pour l'entité. Réponds uniquement avec l'objet JSON. Voici la requête: "${query}"`;
    try {
        const chatCompletion = await groq.chat.completions.create({ messages: [{ role: 'system', content: aiPrompt }, { role: 'user', content: query }], model: 'gemma2-9b-it', temperature: 0.1, stream: false });
        const responseContent = chatCompletion?.choices?.[0]?.message?.content;
        const jsonResponse = JSON.parse(responseContent);
        res.json(jsonResponse);
    } catch (error) {
        console.error('Erreur lors de la génération IA:', error);
        res.status(500).json({ error: 'Impossible de générer les données avec l\'IA.' });
    }
});
app.post('/api/ai/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) { return res.status(400).json({ error: 'Message manquant.' }); }
    try {
        const aiResponse = await getGroqChatResponse(message, 'gemma2-9b-it', "Vous êtes un assistant utile et informatif pour un tableau de bord de manifestation. Vous répondez aux questions sur le mouvement.");
        await ctx.reply(aiResponse);
    } catch (error) { res.status(500).json({ error: 'Erreur lors de la communication avec l\'IA.' }); }
});

app.get('/api/financial-flows', (req, res) => res.json(database.financial_flows));


app.post('/api/financial-flows', async (req, res) => {
    const newFlow = { id: uuidv4(), ...req.body, timestamp: new Date().toISOString() };
    const isBoycotted = boycottsData.boycotts.some(boycott => boycott.name.toLowerCase() === newFlow.name.toLowerCase());
    
    // NOUVEAU : Calculer la taxe pour la transaction
    const taxAmount = calculateTaxAmount(newFlow, database.taxes);
    
    // NOUVEAU : Calculer la valeur UTMi de l'interaction de flux financier
    const utmiResult = calculateUtmi({ 
        type: 'financial_flow', // Un nouveau type d'interaction
        data: {
            amount: newFlow.amount,
            isBoycotted,
            taxAmount
        }
    }, { userCvnuValue: 0.5 }); // Valeur CVNU pour l'utilisateur

    newFlow.tax_amount = taxAmount;
    newFlow.utmi_value = utmiResult.utmi;

    if (isBoycotted) {
        console.log(`Transaction vers une entité boycottée. Réaffectation de la TVA...`);
        const tvaAmount = newFlow.amount * (database.taxes.find(t => t.id === 'tax_vat')?.rate || 0);
        try {
            await fetch(`http://localhost:${port}/api/blockchain/recevoir-fonds`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: tvaAmount }) });
            console.log(`TVA de ${tvaAmount}€ envoyée au smart contract.`);
            newFlow.blockchain_status = 'TVA_AFFECTEE';
        } catch (error) {
            console.error('Erreur lors de la réaffectation de la TVA:', error);
            newFlow.blockchain_status = 'ECHEC_AFFECTATION';
        }
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
const RICS_FILE_PATH = path.join(__dirname, 'data', 'rics.json');
let ricsData = [];
async function readRicsFile() {
    try {
        const data = await fs.readFile(RICS_FILE_PATH, { encoding: 'utf8' });
        ricsData = JSON.parse(data);
        console.log('Données RIC chargées avec succès.');
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn('Le fichier rics.json n\'existe pas, initialisation avec un tableau vide.');
            ricsData = [];
            await writeRicsFile();
        } else { console.error('Erreur fatale lors du chargement de rics.json:', error); process.exit(1); }
    }
}
async function writeRicsFile() {
    try {
        await fs.writeFile(RICS_FILE_PATH, JSON.stringify(ricsData, null, 2), { encoding: 'utf8' });
        console.log('Écriture de rics.json terminée avec succès.');
    } catch (error) { console.error('Erreur lors de l\'écriture de rics.json:', error); }
}
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
app.post('/api/entities', async (req, res) => { /* ... */ });
app.put('/api/entities/:id', async (req, res) => { /* ... */ });
app.delete('/api/entities/:id', async (req, res) => { /* ... */ });
app.get('/api/boycotts', (req, res) => res.json(database.boycotts));
app.post('/api/boycotts', async (req, res) => {
    const newEntity = req.body;
    newEntity.id = `ent_${Date.now()}`;
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
    } catch (error) {
        console.error('Erreur lors de la génération du résumé du tableau de bord:', error);
        res.status(500).json({ error: 'Erreur lors de la génération du résumé.' });
    }
});
app.post('/api/blockchain/recevoir-fonds', async (req, res) => {
    const { amount } = req.body;
    if (!amount) { return res.status(400).json({ error: 'Montant manquant.' }); }
    console.log(`SIMULATION : Envoi de ${amount}€ au smart contract.`);
    database.blockchain.transactions.push({ id: uuidv4(), type: 'recevoirFonds', amount: amount, timestamp: new Date().toISOString() });
    database.caisse_manifestation.solde += amount;
    await writeDatabaseFile();
    res.status(200).json({ message: `Fonds de ${amount}€ reçus avec succès sur le smart contract (simulé).` });
});
app.post('/api/blockchain/decaisser-allocations', async (req, res) => {
    console.log("SIMULATION : Décaissement des allocations lancé sur le smart contract.");
    res.status(200).json({ message: 'Décaissement des allocations en cours...' });
});
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
database.missions = [
    { id: '1', title: 'Collecte de données sur le terrain', description: 'Relevez les positions des caméras de surveillance dans votre ville.', status: 'En cours' },
    { id: '2', title: 'Analyse des articles de loi', description: 'Examinez les modifications proposées aux articles L3121-1 et L4331-1.', status: 'En cours' },
    { id: '3', title: 'Cartographie des points de ralliement', description: 'Identifiez et enregistrez les lieux de manifestation potentiels.', status: 'À venir' }
];
app.get('/api/missions', (req, res) => { res.json(database.missions); });
initializeDatabase().then(() => {
    readRicsFile();
    loadBoycottData();

    bot.launch();
    console.log('Bot Telegram démarré.');
    app.listen(port, () => {
        console.log(`Serveur d'enquête parlementaire démarré sur http://localhost:${port}`);
        console.log(`Documentation API Swagger UI disponible sur http://localhost:${port}/api-docs`);
    });
});