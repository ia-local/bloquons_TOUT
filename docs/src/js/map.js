// Fichier : public/src/js/map.js

import { initLayerMap } from './layerMap.js';
import { initLegend } from './layerLegend.js';
import { openBoycottageFormModal } from './boycottageForm.js';
// import { getMapConfig } from './utils.js'; // Cette ligne n'est plus nécessaire
import { initTimeline } from './chronologie.js'; 
import { initBoycottList } from './boycott.js';

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
            manifestationData // NOUVEAU: Ajout de la variable manquante
        ] = await Promise.all([
            fetchData('database.json'),
            fetchData('src/json/map.json'),
            fetchData('src/json/cnccfp.json'),
            fetchData('src/json/manifestations.json')
        ]);
        
        allData = {
            ...databaseData,
            ...manifestationData,
            cnccfp_partis: cnccfpData
        };

        legendConfig = legendConfigData;
        
        initLayerMap(allData, legendConfig);
        initLegend(legendConfig, allData);
        
        // NOUVEAU: Appel des fonctions pour afficher la chronologie et la liste des boycotts
        initTimeline(allData.chronology);
        initBoycottList(allData.boycotts);
        
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

// L'appel de la fonction d'initialisation se fera depuis app.js
// document.addEventListener('DOMContentLoaded', initMap);