// Fichier : public/src/js/modal-ric.js
// Ce fichier gère la logique d'affichage et de masquage de la modale.

/**
 * Configure les écouteurs d'événements pour la modale.
 */
function setupModal() {
    const modal = document.getElementById('app-modal');
    if (!modal) return;
    
    // Ferme la modale en cliquant en dehors
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    // Ferme la modale via le bouton de fermeture
    document.querySelector('.modal-close').addEventListener('click', hideModal);
}

/**
 * Affiche la modale avec le titre et le contenu donnés.
 * @param {string} title - Le titre de la modale.
 * @param {Node} content - Le contenu à afficher dans la modale.
 */
function showModal(title, content) {
    const modal = document.getElementById('app-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');

    if (!modal || !modalTitle || !modalContent) return;

    modalTitle.textContent = title;
    modalContent.innerHTML = '';
    modalContent.appendChild(content);

    modal.classList.add('is-visible');
}

/**
 * Cache la modale.
 */
function hideModal() {
    const modal = document.getElementById('app-modal');
    if (modal) {
        modal.classList.remove('is-visible');
    }
}

// Assurez-vous que les fonctions sont accessibles globalement.
window.setupModal = setupModal;
window.showModal = showModal;
window.hideModal = hideModal;
