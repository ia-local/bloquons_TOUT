// Fichier : public/src/js/layerUser.js

import { getMapInstance, getMarkerLayers } from './layerMap.js';

let userCvData = {};
let usersMilitantData = {};

/**
 * Initialise le module de gestion des données utilisateur.
 */
export async function initUserLayer() {
    try {
        const [cvData, militantData] = await Promise.all([
            fetchData('/src/json/user-cv.json'),
            fetchData('/src/json/users-militant.json')
        ]);
        
        userCvData = cvData;
        usersMilitantData = militantData;
        
        renderUserCvList();
        renderMilitantList();
        
        console.log("Module utilisateur et militant initialisé.");
    } catch (error) {
        console.error("Erreur lors de l'initialisation des données utilisateur:", error);
    }
}

/**
 * Récupère et affiche la liste des utilisateurs du CV.
 */
function renderUserCvList() {
    const userCvContainer = document.getElementById('users-cv');
    if (!userCvContainer) return;

    if (userCvData.users_cv && userCvData.users_cv.length > 0) {
        userCvContainer.innerHTML = userCvData.users_cv.map(user => `
            <div class="user-cv-card">
                <h3>${user.name}</h3>
                <p>Score CVNU: ${user.cvnu_score}</p>
            </div>
        `).join('');
    } else {
        userCvContainer.innerHTML = '<p>Aucun utilisateur CV trouvé.</p>';
    }
}

/**
 * Récupère et affiche la liste des utilisateurs militants.
 */
function renderMilitantList() {
    const usersMilitantContainer = document.getElementById('users-militant');
    if (!usersMilitantContainer) return;

    if (usersMilitantData.users_militant && usersMilitantData.users_militant.length > 0) {
        usersMilitantContainer.innerHTML = usersMilitantData.users_militant.map(user => `
            <div class="user-militant-card">
                <h3>${user.name}</h3>
                <p>Score Militant: ${user.militant_score}</p>
            </div>
        `).join('');
    } else {
        usersMilitantContainer.innerHTML = '<p>Aucun militant trouvé.</p>';
    }
}

/**
 * Fonction utilitaire pour récupérer un fichier JSON.
 */
async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Erreur de chargement de ${url}: ${response.statusText}`);
    }
    return response.json();
}