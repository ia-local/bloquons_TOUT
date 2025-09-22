// Fichier : public/src/js/layerMap.js

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
let legendConfig = {}; // Ajout de legendConfig pour la fonction refresh

/**
 * Initialise la carte Leaflet et ajoute les marqueurs.
 */
export function initLayerMap(allDataPassed, legendConfigPassed) {
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
    allData = allDataPassed;
    legendConfig = legendConfigPassed;
    const categorizedPoints = categorizeData(allDataPassed, legendConfigPassed);

    legendConfigPassed.categories.forEach(categoryConfig => {
        const categoryName = categoryConfig.name;
        const subcategories = categoryConfig.subcategories || [{ name: categoryConfig.name, icon: categoryConfig.icon }];

        subcategories.forEach(subConfig => {
            const subcategoryName = subConfig.name;
            const points = categorizedPoints[categoryName] && categorizedPoints[categoryName][subcategoryName] ? categorizedPoints[categoryName][subcategoryName] : [];

            if (points.length > 0) {
                const layerGroup = L.layerGroup();

                points.forEach(point => {
                    const customIcon = L.icon({
                        iconUrl: `src/img/${subConfig.icon}`,
                        iconSize: [32, 32],
                        iconAnchor: [16, 32],
                        popupAnchor: [0, -32]
                    });

                    const marker = L.marker([point.lat, point.lon], { icon: customIcon });
                    
                    let popupContent = `<b>${point.name || subcategoryName}</b><br>${point.description || ''}`;

                    if (categoryName === "RIC" && point.votes_for !== undefined) {
                         popupContent += `<br>Votes Pour: ${point.votes_for}<br>Votes Contre: ${point.votes_against}<br>Niveau: ${point.level}<br>Date limite: ${point.deadline}`;
                    }

                    marker.bindPopup(popupContent);
                    layerGroup.addLayer(marker);
                });
                
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
    allData = updatedData;
    initLayerMap(updatedData, legendConfig);
}

/**
 * Fonction améliorée pour catégoriser toutes les données de la base de données.
 */
export function categorizeData(data, config) {
    const categorized = {};

    config.categories.forEach(categoryConfig => {
        const categoryName = categoryConfig.name;
        categorized[categoryName] = {};

        categoryConfig.dataKeys.forEach(dataKey => {
            const items = data[dataKey] ? (Array.isArray(data[dataKey]) ? data[dataKey] : [data[dataKey]]) : [];

            items.forEach(item => {
                let subcategoryName = null;
                const itemType = item.type || item.voteMethod || '';

                if (categoryName === "Manifestations & Actions" && item.actions) {
                    item.actions.forEach(action => {
                        const matchingSubcategory = categoryConfig.subcategories?.find(sub => sub.typeFilter && sub.typeFilter.includes(action.type));
                        if (matchingSubcategory) {
                            subcategoryName = matchingSubcategory.name;
                            if (!categorized[categoryName][subcategoryName]) { categorized[categoryName][subcategoryName] = []; }
                            if (action.locations) {
                                action.locations.forEach(loc => {
                                    categorized[categoryName][subcategoryName].push({
                                        name: loc.name || loc.city || action.description,
                                        description: action.description,
                                        lat: loc.lat,
                                        lon: loc.lon
                                    });
                                });
                            }
                        }
                    });
                } else if (categoryName === "RIC" && item.voteMethod) {
                    subcategoryName = item.voteMethod;
                }
                
                // Logique de catégorisation pour les autres catégories
                if (!subcategoryName) {
                    const matchingSubcategory = categoryConfig.subcategories?.find(sub => sub.typeFilter && sub.typeFilter.includes(itemType));
                    if (matchingSubcategory) {
                        subcategoryName = matchingSubcategory.name;
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
                    }
                }
                
                if (subcategoryName) {
                    if (!categorized[categoryName][subcategoryName]) { categorized[categoryName][subcategoryName] = []; }
                    const points = item.locations ? item.locations : (item.lat && item.lon ? [item] : []);
                    points.forEach(loc => {
                        categorized[categoryName][subcategoryName].push({
                            name: loc.name || loc.city || item.title || item.name,
                            description: item.description,
                            lat: loc.lat,
                            lon: loc.lon,
                            ... (categoryName === "RIC" ? { votes_for: item.votes_for, votes_against: item.votes_against, level: item.level, deadline: item.deadline } : {})
                        });
                    });
                }
            });
        });
    });
    return categorized;
}