const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs/promises');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Clés API
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GROQ_API_KEY) {
    console.error("GROQ_API_KEY non défini. Le serveur ne pourra pas utiliser l'IA.");
}
if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY non défini. Le serveur utilisera un lien d'image statique par défaut.");
}

const groq = new Groq({ apiKey: GROQ_API_KEY });
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const DATABASE_FILE_PATH = path.join(__dirname, '..', 'database.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// Créer le dossier 'output' s'il n'existe pas
fs.mkdir(OUTPUT_DIR, { recursive: true }).catch(console.error);

// Fonction utilitaire pour lire la base de données
const readDatabase = async () => {
    try {
        const data = await fs.readFile(DATABASE_FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn('Le fichier database.json n\'existe pas, initialisation de la base de données vide.');
            return { journal_posts: [] };
        }
        console.error('Erreur lors de la lecture de database.json:', error);
        throw error;
    }
};

// Fonction utilitaire pour écrire dans la base de données
const writeDatabase = async (db) => {
    try {
        await fs.writeFile(DATABASE_FILE_PATH, JSON.stringify(db, null, 2), 'utf8');
    } catch (error) {
        console.error('Erreur lors de l\'écriture de database.json:', error);
        throw error;
    }
};

// Route pour générer un brouillon complet
router.get('/generate', async (req, res) => {
    const topic = req.query.topic;
    if (!topic) {
        return res.status(400).json({ error: 'Le paramètre "topic" est manquant.' });
    }

    try {
        // Génération du titre
        const titleResponse = await groq.chat.completions.create({
            messages: [{ role: 'user', content: `Génère un titre d'article de journal sur le thème : ${topic}. Fais moins de 10 mots.` }],
            model: 'gemma2-9b-it'
        });
        const title = titleResponse.choices[0].message.content;

        // Génération du contenu de l'article
        const contentResponse = await groq.chat.completions.create({
            messages: [{ role: 'user', content: `Rédige un article de journal sur le thème '${topic}'. Utilise un style formel et pertinent pour l'actualité citoyenne. Le contenu doit être formaté en HTML.` }],
            model: 'gemma2-9b-it'
        });
        const article = contentResponse.choices[0].message.content;
        
        let mediaUrl = 'https://ia-local.github.io/Manifest.910-2025/media/generated-image.jpg';
        let mediaBase64 = null;

        if (genAI) {
            try {
                const imagePrompt = `Create an image that represents a key concept from this article: '${title}'. Summarize the content to provide context: '${article.substring(0, 200)}'`;
                const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
                const result = await model.generateContent(imagePrompt);
                const response = result.response;
                const parts = response.candidates[0].content.parts;
                for (const part of parts) {
                    if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                        mediaUrl = `data:image/webp;base64,${part.inlineData.data}`;
                        mediaBase64 = part.inlineData.data;
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
            date: new Date().toISOString(),
            mediaBase64: mediaBase64
        };
        
        res.json(newPost);
    } catch (error) {
        console.error('Erreur lors de la génération du contenu du journal:', error);
        res.status(500).json({ error: 'Échec de la génération de l\'article.' });
    }
});

// Route pour régénérer un titre
router.get('/regenerate-title', async (req, res) => {
    const topic = req.query.topic;
    if (!topic) {
        return res.status(400).json({ error: 'Le paramètre "topic" est manquant.' });
    }
    try {
        const titleResponse = await groq.chat.completions.create({
            messages: [{ role: 'user', content: `Génère un titre d'article de journal sur le thème : ${topic}. Fais moins de 10 mots.` }],
            model: 'gemma2-9b-it'
        });
        res.json({ title: titleResponse.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la régénération du titre.' });
    }
});

// Route pour régénérer le contenu d'un article
router.get('/regenerate-content', async (req, res) => {
    const topic = req.query.topic;
    if (!topic) {
        return res.status(400).json({ error: 'Le paramètre "topic" est manquant.' });
    }
    try {
        const contentResponse = await groq.chat.completions.create({
            messages: [{ role: 'user', content: `Rédige un article de journal sur le thème '${topic}'. Le contenu doit être formaté en HTML.` }],
            model: 'gemma2-9b-it'
        });
        res.json({ article: contentResponse.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la régénération de l\'article.' });
    }
});

// Route pour régénérer l'image
router.post('/regenerate-image', async (req, res) => {
    const { title, article } = req.body;
    if (!genAI || !title || !article) {
        return res.status(400).json({ error: 'Titre ou contenu manquant, ou API d\'IA non configurée.' });
    }
    try {
        const imagePrompt = `Create an image that represents a key concept from this article: '${title}'. Summarize the content to provide context: '${article.substring(0, 200)}'`;
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imagePrompt);
        const response = result.response;
        const parts = response.candidates[0].content.parts;
        let mediaUrl = 'https://ia-local.github.io/Manifest.910-2025/media/generated-image.jpg';
        let mediaBase64 = null;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                mediaUrl = `data:image/webp;base64,${part.inlineData.data}`;
                mediaBase64 = part.inlineData.data;
            }
        }
        res.json({ mediaUrl, mediaBase64 });
    } catch (error) {
        console.error("Erreur lors de la génération de l'image:", error);
        res.status(500).json({ error: "Échec de la génération de l'image." });
    }
});

// Route pour récupérer tous les articles du journal
router.get('/posts', async (req, res) => {
    try {
        const db = await readDatabase();
        res.json(db.journal_posts || []);
    } catch (error) {
        res.status(500).json({ error: 'Erreur de lecture de la base de données.' });
    }
});

// Route pour sauvegarder un nouvel article de journal
router.post('/save-article', async (req, res) => {
    const { title, content, mediaUrl, mediaBase64 } = req.body;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const idSeed = uuidv4();

    if (!title || !content || !mediaUrl) {
        return res.status(400).json({ error: 'Titre, contenu ou média manquant.' });
    }

    try {
        // Sauvegarde de l'article en HTML et en Markdown
        const articleFileName = `article_${timestamp}_${idSeed}.html`;
        const contentFileName = `content_${timestamp}_${idSeed}.md`;
        await fs.writeFile(path.join(OUTPUT_DIR, articleFileName), content, 'utf8');
        await fs.writeFile(path.join(OUTPUT_DIR, contentFileName), content, 'utf8');

        // Sauvegarde de l'image si elle est en Base64
        let imageFileName = `image_${timestamp}_${idSeed}.png`;
        if (mediaBase64) {
            const buffer = Buffer.from(mediaBase64, 'base64');
            await fs.writeFile(path.join(OUTPUT_DIR, imageFileName), buffer);
        } else {
            imageFileName = mediaUrl;
        }

        // Enregistrement dans la base de données
        const db = await readDatabase();
        if (!db.journal_posts) {
            db.journal_posts = [];
        }
        
        const newPost = {
            id: idSeed,
            title: title,
            media: imageFileName, // On stocke le nom du fichier image
            article: content,
            date: new Date().toISOString()
        };
        
        db.journal_posts.push(newPost);
        await writeDatabase(db);
        
        res.status(201).json({ message: 'Article enregistré avec succès.', post: newPost });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'article:', error);
        res.status(500).json({ error: 'Erreur lors de la sauvegarde de l\'article.' });
    }
});

// Route pour la gestion des fichiers dans le dossier output
router.get('/files', async (req, res) => {
    try {
        const files = await fs.readdir(OUTPUT_DIR);
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: "Impossible de lister les fichiers." });
    }
});

module.exports = router;