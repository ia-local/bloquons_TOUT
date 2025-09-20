// Fichier : public/src/js/ipCam.js

/**
 * Gère l'affichage d'une modale avec un flux vidéo ou une image d'une caméra.
 * @param {string} videoUrl - L'URL du flux vidéo ou de l'image.
 * @param {string} title - Le titre de la modale.
 */
export function openIpCamModal(videoUrl, title) {
    const modal = document.createElement('div');
    modal.className = 'ipcam-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h2>${title}</h2>
            <div class="video-container">
                <iframe src="${videoUrl}" frameborder="0" allowfullscreen></iframe>
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