// Fichier : public/src/js/chronologie.js

let chronologyData = [];
let timelineContainer = null;
let mapInstance = null;
let markerLayers = null;

export function initChronologieFilter(mapRef, layers) {
    timelineContainer = document.getElementById('timeline-container');
    mapInstance = mapRef;
    markerLayers = layers;

    if (!timelineContainer) {
        console.error("Le conteneur de la chronologie est introuvable.");
        return;
    }

    fetch('/database.json')
        .then(res => res.json())
        .then(data => {
            chronologyData = data.chronology || [];
            renderTimeline();
        })
        .catch(error => {
            console.error('Erreur lors du chargement des données de chronologie:', error);
            timelineContainer.innerHTML = '<p>Impossible de charger la chronologie.</p>';
        });
}

function renderTimeline() {
    timelineContainer.innerHTML = '';
    
    if (chronologyData.length === 0) {
        timelineContainer.innerHTML = '<p>Aucun événement dans la chronologie.</p>';
        return;
    }

    const ul = document.createElement('ul');
    ul.className = 'timeline-list';

    chronologyData.forEach(event => {
        const li = document.createElement('li');
        li.className = 'timeline-event';
        li.setAttribute('data-event-id', event.id);
        li.innerHTML = `<h3>${event.subtitle}</h3><p>${event.title}</p>`;
        
        li.addEventListener('click', () => {
            handleTimelineClick(event);
        });
        ul.appendChild(li);
    });

    timelineContainer.appendChild(ul);
}

function handleTimelineClick(event) {
    // Supprime tous les marqueurs de la carte
    for (const category in markerLayers) {
        if (markerLayers.hasOwnProperty(category)) {
            mapInstance.removeLayer(markerLayers[category]);
        }
    }

    // Affiche seulement les marqueurs liés à cet événement
    const relatedMarkers = findMarkersForEvent(event);
    relatedMarkers.forEach(marker => {
        mapInstance.addLayer(marker);
        mapInstance.panTo(marker.getLatLng());
        marker.openPopup();
    });
}

function findMarkersForEvent(event) {
    const markers = [];
    // Logique pour trouver les marqueurs liés à l'événement
    for (const category in markerLayers) {
        if (markerLayers.hasOwnProperty(category)) {
            markerLayers[category].eachLayer(marker => {
                const popupContent = marker.getPopup().getContent();
                if (popupContent.includes(event.title) || popupContent.includes(event.subtitle)) {
                    markers.push(marker);
                }
            });
        }
    }
    return markers;
}