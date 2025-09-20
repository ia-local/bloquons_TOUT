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
const blogRouter = require('./blog.js'); // NOUVEAU: Changé 'blog' en 'blogRouter'
const cvnuRouter = require('./cvnu.js');
const reformeRouter = require('./reforme.js');
const missionsRouter = require('./routes/quests.js'); 
const mapRouter = require('./routes/map-router.js');
const ee = require('@google/earthengine');
const cors = require('cors'); // NOUVEAU: Importez CORS ici
const sassMiddleware = require('node-sass-middleware'); // NOUVEAU: Importez SASS middleware
// const { parse } = require('node-html-parser');

// Clés API
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const EE_PRIVATE_KEY_PATH = './private-key.json';
let EE_PRIVATE_KEY = {};

// Initialisation unique des dépendances
const groq = new Groq({ apiKey: GROQ_API_KEY });
const app = express();
const port = process.env.PORT || 3000;
const bot = new Telegraf('7219104241:AAG2biLtqAucVucjHp1bSrjxnoxXWdNU2K0', {
    telegram: {
      webhookReply: true,
    },
});
let chatLog = {};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let rolesSystem = { system: { content: "Vous êtes un assistant IA généraliste." } };
let rolesAssistant = { assistant: { content: "Je suis un assistant IA utile et informatif." } };
let rolesUser = { user: { content: "Je suis un utilisateur." } };

// Toutes les routes les quests.js commenceront par /missions
app.use('/missions', missionsRouter);
// Toutes les routes du blog.js commenceront par /blog
app.use('/blog', blogRouter);
// Toutes les routes de cvnu.js commenceront par /cvnu
app.use('/cvnu', cvnuRouter);

// Toutes les routes de reforme.js commenceront par /reforme
app.use('/map', mapRouter); // Monte le nouveau routeur de la carte
// Toutes les routes de reforme.js commenceront par /reforme
app.use('/reforme', reformeRouter);
// --- Configuration du serveur Express ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/roles', express.static(path.join(__dirname, 'docs', 'roles')));

const STATS_FILE = path.join(__dirname, 'data', 'stats.json');
const SATELLITES_DATA_FILE = path.join(__dirname, 'data', 'satellites.json');

const ORGANIZER_GROUP_ID = "https://ia-local.github.io/Manifest.910-2025"; 

app.get('/api/prefectures', (req, res) => {
    res.json(database.prefectures);
});

// Configuration et service du SASS middleware
app.use(
  sassMiddleware({
    src: path.join(__dirname, 'public', 'src', 'css'),
    dest: path.join(__dirname, 'public', 'src', 'css'),
    debug: true,
    outputStyle: 'compressed',
    prefix: '/src/css'
  })
);


const gouv_lawArticles = {
    objectifs: [
        "Améliorer la valorisation des compétences.",
        "Favoriser la formation et la professionnalisation.",
        "Encourager l'innovation et la création d'emplois qualifiés."
    ],
    modifications: {
        L3121_1: "Définition du travail pour inclure la monétisation des compétences basée sur le CVNU.",
        L4331_1: "Smart contracts pour la sécurisation et la transparence des transactions liées à la monétisation des compétences.",
        L3222_1: "Redéfinition de la durée légale de travail et de sa monétisation.",
        L4334_1: "Utilisation de la TVA pour financer la formation et l'emploi en fonction des compétences validées sur le CVNU.",
        L4333_1: "Suivi régulier de la répartition des recettes de la TVA."
    },
    reference_cgi: {
        article256: "Cet article du CGI définit le champ d'application de la TVA en France. La réforme propose de réaffecter une fraction de cette taxe existante pour financer les dispositifs de formation et d'emploi."
    }
};

app.get('/api/telegram-sites', (req, res) => {
    res.json(database.telegram_groups);
});

const swaggerDocumentPath = path.join(__dirname, 'api-docs', 'swagger.yaml');
let swaggerDocument = {};
try {
    swaggerDocument = YAML.load(swaggerDocumentPath);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
    console.error('Erreur lors du chargement de la documentation Swagger:', error);
}

