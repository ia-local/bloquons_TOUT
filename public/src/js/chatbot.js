// Fichier : public/src/js/chatbot.js

/**
 * Définit la structure d'un message pour le chat.
 * @typedef {Object} ChatMessage
 * @property {string} role - Le rôle de l'expéditeur ('user', 'ai', 'system').
 * @property {string} content - Le contenu du message.
 * @property {string} [persona] - La persona de l'IA (e.g., 'avocat', 'enqueteur').
 */
// Fichier : public/src/js/chatbot.js

/**
 * Gère l'interface et la logique du chatbot avec les fonctionnalités CRUD.
 * @param {HTMLElement} container - Le conteneur HTML du chat.
 */
export function initChatbot(container) {
    if (!container) {
        console.error("Conteneur de chatbot non trouvé.");
        return;
    }

    const messageList = document.getElementById('chat-messages');
    const messageForm = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    
    // Fonction d'affichage des messages
    function displayMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${message.role}-message`;
        messageElement.setAttribute('data-message-id', message.id);
        
        messageElement.innerHTML = `
            <div class="message-bubble">
                <span class="persona-tag">[${message.persona}]</span> ${message.content}
            </div>
            ${message.role === 'user' ? `
                <div class="message-actions">
                    <button class="edit-btn">✏️</button>
                    <button class="delete-btn">🗑️</button>
                </div>
            ` : ''}
        `;
        messageList.appendChild(messageElement);
        messageList.scrollTop = messageList.scrollHeight;
    }

    // Fonction pour charger l'historique des messages
    async function loadChatHistory() {
        try {
            const response = await fetch('/api/chat/history');
            const history = await response.json();
            messageList.innerHTML = ''; // Nettoyer l'historique avant de recharger
            history.forEach(displayMessage);
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique du chat:', error);
        }
    }
    
    // Créer un message (C)
    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userMessage = input.value;
        if (!userMessage) return;

        displayMessage({ id: 'temp-id', role: 'user', content: userMessage, persona: 'vous' });
        input.value = '';

        try {
            const persona = getPersonaFromMessage(userMessage);
            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, persona })
            });
            await response.json();
            loadChatHistory(); // Recharger pour afficher le message avec son ID final
        } catch (error) {
            console.error('Erreur lors de la communication avec le chatbot:', error);
            displayMessage({ id: 'error-id', role: 'system', content: "Désolé, une erreur est survenue." });
        }
    });

    // Mettre à jour un message (U) et supprimer un message (D)
    messageList.addEventListener('click', async (e) => {
        const target = e.target;
        const messageElement = target.closest('.chat-message');
        if (!messageElement) return;

        const messageId = messageElement.getAttribute('data-message-id');

        if (target.classList.contains('delete-btn')) {
            if (confirm("Voulez-vous vraiment supprimer ce message ?")) {
                try {
                    await fetch(`/api/chat/message/${messageId}`, { method: 'DELETE' });
                    messageElement.remove();
                } catch (error) {
                    console.error('Erreur lors de la suppression du message:', error);
                }
            }
        } else if (target.classList.contains('edit-btn')) {
            const currentContent = messageElement.querySelector('.message-bubble').textContent.trim();
            const newContent = prompt("Modifier le message:", currentContent);
            if (newContent !== null && newContent.trim() !== '') {
                try {
                    await fetch(`/api/chat/message/${messageId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: newContent })
                    });
                    messageElement.querySelector('.message-bubble').textContent = newContent;
                } catch (error) {
                    console.error('Erreur lors de la mise à jour du message:', error);
                }
            }
        }
    });
    
    loadChatHistory(); // Charger l'historique au démarrage

    function getPersonaFromMessage(message) {
        if (message.toLowerCase().includes('loi') || message.toLowerCase().includes('législatif')) { return 'avocat'; }
        if (message.toLowerCase().includes('données') || message.toLowerCase().includes('preuve')) { return 'enqueteur'; }
        if (message.toLowerCase().includes('code')) { return 'codage'; }
        return 'generaliste';
    }
}