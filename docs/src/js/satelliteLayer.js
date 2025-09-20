// Fichier : public/src/js/SatelliteLayer.js

let mapInstance;
let geeLayersInstance;
let allDataInstance;
const satelliteIconUrl = 'src/img/satellites.png';

/**
 * Initialise le module SatelliteLayer.
 * @param {L.Map} map - L'instance de la carte Leaflet.
 * @param {Object} geeLayers - Le conteneur pour les couches GEE.
 * @param {Object} allData - Toutes les données de l'application.
 */
export function initSatelliteLayer(map, geeLayers, allData) {
    mapInstance = map;
    geeLayersInstance = geeLayers;
    allDataInstance = allData;
    
    renderSatelliteList();
}

/**
 * Génère et affiche la liste des satellites cliquables.
 */
function renderSatelliteList() {
    const satelliteListEl = document.getElementById('satellite-list');
    if (!satelliteListEl || !allDataInstance.satellites) return;

    satelliteListEl.innerHTML = allDataInstance.satellites.map(satellite => `
        <li class="satellite-item" data-id="${satellite.id}">
            <span class="satellite-icon" style="background-image: url('${satelliteIconUrl}')"></span>
            ${satellite.name}
            <button class="settings-btn" data-id="${satellite.id}">⚙️</button>
        </li>
    `).join('');

    // Attacher des écouteurs pour chaque satellite
    document.querySelectorAll('.satellite-item').forEach(item => {
        item.addEventListener('click', toggleSatelliteLayer);
    });

    // Attacher des écouteurs pour les boutons de paramètres
    document.querySelectorAll('.settings-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            openSatelliteSettingsModal(event.target.dataset.id);
        });
    });
}

/**
 * Ouvre la modale de paramètres pour un satellite donné.
 * @param {string} satelliteId - L'ID du satellite.
 */
function openSatelliteSettingsModal(satelliteId) {
    const satellite = allDataInstance.satellites.find(s => s.id === satelliteId);
    if (!satellite) return;

    const modal = document.getElementById('satellite-settings-modal');
    const titleEl = document.getElementById('settings-modal-title');
    const bodyEl = document.getElementById('settings-modal-body');
    const applyBtn = document.getElementById('apply-settings-btn');
    
    titleEl.textContent = `Paramètres de : ${satellite.name}`;
    
    let bandsOptions = satellite.bands.map(b => `<option value="${b}">${b}</option>`).join('');
    
    bodyEl.innerHTML = `
        <div class="form-group">
            <label for="bands-select">Bandes (sélection multiple) :</label>
            <select id="bands-select" multiple>${bandsOptions}</select>
        </div>
        <div class="form-group">
            <label for="cloud-input">Pourcentage de nuages maximum :</label>
            <input type="number" id="cloud-input" min="0" max="100" value="20">
        </div>
    `;

    applyBtn.onclick = () => {
        const selectedBands = Array.from(document.getElementById('bands-select').options)
                                 .filter(option => option.selected)
                                 .map(option => option.value);
        const cloudPercentage = document.getElementById('cloud-input').value;
        
        toggleSatelliteLayerWithSettings(satelliteId, selectedBands, cloudPercentage);
        modal.style.display = 'none';
    };

    modal.style.display = 'block';
}

/**
 * Gère l'affichage ou la dissimulation de la couche satellite GEE.
 */
async function toggleSatelliteLayer(event) {
    const satelliteId = event.currentTarget.dataset.id;
    const item = event.currentTarget;
    
    if (item.classList.contains('active')) {
        if (geeLayersInstance[satelliteId]) {
            mapInstance.removeLayer(geeLayersInstance[satelliteId]);
            delete geeLayersInstance[satelliteId];
        }
        item.classList.remove('active');
        item.innerHTML = `<span class="satellite-icon" style="background-image: url('${satelliteIconUrl}')"></span>${allDataInstance.satellites.find(s => s.id === satelliteId).name}`;
    } else {
        item.innerHTML = `<span class="satellite-icon" style="background-image: url('${satelliteIconUrl}')"></span>${allDataInstance.satellites.find(s => s.id === satelliteId).name} (Chargement...)`;
        try {
            const satellite = allDataInstance.satellites.find(s => s.id === satelliteId);
            const response = await fetch(`/api/gee/tiles/${satelliteId}?bands=${satellite.bands.join(',')}`);
            const data = await response.json();
            
            if (data.mapid && data.token) {
                const geeTileLayer = L.tileLayer(`https://earthengine.googleapis.com/v1alpha/{mapid}/tiles/{z}/{x}/{y}?token={token}`, {
                    attribution: `Google Earth Engine (${data.satelliteName})`,
                    mapid: data.mapid,
                    token: data.token,
                    maxZoom: 20
                }).addTo(mapInstance);
                
                geeLayersInstance[satelliteId] = geeTileLayer;
                item.classList.add('active');
                item.innerHTML = `<span class="satellite-icon" style="background-image: url('${satelliteIconUrl}')"></span>${data.satelliteName} (Active)`;
            } else {
                throw new Error('Données de tuiles GEE invalides.');
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la couche GEE:', error);
            item.innerHTML = `<span class="satellite-icon" style="background-image: url('${satelliteIconUrl}')"></span>Erreur de chargement`;
            item.classList.remove('active');
        }
    }
}