const DATABASE_FILE_PATH = path.join(__dirname, 'database.json');
const BOYCOTT_FILE_PATH = path.join(__dirname, 'boycott.json');
let database = {};
let boycottsData = {};
let satellitesData = [];

let writeQueue = Promise.resolve();
let isWriting = false;

app.get('/api/manifestation-sites', (req, res) => res.json(database.manifestation_points));

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

// ----------------------------------------------------------------------
// ÉTAPE IMPORTANTE : Supprimer l'ancienne initialisation de database.missions
// et la route obsolète /api/missions
// ----------------------------------------------------------------------
async function initializeDatabase() {
    try {
        const data = await fs.readFile(DATABASE_FILE_PATH, { encoding: 'utf8' });
        database = JSON.parse(data);
        console.log('Base de données chargée avec succès.');
        // Assurez-vous d'initialiser missions ici si le fichier est vide
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
                blog_posts: [],
                missions: [] // NOUVEAU: Assurez-vous que le tableau des missions est initialisé 
            };
            await writeDatabaseFile();
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

// Nouvelle route d'API pour les données de caméras publiques
app.get('/api/public-cameras', async (req, res) => {
    const cameraPoints = database.cameras_points || [];
    res.json(cameraPoints);
});

// ROUTE GENERALE POUR LA GESTION DU BLOG
app.get('/api/blog/generate', async (req, res) => {
    const topic = req.query.topic;
    if (!topic) {
        return res.status(400).json({ error: 'Le paramètre "topic" est manquant.' });
    }

    try {
        const [titleResponse, contentResponse, imageResponse] = await Promise.all([
            groq.chat.completions.create({
                messages: [{ role: 'user', content: `Génère un titre de blog sur le thème : ${topic}. Fais moins de 10 mots.` }],
                model: 'gemma2-9b-it',
            }),
            groq.chat.completions.create({
                messages: [{ role: 'user', content: `Rédige un article de blog sur le thème ${topic}. Formaté en HTML.` }],
                model: 'gemma2-9b-it',
            }),
            // Simule la génération d'image pour éviter les problèmes de dépendance
            Promise.resolve({ choices: [{ message: { content: 'https://ia-local.github.io/Manifest.910-2025/media/generated-image.jpg' } }] })
        ]);

        const title = titleResponse.choices[0].message.content;
        const content = contentResponse.choices[0].message.content;
        const imageUrl = imageResponse.choices[0].message.content;
        
        // Simule la sauvegarde de l'article pour le moment
        const newPost = {
            id: uuidv4(),
            title: title,
            media: imageUrl,
            article: content,
            date: new Date().toISOString()
        };

        // Sauvegarder dans la base de données (si un tableau blog_posts existe)
        if (database.blog_posts) {
            database.blog_posts.push(newPost);
            await writeDatabaseFile();
        }

        res.json(newPost);

    } catch (error) {
        console.error('Erreur lors de la génération du contenu du blog:', error);
        res.status(500).json({ error: 'Échec de la génération de l\'article.' });
    }
});


app.get('/api/blog/posts', async (req, res) => {
    // Si la base de données ne contient pas de blog_posts, renvoie un tableau vide
    res.json(database.blog_posts || []);
});


async function getGroqChatResponse(promptInput, model, systemMessageContent) {
    try {
        const messages = [];
        if (systemMessageContent) {
            messages.push({ role: 'system', content: systemMessageContent });
        }
        messages.push({ role: 'user', content: promptInput });

        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: model,
            temperature: 0.7,
            max_tokens: 2048,
        });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error(`Erreur lors de la génération de la réponse IA (Groq model: ${model}):`, error);
        return 'Une erreur est survenue lors du traitement de votre demande. Veuillez réessayer plus tard.';
    }
}

