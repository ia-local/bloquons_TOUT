// Fichier : routes/democratie.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const fs = require("fs/promises");
const path = require('path');
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialisations (à adapter selon votre environnement)
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const groq = new Groq({ apiKey: GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const DATABASE_FILE_PATH = path.join(__dirname, '..', 'database.json');

// Fonction utilitaire pour lire la base de données
async function readDatabaseFile() {
    try {
        const data = await fs.readFile(DATABASE_FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur de lecture de database.json:', error);
        return {};
    }
}

// Fonction utilitaire pour écrire la base de données
async function writeDatabaseFile(data) {
    try {
        await fs.writeFile(DATABASE_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Erreur d\'écriture de database.json:', error);
    }
}

// --- Route pour la génération IA d'un article de démocratie ---
router.get('/generate', async (req, res) => {
    const topic = req.query.topic;
    if (!topic) {
        return res.status(400).json({ error: 'Le paramètre "topic" est manquant.' });
    }
    try {
        // Logique de génération de contenu avec l'IA
        const titleResponse = await groq.chat.completions.create({
            messages: [{ role: 'user', content: `Génère un titre d'article sur le thème : ${topic}. Fais moins de 15 mots.` }],
            model: 'gemma2-9b-it' // Exemple de modèle
        });
        const title = titleResponse.choices[0].message.content;

        const contentResponse = await groq.chat.completions.create({
            messages: [{ role: 'user', content: `Rédige un article de démocratie sur le thème '${topic}'. Utilise un style formel et pertinent. Le contenu doit être formaté en HTML.` }],
            model: 'gemma2-9b-it' // Exemple de modèle
        });
        const article = contentResponse.choices[0].message.content;

        let mediaUrl = 'https://ia-local.github.io/Manifest.910-2025/media/generated-image.jpg'; // Image par défaut

        try {
            const imagePrompt = `Crée une image qui représente un concept clé de cet article sur le thème de la démocratie: '${title}'.`;
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
        
        const newPost = {
            id: uuidv4(),
            title: title,
            media: mediaUrl,
            article: article,
            date: new Date().toISOString()
        };
        
        res.json(newPost);

    } catch (error) {
        console.error('Erreur lors de la génération du contenu de démocratie:', error);
        res.status(500).json({ error: 'Échec de la génération de l\'article.' });
    }
});

// --- Route pour l'enregistrement d'un article de démocratie ---
router.post('/save-article', async (req, res) => {
    const { title, content, mediaUrl, mediaBase64 } = req.body;
    if (!title || !content || !mediaUrl) {
        return res.status(400).json({ error: 'Titre, contenu ou média manquant.' });
    }
    
    const database = await readDatabaseFile();
    if (!database.democratie_posts) {
        database.democratie_posts = [];
    }
    
    const newPost = {
        id: uuidv4(),
        title: title,
        media: mediaUrl,
        mediaBase64: mediaBase64,
        article: content,
        date: new Date().toISOString()
    };
    
    database.democratie_posts.push(newPost);
    await writeDatabaseFile(database);
    
    res.status(201).json({ message: 'Article enregistré avec succès.', post: newPost });
});

// --- Route pour récupérer tous les articles de démocratie ---
router.get('/posts', async (req, res) => {
    const database = await readDatabaseFile();
    res.json(database.democratie_posts || []);
});

module.exports = router;