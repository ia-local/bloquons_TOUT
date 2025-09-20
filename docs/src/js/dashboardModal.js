// Fichier : public/src/js/dashboardModal.js

/**
 * Gère l'ouverture et la fermeture de la modale du tableau de bord.
 * @param {string} title - Le titre de la modale.
 * @param {string} contentHtml - Le contenu HTML à afficher.
 */
export function openDashboardModal(title, contentHtml) {
    const modal = document.getElementById('dashboard-modal');
    const modalTitle = document.getElementById('dashboard-modal-title');
    const modalContent = document.getElementById('dashboard-modal-content');
    const closeBtn = document.getElementById('dashboard-modal-close-btn');

    if (!modal || !modalTitle || !modalContent || !closeBtn) {
        console.error("Éléments de la modale du dashboard non trouvés.");
        return;
    }

    modalTitle.textContent = title;
    modalContent.innerHTML = contentHtml;
    modal.style.display = 'block';

    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}