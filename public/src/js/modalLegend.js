// Fichier : public/src/js/modalLegend.js

// Cache pour stocker temporairement les données de la base de données
let dataCache = null;

/**
 * Charge la base de données une seule fois pour optimiser les performances.
 * @returns {Promise<Object>} Les données complètes de la base de données.
 */
async function loadDatabaseData() {
    if (dataCache) {
        return dataCache;
    }
    try {
        const response = await fetch('/database.json');
        if (!response.ok) {
            throw new Error(`Erreur de chargement de la base de données : ${response.statusText}`);
        }
        dataCache = await response.json();
        return dataCache;
    } catch (error) {
        console.error('Erreur lors de la récupération des données de la base de données:', error);
        return null;
    }
}

/**
 * Ouvre la modale pour afficher les détails d'un point de la carte.
 * Cette fonction est appelée par un bouton dans le pop-up de la carte.
 * @param {string} itemId - L'ID unique de l'élément à afficher.
 * @param {string} itemCategory - La catégorie de l'élément (Dossiers de Preuves, Assemblée Générale, etc.).
 */
export async function openModalLegend(itemId, itemCategory) {
    const allData = await loadDatabaseData();
    if (!allData) {
        console.error("Impossible de charger les données de la base.");
        return;
    }

    let item = null;

    // Chercher l'élément en fonction de sa catégorie
    if (itemCategory === 'Dossiers de Preuves' || itemCategory === 'Assemblée Générale') {
        if (allData.affaires && allData.affaires.chronology) {
            item = allData.affaires.chronology.find(i => i.id === itemId);
        }
    } else if (itemCategory === 'Intersyndical') {
        item = allData.syndicats.find(i => i.name === itemId);
    }
    
    if (!item) {
        console.error(`Élément introuvable : ID=${itemId}, Catégorie=${itemCategory}`);
        return;
    }
    
    // Crée la structure de la modale si elle n'existe pas
    let modal = document.getElementById('legend-modal');
    if (!modal) {
        modal = createModalStructure();
    }
    
    // Afficher le contenu de l'élément
    const modalBody = document.getElementById('legend-modal-body');
    modalBody.innerHTML = getItemContent(item, allData);
    
    // Afficher la modale
    modal.style.display = 'block';
}

/**
 * Crée la structure HTML de base de la modale.
 * @returns {HTMLElement} La modale créée.
 */
function createModalStructure() {
    const modal = document.createElement('div');
    modal.id = 'legend-modal';
    modal.className = 'modal-legend';
    modal.innerHTML = `
        <div class="modal-legend-content">
            <span class="close-btn" id="close-legend-modal-btn">&times;</span>
            <div id="legend-modal-body" class="modal-body-content">
                </div>
        </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = document.getElementById('close-legend-modal-btn');
    closeBtn.onclick = () => modal.style.display = 'none';

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    return modal;
}

/**
 * Récupère le contenu HTML détaillé pour un élément.
 * @param {Object} item - L'objet de l'élément à afficher.
 * @param {Object} allData - Les données de la base de données pour les sources.
 * @returns {string} Le contenu HTML formaté.
 */
function getItemContent(item, allData) {
    const sources = allData.sources || [];
    const source = item.source_id ? sources.find(s => s.id === item.source_id) : null;
    const sourceHtml = source 
        ? `<p><strong>Source:</strong> <a href="${source.url}" target="_blank">${source.description} (${source.type})</a></p>`
        : '<p>Aucune source disponible.</p>';
    
    return `
        <div class="modal-header">
            <h2>${item.title || item.name}</h2>
            <p>${item.description}</p>
        </div>
        <div class="modal-body">
            <h4>Détails de l'événement</h4>
            <p><strong>Lieu:</strong> ${item.city}</p>
            <p><strong>Date:</strong> ${new Date(item.start_date || item.date).toLocaleDateString()}</p>
            ${sourceHtml}
            ${item.video_link ? `<p><strong>Preuve vidéo:</strong> <a href="${item.video_link}" target="_blank">Voir la vidéo</a></p>` : ''}
            </div>
    `;
}