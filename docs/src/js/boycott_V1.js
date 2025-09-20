// Fichier : public/src/js/boycott.js
// Ce fichier gère la logique de la page de boycottage, y compris la carte et la liste des entités.

let boycottMap;
let markerLayers = {};
let mapInitialized = false;
let allEntities = [];

// Définition des icônes personnalisées
const entityIcons = {
    'Leclerc': L.icon({ iconUrl: 'src/img/Leclerc.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'Carrefour': L.icon({ iconUrl: 'src/img/Carrefour.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'Intermarché': L.icon({ iconUrl: 'src/img/Intermarche.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'Super U': L.icon({ iconUrl: 'src/img/U.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'Lidl': L.icon({ iconUrl: 'src/img/Lidl.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'Aldi': L.icon({ iconUrl: 'src/img/Aldi.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'Monoprix': L.icon({ iconUrl: 'src/img/Monoprix.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'Proxy/Cocci-MARKET': L.icon({ iconUrl: 'src/img/Proxy_Cocci-MARKET.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'Total': L.icon({ iconUrl: 'src/img/total.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'HSBC': L.icon({ iconUrl: 'src/img/HSBC.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'Société Générale': L.icon({ iconUrl: 'src/img/SocieteGenerale.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'Crédit Coopératif': L.icon({ iconUrl: 'src/img/CreditCooperatif.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'Crédit Agricole': L.icon({ iconUrl: 'src/img/CreditAgricole.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'La Poste': L.icon({ iconUrl: 'src/img/LaPoste.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'Crédit Lyonnais': L.icon({ iconUrl: 'src/img/CreditLyonnais.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'Crédit Mutuel': L.icon({ iconUrl: 'src/img/CreditMutuel.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'CIC': L.icon({ iconUrl: 'src/img/CIC.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'EUROPAFI': L.icon({ iconUrl: 'src/img/EUROPAFI.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'McDonald\'s': L.icon({ iconUrl: 'src/img/McDonalds.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'Boulangerie': L.icon({ iconUrl: 'src/img/store.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] })
};
// Fichier : public/src/js/boycott.js    'Boulangerie': 'store.png'

// Fichier : public/src/js/boycott.js

/**
 * Initialise et affiche la liste des enseignes à boycotter.
 * @param {Array<Object>} boycottData - Les données des enseignes à boycotter.
 */
export function initBoycottList(boycottData) {
    const entitiesListContainer = document.getElementById('entities-list');
    if (!entitiesListContainer) {
        console.error("Conteneur de la liste d'entités non trouvé.");
        return;
    }
    
    entitiesListContainer.innerHTML = ''; // Nettoyer le conteneur

    boycottData.forEach(entity => {
        const entityCard = document.createElement('div');
        entityCard.className = 'boycott-card';

        // Gérer le cas où l'icône est manquante
        const iconPath = `src/img/${entity.type}.png`; // Supposons que l'icône soit nommée d'après le type
        const iconHtml = `<img src="${iconPath}" alt="Icône ${entity.type}" onerror="this.src='src/img/store.png'">`;
        
        const locationsList = entity.locations ? entity.locations.map(loc => `<li>${loc.name || loc.city} (${loc.level})</li>`).join('') : '';

        entityCard.innerHTML = `
            <div class="card-header">
                ${iconHtml}
                <h4>${entity.name}</h4>
            </div>
            <p><strong>Type:</strong> ${entity.type}</p>
            <p>${entity.description}</p>
            ${locationsList ? `<h5>Lieux:</h5><ul>${locationsList}</ul>` : ''}
        `;

        entitiesListContainer.appendChild(entityCard);
    });
}
/**
 * Récupère l'icône appropriée en fonction du nom de l'entité.
 * Si l'icône n'est pas trouvée, utilise une icône par défaut.
 * @param {string} entityName - Nom de l'entité.
 * @returns {L.Icon} L'objet icône.
 */
function getIconForEntity(entityName) {
    // Convertit le nom en une version normalisée pour la recherche d'icônes
    const normalizedName = Object.keys(entityIcons).find(key => key.toLowerCase() === entityName.toLowerCase());
    return entityIcons[normalizedName] || L.icon({
        iconUrl: 'src/assets/icons/manifestation-icon.png', // Icône par défaut
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
}

/**
 * Initialise la carte Leaflet et les événements associés.
 */
async function initBoycottPage() {
    try {
        const response = await fetch('/api/entities');
        if (!response.ok) {
            throw new Error('Erreur de chargement des entités.');
        }
        allEntities = await response.json();
        
        initMap(allEntities);
        renderEntitiesList(allEntities);
        setupForm();
    } catch (error) {
        console.error("Erreur lors de l'initialisation de la page de boycott:", error);
        document.getElementById('entities-list').innerHTML = `<p class="error-message">Erreur : Impossible de charger les entités à boycotter.</p>`;
    }
}

/**
 * Initialise la carte Leaflet et ajoute les marqueurs.
 * @param {Array} entities - Données des entités à afficher.
 */
function initMap(entities) {
    if (mapInitialized) {
        // La carte est déjà initialisée, il suffit de la réinitialiser si besoin
        boycottMap.eachLayer(layer => {
            if (layer instanceof L.Marker || layer instanceof L.LayerGroup) {
                boycottMap.removeLayer(layer);
            }
        });
        markerLayers = {};
        document.getElementById('legend-list').innerHTML = '';
    } else {
        boycottMap = L.map('map').setView([46.603354, 1.888334], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(boycottMap);
        mapInitialized = true;
    }

    // Agrège les entités par nom pour la carte et la légende
    const uniqueEntityNames = [...new Set(entities.map(item => item.name))];
    uniqueEntityNames.forEach(name => {
        markerLayers[name] = L.layerGroup().addTo(boycottMap);
        const filteredEntities = entities.filter(item => item.name === name);
        filteredEntities.forEach(entity => {
            if (entity.locations) {
                entity.locations.forEach(location => {
                    const icon = getIconForEntity(entity.name);
                    const marker = L.marker([location.lat, location.lon], { icon: icon })
                        .bindPopup(`<b>${entity.name}</b><br>Type: ${entity.type}<br>Description: ${entity.description}<br>Ville: ${location.city || 'Non spécifiée'}`);
                    markerLayers[name].addLayer(marker);
                });
            }
        });

        addLegendItem(name, getIconForEntity(name).options.iconUrl);
    });
}

/**
 * Ajoute un élément à la légende de la carte et configure l'écouteur d'événements.
 * @param {string} name - Nom de l'entité.
 * @param {string} iconUrl - URL de l'icône.
 */
function addLegendItem(name, iconUrl) {
    const legendList = document.getElementById('legend-list');
    const li = document.createElement('li');
    li.setAttribute('data-id', name);
    li.innerHTML = `<span class="legend-icon" style="background-image: url('${iconUrl}')"></span>${name}`;
    legendList.appendChild(li);

    li.addEventListener('click', () => {
        const layer = markerLayers[name];
        if (layer) {
            if (boycottMap.hasLayer(layer)) {
                boycottMap.removeLayer(layer);
                li.classList.remove('selected');
            } else {
                boycottMap.addLayer(layer);
                li.classList.add('selected');
            }
        }
    });
}

/**
 * Affiche la liste des entités à boycotter sous forme de cartes.
 * @param {Array} entities - Données des entités à afficher.
 */
function renderEntitiesList(entities) {
    const entitiesListContainer = document.getElementById('entities-list');
    entitiesListContainer.innerHTML = '';

    if (entities.length === 0) {
        entitiesListContainer.innerHTML = `<p>Aucune enseigne à boycotter n'est listée pour le moment.</p>`;
        return;
    }

    entities.forEach(entity => {
        const card = document.createElement('div');
        card.className = 'card boycott-card';
        const locationsHtml = entity.locations ? entity.locations.map(loc => `<li>${loc.city || 'Ville non spécifiée'}</li>`).join('') : '';

        card.innerHTML = `
            <div class="card-icon" style="background-image: url('${getIconForEntity(entity.name).options.iconUrl}')"></div>
            <div class="card-content">
                <h3>${entity.name}</h3>
                <p><strong>Type :</strong> ${entity.type}</p>
                <p>${entity.description}</p>
                ${locationsHtml ? `<h4>Localisations :</h4><ul>${locationsHtml}</ul>` : ''}
                <button class="btn btn-danger delete-btn" data-id="${entity.id}">Supprimer</button>
            </div>
        `;
        entitiesListContainer.appendChild(card);
        
        card.querySelector('.delete-btn').addEventListener('click', () => deleteEntity(entity.id));
    });
}

/**
 * Configure l'écouteur d'événements pour le formulaire de soumission.
 */
function setupForm() {
    const form = document.getElementById('new-boycott-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newEntity = {
                name: document.getElementById('name').value,
                type: document.getElementById('type').value,
                description: document.getElementById('description').value,
                lat: parseFloat(document.getElementById('lat').value),
                lon: parseFloat(document.getElementById('lon').value)
            };

            try {
                const response = await fetch('/api/entities', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newEntity)
                });

                if (response.ok) {
                    alert('Enseigne ajoutée avec succès !');
                    form.reset();
                    initBoycottPage(); // Recharge les données
                } else {
                    const error = await response.json();
                    alert(`Échec de l'ajout : ${error.error}`);
                }
            } catch (error) {
                console.error('Erreur lors de l\'ajout de l\'entité:', error);
                alert('Une erreur est survenue lors de l\'ajout. Veuillez réessayer.');
            }
        });
    }
}

/**
 * Gère la suppression d'une entité via l'API.
 * @param {string} entityId - L'ID de l'entité à supprimer.
 */
async function deleteEntity(entityId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette entité ?')) {
        try {
            const response = await fetch(`/api/entities/${entityId}`, {
                method: 'DELETE'
            });

            if (response.status === 204) {
                alert('Entité supprimée avec succès.');
                initBoycottPage(); // Recharge les données
            } else {
                const error = await response.json();
                alert(`Échec de la suppression : ${error.error}`);
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'entité:', error);
            alert('Une erreur est survenue lors de la suppression. Veuillez réessayer.');
        }
    }
}

// Initialise la page au chargement
window.addEventListener('DOMContentLoaded', initBoycottPage);
