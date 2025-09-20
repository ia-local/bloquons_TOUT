// public/modal.js

const genericAppModal = document.getElementById('genericAppModal');
const genericModalTitle = document.getElementById('genericModalTitle');
const genericModalBody = document.getElementById('genericModalBody');
const genericModalFooter = document.getElementById('genericModalFooter');

// Références aux boutons (déclarées globalement, mais initialisées lors de DOMContentLoaded dans cv.js)
let genericCloseModalBtn, genericModalConfirmBtn, genericModalCancelBtn, genericModalOkBtn;

let resolveModalPromise; // Function to resolve the promise when modal is closed

// Initialisation des éléments DOM de la modale une fois le DOM chargé
document.addEventListener('DOMContentLoaded', () => {
    genericCloseModalBtn = document.getElementById('genericCloseModalBtn');
    genericModalConfirmBtn = document.getElementById('genericModalConfirmBtn');
    genericModalCancelBtn = document.getElementById('genericModalCancelBtn');
    genericModalOkBtn = document.getElementById('genericModalOkBtn');
});


/**
 * Shows a generic modal with customizable content and buttons.
 * @param {string} title - The title of the modal.
 * @param {string} bodyHtml - The HTML content for the modal body.
 * @param {'alert'|'confirm'|'info'} type - Type of modal to determine button visibility.
 * @param {string} [maxWidth='500px'] - Optional: maximum width for the modal content.
 * @returns {Promise<boolean|undefined>} Resolves to true for 'confirm' if confirmed, false if cancelled. Undefined for 'alert'/'info'.
 */
export function showModal(title, bodyHtml, type = 'alert', maxWidth = '500px') {
    return new Promise((resolve) => {
        resolveModalPromise = resolve; // Store resolve function for later use

        if (genericModalTitle) genericModalTitle.innerHTML = title;
        if (genericModalBody) genericModalBody.innerHTML = bodyHtml;
        if (genericAppModal && genericAppModal.querySelector('.modal-content')) {
            genericAppModal.querySelector('.modal-content').style.maxWidth = maxWidth; // Set max-width
        }


        // Reset button visibility
        if (genericModalConfirmBtn) genericModalConfirmBtn.style.display = 'none';
        if (genericModalCancelBtn) genericModalCancelBtn.style.display = 'none';
        if (genericModalOkBtn) genericModalOkBtn.style.display = 'none';

        // Remove existing event listeners to prevent multiple bindings
        // IMPORTANT: Always check if the element exists before trying to add/remove listeners
        const cleanListeners = (btn, handler) => {
            if (btn) {
                btn.removeEventListener('click', handler);
            }
        };

        // Remove all potential handlers before adding new ones
        cleanListeners(genericCloseModalBtn, () => hideModal(type === 'confirm' ? false : undefined));
        cleanListeners(genericModalOkBtn, () => hideModal(undefined));
        cleanListeners(genericModalConfirmBtn, () => hideModal(true));
        cleanListeners(genericModalCancelBtn, () => hideModal(false));

        // Configure and add new event listeners based on type
        if (type === 'confirm') {
            if (genericModalConfirmBtn) {
                genericModalConfirmBtn.style.display = 'inline-block';
                genericModalConfirmBtn.addEventListener('click', () => hideModal(true));
            }
            if (genericModalCancelBtn) {
                genericModalCancelBtn.style.display = 'inline-block';
                genericModalCancelBtn.addEventListener('click', () => hideModal(false));
            }
        } else { // 'alert' or 'info'
            if (genericModalOkBtn) {
                genericModalOkBtn.style.display = 'inline-block';
                genericModalOkBtn.addEventListener('click', () => hideModal(undefined));
            }
        }

        // Add close button listener
        if (genericCloseModalBtn) {
            genericCloseModalBtn.addEventListener('click', () => hideModal(type === 'confirm' ? false : undefined));
        }

        // Show the modal
        if (genericAppModal) genericAppModal.classList.add('active');
    });
}

/**
 * Hides the generic modal and resolves the promise.
 * @param {boolean|undefined} result - The value to resolve the modal promise with.
 */
function hideModal(result) {
    if (genericAppModal) genericAppModal.classList.remove('active');
    if (resolveModalPromise) {
        resolveModalPromise(result);
        resolveModalPromise = null; // Clear the stored resolve function
    }
}
