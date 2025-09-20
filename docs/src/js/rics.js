// Fichier : public/src/js/rics.js
// Ce fichier gère la logique de la page des Référendums d'Initiative Citoyenne (RIC).
// CORRECTION : Le formulaire et les votes interagissent avec l'API du serveur pour
// gérer les données dans rics.json. Le bouton "Supprimer" a été retiré.

let ricMap;
let activeRicsData = [];
let ricMarkersLayer = L.layerGroup(); // Couche pour les marqueurs de RIC

// Définition des icônes personnalisées pour la carte (si nécessaire)
const ricIcon = L.icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

/**
 * Fonction d'initialisation de la page RIC.
 * Récupère les données depuis l'API du serveur au lieu du fichier JSON statique.
 */
export function initRicPage() {
    console.log("Initialisation de la page RIC...");

    // S'assurer que la modale est initialisée
    if (typeof setupModal === 'function') {
        setupModal();
    }
    
    // Récupération des données depuis l'API du serveur
    fetch('/api/rics')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur de chargement des données des référendums.');
            }
            return response.json();
        })
        .then(data => {
            // S'assure que chaque RIC a un statut par défaut
            activeRicsData = data.map(ric => ({ ...ric, status: ric.status || 'active' }));
            
            // Met à jour le statut et lance le tirage au sort si nécessaire
            updateRicStatusAndConductDraws();
            
            // Configure les écouteurs d'événements
            setupRicFormModal();
            setupFilters();
            setupRicMapModal();
        })
        .catch(error => {
            console.error("Erreur lors de l'initialisation de la page RIC:", error);
            const ricListContainer = document.getElementById('ric-list');
            if (ricListContainer) {
                ricListContainer.innerHTML = `<p class="error-message">Erreur : Impossible de charger les propositions de référendum.</p>`;
            }
        });
}

/**
 * Met à jour le statut des RIC en fonction de la date butoir
 * et simule le tirage au sort pour les référendums expirés.
 */
function updateRicStatusAndConductDraws() {
    const now = new Date();
    
    activeRicsData.forEach(ric => {
        const deadline = new Date(ric.deadline);
        
        // Si le RIC est actif et que la date butoir est passée
        if (ric.status === 'active' && deadline < now) {
            ric.status = 'en attente';
            ric.drawn_people = 10; // Simulation du tirage au sort
            
            console.log(`RIC "${ric.question}" a atteint sa date butoir. Déclenchement du tirage au sort.`);
            console.log(`Tirage au sort effectué. ${ric.drawn_people} citoyens ont été sélectionnés pour statuer sur la majorité.`);
        }
    });
    
    // Recharge les RIC pour refléter les changements
    loadRics();
}

/**
 * Configure la modale de la carte et ses événements.
 */
function setupRicMapModal() {
    const viewMapBtn = document.getElementById('view-map-btn');
    if (viewMapBtn) {
        viewMapBtn.addEventListener('click', () => {
            const mapTemplate = document.getElementById('ric-map-modal-template');
            if (mapTemplate) {
                const mapContent = mapTemplate.content.cloneNode(true);
                showModal('Localisation des RIC', mapContent);
                // Utilisation de setTimeout pour s'assurer que la modale est rendue
                setTimeout(() => {
                    initRicMapInModal(activeRicsData);
                    setupMapFilters();
                }, 100);
            }
        });
    }
}

/**
 * Configure les écouteurs d'événements pour les filtres de la modale de la carte.
 */
function setupMapFilters() {
    const levelFilter = document.getElementById('level-filter-modal');
    const sortFilter = document.getElementById('sort-filter-modal');
    const filterBtn = document.getElementById('filter-map-btn');

    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            const level = levelFilter.value;
            const sortBy = sortFilter.value;
            filterAndDisplayMap(level, sortBy);
        });
    }
}

/**
 * Filtre et affiche les RIC sur la carte.
 * @param {string} level Le niveau de scrutin à filtrer.
 * @param {string} sortBy Le critère de tri.
 */
function filterAndDisplayMap(level, sortBy) {
    let filteredData = activeRicsData;

    if (level !== 'all') {
        filteredData = filteredData.filter(ric => ric.level === level);
    }
    
    if (sortBy === 'voters') {
        filteredData.sort((a, b) => (b.votes_for + b.votes_against) - (a.votes_for + a.votes_against));
    }

    ricMarkersLayer.clearLayers();
    renderMapMarkers(filteredData);
}

/**
 * Initialise la carte dans la modale.
 * @param {Array} data Les données de RIC à afficher.
 */
