// Fonction pour charger le contenu de la page cvnu.html dans le modal
async function loadCvnuContentIntoModal() {
    const modalBody = document.getElementById('cvnu-modal-body');
    modalBody.innerHTML = 'Chargement du contenu...'; // Message de chargement

    try {
        const response = await fetch('src/pages/cvnu.html');
        if (!response.ok) {
            throw new Error(`Erreur de chargement du contenu: ${response.statusText}`);
        }
        const htmlContent = await response.text();
        modalBody.innerHTML = htmlContent;

        // Une fois le contenu chargé, il faut initialiser le script qui s'y rattache
        // pour que les boutons et les événements fonctionnent.
        // Puisque nous avons une fonction initCvnuPage, nous l'appelons ici.
        // Assurez-vous que initCvnuPage est disponible dans ce contexte.
        if (typeof initCvnuPage === 'function') {
            initCvnuPage();
        }

    } catch (error) {
        console.error('Erreur lors du chargement du contenu du modal:', error);
        modalBody.innerHTML = `<div class="error-message">Une erreur est survenue lors du chargement du générateur CVNU.</div>`;
    }
}

// Fonction pour initialiser le comportement du modal
export function initCvnuModal() {
    const modal = document.getElementById('cvnu-modal');
    const openBtn = document.getElementById('open-cv-modal-btn');
    const closeBtn = document.getElementById('close-cv-modal-btn');

    // Ouvre le modal et charge le contenu
    openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'block';
        loadCvnuContentIntoModal();
    });

    // Ferme le modal
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Ferme le modal si l'utilisateur clique en dehors
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}