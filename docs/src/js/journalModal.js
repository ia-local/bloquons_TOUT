// Fichier : public/src/js/journalModal.js
import { initJournalAdminPage } from './journal-admin.js';

export function initJournalModal() {
    const openBtn = document.getElementById('open-journal-admin-btn');
    if (openBtn) {
        openBtn.addEventListener('click', async () => {
            await createAndOpenModal();
        });
    }
}

async function createAndOpenModal() {
    const modalContainer = document.getElementById('journal-admin-modal-container');
    
    // Crée la structure de la modale
    modalContainer.innerHTML = `
        <div id="journal-modal" class="journal-modal">
            <div class="journal-modal-content">
                <span class="close-btn" id="close-journal-modal-btn">&times;</span>
                <div id="journal-modal-body">
                    </div>
            </div>
        </div>
    `;

    const modal = document.getElementById('journal-modal');
    const closeBtn = document.getElementById('close-journal-modal-btn');
    const modalBody = document.getElementById('journal-modal-body');

    // Charge le contenu HTML de la page d'administration
    try {
        const response = await fetch('src/pages/journal-admin.html');
        if (!response.ok) {
            throw new Error('Échec du chargement de la page d\'administration du journal.');
        }
        const html = await response.text();
        modalBody.innerHTML = html;
        initJournalAdminPage(); // Initialise la logique du journal-admin.js

    } catch (error) {
        modalBody.innerHTML = `<p class="error-message">Erreur : ${error.message}</p>`;
        console.error('Erreur de chargement du contenu de la modale:', error);
    }
    
    modal.style.display = 'block';

    // Fermeture de la modale
    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}