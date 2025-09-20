const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const path = require('path');
const fs = require('fs/promises');

// Définissez le chemin vers la base de données ici
const DATABASE_FILE_PATH = path.join(__dirname,'..', 'database.json');

// Fonctions pour la lecture et l'écriture du fichier de la base de données
// Elles sont copiées depuis votre serveur.js pour être autonomes
async function readDatabaseFile() {
    try {
        const data = await fs.readFile(DATABASE_FILE_PATH, { encoding: 'utf8' });
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lors de la lecture de database.json:', error);
        return { missions: [] };
    }
}

async function writeDatabaseFile(db) {
    try {
        await fs.writeFile(DATABASE_FILE_PATH, JSON.stringify(db, null, 2), { encoding: 'utf8' });
    } catch (error) {
        console.error('Erreur lors de l\'écriture de database.json:', error);
    }
}

router.get('/api/missions', async (req, res) => {
    const db = await readDatabaseFile();
    res.json(db.missions || []);
});

router.post('/api/missions', async (req, res) => {
    const { title, description, full_description, status, rewards } = req.body;
    if (!title || !description || !status) {
        return res.status(400).json({ error: 'Titre, description et statut sont requis.' });
    }

    const newMission = {
        id: uuidv4(),
        title,
        description,
        full_description,
        status,
        rewards,
        created_at: new Date().toISOString()
    };
    
    const db = await readDatabaseFile();
    db.missions.push(newMission);
    await writeDatabaseFile(db);
    res.status(201).json(newMission);
});

router.post('/api/missions/generate', async (req, res) => {
    const { topic } = req.body;
    if (!topic) {
        return res.status(400).json({ error: 'Le paramètre "topic" est manquant.' });
    }
    
    try {
        const prompt = `Génère une mission pour un mouvement citoyen sur le thème "${topic}". La mission doit être concise (titre et description courte) pour une carte, mais aussi avoir une description complète. Réponds uniquement avec un objet JSON au format suivant:
        {
          "title": "Titre de la mission (max 10 mots)",
          "description": "Description courte (max 30 mots)",
          "full_description": "Description complète (max 150 mots)",
          "status": "À venir",
          "rewards": "Points de participation, reconnaissance, etc."
        }`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gemma2-9b-it',
        });

        const generatedJson = JSON.parse(chatCompletion.choices[0].message.content);
        res.json(generatedJson);
    } catch (error) {
        console.error('Erreur lors de la génération de la mission:', error);
        res.status(500).json({ error: 'Échec de la génération de la mission avec l\'IA.' });
    }
});

// Ajoutez les routes pour l'édition et la suppression
router.put('/api/missions/:id', async (req, res) => {
    const missionId = req.params.id;
    const { title, description, full_description, status, rewards } = req.body;
    
    const db = await readDatabaseFile();
    const missionIndex = db.missions.findIndex(m => m.id === missionId);

    if (missionIndex !== -1) {
        const updatedMission = { ...db.missions[missionIndex], title, description, full_description, status, rewards };
        db.missions[missionIndex] = updatedMission;
        await writeDatabaseFile(db);
        res.json(updatedMission);
    } else {
        res.status(404).json({ error: 'Mission non trouvée.' });
    }
});

router.delete('/api/missions/:id', async (req, res) => {
    const missionId = req.params.id;
    
    const db = await readDatabaseFile();
    const initialLength = db.missions.length;
    db.missions = db.missions.filter(m => m.id !== missionId);

    if (db.missions.length < initialLength) {
        await writeDatabaseFile(db);
        res.status(204).send();
    } else {
        res.status(404).json({ error: 'Mission non trouvée.' });
    }
});

module.exports = router;