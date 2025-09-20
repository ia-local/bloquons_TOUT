// server.js
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
const ee = require('@google/earthengine');
const cors = require('cors');
const sassMiddleware = require('node-sass-middleware');
const { google } = require('googleapis'); // Ajout de l'import pour googleapis

// --- Importation des routeurs ---
const cvnuRouter = require('./cvnu.js');
const reformeRouter = require('./reforme.js');
const missionsRouter = require('./routes/quests.js');
const mapRouter = require('./routes/map-router.js');
const smartContractRouter = require('./routes/smartContract-router.js');
const journalRouter = require('./routes/journal.js');

// --- Importation des modules serveur ---
const operator = require('./server_modules/operator.js');

// --- Initialisation des API et du serveur ---
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = new Groq({ apiKey: GROQ_API_KEY });
const app = express();
const port = process.env.PORT || 3000;
const bot = new Telegraf('7219104241:AAG2biLtqAucVucjHp1bSrjxnoxXWdNU2K0', {
    telegram: { webhookReply: true }
});

// --- Fichiers de configuration ---
const CLIENT_SECRET_FILE = './client-key.json'; // Votre fichier OAuth2
const DATABASE_FILE_PATH = path.join(__dirname, 'database.json');
const BOYCOTT_FILE_PATH = path.join(__dirname, 'boycott.json');
const STATS_FILE = path.join(__dirname, 'data', 'stats.json');
const SATELLITES_DATA_FILE = path.join(__dirname, 'data', 'satellites.json');

// --- Variables de l'application ---
let database = {};
let boycottsData = {};
let satellitesData = [];
let writeQueue = Promise.resolve();
let isWriting = false;
const ORGANIZER_GROUP_ID = "https://ia-local.github.io/Manifest.910-2025"; 

// --- Variables OAuth2 pour GEE ---
let authClient; // Le client GEE authentifié
let oAuth2Client;

// Fonction pour configurer le client OAuth2
async function setupGoogleAuth() {
    try {
        const credentials = require(CLIENT_SECRET_FILE);
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        oAuth2Client = new google.auth.OAuth2(
            client_id,
            client_secret,
            redirect_uris[0]
        );
        console.log('Client Google OAuth2 configuré avec succès.');
    } catch (error) {
        console.error('Erreur lors du chargement des identifiants client OAuth2:', error);
        throw error;
    }
}

// Fonction pour authentifier GEE via OAuth2
async function authenticateEarthEngine() {
    if (!authClient) {
        throw new Error('L\'utilisateur n\'est pas encore authentifié.');
    }
    return new Promise((resolve, reject) => {
        ee.data.setAuthToken(authClient.credentials.access_token, 'Bearer', () => {
            ee.initialize(null, null, resolve, (err) => reject(new Error(`Failed to initialize Earth Engine: ${err}`)));
        }, (err) => reject(new Error(`Authentication failed: ${err}`)));
    });
}

// --- Fonctions utilitaires de gestion de fichiers ---
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
        throw error;
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

async function writeDatabaseFile() {
    if (isWriting) {
        return writeQueue = writeQueue.then(() => writeDatabaseFile());
    }
    isWriting = true;
    try {
        await fs.writeFile(DATABASE_FILE_PATH, JSON.stringify(database, null, 2), { encoding: 'utf8' });
    } catch (error) {
        console.error('Erreur lors de l\'écriture de database.json:', error);
    } finally {
        isWriting = false;
    }
}

