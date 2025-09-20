// Fichier : routes/camera.js
const express = require('express');
const router = express.Router();
const ee = require('@google/earthengine');
const Groq = require('groq-sdk');
const axios = require('axios');

// Votre base de données de satellites
const SATELLITES_DATA = require('../data/satellites.json');

module.exports = (groq) => {
    router.post('/analyze-satellite', async (req, res) => {
        const { lat, lon, timestamp } = req.body;
        if (!lat || !lon || !timestamp) {
            return res.status(400).json({ error: 'Latitude, longitude et timestamp sont requis.' });
        }

        // Logic to fetch satellite image via Google Earth Engine
        const point = ee.Geometry.Point(parseFloat(lon), parseFloat(lat));
        const imageCollection = ee.ImageCollection('COPERNICUS/S2_SR')
            .filterDate(timestamp)
            .filterBounds(point);
        
        const firstImage = imageCollection.sort('CLOUD_COVER', false).first();
        const url = firstImage.getThumbURL({
            'min': 0, 'max': 3000, 'bands': ['B4', 'B3', 'B2'],
            'dimensions': 1024
        });
        
        let base64Image = null;
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            base64Image = Buffer.from(response.data, 'binary').toString('base64');
        } catch (err) {
            console.error('Failed to download satellite thumbnail:', err.message);
            return res.status(500).json({ error: 'Échec du téléchargement de l\'image satellite.' });
        }

        // Logic to analyze image with Groq Vision API
        const groqResponse = await groq.chat.completions.create({
            model: "your-groq-vision-model", // Utilisez le nom de votre modèle de vision
            messages: [{
                role: "user",
                content: [{
                    type: "image_url",
                    image_url: { url: `data:image/jpeg;base64,${base64Image}` }
                }, {
                    type: "text",
                    text: "Compte le nombre de personnes sur cette image satellite et estime la foule. Réponds avec un objet JSON {'count': number, 'description': 'string'}."
                }]
            }]
        });

        res.json({
            analysis: groqResponse.choices[0].message.content,
            satellite_data: SATELLITES_DATA
        });
    });

    return router;
};