async function getLlmResponse(userMessage, role, conversationHistory) {
    const systemPrompt = `Tu es un assistant IA spécialisé dans l'analyse de dossiers de corruption, de blanchiment d'argent, d'évasion fiscale et de prise illégale d'intérêts. Tu as accès à une base de données de l'enquête parlementaire française. L'enquête se concentre sur les actions de hauts fonctionnaires d'État entre 2017 et 2027. Tu peux prendre plusieurs rôles en fonction des requêtes de l'utilisateur. Ton ton doit être factuel, précis, et basé sur les données de l'enquête. Les rôles possibles sont : Enquêteur, Journaliste, Avocat et Juge. Le rôle actuel est: ${role}.`;

    const chatHistory = conversationHistory.map(item => ({
        role: item.role === 'user' ? 'user' : 'assistant',
        content: item.message
    }));

    chatHistory.push({ role: 'user', content: userMessage });

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'system', content: systemPrompt }, ...chatHistory],
            model: 'gemma2-9b-it',
            stream: false,
        });

        if (chatCompletion?.choices?.[0]?.message?.content) {
            return chatCompletion.choices[0].message.content;
        } else {
            return 'Aucune réponse générée par l\'IA.';
        }
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
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'system', content: aiPrompt }, { role: 'user', content: query }],
            model: 'gemma2-9b-it',
            temperature: 0.1,
            stream: false,
        });

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
    if (!message) {
        return res.status(400).json({ error: 'Message manquant.' });
    }

    try {
        const aiResponse = await getGroqChatResponse(
            message,
            'gemma2-9b-it',
            "Vous êtes un assistant utile et informatif pour un tableau de bord de manifestation. Vous répondez aux questions sur le mouvement."
        );
        res.json({ response: aiResponse });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la communication avec l\'IA.' });
    }
});

bot.start(async (ctx) => {
    const payload = ctx.startPayload;
    let welcomeMessage = `Bonjour citoyen(ne) ! 👋\n\nBienvenue dans l'espace de mobilisation pour la **Grève Générale du 10 Septembre 2025** et la **Justice Sociale** ! Je suis votre assistant pour le mouvement.`;

    if (payload) {
        welcomeMessage += `\n\nVous êtes arrivé via un lien d'invitation : \`${payload}\`. Merci de rejoindre notre cause !`;
    }

    welcomeMessage += `\n\nComment puis-je vous aider à vous informer et à vous engager ?`;

    const inlineKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📜 Le Manifeste', 'show_manifest')],
        [Markup.button.callback('🗳️ S\'engager (RIC/Pétitions)', 'engage_menu')],
        [Markup.button.callback('❓ Aide & Commandes', 'show_help')]
    ]);

    await ctx.replyWithMarkdown(welcomeMessage, inlineKeyboard);
});

bot.action('start_menu', async (ctx) => {
    await ctx.answerCbQuery();
    await bot.start(ctx);
});

bot.action('show_manifest', async (ctx) => {
    await ctx.answerCbQuery();
    const manifestoContent = `**Extrait du Manifeste 'Le 10 Septembre' :**
Notre mouvement est né de la conviction que la République doit retrouver ses valeurs de justice sociale, de démocratie directe et de transparence. Nous exigeons :
\n1.  **L'instauration du Référendum d'Initiative Citoyenne (RIC)** dans toutes ses formes (législatif, abrogatoire, constituant, révocatoire).
\n2.  **La mise en œuvre de la procédure de destitution** des élus, notamment présidentielle, en cas de manquement grave à leurs devoirs, conformément à l'Article 68 de la Constitution.
\n3.  **Une refonte du système fiscal** pour une plus grande équité et une contribution juste de chacun.
\n4.  **Une véritable transition écologique** qui ne laisse personne de côté, financée par la justice fiscale.
\n5.  **La fin de l'impunité** et la responsabilisation des élites économiques et politiques.

\n\nPour le manifeste complet et toutes nos propositions, interrogez l'IA ou explorez les commandes /manifeste, /ric, /destitution.
`;
    await ctx.replyWithMarkdown(manifestoContent);
});

