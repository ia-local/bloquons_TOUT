// Fichier : public/src/js/modalSlide.js

/**
 * Initialise les modales sur une page.
 * Gère l'ouverture, la fermeture et le chargement de contenu dynamique si nécessaire.
 */
export function initModalSlides() {
    const modalButtons = document.querySelectorAll('[data-modal-id]');
    const modals = document.querySelectorAll('.modal');

    // Écoute les clics sur les boutons qui ouvrent les modales
    modalButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Empêche la propagation de l'événement
            const modalId = button.getAttribute('data-modal-id');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = "block";
                
                // Si la modale contient un graphique, on le rend
                if (modalId === 'modal-finance') {
                    // C'est ici que nous allons appeler une fonction pour créer le graphique
                    // Nous y reviendrons dans la prochaine étape.
                    console.log("Graphique de la modale de financement à initialiser.");
                }
            }
        });
    });

    // Gère la fermeture des modales
    modals.forEach(modal => {
        const closeBtn = modal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = "none";
            });
        }
    });

    // Fermeture de la modale en cliquant en dehors
    window.addEventListener('click', (e) => {
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        });
    });
}