function initRicMapInModal(data) {
    const mapContainer = document.getElementById('ric-map-modal');
    if (!mapContainer) return;

    if (ricMap) {
        ricMap.remove();
    }

    ricMap = L.map('ric-map-modal').setView([46.603354, 1.888334], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(ricMap);
    
    ricMarkersLayer.addTo(ricMap);
    
    renderMapMarkers(data);
}

/**
 * Affiche les marqueurs sur la carte en fonction des données fournies.
 * @param {Array} data Les données de RIC à afficher.
 */
function renderMapMarkers(data) {
    data.forEach(ric => {
        if (ric.locations) {
            ric.locations.forEach(location => {
                const totalVotes = (ric.votes_for || 0) + (ric.votes_against || 0);
                const marker = L.circleMarker([location.lat, location.lon], {
                    radius: Math.sqrt(totalVotes) / 10,
                    fillColor: "#007bff",
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                }).bindPopup(`<b>${ric.question}</b><br>Votants : ${totalVotes.toLocaleString()}<br>Niveau : ${ric.level}`);
                
                ricMarkersLayer.addLayer(marker);
            });
        }
    });
}

/**
 * Configure le formulaire de soumission de RIC dans une modale.
 */
function setupRicFormModal() {
    const addRicBtn = document.getElementById('add-ric-btn');
    if (addRicBtn) {
        addRicBtn.addEventListener('click', () => {
            const formTemplate = document.getElementById('ric-form-template');
            if (formTemplate) {
                const formContent = formTemplate.content.cloneNode(true);
                showModal('Proposer un nouveau RIC', formContent);
                setupRicFormSubmission();
            }
        });
    }
}

/**
 * Gère la soumission du formulaire de RIC en envoyant une requête POST à l'API du serveur.
 */
function setupRicFormSubmission() {
    const form = document.getElementById('ric-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const ricData = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/rics', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(ricData)
                });

                if (response.ok) {
                    const newRic = await response.json();
                    alert(`Votre proposition "${newRic.question}" a été soumise avec succès et est en attente de validation.`);
                    hideModal(); 
                    initRicPage(); // Recharge les données
                } else {
                    const error = await response.json();
                    alert(`Échec de la soumission : ${error.error}`);
                }
            } catch (error) {
                console.error('Erreur lors de l\'envoi du RIC:', error);
                alert('Une erreur est survenue lors de la soumission. Veuillez réessayer.');
            }
        });
    }
}

/**
 * Configure les écouteurs d'événements pour les filtres de la page principale.
 */
function setupFilters() {
    const levelFilter = document.getElementById('level-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    if (levelFilter) {
        levelFilter.addEventListener('change', filterRics);
    }
    if (sortFilter) {
        sortFilter.addEventListener('change', filterRics);
    }
}

/**
 * Filtre et trie les propositions de RIC.
 */
function filterRics() {
    const levelFilterValue = document.getElementById('level-filter').value;
    const sortFilterValue = document.getElementById('sort-filter').value;
    
    let filteredData = activeRicsData;
    
    if (levelFilterValue !== 'all') {
        filteredData = filteredData.filter(ric => ric.level === levelFilterValue);
    }
    
    if (sortFilterValue === 'voters') {
        filteredData.sort((a, b) => (b.votes_for + b.votes_against) - (a.votes_for + a.votes_against));
    }
    
    loadRics(filteredData);
}

/**
 * Récupère les propositions de RIC et les affiche.
 * @param {Array} data Les données à afficher (optionnel, utilise activeRicsData par défaut).
 */
function loadRics(data = activeRicsData) {
    const ricListContainer = document.getElementById('ric-list');
    if (!ricListContainer) return;

    ricListContainer.innerHTML = '';

    const dataToDisplay = data.filter(ric => ric.status !== 'en attente');

    if (dataToDisplay.length === 0) {
        ricListContainer.innerHTML = `<p>Aucune proposition de RIC active pour le moment.</p>`;
        return;
    }

    dataToDisplay.forEach(ric => {
        const card = document.createElement('div');
        card.className = 'card ric-card';
        
        const totalVotes = (ric.votes_for || 0) + (ric.votes_against || 0);
        let cardContent;

        if (ric.status === 'en attente') {
            cardContent = `
                <h3>${ric.question}</h3>
                <p>Statut : <span style="color: #ffc107; font-weight: bold;">En attente de validation</span></p>
                <p>Citoyens tirés au sort : ${ric.drawn_people || 0}</p>
                <div class="card-footer">
                    <span>Votes pour : ${ric.votes_for.toLocaleString()}</span>
                    <span>Votes contre : ${ric.votes_against.toLocaleString()}</span>
                </div>
            `;
        } else {
            cardContent = `
                <h3>${ric.question}</h3>
                <p>Temps restant : <span id="countdown-${ric.id}"></span></p>
                <div class="card-footer">
                    <span>Votants : ${totalVotes.toLocaleString()}</span>
                    <button class="btn btn-secondary vote-btn" data-id="${ric.id}">Voter</button>
                    <button class="btn btn-secondary details-btn" data-id="${ric.id}">Détails</button>
                </div>
            `;
        }
        
        card.innerHTML = cardContent;
        ricListContainer.appendChild(card);
        
        if (ric.status === 'active') {
             startCountdown(ric.id, ric.deadline);
        }
        
        // Ajout des écouteurs d'événements pour les boutons
        const voteBtn = card.querySelector('.vote-btn');
        if (voteBtn) {
            voteBtn.addEventListener('click', () => showVoteModal(ric.id));
        }
        const detailsBtn = card.querySelector('.details-btn');
        if (detailsBtn) {
            detailsBtn.addEventListener('click', () => showRicDetailsModal(ric.id));
        }
    });
}

