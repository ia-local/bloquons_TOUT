// Fichier : public/src/js/modal.js

function showModal(content) {
    const modalContainer = document.getElementById('modal-container');
    const modalBody = document.getElementById('modal-body');
    if (modalContainer && modalBody) {
        modalBody.innerHTML = content;
        modalContainer.classList.remove('hidden');
    }
}

function closeModal() {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
        modalContainer.classList.add('hidden');
    }
}
// Fichier : public/src/js/modal.js

/**
 * Gère l'affichage d'une modale générique.
 * @param {Object} content - Un objet contenant les informations à afficher dans la modale (titre, contenu, média).
 */
export function openModal({ title, content, media }) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <div class="modal-body">
                ${media ? `<img src="${media}" alt="${title}" class="modal-image">` : ''}
                <h2>${title}</h2>
                <p>${content}</p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeButton = modal.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    });
}