async function initializeDatabase() {
    try {
        const data = await fs.readFile(DATABASE_FILE_PATH, { encoding: 'utf8' });
        database = JSON.parse(data);
        console.log('Base de données chargée avec succès.');
        if (!database.missions) {
            database.missions = [];
            await writeDatabaseFile();
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn('Le fichier database.json n\'existe pas, initialisation de la base de données vide.');
            database = {
                financial_flows: [],
                affaires: { chronology: [] },
                rics: [],
                taxes: [],
                boycotts: [],
                entities: [],
                caisse_manifestation: { solde: 0, transactions: [] },
                blockchain: { transactions: [] },
                polls: [],
                organizers: [],
                beneficiaries: [],
                cv_contracts: [],
                cameras_points: [], 
                journal_posts: [],
                missions: []
            };
            await writeDatabaseFile();
        } else {
            console.error('Erreur fatale lors du chargement de database.json:', error);
            throw error;
        }
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
async function readRicsFile() {
    try {
      const RICS_FILE_PATH = path.join(__dirname, 'data', 'rics.json');
      ricsData = await readJsonFile(RICS_FILE_PATH, []);
      console.log('Données RIC chargées avec succès.');
    } catch (error) {
      console.error('Erreur lors du chargement de rics.json:', error);
    }
}

// --- Middlewares et routes Express ---
app.use(express.json());
app.use(cors());
app.use(sassMiddleware({
    src: path.join(__dirname, 'public', 'src', 'css'),
    dest: path.join(__dirname, 'public', 'src', 'css'),
    debug: true,
    outputStyle: 'compressed',
    prefix: '/src/css'
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/roles', express.static(path.join(__dirname, 'docs', 'roles')));

// Montez les routeurs
app.use('/missions', missionsRouter);
app.use('/journal', journalRouter);
app.use('/cvnu', cvnuRouter);
app.use('/map', mapRouter);
app.use('/reforme', reformeRouter);
app.use('/smartContract', smartContractRouter);

// --- Routes pour l'authentification OAuth2 ---
app.get('/api/auth/google', (req, res) => {
    if (!oAuth2Client) return res.status(500).send('Client OAuth non configuré.');
    const scopes = [
        'https://www.googleapis.com/auth/cloud-platform'
    ];
    const url = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
    });
    res.redirect(url);
});

app.get('/api/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        authClient = oAuth2Client;
        await authenticateEarthEngine(); 
        res.send('Authentification Google réussie et Earth Engine initialisé ! Vous pouvez fermer cette fenêtre.');
    } catch (error) {
        console.error('Échec de l\'authentification Google:', error);
        res.status(500).send('Échec de l\'authentification.');
    }
});

app.get('/api/gee/tiles/:id', async (req, res) => {
    if (!authClient) {
        return res.status(401).json({ error: 'Non authentifié. Veuillez vous connecter via /api/auth/google.' });
    }
    
    const satelliteId = req.params.id;
    const { bands, cloud_percentage } = req.query;
    const satellitesData = database.satellites;
    const satellite = satellitesData.find(s => s.id === satelliteId);
    
    if (!satellite) { return res.status(404).json({ error: 'Satellite non trouvé.' }); }
    
    const bandsArray = bands ? bands.split(',') : satellite.bands;
    if (!bandsArray || bandsArray.length === 0) { return res.status(400).json({ error: 'Bandes non spécifiées pour le satellite.' }); }
    
    try {
        const image = ee.ImageCollection(satelliteId)
            .filterDate('2025-01-01', '2025-09-17')
            .filter(ee.Filter.lt(satellite.sort, parseFloat(cloud_percentage || 20)))
            .mosaic()
            .select(bandsArray);
            
        const visParams = { min: 0, max: 3000, bands: bandsArray };

        image.getMap(visParams, (mapId) => {
            if (mapId.error) { return res.status(500).json({ error: mapId.error }); }
            res.json({ mapid: mapId.mapid, token: mapId.token, satelliteName: satellite.name });
        });
    } catch (error) {
        console.error('Erreur lors de la génération des tuiles GEE:', error);
        res.status(500).json({ error: 'Échec de la génération des tuiles GEE.' });
    }
});

// --- Routes pour l'opérateur IA ---
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
    if (!message) { return res.status(400).json({ error: 'Message manquant.' }); }
    try {
        const aiResponse = await operator.getGroqChatResponse(message);
        res.json({ response: aiResponse });
    } catch (error) { res.status(500).json({ error: 'Erreur lors de la communication avec l\'IA.' }); }
});

