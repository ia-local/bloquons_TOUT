// Fichier: routes/smartContract.js
const express = require('express');
const router = express.Router();
const path = require('path');
const IA = require('groq-sdk');
const fs = require('fs/promises');
const { v4: uuidv4 } = require('uuid');

const Groq = new IA({ apiKey: process.env.GROQ_API_KEY });
const DATABASE_FILE_PATH = path.join(__dirname, '..', 'database.json');
// La variable SATELLITES_DATA_FILE a été retirée car elle n'était pas utilisée ici.
const SMART_CONTRACTS_DIR = path.join(__dirname, '..', 'public', 'src', 'sol');

// Fonctions utilitaires de la base de données
const readDatabaseFile = async () => {
    try {
        const data = await fs.readFile(DATABASE_FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur de lecture de database.json:', error);
        return {};
    }
};

const writeDatabaseFile = async (db) => {
    try {
        await fs.writeFile(DATABASE_FILE_PATH, JSON.stringify(db, null, 2), 'utf8');
    } catch (error) {
        console.error('Erreur d\'écriture de database.json:', error);
    }
};

// Logique de simulation des allocations et des compétences
const generateSkills = (baseDescription) => {
    const keywords = baseDescription.toLowerCase().split(/\s*,\s*|\s+/).filter(word => word.length > 2);
    const uniqueKeywords = [...new Set(keywords)];
    if (uniqueKeywords.length === 0) {
        return [{ name: 'Travail d\'équipe', score: 0.5 }];
    }
    const skills = uniqueKeywords.map(keyword => {
        const score = Math.random() * 0.5 + 0.5;
        return { name: keyword.charAt(0).toUpperCase() + keyword.slice(1), score: parseFloat(score.toFixed(2)) };
    });
    return skills;
};

const calculateAllocation = (skills) => {
    if (!skills || skills.length === 0) { return 500; }
    const totalScore = skills.reduce((sum, skill) => sum + skill.score, 0);
    const averageScore = totalScore / skills.length;
    return Math.round(500 + (averageScore * 4500));
};

// --- API Endpoints ---

// Point de terminaison pour l'API CV
router.post('/api/generate-cv', async (req, res) => {
    const { numeroFiscal, descriptionMetier } = req.body;
    if (!numeroFiscal || !descriptionMetier) {
        return res.status(400).json({ success: false, message: 'Le numéro fiscal et la description sont requis.' });
    }
    try {
        const skills = generateSkills(descriptionMetier);
        const allocation = calculateAllocation(skills);
        const age = Math.floor(Math.random() * 40) + 20;

        const newCitizen = { numeroFiscal, descriptionMetier, age, skills, allocation };
        const db = await readDatabaseFile();
        
        if (!db.citoyensSimules) db.citoyensSimules = [];
        
        const existingCitizenIndex = db.citoyensSimules.findIndex(c => c.numeroFiscal === numeroFiscal);
        if (existingCitizenIndex > -1) {
            db.citoyensSimules[existingCitizenIndex] = newCitizen;
        } else {
            db.citoyensSimules.push(newCitizen);
        }
        await writeDatabaseFile(db);
        res.json({ citoyen: `Citoyen de ${newCitizen.age} ans`, numeroFiscal: newCitizen.numeroFiscal, allocation: newCitizen.allocation, age: newCitizen.age, skills: newCitizen.skills });
    } catch (error) {
        console.error("Erreur lors de la génération du CV:", error);
        res.status(500).json({ success: false, message: "Erreur lors de la génération du CV." });
    }
});

// Point de terminaison pour la collecte de TVA
router.post('/api/collect-tva', async (req, res) => {
    const amount = req.body.amount || 1000;
    const db = await readDatabaseFile();
    if (!db.tresorerieCompteCampagne) db.tresorerieCompteCampagne = 0;
    db.tresorerieCompteCampagne += amount;
    await writeDatabaseFile(db);
    res.json({ success: true, message: `Collecte de ${amount}€ effectuée. Trésorerie actuelle : ${db.tresorerieCompteCampagne}€` });
});

// Point de terminaison pour le décaissement des allocations
router.get('/api/decaisser-allocations', async (req, res) => {
    const db = await readDatabaseFile();
    let totalVerse = 0;
    const allocationsVersees = [];
    
    if (!db.citoyensSimules) db.citoyensSimules = [];

    db.citoyensSimules.forEach(citoyen => {
        if (db.tresorerieCompteCampagne >= citoyen.allocation) {
            db.tresorerieCompteCampagne -= citoyen.allocation;
            totalVerse += citoyen.allocation;
            allocationsVersees.push({ numeroFiscal: citoyen.numeroFiscal, montant: citoyen.allocation });
        }
    });
    
    await writeDatabaseFile(db);
    res.json({
        success: true,
        message: 'Décaissement des allocations réussi.',
        totalVerse,
        tresorerieRestante: db.tresorerieCompteCampagne,
        allocations: allocationsVersees,
    });
});

// Point de terminaison pour l'état du contrat
router.get('/api/contract-state', async (req, res) => {
    const db = await readDatabaseFile();
    res.json({
        tresorerie: db.tresorerieCompteCampagne || 0,
        nombreCitoyens: db.citoyensSimules?.length || 0,
    });
});

// Point de terminaison pour le tableau de bord
router.get('/api/dashboard-data', async (req, res) => {
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

// Route pour les taxes
router.get('/api/taxes', async (req, res) => {
    const db = await readDatabaseFile();
    res.json(db.taxes);
});

// Point de terminaison pour l'explication de la redistribution par l'IA
router.get('/api/redistribution', async (req, res) => {
    try {
        const db = await readDatabaseFile();
        const recettesFiscalesTotales = db.tresorerieCompteCampagne || 0;
        const nombreCVNUActifs = db.citoyensSimules?.length || 0;
        const chatCompletion = await Groq.chat.completions.create({
            messages: [{ role: "user", content: `Expliquez le processus de décaissement et de redistribution de la Taxe sur la Valeur Ajoutée (TVA) pour financer le Curriculum Vitae Numérique Universel (CVNU). Précisez que la redistribution est effectuée de manière automatisée via des smart contracts et que le montant alloué à chaque citoyen (entre 500 et 5000€) dépend de ses compétences enregistrées. Le montant total des recettes est de ${recettesFiscalesTotales}€ pour ${nombreCVNUActifs} bénéficiaires.` }],
            model: "gemma2-9b-it", temperature: 0.2, max_tokens: 2048, top_p: 1, stream: false
        });
        const texteExplicatif = chatCompletion.choices[0]?.message?.content || "Impossible de générer l'explication. Veuillez réessayer.";
        res.json({ statut: "Opération réussie", recettesTotales: recettesFiscalesTotales, nombreBeneficiaires: nombreCVNUActifs, explicationIA: texteExplicatif });
    } catch (error) {
        console.error("Erreur lors de la requête à l'API Groq:", error);
        res.status(500).json({ erreur: "Erreur lors de la génération de l'explication AI." });
    }
});

// Route pour les fichiers de smart contracts
router.get('/api/sol-files', async (req, res) => {
    try {
        const files = await fs.readdir(SMART_CONTRACTS_DIR);
        res.json(files.filter(file => file.endsWith('.sol')));
    } catch (error) {
        console.error("Erreur lors de la lecture des fichiers .sol:", error);
        res.status(500).json({ error: 'Échec du chargement des fichiers Solidity.' });
    }
});

// Route pour le contenu des fichiers Solidity
router.get('/api/sol-content/:filename', async (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(SMART_CONTRACTS_DIR, filename);

    try {
        const content = await fs.readFile(filePath, 'utf8');
        res.set('Content-Type', 'text/plain');
        res.send(content);
    } catch (error) {
        console.error("Erreur lors de la lecture du fichier Solidity:", error);
        res.status(404).send('Fichier non trouvé.');
    }
});

module.exports = exports; // CORRECTION: Remplacer par 'module.exports = router'

module.exports = router;