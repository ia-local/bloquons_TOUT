// routes/visionai.js
const express = require('express');
const router = express.Router();
const ee = require('@google/earthengine');
const fs = require('fs');
const axios = require('axios'); // Importez la bibliothèque axios

module.exports = (groq) => {
    // Load satellite metadata once
    const satelliteData = JSON.parse(fs.readFileSync('./data/satellites.json', 'utf8'));
    const findSatelliteInfo = (id) => satelliteData.find(sat => sat.id === id);

    router.post('/vision', async (req, res) => {
        const { lat, lng } = req.body;
        if (!lat || !lng) {
            return res.status(400).send('Latitude and longitude are required.');
        }

        const point = ee.Geometry.Point(parseFloat(lng), parseFloat(lat));
        
        let thumbnailUrl = null;
        let selectedSatelliteInfo = null;
        let error = null;

        // Loop through satellite sources to find a valid image
        for (const source of satelliteData) {
            if (source.bands.length === 0) continue;

            try {
                const imageCollection = ee.ImageCollection(source.id)
                    .filterDate('2024-01-01', '2025-01-01')
                    .filterBounds(point)
                    .sort(source.sort)
                    .first();

                const hasImage = await new Promise((resolve, reject) => {
                    imageCollection.getInfo((info, err) => {
                        if (err || !info) {
                            resolve(false);
                        } else {
                            resolve(true);
                        }
                    });
                });

                if (hasImage) {
                    const rgbImage = imageCollection.select(source.bands);
                    // Generate the temporary URL
                    thumbnailUrl = await rgbImage.getThumbURL({ dimensions: 512, format: 'jpeg' });
                    selectedSatelliteInfo = source;
                    break;
                }

            } catch (err) {
                console.error(`Error processing ${source.id}: ${err.message}`);
                error = err;
            }
        }

        if (!thumbnailUrl) {
            return res.status(404).json({
                description: "Aucune image satellite de haute qualité n'a pu être trouvée pour cette zone et cette période. Veuillez réessayer ou choisir un autre endroit."
            });
        }
        
        // --- NOUVEAU CODE : TÉLÉCHARGEZ ET CONVERTISSEZ L'IMAGE ---
        let base64Image = null;
        try {
            const response = await axios.get(thumbnailUrl, { responseType: 'arraybuffer' });
            base64Image = Buffer.from(response.data, 'binary').toString('base64');
        } catch (err) {
            console.error('Failed to download thumbnail:', err.message);
            return res.status(500).json({ description: "Une erreur est survenue lors du téléchargement de l'image satellite." });
        }

        try {
            // Prepare the prompt with satellite data
            const satelliteDetails = selectedSatelliteInfo.realtime_data
                ? `Informations sur le satellite ${selectedSatelliteInfo.name}:\n` +
                  Object.entries(selectedSatelliteInfo.realtime_data).map(([key, value]) => `  - ${key}: ${value}`).join('\n')
                : `Informations sur le satellite : ${selectedSatelliteInfo.name}`;
            
            const prompt = `Analyse cette image satellite. ${satelliteDetails}\n\nCoordonnées: Lat ${lat}, Lng ${lng}. Fournis une description détaillée du terrain, de la végétation et des infrastructures.`;

            const chatCompletion = await groq.chat.completions.create({
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            { "type": "text", "text": prompt },
                            {
                                "type": "image_url",
                                "image_url": { "url": `data:image/jpeg;base64,${base64Image}` }
                            }
                        ]
                    }
                ],
                "model": "meta-llama/llama-4-scout-17b-16e-instruct",
                "temperature": 0.7,
                "max_completion_tokens": 1024
            });

            res.json({ description: chatCompletion.choices[0].message.content });
        } catch (err) {
            console.error('Vision AI error:', err.message);
            res.status(500).json({ description: "An error occurred during AI analysis." });
        }
    });

    return router;
};