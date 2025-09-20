// Fichier : public/src/js/map.js
// Ce fichier gère l'initialisation et l'affichage de la carte Leaflet.
import { openIpCamModal } from './ipCam.js';

let map;
let markerLayers = {};
let mapInitialized = false;
let allData = {};

// --- Définition des icônes personnalisées ---
const manifestationIcon = L.icon({ iconUrl: 'src/img/manifestation-icon.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
const mairieIcon = L.icon({ iconUrl: 'src/img/mairie-icon.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
const prefectureIcon = L.icon({ iconUrl: 'src/img/pref.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
const telegramIcon = L.icon({ iconUrl: 'src/img/telegram.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
const universityIcon = L.icon({ iconUrl: 'src/img/university.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
const hospitalIcon = L.icon({ iconUrl: 'src/img/hospital.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
const roundaboutIcon = L.icon({ iconUrl: 'src/img/roundabout-icon.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
const porteIcon = L.icon({ iconUrl: 'src/img/porte-icon.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
const elyseeIcon = L.icon({ iconUrl: 'src/img/boutique.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
const banqueDeFranceIcon = L.icon({ iconUrl: 'src/img/banque_de_france.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
const cameraIcon = L.icon({ iconUrl: 'src/img/camera-icon.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
const fixedCameraIcon = L.icon({ iconUrl: 'src/img/fixed-camera.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
const panoramicCameraIcon = L.icon({ iconUrl: 'src/img/panoramic-camera.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
const domeCameraIcon = L.icon({ iconUrl: 'src/img/dome-camera.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
const guardIcon = L.icon({ iconUrl: 'src/img/guard-icon.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
const alprIcon = L.icon({ iconUrl: 'src/img/alpr-icon.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
const boycottIcon = L.icon({ iconUrl: 'src/img/boycott-icon.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });

const entityIcons = {
    'Leclerc': L.icon({ iconUrl: 'src/img/Leclerc.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'Carrefour': L.icon({ iconUrl: 'src/img/Carrefour.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'Amazon': L.icon({ iconUrl: 'src/img/Amazon-icon.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'Intermarché': L.icon({ iconUrl: 'src/img/Intermarche.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'Super U': L.icon({ iconUrl: 'src/img/U.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
    'Auchan': L.icon({ iconUrl: 'src/img/Auchan.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
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
    'Banque de France': banqueDeFranceIcon,
    'Camera Point': cameraIcon,
    'McDonald\'s': L.icon({ iconUrl: 'src/img/McDonalds.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] })
};

function getIconForEntity(entityName) {
    if (entityIcons[entityName]) {
        return entityIcons[entityName];
    }
    if (entityName.toLowerCase().includes('banque') || entityName.toLowerCase().includes('crédit')) {
        return banqueDeFranceIcon;
    }
    return boycottIcon;
}

function getIconForCameraPoint(cameraType) {
    switch (cameraType) {
        case 'fixed': return fixedCameraIcon;
        case 'panning': return panoramicCameraIcon;
        case 'dome': return domeCameraIcon;
        case 'guard': return guardIcon;
        case 'ALPR': return alprIcon;
        default: return cameraIcon;
    }
}

/**
 * Catégorise et enrichit les données de la carte.
 * @param {Object} allData - L'objet contenant toutes les données de la base de données.
 */
function categorizeData(allData) {
    const categories = {
        'Commerce': { icon: boycottIcon, items: [] },
        'Banque': { icon: banqueDeFranceIcon, items: [] },
        'Caméras': { icon: cameraIcon, items: [] },
        'Éducation': { icon: universityIcon, items: [] },
        'Santé': { icon: hospitalIcon, items: [] },
        'Mairies': { icon: mairieIcon, items: [] },
        'Préfectures': { icon: prefectureIcon, items: [] },
        'Gouvernement': { icon: elyseeIcon, items: [] },
        'Manifestation': { icon: manifestationIcon, items: [] },
        'Points Stratégiques': { icon: roundaboutIcon, items: [] },
        'Télégram': { icon: telegramIcon, items: [] }
    };
    
    // Ajoute les commerces et banques
    if (allData.boycotts) {
        allData.boycotts.forEach(entity => {
            if (entity.locations) {
                entity.locations.forEach(location => {
                    if (location.lat && location.lon) {
                        const item = { ...entity, ...location, category: 'Commerce' };
                        if (entity.type.toLowerCase().includes('banque') || entity.type.toLowerCase().includes('financière')) {
                            item.category = 'Banque';
                            categories['Banque'].items.push(item);
                        } else if (entity.type.toLowerCase().includes('distribution') || entity.type.toLowerCase().includes('restauration')) {
                            categories['Commerce'].items.push(item);
                        } else {
                            categories['Commerce'].items.push(item);
                        }
                    }
                });
            }
        });
    }

    if (allData.cameras_points) {
        allData.cameras_points.forEach(point => {
            if (point.lat && point.lon) {
                categories['Caméras'].items.push({ ...point, category: 'Caméras' });
            }
        });
    }

    if (allData.strategic_locations) {
        allData.strategic_locations.forEach(location => {
            if (location.lat && location.lon) {
                if (location.type === 'Université') {
                    categories['Éducation'].items.push({ ...location, category: 'Éducation' });
                } else if (location.type === 'Hôpital') {
                    categories['Santé'].items.push({ ...location, category: 'Santé' });
                }
            }
        });
    }

    if (allData.mairies) {
        allData.mairies.forEach(mairie => {
            if (mairie.lat && mairie.lon) {
                categories['Mairies'].items.push({ ...mairie, category: 'Mairies' });
            }
        });
    }
    if (allData.prefectures) {
        allData.prefectures.forEach(pref => {
            if (pref.lat && pref.lon) {
                categories['Préfectures'].items.push({ ...pref, category: 'Préfectures' });
            }
        });
    }
    
    if (allData.elysee_point && allData.elysee_point.lat && allData.elysee_point.lon) {
        categories['Gouvernement'].items.push({ ...allData.elysee_point, category: 'Gouvernement' });
    }

    if (allData.manifestation_points) {
        allData.manifestation_points.forEach(point => {
            if (point.lat && point.lon) {
                categories['Manifestation'].items.push({ ...point, category: 'Manifestation' });
            }
        });
    }
    if (allData.roundabout_points) {
        allData.roundabout_points.forEach(point => {
            if (point.lat && point.lon) {
                categories['Points Stratégiques'].items.push({ ...point, category: 'Points Stratégiques' });
            }
        });
    }
    if (allData.porte_points) {
        allData.porte_points.forEach(point => {
            if (point.lat && point.lon) {
                categories['Points Stratégiques'].items.push({ ...point, category: 'Points Stratégiques' });
            }
        });
    }
    
    if (allData.telegram_groups) {
        allData.telegram_groups.forEach(group => {
            if (group.lat && group.lon) {
                categories['Télégram'].items.push({ ...group, category: 'Télégram' });
            }
        });
    }

    return categories;
}

/**
 * Affiche la liste des sous-éléments d'une catégorie
 */
function renderSublist(categoryName, categories) {
    const legendList = document.getElementById('legend-list');
    legendList.innerHTML = '';
    
    const backBtn = document.createElement('li');
    backBtn.className = 'legend-back-btn';
    backBtn.innerHTML = `&larr; Retour`;
    backBtn.addEventListener('click', renderCategories);
    legendList.appendChild(backBtn);

    const category = categories[categoryName];

    // Ajout du bouton "Tout afficher"
    if (category && category.items.length > 0) {
        const showAllBtn = document.createElement('li');
        showAllBtn.className = 'legend-item show-all-btn';
        showAllBtn.setAttribute('data-category', categoryName);
        showAllBtn.innerHTML = `<span class="legend-icon" style="background-image: url('src/img/map.png')"></span>Tout afficher (${category.items.length})`;
        
        showAllBtn.addEventListener('click', () => {
            const layer = markerLayers[categoryName];
            const isVisible = map.hasLayer(layer);
            if (isVisible) {
                map.removeLayer(layer);
                showAllBtn.classList.remove('active');
            } else {
                map.addLayer(layer);
                showAllBtn.classList.add('active');
            }
        });
        legendList.appendChild(showAllBtn);
    }
    
    if (category && category.items.length > 0) {
        const ulSublist = document.createElement('ul');
        ulSublist.className = 'sub-list-items';

        category.items.forEach(item => {
            if (item.lat && item.lon) {
                const liItem = document.createElement('li');
                liItem.className = 'legend-item';
                liItem.setAttribute('data-lat', item.lat);
                liItem.setAttribute('data-lon', item.lon);
                liItem.innerHTML = `<span class="legend-icon" style="background-image: url('${getIconForItem(item, category.icon).options.iconUrl}')"></span>${item.name || item.city}`;
                liItem.addEventListener('click', () => {
                    const lat = parseFloat(liItem.getAttribute('data-lat'));
                    const lon = parseFloat(liItem.getAttribute('data-lon'));
                    const marker = findMarkerInLayer(markerLayers[categoryName], lat, lon);
                    
                    if (marker) {
                        const isVisible = map.hasLayer(marker);
                        if (isVisible) {
                            map.removeLayer(marker);
                            liItem.classList.remove('active');
                        } else {
                            map.addLayer(marker);
                            liItem.classList.add('active');
                            map.panTo([lat, lon]);
                            marker.openPopup();
                        }
                    }
                });
                ulSublist.appendChild(liItem);
            }
        });
        legendList.appendChild(ulSublist);
    }
}

/**
 * Affiche la liste des catégories principales
 */
function renderCategories() {
    const legendList = document.getElementById('legend-list');
    legendList.innerHTML = '';
    
    const categories = categorizeData(allData);

    for (const categoryName in categories) {
        const category = categories[categoryName];
        if (category && category.items.length > 0) {
            const liCategory = document.createElement('li');
            liCategory.className = 'legend-category';
            liCategory.setAttribute('data-category', categoryName);
            const iconUrl = category.icon ? category.icon.options.iconUrl : 'src/img/default-icon.png';
            liCategory.innerHTML = `<span class="legend-icon" style="background-image: url('${iconUrl}')"></span>${categoryName}`;
            
            liCategory.addEventListener('click', () => {
                renderSublist(categoryName, categories);
            });
            legendList.appendChild(liCategory);
        }
    }
    
    const showAllBtn = document.createElement('li');
    showAllBtn.className = 'legend-category';
    showAllBtn.innerHTML = `<span class="legend-icon" style="background-image: url('src/img/map.png')"></span>Tout afficher`;
    showAllBtn.addEventListener('click', () => {
        // Enlève toutes les couches existantes
        for (const name in markerLayers) {
            map.removeLayer(markerLayers[name]);
        }
        // Affiche toutes les couches
        for (const name in markerLayers) {
            map.addLayer(markerLayers[name]);
        }
        // Met à jour la liste des catégories
        renderCategories();
        
        // Sélectionne toutes les catégories et les active
        document.querySelectorAll('.legend-category').forEach(cat => {
            cat.classList.add('active');
        });
    });
    legendList.appendChild(showAllBtn);
}

/**
 * Fonction utilitaire pour trouver un marqueur dans une couche
 */
function findMarkerInLayer(layer, lat, lon) {
    let foundMarker = null;
    layer.eachLayer(marker => {
        if (marker.getLatLng().lat === lat && marker.getLatLng().lng === lon) {
            foundMarker = marker;
        }
    });
    return foundMarker;
}

/**
 * Fonction utilitaire pour obtenir l'icône appropriée pour un élément
 */
function getIconForItem(item, defaultIcon) {
    // Logique pour les icônes de caméras
    if (item.type && (item.type === 'fixed' || item.type === 'panning' || item.type === 'dome' || item.type === 'guard' || item.type === 'ALPR')) {
        return getIconForCameraPoint(item.type);
    }
    // Logique pour les icônes d'entités spécifiques
    if (item.name && entityIcons[item.name]) {
        return entityIcons[item.name];
    }
    // Logique pour les types génériques
    if (item.type) {
        if (item.type.toLowerCase().includes('préfecture')) return prefectureIcon;
        if (item.type.toLowerCase().includes('mairie')) return mairieIcon;
        if (item.type.toLowerCase().includes('université')) return universityIcon;
        if (item.type.toLowerCase().includes('hôpital')) return hospitalIcon;
        if (item.type.toLowerCase().includes('banque')) return banqueDeFranceIcon;
        if (item.type.toLowerCase().includes('telegram')) return telegramIcon;
    }
    // Si aucune correspondance, retourne l'icône par défaut de la catégorie
    return defaultIcon;
}


/**
 * Initialise la carte Leaflet et ajoute les marqueurs.
 * @param {Object} allDataPassed - L'objet contenant toutes les données de la base de données.
 */
export function initMap(allDataPassed) {
    if (mapInitialized) return;

    allData = allDataPassed;

    map = L.map('map').setView([46.603354, 1.888334], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInitialized = true;
    
    const categorizedData = categorizeData(allData);

    for (const categoryName in categorizedData) {
        if (categorizedData.hasOwnProperty(categoryName)) {
            const category = categorizedData[categoryName];
            if (category.items.length > 0) {
                markerLayers[categoryName] = L.layerGroup();
                category.items.forEach(item => {
                    const icon = getIconForItem(item, category.icon);
                    const marker = L.marker([item.lat, item.lon], { icon: icon });

                    let popupContent = `<b>${item.name || item.city}</b>`;
                    if (item.type) popupContent += `<br>Type: ${item.type}`;
                    if (item.description) popupContent += `<br>Description: ${item.description}`;
                    if (item.city) popupContent += `<br>Ville: ${item.city}`;
                    if (item.link) popupContent += `<br><a href="${item.link}" target="_blank">Rejoindre</a>`;
                    if (item.video_link) {
                        popupContent += `<br><a href="#" onclick="event.preventDefault(); window.openIpCamModal('${item.video_link}', 'Flux Vidéo - ${item.name || item.city}');">Voir le flux</a>`;
                    }
                    marker.bindPopup(popupContent);
                    marker.addTo(markerLayers[categoryName]);
                });
            }
        }
    }

    renderCategories();

    document.getElementById('legend-list').addEventListener('click', (e) => {
        const item = e.target.closest('.legend-item');
        if (item) {
            const lat = parseFloat(item.getAttribute('data-lat'));
            const lon = parseFloat(item.getAttribute('data-lon'));
            if (!isNaN(lat) && !isNaN(lon)) {
                map.panTo([lat, lon]);
                const categoryName = item.closest('.legend-category').getAttribute('data-category');
                const layer = markerLayers[categoryName];
                if (layer) {
                    layer.eachLayer(marker => {
                        if (marker.getLatLng().lat === lat && marker.getLatLng().lng === lon) {
                            marker.openPopup();
                        }
                    });
                }
            }
        }
    });

    // Au démarrage, on s'assure que toutes les couches sont désactivées
    for (const name in markerLayers) {
        map.removeLayer(markerLayers[name]);
    }
}