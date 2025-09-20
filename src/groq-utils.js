const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const express = require('express');
const bot = express();

bot.use(express.static('../public/')); // Sert les fichiers statiques (HTML, CSS, JS)

// Routage pour servir index.html à la racine du serveur
bot.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

bot.get('/evenements', async (req, res) => {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'assistant', content: `** **<br/> | in box |.`, },
                {
                    role: 'user',
                    content: `** Générez 5 idées d'événements innovants pour promouvoir l'IA à Caen. Incluez des titres, des descriptions et des formats. Ta réponse de t'être rédigé au format liste en HTML, respectant les normes du Web sémantique W3C intégrant des emoji intélligent associer.`,
                },
            ],
            model: 'gemma2-9b-it',
        });
  
        res.status(200).send(chatCompletion.choices[0].message.content);
    } catch (error) {
        res.status(500).send('Une erreur est survenue');
    }
  });

async function generateResponse(req, res) {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Le champ "prompt" est requis.' });
        }

        const response = await groq.chat.completions.create({
            model: 'gemma2-9b-it',
            messages: [
                { role: 'assistant', content: "welcom @worker_Pibot tu es l'intelligence artificielle au cœur du projet C, intitulé « blog des Séveloppeurs ». Tu résides donc à cette adresse https://wp.univers-mc.cloud wp-admin worldpress, bienvenu dans le code source main.js nodeJs. Dont le thème world wp-content/themes/XordThemes/$ blog world t'es indexé en système version sur GitHub https://github.com/universmc/blog/, Si tout est bien compris, nous allons commencer par les présentations." },
                { role: 'user', content: prompt }
            ],
        });

        const message = response.choices[0].message.content;
        res.json({ message });
    } catch (error) {
        console.error('Erreur lors de la requête GROQ:', error);
        res.status(500).json({ error: 'Erreur lors de la requête à l\'API GROQ.' });
    }
}

async function makeResponse(req, res) {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Le champ "prompt" est requis.' });
        }

        const response = await groq.chat.completions.create({
            model: 'llama3-8b-8192',
            messages: [
                { role: 'assistant', content: "welcom @worker_Pibot tu es l'intelligence artificielle au cœur du projet C, intitulé « blog des Séveloppeurs ». Tu résides donc à cette adresse https://wp.univers-mc.cloud wp-admin worldpress, bienvenu dans le code source main.js nodeJs. Dont le thème world wp-content/themes/XordThemes/$ blog world t'es indexé en système version sur GitHub https://github.com/universmc/blog/, Si tout est bien compris, nous allons commencer par les présentations." },
                { role: 'user', content: prompt }
            ],
        });

        const message = response.choices[0].message.content;
        res.json({ message });
    } catch (error) {
        console.error('Erreur lors de la requête GROQ:', error);
        res.status(500).json({ error: 'Erreur lors de la requête à l\'API GROQ.' });
    }
}

module.exports = { generateResponse, makeResponse };