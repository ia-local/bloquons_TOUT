// Fichier : routes/telegramRouter.js

const { Telegraf, Markup } = require('telegraf');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs/promises');
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- CONSTANTES ET VARIABLES GLOBALES ---
const STATS_FILE = path.join(__dirname, '..', 'data', 'stats.json');
const DATABASE_FILE_PATH = path.join(__dirname, '..', 'data', 'database.json');
const ORGANIZER_GROUP_ID = "https://ia-local.github.io/Manifest.910-2025";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY || '';

// Initialisations des services
const groq = new Groq({ apiKey: GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const bot = new Telegraf(TELEGRAM_API_KEY, {
    telegram: { webhookReply: true }
});
let database = {};

// --- FONCTIONS UTILITAIRES (pour l'autonomie du module) ---
async function readJsonFile(filePath, defaultValue = {}) {
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
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
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Erreur d'écriture du fichier ${filePath}:`, error);
    }
}
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
async function getManifestationInfo() {
  const info = `Voici quelques informations sur la manifestation : \n\n` +
               `**Date :** 10 Septembre 2025\n` +
               `**Objectif :** Grève Générale pour la Justice Sociale\n` +
               `**Points de ralliement :** Paris (Place de la République), Lyon (Place Bellecour), Marseille (Vieux-Port). D'autres lieux seront annoncés prochainement.`;
  return info;
}


// --- 🤖 EXPORTATION DE LA LOGIQUE DU BOT 🤖 ---
bot.start(async (ctx) => {
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
bot.action('start_menu', async (ctx) => { await ctx.answerCbQuery(); await bot.start(ctx); });
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
bot.command('manifeste', (ctx) => { ctx.reply('Le Manifeste du mouvement pour le 10 septembre est le suivant...'); });
bot.command('destitution', async (ctx) => { await ctx.replyWithMarkdown(await getDestitutionInfoMarkdown()); });
bot.command('ric', async (ctx) => { await ctx.replyWithMarkdown(await getRicInfoMarkdown()); });
bot.command('greve', async (ctx) => { await ctx.replyWithMarkdown(await getManifestationInfo()); });
bot.command('imagine', async (ctx) => {
    const topic = ctx.message.text.split(' ').slice(1).join(' ');
    if (!topic) { await ctx.reply('Veuillez fournir une description pour l\'image. Exemple: /imagine un dragon survolant une ville futuriste'); return; }
    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ Génération de l\'image en cours... Cela peut prendre un moment.');
        const imageDescription = await groq.chat.completions.create({ messages: [{ role: 'user', content: `Décris une image qui illustre le thème suivant : ${topic}. La description doit être suffisamment détaillée pour générer une image pertinente.` }], model: 'gemma2-9b-it' }).then(res => res.choices[0].message.content);
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
        // Pour les sondages, il faut gérer la base de données de manière plus robuste
        const db = await readJsonFile(DATABASE_FILE_PATH, { polls: [] });
        if (!db.polls) { db.polls = []; }
        db.polls.push({ id: pollId, messageId: message.message_id, question: question, options: options.map(opt => ({ text: opt, votes: 0 })), creatorId: ctx.from.id });
        await writeJsonFile(DATABASE_FILE_PATH, db);
    } catch (error) { console.error('Erreur lors de la création du sondage:', error); }
});
bot.on('poll_answer', async (ctx) => {
    const db = await readJsonFile(DATABASE_FILE_PATH, { polls: [] });
    const pollIndex = db.polls.findIndex(p => p.messageId === ctx.pollAnswer.poll_id);
    if (pollIndex !== -1) {
        ctx.pollAnswer.option_ids.forEach(optionIndex => { db.polls[pollIndex].options[optionIndex].votes++; });
        await writeJsonFile(DATABASE_FILE_PATH, db);
    }
});
bot.on('text', async (ctx) => {
    try {
        const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
        stats.totalMessages = (stats.totalMessages || 0) + 1;
        await writeJsonFile(STATS_FILE, stats);
    } catch (error) { console.error('Erreur lors de la mise à jour du compteur de messages:', error); }
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
bot.command('contact', async (ctx) => {
    const messageContent = ctx.message.text.split(' ').slice(1).join(' ');
    if (!messageContent) { await ctx.reply('Veuillez fournir le message que vous souhaitez envoyer aux organisateurs. Exemple: /contact J\'ai une idée pour la grève.'); return; }
    if (ORGANIZER_GROUP_ID) {
        try {
            await bot.telegram.sendMessage(ORGANIZER_GROUP_ID, `Nouveau message de l'utilisateur ${ctx.from.first_name} (${ctx.from.username || 'ID: ' + ctx.from.id}) :\n\n${messageContent}`);
            await ctx.reply('Votre message a été transmis aux organisateurs. Merci !');
        } catch (error) { console.error('Erreur lors de l\'envoi du message aux organisateurs:', error); await ctx.reply('Désolé, je n\'ai pas pu transmettre votre message aux organisateurs. Veuillez réessayer plus tard.'); }
    } else { await ctx.reply('Le canal de contact des organisateurs n\'est pas configuré. Veuillez contacter l\'administrateur du bot.'); }
});
bot.on('message', async (msg) => {
  if (msg.text && msg.text.toLowerCase().includes('manifestation')) {
    const response = await getManifestationInfo();
    bot.telegram.sendMessage(msg.chat.id, response);
  }
});


module.exports = bot;