// Fichier : public/src/js/detailModal.js

let detailModalEl;
let modalTitleEl;
let modalContentEl;
let closeModalBtn;

/**
 * Initialise le comportement de la modale des détails.
 */
export function initDetailModal() {
    detailModalEl = document.getElementById('detail-modal');
    modalTitleEl = document.getElementById('modal-title');
    modalContentEl = document.getElementById('modal-content');
    closeModalBtn = document.querySelector('#detail-modal .close-button');

    // Vérifie si les éléments HTML nécessaires existent
    if (!detailModalEl || !modalTitleEl || !modalContentEl || !closeModalBtn) {
        console.error("Un ou plusieurs éléments de la modale des détails sont manquants dans le HTML.");
        return;
    }

    closeModalBtn.addEventListener('click', () => {
        detailModalEl.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === detailModalEl) {
            detailModalEl.style.display = 'none';
        }
    });
}

/**
 * Charge les données d'un type d'entité et affiche une modale.
 * @param {string} apiPath - Le chemin de l'API pour récupérer les données (ex: '/api/prefectures').
 * @param {string} itemId - L'ID de l'élément à afficher en détail.
 * @param {string} modalTitle - Le titre de la modale.
 */
export async function showDetailsAsync(apiPath, itemId, modalTitle) {
    if (!detailModalEl || !modalTitleEl || !modalContentEl) return;

    // Afficher un état de chargement
    modalTitleEl.textContent = "Chargement...";
    modalContentEl.innerHTML = "<p>Veuillez patienter...</p>";
    detailModalEl.style.display = 'block';

    try {
        const response = await fetch(apiPath);
        if (!response.ok) {
            throw new Error(`Erreur de chargement des données : ${response.statusText}`);
        }
        const data = await response.json();
        
        const item = data.find(i => i.id === itemId);

        if (item) {
            modalTitleEl.textContent = modalTitle;
            let contentHTML = '';
            for (const key in item) {
                if (Object.prototype.hasOwnProperty.call(item, key)) {
                    let value = item[key];
                    if (typeof value === 'object' && value !== null) {
                        value = JSON.stringify(value, null, 2);
                    }
                    contentHTML += `<p><strong>${key.replace(/_/g, ' ')}:</strong> ${value}</p>`;
                }
            }
            modalContentEl.innerHTML = contentHTML;
        } else {
            modalTitleEl.textContent = "Erreur";
            modalContentEl.innerHTML = "<p>Détails non trouvés.</p>";
        }

    } catch (error) {
        console.error('Erreur lors de la récupération des détails:', error);
        modalTitleEl.textContent = "Erreur";
        modalContentEl.innerHTML = `<p>Impossible de charger les détails : ${error.message}</p>`;
    }
}