bot.action('engage_menu', async (ctx) => {
    await ctx.answerCbQuery();
    const engageMessage = `Choisissez how you would like to engage :\n\n` +
                          `✅ **Signer la Pétition RIC :** Le Référendum d'Initiative Citoyenne est au cœur de nos demandes. Participez à nos sondages réguliers sur le sujet, ou lancez la commande /ric pour en savoir plus.\n\n` +
                          `⚖️ **Soutenir la Procédure de Destitution :** Nous visons la responsabilisation des élus. Utilisez la commande /destitution pour comprendre l'Article 68 et nos actions.\n\n` +
                          `💬 **Jugement Majoritaire & Justice Sociale :** Explorez nos propositions pour une démocratie plus juste. Vous pouvez poser des questions à l'IA ou utiliser la commande /manifeste pour plus de détails sur nos objectifs de justice sociale.`;
                          
    const inlineKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('En savoir plus sur le RIC', 'ric_info_from_engage')],
        [Markup.button.callback('En savoir plus sur la Destitution', 'destitution_info_from_engage')],
        [Markup.button.callback('Retour au menu principal', 'start_menu')]
    ]);
    await ctx.replyWithMarkdown(engageMessage, inlineKeyboard);
});

bot.action('show_help', async (ctx) => {
    await ctx.answerCbQuery();
    const helpMessage = `Voici les commandes que vous pouvez utiliser :
/start - Revenir au menu principal et message de bienvenue
/manifeste - Lire un extrait de notre manifeste
/ric - Tout savoir sur le Référendum d'Initiative Citoyenne
/destitution - Comprendre la procédure de destitution (Art. 68)
/greve - Infos pratiques sur la Grève du 10 Septembre 2025
/sondage - Participer aux sondages d'opinion du mouvement
/petition - Accéder aux pétitions en cours (via le bot)
/inviter - Inviter des amis à rejoindre le bot et le mouvement
/contact [votre message] - Envoyer un message aux organisateurs
/stats - Afficher les statistiques d'utilisation du bot
/imagine [description] - Créer une image à partir d'une description textuelle
/aboutai - En savoir plus sur mon fonctionnement
/help - Afficher ce message d'aide
`;
    await ctx.reply(helpMessage);
});


bot.help((ctx) => ctx.reply('Commandes disponibles: /start, /aide, /manifeste, /ric, /destitution, /create_poll, /stats, /imagine'));

bot.command('stats', async (ctx) => {
    const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
    const statsMessage = `📊 Statistiques d'utilisation du bot :\nTotal de messages traités : ${stats.totalMessages}`;
    await ctx.reply(statsMessage);
});


bot.command('manifeste', (ctx) => {
    ctx.reply('Le Manifeste du mouvement pour le 10 septembre est le suivant...');
});


async function getDestitutionInfoMarkdown() {
    return `**La Procédure de Destitution : L'Article 68 de la Constitution**
\nL'Article 68 de la Constitution française prévoit la possibilité de destituer le Président de la République en cas de manquement à ses devoirs manifestement incompatible avec l'exercice de son mandat.
\n https://petitions.assemblee-nationale.fr/initiatives/i-2743
\n\nNotre mouvement demande une application rigoureuse et transparente de cet article, et la mise en place de mécanismes citoyens pour initier et suivre cette procédure.
\nPour le moment, nous recueillons les avis et les soutiens via des sondages et des discussions au sein du bot.
`;
}

bot.command('destitution', async (ctx) => {
    await ctx.replyWithMarkdown(await getDestitutionInfoMarkdown());
});


async function getRicInfoMarkdown() {
    return `**Le Référendum d'Initiative Citoyenne (RIC) : Le Cœur de notre Démocratie !**
Le RIC est l'outil essentiel pour redonner le pouvoir aux citoyens. Il se décline en plusieurs formes :
\n* **RIC Législatif :** Proposer et voter des lois.
\n* **RIC Abrogatoire :** Annuler une loi existante.
\n* **RIC Constituant :** Modifier la Constitution.
\n* **RIC Révocatoire :** Destituer un élu.

\n\nC'est la garantie que notre voix sera directement entendue et respectée.
\nNous organisons des sondages réguliers et des débats au sein du bot pour recueillir votre opinion et votre soutien sur le RIC. Utilisez la commande /sondage pour participer !
`;
}

