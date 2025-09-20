// Fichier : public/src/js/missions.js

// Déclaration des variables globales pour stocker les éléments HTML et les données
let missionsGrid;
let missionDetailsModal;
let missionsData = []; // Variable pour stocker les missions une fois chargées

/**
 * Initialise la page Missions.
 * Point d'entrée principal.
 */
export async function initMissionsPage() {
    console.log("Initialisation de la page Missions...");

    // 1. Assurez-vous que tous les conteneurs HTML existent
    missionsGrid = document.querySelector('.mission-grid');
    if (!missionsGrid) {
        console.error("Le conteneur '.mission-grid' est introuvable. Arrêt de l'initialisation.");
        return;
    }
    
    // Le bon ID de la modale est 'mission-details-modal'
    missionDetailsModal = document.getElementById('mission-details-modal');

    // 2. Initialiser les gestionnaires d'événements pour les formulaires et boutons
    initAddMissionForm();
    initGenerateMissionAiBtn();
    initMissionDetailsModal();

    // 3. Charger et afficher les missions
    await fetchAndRenderMissions();
}

/**
 * Charge les missions depuis l'API et les affiche dans la grille.
 */
async function fetchAndRenderMissions() {
    if (!missionsGrid) return;

    missionsGrid.innerHTML = '<div class="loading-spinner"><p>Chargement des missions...</p></div>';
    try {
        const response = await fetch('/missions/api/missions');
        if (!response.ok) {
            throw new Error(`Erreur de chargement des missions : ${response.statusText}`);
        }
        missionsData = await response.json();
        
        missionsGrid.innerHTML = '';
        if (missionsData.length === 0) {
            missionsGrid.innerHTML = '<p>Aucune mission disponible pour le moment.</p>';
            return;
        }
        
        missionsData.forEach(mission => {
            const card = document.createElement('div');
            card.className = 'card mission-card';
            card.innerHTML = `
                <h3>${mission.title}</h3>
                <p>${mission.description}</p>
                <p><strong>Statut :</strong> ${mission.status}</p>
                <button class="details-button" data-mission-id="${mission.id}">Détails</button>
            `;
            missionsGrid.appendChild(card);
        });

        document.querySelectorAll('.details-button').forEach(button => {
            button.addEventListener('click', handleShowMissionDetails);
        });

    } catch (error) {
        console.error('Erreur lors du chargement des missions:', error);
        missionsGrid.innerHTML = `<p>Impossible de charger les missions : ${error.message}</p>`;
    }
}

/**
 * Affiche la modale avec les détails de la mission sélectionnée.
 * @param {Event} event - L'événement de clic.
 */
function handleShowMissionDetails(event) {
    const missionId = event.target.dataset.mission-id;
    const mission = missionsData.find(m => m.id === missionId); // Utilisez les données déjà chargées

    if (mission && missionDetailsModal) {
        document.getElementById('modal-mission-title').textContent = mission.title;
        // Correction de l'ID de l'élément de description
        document.getElementById('modal-mission-full-description').textContent = mission.full_description;
        document.getElementById('modal-mission-status').textContent = mission.status;
        document.getElementById('modal-mission-rewards').textContent = mission.rewards;
        missionDetailsModal.style.display = 'block';
    } else {
        console.error(`Détails de mission non trouvés pour l'ID: ${missionId}`);
    }
}

/**
 * Initialise le formulaire d'ajout de mission.
 */
function initAddMissionForm() {
    const addMissionFormContainer = document.getElementById('add-mission-form-container');
    const showAddMissionBtn = document.getElementById('show-add-mission-btn');
    const addMissionForm = document.getElementById('add-mission-form');

    if (showAddMissionBtn && addMissionFormContainer && addMissionForm) {
        showAddMissionBtn.addEventListener('click', () => {
            addMissionFormContainer.style.display = 'block';
        });

        addMissionForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(addMissionForm);
            const newMission = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/missions/api/missions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newMission)
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de l\'ajout de la mission.');
                }

                alert('Mission ajoutée avec succès!');
                addMissionFormContainer.style.display = 'none';
                addMissionForm.reset();
                await fetchAndRenderMissions(); // Mettez à jour la liste
            } catch (error) {
                console.error('Erreur:', error);
                alert('Erreur lors de l\'ajout de la mission: ' + error.message);
            }
        });
    } else {
        console.warn("Éléments du formulaire d'ajout de mission non trouvés. La fonctionnalité sera désactivée.");
    }
}

/**
 * Initialise le bouton de génération de mission par IA.
 */
function initGenerateMissionAiBtn() {
    const generateMissionAiBtn = document.getElementById('generate-mission-ai-btn');
    const missionTitleInput = document.getElementById('mission-title-input');
    const missionDescriptionInput = document.getElementById('mission-description-input');
    const missionFullDescriptionInput = document.getElementById('mission-full-description-input');
    const missionRewardsInput = document.getElementById('mission-rewards-input'); // Ajout du champ récompenses
    
    // Vérification de l'existence de tous les éléments
    if (generateMissionAiBtn && missionTitleInput && missionDescriptionInput && missionFullDescriptionInput && missionRewardsInput) {
        generateMissionAiBtn.addEventListener('click', async () => {
            const topic = missionTitleInput.value;
            if (!topic) {
                alert('Veuillez entrer un titre pour la mission.');
                return;
            }
    
            generateMissionAiBtn.textContent = 'Génération en cours...';
            generateMissionAiBtn.disabled = true;
    
            try {
                const response = await fetch('/missions/api/missions/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic })
                });
    
                if (!response.ok) {
                    throw new Error('Erreur de génération de la mission.');
                }
    
                const generatedMission = await response.json();
                missionTitleInput.value = generatedMission.title;
                missionDescriptionInput.value = generatedMission.description;
                missionFullDescriptionInput.value = generatedMission.full_description;
                missionRewardsInput.value = generatedMission.rewards; // Met à jour le champ récompenses
            } catch (error) {
                console.error('Erreur lors de la génération avec l\'IA:', error);
                alert('Échec de la génération avec l\'IA.');
            } finally {
                generateMissionAiBtn.textContent = 'Générer avec l\'IA';
                generateMissionAiBtn.disabled = false;
            }
        });
    } else {
        console.warn("Éléments de génération IA non trouvés. La fonctionnalité sera désactivée.");
    }
}

/**
 * Initialise la modale des détails de mission et ses événements.
 */
function initMissionDetailsModal() {
    if (missionDetailsModal) {
        // La classe du bouton de fermeture est 'close-button'
        const closeBtn = missionDetailsModal.querySelector('.close-button');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                missionDetailsModal.style.display = 'none';
            });
        }
        window.addEventListener('click', (event) => {
            if (event.target === missionDetailsModal) {
                missionDetailsModal.style.display = 'none';
            }
        });
    }
}

// L'appel de cette fonction est géré par app.js