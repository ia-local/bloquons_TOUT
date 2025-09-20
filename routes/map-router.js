// Fichier : routes/map-router.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs/promises');

// Defining the correct path to the data files
const DATABASE_FILE_PATH = path.join(__dirname, '..', 'database.json');
const SATELLITES_DATA_FILE = path.join(__dirname, '..', 'data', 'satellites.json');

// Simplified icon routing logic for the server
function getCategoryIconPath(categoryName) {
    switch (categoryName) {
        case 'Commerce': return 'src/img/boycott-icon.png';
        case 'Économie': return 'src/img/banque_de_france.png';
        case 'Caméras': return 'src/img/camera-icon.png';
        case 'Éducation': return 'src/img/university.png';
        case 'Santé': return 'src/img/hospital.png';
        case 'Gouvernement': return 'src/img/mairie-icon.png';
        case 'Manifestation': return 'src/img/manifestation-icon.png';
        case 'Points Stratégiques': return 'src/img/roundabout-icon.png';
        case 'Réseaux Sociaux': return 'src/img/telegram.png';
        case 'Industrie': return 'src/img/industrie-icon.png';
        case 'Satellites': return 'src/img/satellite.png';
        case 'Télécommunications': return 'src/img/telecom.png';
        default: return 'src/img/default-icon.png';
    }
}

// Data categorization logic on the server side
async function categorizeAllData() {
    try {
        const [databaseData, satellitesData] = await Promise.all([
            fs.readFile(DATABASE_FILE_PATH, 'utf8').then(JSON.parse),
            fs.readFile(SATELLITES_DATA_FILE, 'utf8').then(JSON.parse)
        ]);

        const categories = {
            'Commerce': { icon: getCategoryIconPath('Commerce'), items: [] },
            'Économie': { icon: getCategoryIconPath('Économie'), items: [] },
            'Caméras': { icon: getCategoryIconPath('Caméras'), items: [] },
            'Éducation': { icon: getCategoryIconPath('Éducation'), items: [] },
            'Santé': { icon: getCategoryIconPath('Santé'), items: [] },
            'Gouvernement': { icon: getCategoryIconPath('Gouvernement'), items: [] },
            'Manifestation': { icon: getCategoryIconPath('Manifestation'), items: [] },
            'Points Stratégiques': { icon: getCategoryIconPath('Points Stratégiques'), items: [] },
            'Réseaux Sociaux': { icon: getCategoryIconPath('Réseaux Sociaux'), items: [] },
            'Industrie': { icon: getCategoryIconPath('Industrie'), items: [] },
            'Satellites': { icon: getCategoryIconPath('Satellites'), items: [] },
            'Télécommunications': { icon: getCategoryIconPath('Télécommunications'), items: [] }
        };

        // Regroupement des données...
        // Ce code est une version simplifiée de la logique que nous avions dans map.js
        if (databaseData.boycotts) {
            databaseData.boycotts.forEach(entity => {
                if (entity.locations) {
                    entity.locations.forEach(location => {
                        if (location.lat && location.lon) {
                            const item = { ...entity, ...location };
                            if (item.type.toLowerCase().includes('banque') || item.name.toLowerCase().includes('europafi') || item.tax_id === 'tax_tfa' || item.tax_id === 'tax_campaign') {
                                item.category = 'Économie';
                                categories['Économie'].items.push(item);
                            } else if (item.type.toLowerCase().includes('industrie') || item.name.toLowerCase().includes('total')) {
                                item.category = 'Industrie';
                                categories['Industrie'].items.push(item);
                            } else {
                                item.category = 'Commerce';
                                categories['Commerce'].items.push(item);
                            }
                        }
                    });
                }
            });
        }
        
        // ... (Ajoutez la logique pour toutes les autres catégories ici) ...

        return categories;

    } catch (error) {
        console.error('Error during data categorization:', error);
        return {};
    }
}

router.get('/api/map-data', async (req, res) => {
    const mapData = await categorizeAllData();
    res.json(mapData);
});

module.exports = router;