bot.command('ric', async (ctx) => {
    await ctx.replyWithMarkdown(await getRicInfoMarkdown());
});


bot.command('imagine', async (ctx) => {
    const topic = ctx.message.text.split(' ').slice(1).join(' ');
    if (!topic) {
        await ctx.reply('Veuillez fournir une description pour l\'image. Exemple: /imagine un dragon survolant une ville futuriste');
        return;
    }

    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ Génération de l\'image en cours... Cela peut prendre un moment.');

        const imageDescription = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: `Décris une image qui illustre le thème suivant : ${topic}. La description doit être suffisamment détaillée pour générer une image pertinente.`,
                },
            ],
            model: 'gemma2-9b-it',
        }).then(res => res.choices[0].message.content);

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = await result.response;
        
        const parts = response.candidates[0].content.parts;
        
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');
                await ctx.replyWithPhoto({ source: imageBuffer });
                return;
            }
        }
        
        await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer avec une autre description.');
    } catch (error) {
        console.error('Erreur lors de la génération de l\'image (Telegram):', error);
        await ctx.reply('Désolé, une erreur est survenue lors de la génération de l\'image. Le modèle a pu échouer ou la description était trop complexe.');
    }
});


bot.command('create_poll', async (ctx) => {
    const question = 'Quel sujet devrions-nous aborder dans le prochain live ?';
    const options = ['Justice Sociale', 'Justice Fiscale', 'Justice Climatique'];

    try {
        const message = await ctx.replyWithPoll(question, options, { is_anonymous: false });
        const pollId = uuidv4();
        database.polls.push({
            id: pollId,
            messageId: message.message_id,
            question: question,
            options: options.map(opt => ({ text: opt, votes: 0 })),
            creatorId: ctx.from.id
        });
        await writeDatabaseFile();
    } catch (error) {
        console.error('Erreur lors de la création du sondage:', error);
    }
});

bot.on('poll_answer', async (ctx) => {
    const pollIndex = database.polls.findIndex(p => p.messageId === ctx.pollAnswer.poll_id);
    
    if (pollIndex !== -1) {
        ctx.pollAnswer.option_ids.forEach(optionIndex => {
            database.polls[pollIndex].options[optionIndex].votes++;
        });
        await writeDatabaseFile();
    }
});


bot.on('text', async (ctx) => {
    try {
        const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
        stats.totalMessages = (stats.totalMessages || 0) + 1;
        await writeJsonFile(STATS_FILE, stats);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du compteur de messages:', error);
    }

    if (ctx.message.text.startsWith('/')) {
        return;
    }
    await ctx.replyWithChatAction('typing');

    try {
        const userMessage = ctx.message.text;
        const aiResponse = await getGroqChatResponse(
            userMessage,
            'gemma2-9b-it',
            "Vous êtes un assistant utile et informatif pour un tableau de bord de manifestation. Vous répondez aux questions sur le mouvement."
        );
        await ctx.reply(aiResponse);
    } catch (error) {
        console.error('Échec de la génération de la réponse IA (Telegram) avec gemma2-9b-it:', error);
        await ctx.reply('Une erreur est survenue lors du traitement de votre demande de conversation IA. Veuillez vérifier la configuration de l\'IA ou réessayer plus tard.');
    }
});

bot.command('contact', async (ctx) => {
    const messageContent = ctx.message.text.split(' ').slice(1).join(' ');
    if (!messageContent) {
        await ctx.reply('Veuillez fournir le message que vous souhaitez envoyer aux organisateurs. Exemple: /contact J\'ai une idée pour la grève.');
        return;
    }

    if (ORGANIZER_GROUP_ID) {
        try {
            await bot.telegram.sendMessage(ORGANIZER_GROUP_ID, `Nouveau message de l'utilisateur ${ctx.from.first_name} (${ctx.from.username || 'ID: ' + ctx.from.id}) :\n\n${messageContent}`);
            await ctx.reply('Votre message a été transmis aux organisateurs. Merci !');
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message aux organisateurs:', error);
            await ctx.reply('Désolé, je n\'ai pas pu transmettre votre message aux organisateurs. Veuillez réessayer plus tard.');
        }
    } else {
        await ctx.reply('Le canal de contact des organisateurs n\'est pas configuré. Veuillez contacter l\'administrateur du bot.');
    }
});


