// Fichier : public/src/js/boycottageForm.js

/**
 * Initialise le gestionnaire d'événements pour le bouton d'ouverture de la modale.
 */
export function initBoycottageForm() {
    const openModalBtn = document.getElementById('open-boycott-modal-btn');
    if (openModalBtn) {
        openModalBtn.addEventListener('click', openBoycottageFormModal);
    }
}

/**
 * Gère l'affichage d'une modale avec un formulaire de soumission de boycottage.
 */
export function openBoycottageFormModal() { // <-- EXPORT AJOUTÉ
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h2>Soumettre une information de boycottage</h2>
            <p>Décrivez une transaction ou un point de manifestation. L'IA extraira les détails pour la carte.</p>
            <form id="boycott-ai-form">
                <div class="input-group">
                    <label for="text-input">Décrivez l'événement ou le commerce :</label>
                    <textarea id="text-input" name="text" rows="4" placeholder="Ex: J'ai fait mes courses au Carrefour de Lyon."></textarea>
                </div>
                <div class="input-group">
                    <label for="image-input">Ou téléchargez une photo de ticket de caisse :</label>
                    <input type="file" id="image-input" name="image" accept="image/*">
                </div>
                <div class="form-actions">
                    <button type="submit" id="submit-btn" class="action-btn">Soumettre</button>
                    <div id="status-message" class="status-message"></div>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'flex';

    const form = document.getElementById('boycott-ai-form');
    const submitBtn = document.getElementById('submit-btn');
    const statusMessage = document.getElementById('status-message');
    const closeButton = modal.querySelector('.close-button');

    closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const textInput = document.getElementById('text-input').value;
        const imageInput = document.getElementById('image-input').files[0];

        if (!textInput && !imageInput) {
            statusMessage.textContent = "Veuillez fournir une description ou une image.";
            return;
        }

        submitBtn.disabled = true;
        statusMessage.textContent = "Analyse en cours par l'IA...";

        let requestBody = {};
        if (textInput) {
            requestBody = { text: textInput };
        } else if (imageInput) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Image = reader.result;
                await submitData({ image: base64Image });
            };
            reader.readAsDataURL(imageInput);
            return; 
        }
        
        await submitData(requestBody);

        async function submitData(data) {
            try {
                const response = await fetch('/api/boycotts/submit-ai-analysis', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
        
                if (response.ok) {
                    const result = await response.json();
                    statusMessage.textContent = "Soumission en attente de validation. Merci pour votre contribution !";
                    document.body.removeChild(modal);
                } else {
                    const error = await response.json();
                    statusMessage.textContent = `Erreur : ${error.error}`;
                }
            } catch (error) {
                console.error('Erreur lors de l\'envoi de la requête:', error);
                statusMessage.textContent = "Une erreur est survenue lors de la communication avec le serveur.";
            } finally {
                submitBtn.disabled = false;
            }
        }
    });
}