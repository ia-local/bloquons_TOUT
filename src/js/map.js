// Fichier : public/src/js/layerMap.js

let mapInstance;
let markerLayers = {};

/**
 * Initialise la carte et ses couches de marqueurs.
 * @param {Object} allData - Toutes les données de la base de données.
 * @param {Object} legendConfig - La configuration de la légende.
 */
export function initLayerMap(allData, legendConfig) {
    if (mapInstance) {
        mapInstance.remove();
    }
    
    mapInstance = L.map('map').setView([46.603354, 1.888334], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    markerLayers = {};
    const categorizedPoints = categorizeData(allData, legendConfig);

    legendConfig.categories.forEach(categoryConfig => {
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
                    marker.bindPopup(`<b>${point.name}</b><br>${point.description || ''}`);
                    layerGroup.addLayer(marker);
                });
                markerLayers[subcategoryName] = layerGroup;
                layerGroup.addTo(mapInstance);
            }
        });
    });
}

/**
 * Retourne l'instance de la carte.
 * @returns {L.Map} L'instance de la carte.
 */
export function getMapInstance() {
    return mapInstance;
}

/**
 * Retourne les couches de marqueurs.
 * @returns {Object} Un objet contenant les groupes de couches de marqueurs.
 */
export function getMarkerLayers() {
    return markerLayers;
}

/**
 * Fonction améliorée pour catégoriser toutes les données du database.json.
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
                    const itemType = item.type || (item.actions && item.actions.length > 0 && item.actions[0].type) || '';

                    // Logique de catégorisation principale basée sur le dataKey et le type
                    if (categoryName === "Manifestations & Actions") {
                        if (dataKey.includes("manifestation_points")) {
                            if (item.actions) {
                                item.actions.forEach(action => {
                                    if (action.locations) {
                                        let actionSubcategoryName = "Rassemblements";
                                        if (action.type === "Blocage") actionSubcategoryName = "Blocages";
                                        else if (action.type === "Grève") actionSubcategoryName = "Grèves";
                                        else if (action.type === "Opération") actionSubcategoryName = "Opérations Spéciales";

                                        if (!categorized[categoryName][actionSubcategoryName]) categorized[categoryName][actionSubcategoryName] = [];
                                        
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
                            } else {
                                // Gérer les points de manifestation sans sous-actions
                                subcategoryName = "Rassemblements";
                            }
                        }
                    } else if (categoryName === "Boycotts") {
                        const matchingSubcategory = categoryConfig.subcategories.find(sub => sub.typeFilter && sub.typeFilter.includes(item.type));
                        subcategoryName = matchingSubcategory ? matchingSubcategory.name : "Autres";
                    } else if (categoryName === "Surveillance & Réseaux") {
                         const matchingSubcategory = categoryConfig.subcategories.find(sub => sub.typeFilter && sub.typeFilter.includes(item.type));
                         subcategoryName = matchingSubcategory ? matchingSubcategory.name : "Autres";
                    } else if (categoryName === "Lieux Administratifs") {
                        if (dataKey.includes("mairies")) subcategoryName = "Mairies";
                        else if (dataKey.includes("prefectures")) subcategoryName = "Préfectures";
                        else if (dataKey.includes("elysee")) subcategoryName = "Élysée";
                    } else if (categoryName === "Lieux Stratégiques") {
                        if (dataKey.includes("roundabout_points")) subcategoryName = "Ronds-points";
                        else if (dataKey.includes("porte_points")) subcategoryName = "Portes & Gares";
                        else if (dataKey.includes("strategic_locations")) subcategoryName = "Hôpitaux & Universités";
                    } else if (categoryName === "Organisations") {
                        if (dataKey.includes("syndicats")) subcategoryName = "Sièges Syndicaux";
                        else if (dataKey.includes("cnccfp_partis")) subcategoryName = "Partis Politiques";
                    } else if (categoryName === "Pétitions") {
                        subcategoryName = "Pétitions";
                    }
                    
                    if (subcategoryName && subcategoryName !== "Rassemblements" && subcategoryName !== "Blocages" && subcategoryName !== "Grèves" && subcategoryName !== "Opérations Spéciales") {
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