app.get('/api/financial-flows', (req, res) => res.json(database.financial_flows));
app.post('/api/financial-flows', async (req, res) => {
    const newFlow = { id: uuidv4(), ...req.body, timestamp: new Date().toISOString() };
    
    const isBoycotted = boycottsData.boycotts.some(boycott => {
        return boycott.name.toLowerCase() === newFlow.name.toLowerCase();
    });

    if (isBoycotted) {
        console.log(`Transaction vers une entité boycottée. Réaffectation de la TVA...`);
        const tvaAmount = newFlow.amount * 0.2;

        try {
            await fetch(`http://localhost:${port}/api/blockchain/recevoir-fonds`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: tvaAmount })
            });
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
        } else {
            console.error('Erreur fatale lors du chargement de rics.json:', error);
            process.exit(1);
        }
    }
}

async function writeRicsFile() {
    try {
        await fs.writeFile(RICS_FILE_PATH, JSON.stringify(ricsData, null, 2), { encoding: 'utf8' });
        console.log('Écriture de rics.json terminée avec succès.');
    } catch (error) {
        console.error('Erreur lors de l\'écriture de rics.json:', error);
    }
}

app.get('/api/rics', (req, res) => {
    res.json(ricsData);
});

app.post('/api/rics', async (req, res) => {
    const { question, description, deadline, voteMethod, level, locations } = req.body;
    
    const newRic = {
        id: uuidv4(), 
        question,
        description,
        deadline,
        voteMethod,
        level,
        locations,
        votes_for: 0,
        votes_against: 0,
        status: 'active' 
    };
    
    ricsData.push(newRic);
    await writeRicsFile();
    
    res.status(201).json(newRic);
});

app.put('/api/rics/:id', async (req, res) => {
    const ricId = req.params.id;
    const { votes_for, votes_against } = req.body;

    const ric = ricsData.find(r => r.id === ricId);

    if (!ric) {
        return res.status(404).json({ error: 'Référendum non trouvé.' });
    }

    if (typeof votes_for !== 'undefined') {
        ric.votes_for = votes_for;
    }
    if (typeof votes_against !== 'undefined') {
        ric.votes_against = votes_against;
    }
    
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
    if (index !== -1) {
        database.boycotts[index] = { ...database.boycotts[index], ...updatedEntity };
        await writeDatabaseFile();
        res.json(database.boycotts[index]);
    } else {
        res.status(404).json({ message: "Entité non trouvée" });
    }
});

