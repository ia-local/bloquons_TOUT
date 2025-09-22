// Fichier : public/src/js/layerLegend.js

// Les imports des fonctions `getMapInstance` et `getMarkerLayers` sont supprimés,
// car elles sont définies dans `layerMap.js`.
// `categorizeData` est également définie dans `layerMap.js`, donc l'importation ici était redondante.
import { getMarkerLayers, getMapInstance, categorizeData } from './layerMap.js';

let legendConfig = {};
let allData = {};
let categorizedPoints = {};

/**
 * Initialise la légende de la carte.
 * @param {Object} data - Les données de configuration de la légende (map.json).
 * @param {Object} fetchedData - Toutes les données de la base de données.
 */
export function initLegend(data, fetchedData) {
    legendConfig = data;
    allData = fetchedData;
    categorizedPoints = categorizeData(allData, legendConfig);
    renderCategories();
}

function renderCategories() {
    const legendCategories = document.getElementById('map-categories-legend');
    const legendItems = document.getElementById('map-items-legend');
    const legendListCategories = document.getElementById('legend-list-categories');
    
    legendItems.style.display = 'none';
    legendCategories.style.display = 'block';
    legendListCategories.innerHTML = '';
    
    legendConfig.categories.forEach(categoryConfig => {
        const categoryName = categoryConfig.name;
        const subcategoriesData = categorizedPoints[categoryName] || {};
        const itemCount = Object.values(subcategoriesData).flat().length;
        
        const liCategory = document.createElement('li');
        liCategory.className = 'legend-category';
        liCategory.setAttribute('data-category', categoryName);
        const iconUrl = `src/img/${categoryConfig.icon}`;
        liCategory.innerHTML = `<span class="legend-icon" style="background-image: url('${iconUrl}')"></span>${categoryName} (${itemCount})`;
        
        liCategory.addEventListener('click', () => {
            renderSublist(categoryConfig, subcategoriesData);
        });
        legendListCategories.appendChild(liCategory);
    });

    const showAllBtn = document.createElement('li');
    showAllBtn.className = 'legend-category show-all';
    showAllBtn.innerHTML = `<span class="legend-icon" style="background-image: url('src/img/map.png')"></span>Tout afficher`;
    showAllBtn.addEventListener('click', () => {
        const map = getMapInstance();
        const markerLayers = getMarkerLayers();
        const allCategories = document.querySelectorAll('.legend-category:not(.show-all)');
        const isAnyActive = Array.from(allCategories).some(cat => cat.classList.contains('active'));

        if (isAnyActive) {
            for (const key in markerLayers) {
                if (markerLayers[key]) {
                    map.removeLayer(markerLayers[key]);
                }
            }
            allCategories.forEach(cat => cat.classList.remove('active'));
            showAllBtn.classList.remove('active');
        } else {
            for (const key in markerLayers) {
                if (markerLayers[key]) {
                    map.addLayer(markerLayers[key]);
                }
            }
            allCategories.forEach(cat => cat.classList.add('active'));
            showAllBtn.classList.add('active');
        }
    });
    legendListCategories.appendChild(showAllBtn);
}

function renderSublist(categoryConfig, subcategoriesData) {
    const legendCategories = document.getElementById('map-categories-legend');
    const legendItems = document.getElementById('map-items-legend');
    const legendListItems = document.getElementById('legend-list-items');
    
    legendCategories.style.display = 'none';
    legendItems.style.display = 'block';
    legendListItems.innerHTML = '';
    
    const backBtn = document.createElement('li');
    backBtn.className = 'legend-back-btn';
    const backBtnIconUrl = `src/img/${categoryConfig.icon}`;
    backBtn.innerHTML = `<span class="legend-icon" style="background-image: url('${backBtnIconUrl}')"></span> Retour`;
    backBtn.addEventListener('click', () => {
        renderCategories();
    });
    legendListItems.appendChild(backBtn);
    
    const subcategories = categoryConfig.subcategories || [{ name: categoryConfig.name, icon: categoryConfig.icon }];

    const sortPointsByVotes = (a, b) => (b.votes_for || 0) - (a.votes_for || 0);

    subcategories.forEach(subConfig => {
        const subcategoryName = subConfig.name;
        const subcategoryPoints = subcategoriesData && subcategoriesData[subcategoryName] ? subcategoriesData[subcategoryName] : [];
        const itemCount = subcategoryPoints.length;

        const sortedPoints = subcategoryName.includes('RIC') ? subcategoryPoints.sort(sortPointsByVotes) : subcategoryPoints;
        const totalItems = sortedPoints.length;

        const showSubcategoryBtn = document.createElement('li');
        showSubcategoryBtn.className = 'legend-item';
        showSubcategoryBtn.setAttribute('data-category', categoryConfig.name);
        showSubcategoryBtn.setAttribute('data-subcategory', subcategoryName);
        const iconPath = `src/img/${subConfig.icon}`;
        showSubcategoryBtn.innerHTML = `<span class="legend-icon" style="background-image: url('${iconPath}')"></span>${subcategoryName} (${totalItems})`;
        
        showSubcategoryBtn.addEventListener('click', () => {
            const layer = getMarkerLayers()[subcategoryName];
            const map = getMapInstance();
            if (layer) {
                const isVisible = map.hasLayer(layer);
                if (isVisible) {
                    map.removeLayer(layer);
                    showSubcategoryBtn.classList.remove('active');
                } else {
                    map.addLayer(layer);
                    showSubcategoryBtn.classList.add('active');
                }
            } else {
                console.warn(`La couche pour "${subcategoryName}" n'existe pas.`);
            }
        });
        legendListItems.appendChild(showSubcategoryBtn);

        if (totalItems > 0) {
            const pointsList = document.createElement('ul');
            pointsList.className = 'legend-item-list';
            sortedPoints.forEach(point => {
                const pointItem = document.createElement('li');
                pointItem.textContent = point.name || point.title;
                pointItem.classList.add('clickable-point');
                pointItem.addEventListener('click', (event) => {
                    event.stopPropagation();
                    const map = getMapInstance();
                    if (map) {
                        map.panTo([point.lat, point.lon]);
                        const layerGroup = getMarkerLayers()[subcategoryName];
                        if (layerGroup) {
                            layerGroup.eachLayer(marker => {
                                if (marker.getLatLng().lat === point.lat && marker.getLatLng().lng === point.lon) {
                                    marker.openPopup();
                                }
                            });
                        }
                    }
                });
                pointsList.appendChild(pointItem);
            });
            legendListItems.appendChild(pointsList);
        }
    });

    const totalItems = Object.values(subcategoriesData || {}).flat().length;
    if (totalItems === 0) {
        const noItemsLi = document.createElement('li');
        noItemsLi.textContent = "Aucun point de données disponible.";
        legendListItems.appendChild(noItemsLi);
    }
}