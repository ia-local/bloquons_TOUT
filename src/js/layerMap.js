// Fichier : public/src/js/layerMap.js (Version corrigée et fonctionnelle)

import { initChronologieFilter } from './chronologie.js';
import * as icons from './icons.js';
import { openIpCamModal } from './ipCam.js';
import { openModalLegend } from './modalLegend.js';
import { initSatelliteLayer } from './satelliteLayer.js';

let mapInstance;
let markerLayers = {};
let geeLayers = {};
let mapInitialized = false;
let allData = {};
let activeGeographicalLevel = 'all';

/**
 * Initialise la carte Leaflet et ajoute les marqueurs.
 * @param {Object} allDataPassed - L'objet contenant toutes les données de la base de données.
 * @param {Object} legendConfig - L'objet de configuration de la légende.
 */
export function initLayerMap(allDataPassed, legendConfig) {
    if (mapInitialized) {
        mapInstance.remove();
    }
    
    mapInstance = L.map('map').setView([46.603354, 1.888334], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    mapInitialized = true;
    markerLayers = {};
    const categorizedPoints = categorizeData(allDataPassed, legendConfig);

    legendConfig.categories.forEach(categoryConfig => {
        const categoryName = categoryConfig.name;
        const subcategories = categoryConfig.subcategories || [{ name: categoryConfig.name, icon: categoryConfig.icon }];

        subcategories.forEach(subConfig => {
            const subcategoryName = subConfig.name;
            const points = categorizedPoints[categoryName] && categorizedPoints[categoryName][subcategoryName] ? categorizedPoints[categoryName][subcategoryName] : [];

            if (points.length > 0) {
                const layerGroup = L.layerGroup();
                const count = points.length;
                const pointsList = points.map(p => `<li>${p.name}</li>`).join('');
                const firstPoint = points[0];

                const customIcon = L.icon({
                    iconUrl: `src/img/${subConfig.icon}`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                });

                const marker = L.marker([firstPoint.lat, firstPoint.lon], { icon: customIcon });
                marker.bindPopup(`<b>${subcategoryName} (${count})</b><br><ul style="max-height: 200px; overflow-y: scroll;">${pointsList}</ul>`);
                layerGroup.addLayer(marker);
                
                markerLayers[subcategoryName] = layerGroup;
                layerGroup.addTo(mapInstance);
            }
        });
    });
}

/**
 * Fonctions utilitaires pour que la légende puisse interagir avec la carte.
 */
export function getMapInstance() {
    return mapInstance;
}

export function getMarkerLayers() {
    return markerLayers;
}

export function refreshMapLayers(updatedData) {
    // La logique de rafraîchissement est plus complexe et nécessite une refonte
    // pour s'adapter à la nouvelle structure de marqueurs uniques.
    // Pour l'instant, on se contentera d'initialiser à nouveau la carte.
    initLayerMap(updatedData, legendConfig);
}


/**
 * Fonction améliorée pour catégoriser toutes les données du database.json.
 * @param {Object} data - L'objet complet de la base de données.
 * @param {Object} config - La configuration de la légende (map.json).
 * @returns {Object} Un objet structuré par catégories et sous-catégories.
 */
export function categorizeData(data, config) {
    const categorized = {};

    config.categories.forEach(categoryConfig => {
        const categoryName = categoryConfig.name;
        categorized[categoryName] = {};

        categoryConfig.dataKeys.forEach(dataKey => {
            if (data[dataKey]) {
                const items = Array.isArray(data[dataKey]) ? data[dataKey] : [data[dataKey]];

                items.forEach(item => {
                    let subcategoryName = null;
                    let itemType = item.type || '';
                    if (item.actions && item.actions.length > 0) {
                        item.actions.forEach(action => {
                            if (action.type) itemType = action.type;
                        });
                    }
                    
                    if (categoryName === "Manifestations & Actions") {
                        if (dataKey.includes("manifestation_points")) {
                            if (item.actions) {
                                item.actions.forEach(action => {
                                    let actionSubcategoryName = "Opérations Spéciales";
                                    if (action.type === "Blocage" || action.type === "Blocage de lycée") actionSubcategoryName = "Blocages";
                                    else if (action.type === "Grève") actionSubcategoryName = "Grèves";
                                    
                                    if (!categorized[categoryName][actionSubcategoryName]) categorized[categoryName][actionSubcategoryName] = [];
                                    if (action.locations) {
                                        action.locations.forEach(loc => {
                                            categorized[categoryName][actionSubcategoryName].push({
                                                name: loc.name || loc.city || action.description,
                                                description: action.description,
                                                lat: loc.lat,
                                                lon: loc.lon
                                            });
                                        });
                                    }
                                });
                            }
                            if (item.lat && item.lon || item.locations) {
                                subcategoryName = "Rassemblements";
                            }
                        }
                    } else if (categoryName === "Secteurs d'application") {
                        const matchingSubcategory = categoryConfig.subcategories.find(sub => sub.typeFilter && sub.typeFilter.includes(itemType));
                        if (matchingSubcategory) subcategoryName = matchingSubcategory.name;
                    } else if (categoryName === "Boycotts") {
                        const matchingSubcategory = categoryConfig.subcategories.find(sub => sub.typeFilter && sub.typeFilter.includes(itemType));
                        subcategoryName = matchingSubcategory ? matchingSubcategory.name : "Autres";
                    } else if (categoryName === "Surveillance & Réseaux") {
                        const matchingSubcategory = categoryConfig.subcategories.find(sub => sub.typeFilter && sub.typeFilter.includes(itemType));
                        subcategoryName = matchingSubcategory ? matchingSubcategory.name : "Autres";
                    } else if (categoryName === "Lieux Administratifs") {
                        if (dataKey === "mairies") subcategoryName = "Mairies";
                        else if (dataKey === "prefectures") subcategoryName = "Préfectures";
                        else if (dataKey === "elysee_point") subcategoryName = "Élysée";
                    } else if (categoryName === "Lieux Stratégiques") {
                        if (dataKey === "roundabout_points") subcategoryName = "Ronds-points";
                        else if (dataKey === "porte_points") subcategoryName = "Portes & Gares";
                        else if (dataKey === "strategic_locations") subcategoryName = "Hôpitaux & Universités";
                    } else if (categoryName === "Organisations") {
                        if (dataKey === "syndicats") subcategoryName = "Sièges Syndicaux";
                        else if (dataKey === "cnccfp_partis") subcategoryName = "Partis Politiques";
                    } else if (categoryName === "Pétitions") {
                        subcategoryName = "Pétitions";
                    }
                    
                    if (subcategoryName) {
                        if (!categorized[categoryName][subcategoryName]) {
                            categorized[categoryName][subcategoryName] = [];
                        }
                        
                        if (item.locations) {
                            item.locations.forEach(loc => {
                                categorized[categoryName][subcategoryName].push({
                                    name: loc.name || loc.city || item.name || item.title,
                                    description: item.description,
                                    lat: loc.lat,
                                    lon: loc.lon
                                });
                            });
                        } else if (item.lat && item.lon) {
                            categorized[categoryName][subcategoryName].push({
                                name: item.name || item.city || item.title || item.department,
                                description: item.description,
                                lat: item.lat,
                                lon: item.lon
                            });
                        }
                    }
                });
            }
        });
    });

    return categorized;
}