// --- Routes de données pour le front-end ---
app.get('/api/prefectures', (req, res) => { res.json(database.prefectures || []); });
app.get('/api/mairies', (req, res) => { res.json(database.mairies || []); });
app.get('/api/roundabout-points', (req, res) => { res.json(database.roundabout_points || []); });
app.get('/api/porte-points', (req, res) => { res.json(database.porte_points || []); });
app.get('/api/strategic-locations', (req, res) => { res.json(database.strategic_locations || []); });
app.get('/api/syndicats', (req, res) => { res.json(database.syndicats || []); });
app.get('/api/telecoms', (req, res) => { res.json(database.telecoms || []); });
app.get('/api/satellites', (req, res) => { res.json(database.satellites || []); });
app.get('/api/telegram-sites', (req, res) => { res.json(database.telegram_groups || []); });
app.get('/api/public-cameras', async (req, res) => { res.json(database.cameras_points || []); });
app.get('/api/financial-flows', (req, res) => res.json(database.financial_flows));
app.post('/api/financial-flows', async (req, res) => { /* ... */ });
app.put('/api/financial-flows/:id', async (req, res) => { /* ... */ });
app.delete('/api/financial-flows/:id', async (req, res) => { /* ... */ });
app.get('/api/affaires', (req, res) => res.json(database.affaires));
app.post('/api/affaires/event', async (req, res) => { /* ... */ });
app.get('/api/rics', (req, res) => { res.json(ricsData); });
app.post('/api/rics', async (req, res) => { /* ... */ });
app.put('/api/rics/:id', async (req, res) => { /* ... */ });
app.get('/api/taxes', (req, res) => res.json(database.taxes));
app.post('/api/taxes', async (req, res) => { /* ... */ });
app.get('/api/entities', (req, res) => res.json(database.entities));
app.post('/api/entities', async (req, res) => { /* ... */ });
app.put('/api/entities/:id', async (req, res) => { /* ... */ });
app.delete('/api/entities/:id', async (req, res) => { /* ... */ });
app.get('/api/boycotts', (req, res) => res.json(database.boycotts));
app.post('/api/boycotts', async (req, res) => { /* ... */ });
app.put('/api/boycotts/:id', async (req, res) => { /* ... */ });
app.delete('/api/boycotts/:id', async (req, res) => { /* ... */ });
app.get('/api/caisse-manifestation', (req, res) => res.json(database.caisse_manifestation));
app.post('/api/caisse-manifestation/transaction', async (req, res) => { /* ... */ });
app.post('/api/blockchain/transaction', async (req, res) => { /* ... */ });
app.get('/api/dashboard/summary', async (req, res) => { /* ... */ });
app.post('/api/blockchain/recevoir-fonds', async (req, res) => { /* ... */ });
app.post('/api/blockchain/decaisser-allocations', async (req, res) => { /* ... */ });
app.post('/api/beneficiaries/register', async (req, res) => { /* ... */ });
app.get('/api/camera-points', (req, res) => res.json(database.cameras_points));
app.post('/api/camera-points', async (req, res) => { /* ... */ });
app.get('/api/missions', (req, res) => { res.json(database.missions); });

// --- Initialisation et lancement du serveur ---
async function initializeApp() {
    try {
        await setupGoogleAuth(); // Configure le client OAuth2
        await initializeDatabase(); // Charge la base de données
        await loadBoycottData();
        await loadSatellitesData();
        await readRicsFile();

        // Montage de la documentation Swagger (doit être après le chargement des données)
        const swaggerDocumentPath = path.join(__dirname, 'api-docs', 'swagger.yaml');
        const swaggerDocument = YAML.load(swaggerDocumentPath);
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

        // Finaliser l'initialisation et démarrer le serveur
        bot.launch();
        console.log('Bot Telegram démarré.');
        app.listen(port, () => {
            console.log(`Serveur d'enquête parlementaire démarré sur http://localhost:${port}`);
            console.log(`Documentation API Swagger UI disponible sur http://localhost:${port}/api-docs`);
        });

    } catch (err) {
        console.error('Erreur fatale lors de l\'initialisation du serveur:', err);
        process.exit(1);
    }
}

initializeApp();