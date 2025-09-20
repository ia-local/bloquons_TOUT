// Fichier : routes/telegramRouter.js

// --- 📦 Modules & Librairies 📦 ---
const { Markup } = require('telegraf'); // N'initialisez pas le bot ici
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs/promises');
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');


// --- ⚠️ Fonctions et variables globales ⚠️ ---
// IMPORTANT : Les fonctions de lecture/écriture de fichiers JSON doivent être déplacées
// dans un module utilitaire commun pour éviter la duplication et centraliser les données.
const STATS_FILE = path.join(__dirname, '..', 'data', 'stats.json');
const ORGANIZER_GROUP_ID = "https://ia-local.github.io/Manifest.910-2025"; 

async function readJsonFile(filePath, defaultValue = {}) {
    try {
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
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Erreur d'écriture du fichier ${filePath}:`, error);
    }
}
async function getGroqChatResponse(promptInput, model, systemMessageContent) {
    // La logique de la fonction
    try {
        const messages = [];
        if (systemMessageContent) { messages.push({ role: 'system', content: systemMessageContent }); }
        messages.push({ role: 'user', content: promptInput });
        const chatCompletion = await new Groq({ apiKey: process.env.GROQ_API_KEY }).chat.completions.create({ messages: messages, model: model, temperature: 0.7, max_tokens: 2048 });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error(`Erreur lors de la génération de la réponse IA (Groq model: ${model}):`, error);
        return 'Une erreur est survenue lors du traitement de votre demande. Veuillez réessayer plus tard.';
    }
}
async function getDestitutionInfoMarkdown() {
    return `**La Procédure de Destitution : L'Article 68 de la Constitution**
\nL'Article 68 de la Constitution française prévoit la possibilité de destituer le Président de la République en cas de manquement à ses devoirs manifestement incompatible avec l'exercice de son mandat.
\n https://petitions.assemblee-nationale.fr/initiatives/i-2743
\n\nNotre mouvement demande une application rigoureuse et transparente de cet article, et la mise en place de mécanismes citoyens pour initier et suivre cette procédure.
\nPour le moment, nous recueillons les avis et les soutiens via des sondages et des discussions au sein du bot.
`;
}
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
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- 🤖 Exportation de la logique du Bot 🤖 ---
// Nous exportons une fonction qui prend l'instance du bot en argument
// et y attache tous les gestionnaires d'événements (commandes, actions, etc.).
module.exports = (botInstance) => {

    // --- 🤖 Commandes et Actions du Bot Telegram 🤖 ---
    botInstance.start(async (ctx) => {
        const payload = ctx.startPayload;
        let welcomeMessage = `Bonjour citoyen(ne) ! 👋\n\nBienvenue dans l'espace de mobilisation pour la **Grève Générale du 10 Septembre 2025** et la **Justice Sociale** ! Je suis votre assistant pour le mouvement.`;
        if (payload) { welcomeMessage += `\n\nVous êtes arrivé via un lien d'invitation : \`${payload}\`. Merci de rejoindre notre cause !`; }
        welcomeMessage += `\n\nComment puis-je vous aider à vous informer et à vous engager ?`;
        const inlineKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('📜 Le Manifeste', 'show_manifest')],
            [Markup.button.callback('🗳️ S\'engager (RIC/Pétitions)', 'engage_menu')],
            [Markup.button.callback('❓ Aide & Commandes', 'show_help')]
        ]);
        await ctx.replyWithMarkdown(welcomeMessage, inlineKeyboard);
    });

    // ... Le reste des commandes, actions et 'on' listeners ...
    // Note: Utiliser 'botInstance' partout où vous aviez 'bot'
    botInstance.action('start_menu', async (ctx) => { await ctx.answerCbQuery(); await botInstance.start(ctx); });
    botInstance.action('show_manifest', async (ctx) => {
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
    // ... et ainsi de suite pour toutes les autres commandes et actions.
    
    // Ajoutez le reste de votre code ici, en remplaçant 'bot.' par 'botInstance.'
    
    botInstance.command('stats', async (ctx) => {
        const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
        const statsMessage = `📊 Statistiques d'utilisation du bot :\nTotal de messages traités : ${stats.totalMessages}`;
        await ctx.reply(statsMessage);
    });

    botInstance.command('imagine', async (ctx) => {
        const topic = ctx.message.text.split(' ').slice(1).join(' ');
        if (!topic) {
            await ctx.reply('Veuillez fournir une description pour l\'image. Exemple: /imagine un dragon survolant une ville futuriste');
            return;
        }
        try {
            await ctx.replyWithChatAction('upload_photo');
            await ctx.reply('⏳ Génération de l\'image en cours... Cela peut prendre un moment.');
            const imageDescription = await new Groq({ apiKey: process.env.GROQ_API_KEY }).chat.completions.create({
                messages: [{ role: 'user', content: `Décris une image qui illustre le thème suivant : ${topic}. La description doit être suffisamment détaillée pour générer une image pertinente.` }],
                model: 'gemma2-9b-it'
            }).then(res => res.choices[0].message.content);
            
            const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
            const result = await model.generateContent(imageDescription);
            const response = result.response;
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

    botInstance.on('text', async (ctx) => {
        try {
            const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
            stats.totalMessages = (stats.totalMessages || 0) + 1;
            await writeJsonFile(STATS_FILE, stats);
        } catch (error) {
            console.error('Erreur lors de la mise à jour du compteur de messages:', error);
        }
        
        if (ctx.message.text.startsWith('/')) { return; }
        await ctx.replyWithChatAction('typing');
        try {
            const userMessage = ctx.message.text;
            const aiResponse = await getGroqChatResponse(userMessage, 'gemma2-9b-it', "Vous êtes un assistant utile et informatif pour un tableau de bord de manifestation. Vous répondez aux questions sur le mouvement.");
            await ctx.reply(aiResponse);
        } catch (error) {
            console.error('Échec de la génération de la réponse IA (Telegram) avec gemma2-9b-it:', error);
            await ctx.reply('Une erreur est survenue lors du traitement de votre demande de conversation IA. Veuillez vérifier la configuration de l\'IA ou réessayer plus tard.');
        }
    });

    botInstance.command('contact', async (ctx) => {
        const messageContent = ctx.message.text.split(' ').slice(1).join(' ');
        if (!messageContent) { await ctx.reply('Veuillez fournir le message que vous souhaitez envoyer aux organisateurs. Exemple: /contact J\'ai une idée pour la grève.'); return; }
        if (ORGANIZER_GROUP_ID) {
            try {
                await botInstance.telegram.sendMessage(ORGANIZER_GROUP_ID, `Nouveau message de l'utilisateur ${ctx.from.first_name} (${ctx.from.username || 'ID: ' + ctx.from.id}) :\n\n${messageContent}`);
                await ctx.reply('Votre message a été transmis aux organisateurs. Merci !');
            } catch (error) {
                console.error('Erreur lors de l\'envoi du message aux organisateurs:', error);
                await ctx.reply('Désolé, je n\'ai pas pu transmettre votre message aux organisateurs. Veuillez réessayer plus tard.');
            }
        } else {
            await ctx.reply('Le canal de contact des organisateurs n\'est pas configuré. Veuillez contacter l\'administrateur du bot.');
        }
    });
};