/**
 * Démarre un compte à rebours pour un RIC donné.
 * @param {string} ricId - L'ID du référendum.
 * @param {string} deadline - La date butoir au format ISO.
 */
function startCountdown(ricId, deadline) {
    const countdownElement = document.getElementById(`countdown-${ricId}`);
    const deadlineDate = new Date(deadline).getTime();

    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = deadlineDate - now;

        if (distance < 0) {
            clearInterval(interval);
            if (countdownElement) {
                countdownElement.textContent = "Expiré";
            }
            updateRicStatusAndConductDraws();
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if (countdownElement) {
            countdownElement.textContent = `${days}j ${hours}h ${minutes}m ${seconds}s`;
        }
    }, 1000);
}

/**
 * Affiche une modale avec les détails d'un RIC.
 * @param {string} ricId - L'ID du référendum.
 */
function showRicDetailsModal(ricId) {
    const ric = activeRicsData.find(r => r.id === ricId);
    if (!ric) return;

    const detailsTemplate = document.getElementById('ric-description-template');
    if (!detailsTemplate) {
        console.error("Template 'ric-description-template' non trouvé.");
        return;
    }
    const modalContent = detailsTemplate.content.cloneNode(true);

    const totalVotes = ric.votes_for + ric.votes_against;

    modalContent.querySelector('#ric-modal-description').textContent = ric.description;
    modalContent.querySelector('#ric-modal-deadline').textContent = `Date butoir : ${ric.deadline}`;
    modalContent.querySelector('#ric-modal-votes').textContent = `Votes actuels : ${totalVotes.toLocaleString()}`;
    modalContent.querySelector('#ric-modal-status').textContent = `Statut : ${ric.status}`;

    showModal(`Détails du RIC : "${ric.question}"`, modalContent);
}

/**
 * Affiche la modale pour voter sur un RIC et envoie la mise à jour à l'API.
 * @param {string} ricId - L'ID du référendum.
 */
function showVoteModal(ricId) {
    const ric = activeRicsData.find(r => r.id === ricId);
    if (!ric) {
        console.error("Référendum non trouvé avec l'ID :", ricId);
        return;
    }

    const voteTemplate = document.getElementById('ric-vote-template');
    if (!voteTemplate) {
        console.error("Template 'ric-vote-template' non trouvé.");
        return;
    }
    const modalContent = voteTemplate.content.cloneNode(true);

    modalContent.querySelector('#ric-vote-question').textContent = ric.question;
    modalContent.querySelector('#ric-vote-description').textContent = ric.description;
    
    const voteYesBtn = modalContent.querySelector('#vote-yes-btn');
    const voteNoBtn = modalContent.querySelector('#vote-no-btn');
    
    if (voteYesBtn) {
        voteYesBtn.addEventListener('click', async () => {
            ric.votes_for++; // Incrémente le vote localement
            
            try {
                // Envoie une requête PUT pour mettre à jour les données sur le serveur
                const response = await fetch(`/api/rics/${ric.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ votes_for: ric.votes_for })
                });

                if (response.ok) {
                    alert(`Vote "OUI" enregistré pour le référendum "${ric.question}" !`);
                    hideModal();
                    initRicPage(); // Recharge les données du serveur pour une mise à jour complète
                } else {
                    const error = await response.json();
                    alert(`Échec du vote : ${error.error}`);
                    ric.votes_for--; // Annule le changement local en cas d'échec
                }
            } catch (error) {
                console.error('Erreur lors de l\'envoi du vote:', error);
                alert('Une erreur est survenue lors du vote. Veuillez réessayer.');
                ric.votes_for--; // Annule le changement local en cas d'échec
            }
        });
    }

    if (voteNoBtn) {
        voteNoBtn.addEventListener('click', async () => {
            ric.votes_against++; // Incrémente le vote localement

            try {
                // Envoie une requête PUT pour mettre à jour les données sur le serveur
                const response = await fetch(`/api/rics/${ric.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ votes_against: ric.votes_against })
                });

                if (response.ok) {
                    alert(`Vote "NON" enregistré pour le référendum "${ric.question}" !`);
                    hideModal();
                    initRicPage(); // Recharge les données du serveur pour une mise à jour complète
                } else {
                    const error = await response.json();
                    alert(`Échec du vote : ${error.error}`);
                    ric.votes_against--; // Annule le changement local en cas d'échec
                }
            } catch (error) {
                console.error('Erreur lors de l\'envoi du vote:', error);
                alert('Une erreur est survenue lors du vote. Veuillez réessayer.');
                ric.votes_against--; // Annule le changement local en cas d'échec
            }
        });
    }
    
    showModal(`Voter sur le RIC : "${ric.question}"`, modalContent);
}

// L'ancienne fonction initRicMap est remplacée par la logique de la modale.
function initRicMap() {}