app.delete('/api/boycotts/:id', async (req, res) => {
    const { id } = req.params;
    const initialLength = database.boycotts.length;
    database.boycotts = database.boycotts.filter(e => e.id !== id);
    if (database.boycotts.length < initialLength) {
        await writeDatabaseFile();
        res.status(204).send();
    } else {
        res.status(404).json({ message: "Entité non trouvée" });
    }
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

// server.js (Extrait de la route /api/dashboard/summary)

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
        
        // --- NOUVELLES DONNÉES ---
        const mairiesCount = database.mairies?.length ?? 0;
        const roundaboutCount = database.roundabout_points?.length ?? 0;
        const carrefourCount = database.boycotts?.filter(b => b.name === 'Carrefour')?.length ?? 0;
        const universityCount = database.strategic_locations?.filter(l => l.type === 'Université')?.length ?? 0;
        const bankCount = database.boycotts?.filter(b => b.type === 'Banque')?.length ?? 0;
        // Ajout du comptage des commerces assujettis à la TVA
        const tvaCommerceCount = database.boycotts?.filter(b => b.tax_id === 'tax_vat')?.length ?? 0;


        // Calcul du nombre total de manifestants
        let estimatedManifestantCount = 0;
        if (database.manifestation_points) {
            database.manifestation_points.forEach(point => {
                if (typeof point.count === 'number') {
                    estimatedManifestantCount += point.count;
                } else if (typeof point.count === 'string') {
                    const numberMatch = point.count.match(/\d+/);
                    if (numberMatch) {
                        estimatedManifestantCount += parseInt(numberMatch[0]);
                    } else if (point.count.toLowerCase().includes('plusieurs milliers')) {
                        estimatedManifestantCount += 2000; // Estimation
                    }
                } else if (typeof point.count === 'object' && point.count !== null) {
                    for (const key in point.count) {
                        if (typeof point.count[key] === 'number') {
                            estimatedManifestantCount += point.count[key];
                        }
                    }
                }
            });
        }

        res.json({
            totalTransactions,
            activeAlerts,
            riskyEntities,
            caisseSolde,
            boycottCount,
            ricCount,
            beneficiaryCount,
            monthlyAllocation,
            prefectureCount,
            telegramGroupCount,
            estimatedManifestantCount,
            mairiesCount,
            roundaboutCount,
            universityCount,
            carrefourCount,
            bankCount,
            tvaCommerceCount // Ajout de la nouvelle donnée
        });
    } catch (error) {
        console.error('Erreur lors de la génération du résumé du tableau de bord:', error);
        res.status(500).json({ error: 'Erreur lors de la génération du résumé.' });
    }
});


// ... (fin du code)
app.post('/api/blockchain/recevoir-fonds', async (req, res) => {
    const { amount } = req.body;
    if (!amount) {
        return res.status(400).json({ error: 'Montant manquant.' });
    }
    
    console.log(`SIMULATION : Envoi de ${amount}€ au smart contract.`);
    database.blockchain.transactions.push({
        id: uuidv4(),
        type: 'recevoirFonds',
        amount: amount,
        timestamp: new Date().toISOString()
    });
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
    if (!name || !email || cv_score === undefined) {
        return res.status(400).json({ error: 'Données manquantes pour l\'inscription.' });
    }
    
    const existingBeneficiary = database.beneficiaries.find(b => b.email === email);
    if (existingBeneficiary) {
        return res.status(409).json({ error: 'Cet email est déjà enregistré.' });
    }

    const newBeneficiary = {
        id: uuidv4(),
        name,
        email,
        cv_score: cv_score,
        registration_date: new Date().toISOString()
    };
    
    database.beneficiaries.push(newBeneficiary);
    await writeDatabaseFile();
    
    res.status(201).json({ 
        message: 'Citoyen enregistré avec succès.', 
        beneficiary: newBeneficiary 
    });
});

app.get('/api/camera-points', (req, res) => res.json(database.cameras_points));
app.post('/api/camera-points', async (req, res) => {
    const { name, city, lat, lon, timestamp, video_link } = req.body;
    if (!name || !city || !lat || !lon) {
        return res.status(400).json({ error: 'Données manquantes pour le point de caméra.' });
    }
    
    const newCameraPoint = {
        id: uuidv4(),
        name,
        city,
        lat,
        lon,
        timestamp: timestamp || new Date().toISOString(),
        video_link: video_link || null
    };

    database.cameras_points.push(newCameraPoint);
    await writeDatabaseFile();
    res.status(201).json(newCameraPoint);
});
database.missions = [
    { id: '1', title: 'Collecte de données sur le terrain', description: 'Relevez les positions des caméras de surveillance dans votre ville.', status: 'En cours' },
    { id: '2', title: 'Analyse des articles de loi', description: 'Examinez les modifications proposées aux articles L3121-1 et L4331-1.', status: 'En cours' },
    { id: '3', title: 'Cartographie des points de ralliement', description: 'Identifiez et enregistrez les lieux de manifestation potentiels.', status: 'À venir' }
];

// Nouvelle route d'API pour les missions
app.get('/api/missions', (req, res) => {
    res.json(database.missions);
});

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