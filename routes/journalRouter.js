// Fichier : routes/journal.js

const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs/promises');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Clés API et initialisation
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const groq = new Groq({ apiKey: GROQ_API_KEY });
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Chemins des dossiers pour les sauvegardes
const DATABASE_FILE_PATH = path.join(__dirname, '..', 'data', 'database.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'output'); // Contenus HTML des articles
const MEDIA_DIR = path.join(__dirname, '..', 'docs', 'media'); // Images des articles
const DEFAULT_IMAGE_PATH = '/media/default-article-image.jpg';

// Créer les dossiers s'ils n'existent pas
fs.mkdir(OUTPUT_DIR, { recursive: true }).catch(console.error);
fs.mkdir(MEDIA_DIR, { recursive: true }).catch(console.error);

// Fonctions utilitaires pour lire/écrire la base de données

// Fonctions utilitaires pour lire/écrire la base de données
const readDatabase = async () => {
    try {
        const data = await fs.readFile(DATABASE_FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn('Le fichier database.json n\'existe pas, initialisation de la base de données vide.');
            return { journal_posts: [], chronology: [] };
        }
        console.error('Erreur lors de la lecture de database.json:', error);
        throw error;
    }
};

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
        const titleResponse = await groq.chat.completions.create({
            messages: [{ role: 'user', content: `Génère un titre d'article de journal sur le thème : ${topic}. Ta réponse doit contenir uniquement le titre et faire moins de 10 mots.` }],
            model: 'gemma2-9b-it'
        });
        const title = titleResponse.choices[0].message.content;

        const contentResponse = await groq.chat.completions.create({
            messages: [{ role: 'user', content: `Rédige un article de journal sur le thème '${topic}'. Utilise un style formel et pertinent pour l'actualité citoyenne. Le contenu doit être formaté en HTML.` }],
            model: 'gemma2-9b-it'
        });
        const article = contentResponse.choices[0].message.content;

        let imagePath = DEFAULT_IMAGE_PATH;

        if (genAI) {
            try {
                const imagePrompt = `Create an image that represents a key concept from this article: '${title}'. Summarize the content to provide context: '${article.substring(0, 200)}'`;
                const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
                const result = await model.generateContent(imagePrompt);
                const response = result.response;
                const parts = response.candidates[0].content.parts;
                
                let imageData;
                for (const part of parts) {
                    if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                        imageData = part.inlineData.data;
                        break;
                    }
                }
                
                if (imageData) {
                    const idSeed = uuidv4();
                    const imageFileName = `image_${idSeed}.webp`;
                    const buffer = Buffer.from(imageData, 'base64');
                    const imageFilePath = path.join(MEDIA_DIR, imageFileName);
                    await fs.writeFile(imageFilePath, buffer);
                    imagePath = `/media/${imageFileName}`;
                }
                
            } catch (imageError) {
                console.error("Erreur lors de la génération de l'image:", imageError);
            }
        }

        const newPost = {
            id: uuidv4(),
            title: title,
            media: imagePath, // On stocke directement le chemin du fichier
            article: article,
            date: new Date().toISOString(),
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
        let mediaUrl = DEFAULT_IMAGE_PATH;
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

// Route pour sauvegarder un nouvel article de journal
// Route pour sauvegarder un nouvel article de journal
router.post('/save-article', async (req, res) => {
    const { title, content, mediaUrl } = req.body;
    const idSeed = uuidv4();

    if (!title || !content || !mediaUrl) {
        return res.status(400).json({ error: 'Titre, contenu ou lien vers l\'image manquant.' });
    }

    try {
        // Créer un fragment HTML pour l'article
        const articleHTML = `
            <article class="journal-post-card">
                <h3>${title}</h3>
                <p class="post-date">${new Date().toLocaleDateString()}</p>
                <img src="${mediaUrl}" alt="${title}">
                <div class="post-content">${content}</div>
            </article>
        `;

        // Enregistrement du contenu HTML dans un fichier
        const contentFileName = `article_${idSeed}.html`;
        const contentPath = path.join(OUTPUT_DIR, contentFileName);
        await fs.writeFile(contentPath, articleHTML, 'utf8');
        const contentRelativePath = `/output/${contentFileName}`;

        // Enregistrement dans la base de données
        const db = await readDatabase();
        if (!db.journal_posts) {
            db.journal_posts = [];
        }
        
        const newPost = {
            id: idSeed,
            title: title,
            media: mediaUrl,
            articlePath: contentRelativePath,
            date: new Date().toISOString(),
            isFeatured: false,
            views: 0
        };
        
        db.journal_posts.push(newPost);
        await writeDatabase(db);
        
        res.status(201).json({ message: 'Article enregistré avec succès.', post: newPost });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'article:', error);
        res.status(500).json({ error: 'Erreur lors de la sauvegarde de l\'article.' });
    }
});


// Route pour récupérer tous les articles du journal
router.get('/posts', async (req, res) => {
    try {
        const db = await readDatabase();
        const posts = db.journal_posts || [];
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: 'Erreur de lecture de la base de données.' });
    }
});

// Route pour récupérer l'article à la une
router.get('/article-du-jour', async (req, res) => {
    try {
        const db = await readDatabase();
        let featuredArticle = db.journal_posts.find(post => post.isFeatured) || null;

        if (!featuredArticle) {
            featuredArticle = db.journal_posts.sort((a, b) => (b.views || 0) - (a.views || 0))[0];
        }

        if (featuredArticle) {
            res.json(featuredArticle);
        } else {
            res.status(404).json({ message: "Aucun article à la une trouvé." });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erreur de lecture de la base de données.' });
    }
});

// Route pour récupérer l'historique (chronologie + articles)
router.get('/historique', async (req, res) => {
    try {
        const db = await readDatabase();
        const historique = [
            ...(db.chronology || []).map(item => ({ ...item, type: 'chronology' })),
            ...(db.journal_posts || []).map(item => ({ ...item, type: 'article' }))
        ];
        historique.sort((a, b) => new Date(b.date || b.start_date) - new Date(a.date || a.start_date));
        res.json(historique);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique.' });
    }
});

module.exports = router;