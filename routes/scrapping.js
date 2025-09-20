// Fichier : routes/scraping.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { parse } = require('node-html-parser');

const CAMERA_URL = 'https://sunders.uber.space/fr/#what';

router.get('/camera-scrape', async (req, res) => {
    try {
        const { data } = await axios.get(CAMERA_URL);
        const root = parse(data);
        const cameraPoints = [];

        // Logique de scraping pour extraire les données de la page
        // Cette partie dépend de la structure HTML du site.
        // C'est un exemple, vous devrez ajuster les sélecteurs
        root.querySelectorAll('.camera-item').forEach(element => {
            const name = element.querySelector('h3')?.text.trim();
            const lat = parseFloat(element.getAttribute('data-lat'));
            const lon = parseFloat(element.getAttribute('data-lon'));
            const video_link = element.querySelector('a.video-link')?.getAttribute('href');
            
            if (name && !isNaN(lat) && !isNaN(lon)) {
                cameraPoints.push({
                    name,
                    lat,
                    lon,
                    video_link,
                    timestamp: new Date().toISOString()
                });
            }
        });

        res.json(cameraPoints);
    } catch (error) {
        console.error('Erreur de scraping:', error);
        res.status(500).json({ error: 'Échec du scraping des données de caméras.' });
    }
});

module.exports = router;