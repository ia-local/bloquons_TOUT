// Fichier : serveur.js

// --- 📦 Modules & Librairies 📦 ---
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
const operator = require('./server_modules/operator.js');
const { calculateDashboardInsights } = require('./server_modules/utms_calculator.js');

// --- 🛣️ Importation des Routeurs 🛣️ ---
const cvnuRouter = require('./routes/cvnu.js');
const reformeRouter = require('./routes/reforme.js');
const missionsRouter = require('./routes/quests.js');
const mapRouter = require('./routes/map-router.js');
const smartContractRouter = require('./routes/smartContract.js');
const journalRouter = require('./routes/journal.js');
const democratieRouter = require('./routes/democratie.js');
const configureTelegramBot = require('./routes/telegramRouter.js');

// --- 🔑 Initialisation des Clients API et du Bot 🔑 ---
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const EE_PRIVATE_KEY_PATH = './private-key.json';
const CLIENT_SECRET_FILE = './client-key.json';

const bot = new Telegraf('7219104241:AAFj0VdUM9nsfGImhBY3zdWAUog6EV3PtnE', {
    telegram: { webhookReply: true }
});

// --- ⚙️ Configuration du Serveur Express ⚙️ ---
const app = express();
const port = process.env.PORT || 3000;
let writeQueue = Promise.resolve();
let isWriting = false;

// --- 🌐 Middleware Express 🌐 ---
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

// --- 🛣️ Montage des Routeurs API 🛣️ ---
app.use('/missions', missionsRouter);
app.use('/journal', journalRouter);
app.use('/cvnu', cvnuRouter);
app.use('/map', mapRouter);
app.use('/reforme', reformeRouter);
app.use('/smartContract', smartContractRouter);
app.use('/democratie', democratieRouter);

// --- 📚 Documentation API (Swagger) 📚 ---
const swaggerDocumentPath = path.join(__dirname, 'api-docs', 'swagger.yaml');
let swaggerDocument = {};
try {
    swaggerDocument = YAML.load(swaggerDocumentPath);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
    console.error('Erreur lors du chargement de la documentation Swagger:', error);
}

// --- 💾 Chemins et Variables Globales 💾 ---
const DATABASE_FILE_PATH = path.join(__dirname,'data', 'database.json');
const BOYCOTT_FILE_PATH = path.join(__dirname, 'data','boycott.json');
const RICS_FILE_PATH = path.join(__dirname, 'data', 'rics.json');
const STATS_FILE = path.join(__dirname, 'data', 'stats.json');
const SATELLITES_DATA_FILE = path.join(__dirname, 'data', 'satellites.json');
const LOG_FILE_PATH = path.join(__dirname, 'data', 'logs.json');
const ORGANIZER_GROUP_ID = "https://ia-local.github.io/Manifest.910-2025"; 

let database = {};
let boycottsData = {};
let ricsData = [];
let satellitesData = [];

// --- 🛠️ Fonctions Utilitaires de la Base de Données 🛠️ ---
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

// ... Les fonctions de chargement de données...
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
                democratie_posts: [],
                taxes: [
                    { id: "tax_tfa", name: "Taxe sur les Transactions Financières (TFA)", description: "Taxe sur les flux financiers et les mouvements de capitaux.", rate: 0.2, applicable_to: "financial_flows" },
                    { id: "tax_production", name: "Taxe sur les Facteurs de Production", description: "Taxe basée sur les coûts de production des entreprises.", rate: 0.05, applicable_to: "company_data" },
                    { id: "tax_vat", name: "Taxe sur la Valeur Ajoutée", description: "Modélisation de l'impact de la TVA sur les transactions.", rate: 0.2, applicable_to: "transactions" },
                    { id: "tax_campaign", name: "Taxe sur les Excédents de Comptes de Campagne", description: "Taxe sur les excédents de financement des partis politiques, d'après les données de la CNCCFP.FR.", rate: 0.5, applicable_to: "campaign_finance" }
                ]
            };
            await writeDatabaseFile();
        } else {
            console.error('Erreur fatale lors du chargement de database.json:', error);
            process.exit(1);
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
let EE_PRIVATE_KEY = {};
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
//...
// --- 🚀 Démarrage du Serveur et du Bot 🚀 ---
const startServer = async () => {
  try {
    await initializeDatabase();
    await readRicsFile();
    await loadBoycottData();
    await loadSatellitesData();
    await loadEarthEnginePrivateKey();
    await authenticateEarthEngine();
    
    await bot.launch();
    console.log('✅ Bot Telegram démarré.');
    
    app.listen(port, () => {
        console.log(`✅ Serveur d'enquête parlementaire démarré sur http://localhost:${port}`);
        console.log(`📚 Documentation API Swagger UI disponible sur http://localhost:${port}/api-docs`);
    });
  } catch (err) {
    console.error('❌ Échec du démarrage du serveur:', err);
    process.exit(1);
  }
};

startServer();