// Fichier : public/src/js/map.js

import { initLayerMap } from './layerMap.js';
import { initLegend } from './layerLegend.js';
import { openBoycottageFormModal } from './boycottageForm.js';
// Les imports suivants sont commentés car les fichiers sources n'ont pas été fournis.
// import { initTimeline } from './chronologie.js';
// import { initBoycottList } from './boycott.js';
import { initUserLayer } from './layerUser.js'; // Ajout de l'import pour le nouveau module utilisateur

let allData = {};
let legendConfig = {};

/**
 * Fonction principale pour initialiser la page de la carte.
 * Charge les données et la configuration de manière asynchrone.
 */
export async function initMap() {
    try {
        const [
            databaseData, 
            legendConfigData, 
            cnccfpData,
            manifestationData,
            ricData,
            userCvData, // NOUVEAU: Chargement des données des CV
            usersMilitantData // NOUVEAU: Chargement des données des militants
        ] = await Promise.all([
            fetchData('database.json'),
            fetchData('src/json/map.json'),
            fetchData('src/json/cnccfp.json'),
            fetchData('src/json/manifestations.json'),
            fetchData('src/json/ric-map.json'),
            fetchData('src/json/user-cv.json'), // NOUVEAU: Appel à fetchData
            fetchData('src/json/users-militant.json') // NOUVEAU: Appel à fetchData
        ]);
        
        // Fusionne toutes les données en un seul objet
        allData = {
            ...databaseData,
            ...manifestationData,
            cnccfp_partis: cnccfpData,
            rics: ricData.rics,
            users_cv: userCvData.users_cv, // NOUVEAU: Ajout des utilisateurs CV
            users_militant: usersMilitantData.users_militant // NOUVEAU: Ajout des utilisateurs militants
        };

        legendConfig = legendConfigData;
        
        initLayerMap(allData, legendConfig);
        initLegend(legendConfig, allData);
        
        // Initialise la couche utilisateur avec les nouvelles données
        initUserLayer(allData); // NOUVEAU: Appel du module utilisateur

        // Exemple d'appels de fonctions de modules annexes
        // if (allData.chronology) initTimeline(allData.chronology);
        // if (allData.boycotts) initBoycottList(allData.boycotts);
        
        attachMapEvents();
        console.log("Carte et légende initialisées avec les données asynchrones.");
    } catch (error) {
        console.error('Erreur lors du chargement des données de la carte:', error);
    }
}

/**
 * Fonction générique pour récupérer les données d'un fichier JSON.
 * @param {string} url - L'URL du fichier JSON.
 * @returns {Promise<Object>} - Une promesse qui résout avec les données JSON.
 */
async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Erreur de chargement de ${url}: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Attache les écouteurs d'événements spécifiques à la page de la carte.
 */
function attachMapEvents() {
    const openFormBtn = document.getElementById('open-boycott-modal-btn');
    if (openFormBtn) {
        openFormBtn.addEventListener('click', openBoycottageFormModal);
    }
}