// routes/ndvianalysis.js
const express = require('express');
const router = express.Router();
const ee = require('@google/earthengine');

module.exports = (groq) => {
    router.post('/ndvi', async (req, res) => {
        const { lat, lng } = req.body;
        if (!lat || !lng) {
            return res.status(400).send('Latitude and longitude are required.');
        }

        const point = ee.Geometry.Point(parseFloat(lng), parseFloat(lat));
        const landsat8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
            .filterDate('2024-01-01', '2025-01-01')
            .filterBounds(point);

        try {
            const recentImage = landsat8.sort('system:time_start', false).first();
            const ndvi = recentImage.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');
            const ndviVis = { min: -0.2, max: 0.8, palette: ['brown', 'yellow', 'green', 'darkgreen'] };
            
            // Wrap the callback-based getMapId into a Promise
            const ndviMapId = await new Promise((resolve, reject) => {
                ndvi.getMap(ndviVis, (mapId, error) => {
                    if (error) {
                        return reject(new Error(error));
                    }
                    resolve(mapId);
                });
            });

            res.json({ ndviLayer: ndviMapId });
        } catch (error) {
            console.error('Error in NDVI analysis:', error);
            res.status(500).send('Failed to compute NDVI.');
        }
    });
    return router;
};