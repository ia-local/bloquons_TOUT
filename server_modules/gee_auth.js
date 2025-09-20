// server_modules/gee_auth.js
const fs = require('fs/promises');
const ee = require('@google/earthengine');
const path = require('path');

const EE_PRIVATE_KEY_PATH = path.join(__dirname, '..', 'private-key.json');
let EE_PRIVATE_KEY = {};

/**
 * 🔑 Loads the Google Earth Engine private key from a file.
 */
async function loadEarthEnginePrivateKey() {
    try {
        const privateKeyData = await fs.readFile(EE_PRIVATE_KEY_PATH, 'utf8');
        EE_PRIVATE_KEY = JSON.parse(privateKeyData);
        console.log('Clé privée Earth Engine chargée avec succès.');
    } catch (error) {
        console.error('Erreur lors du chargement de la clé privée Earth Engine:', error);
        // Do not exit, allow the rest of the server to start if GEE is not critical
        // throw error; // Uncomment this if GEE is a critical dependency
    }
}

/**
 * 🔒 Authenticates with the Google Earth Engine API.
 * @returns {Promise<void>}
 */
async function authenticateEarthEngine() {
    return new Promise((resolve, reject) => {
        ee.data.authenticateViaPrivateKey(
            EE_PRIVATE_KEY,
            () => {
                ee.initialize(null, null, resolve, reject);
                console.log('Authentification et initialisation de Google Earth Engine réussies.');
            },
            (err) => {
                console.error('Erreur d\'authentification de Google Earth Engine:', err);
                reject(err);
            }
        );
    });
}

// 📤 Export the functions so they can be used elsewhere
module.exports = {
    loadEarthEnginePrivateKey,
    authenticateEarthEngine
};