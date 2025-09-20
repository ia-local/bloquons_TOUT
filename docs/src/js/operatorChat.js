// Fichier : public/src/js/operatorChat.js

/**
 * Initialise le chat de l'opérateur sur le tableau de bord.
 */
export function initOperatorChat() {
    console.log("Initialisation du chat de l'opérateur IA...");

    const chatHistory = document.getElementById('ai-chat-history');
    const input = document.getElementById('ai-input');
    const sendButton = document.getElementById('ai-send-button');

    if (!chatHistory || !input || !sendButton) {
        console.error("Éléments du DOM pour le chat de l'opérateur non trouvés.");
        return;
    }

    sendButton.addEventListener('click', () => sendMessage());
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    /**
     * Envoie un message à l'IA et affiche la réponse.
     */
    async function sendMessage() {
        const message = input.value.trim();
        if (!message) return;

        const userMessage = document.createElement('p');
        userMessage.textContent = `Vous : ${message}`;
        userMessage.className = 'user-message';
        chatHistory.appendChild(userMessage);
        input.value = '';

        const loadingMessage = document.createElement('p');
        loadingMessage.textContent = 'IA : ... (réponse en cours)';
        loadingMessage.className = 'ai-message loading';
        chatHistory.appendChild(loadingMessage);
        chatHistory.scrollTop = chatHistory.scrollHeight;

        try {
            const response = await fetch('/api/operator/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                throw new Error(`Erreur API: ${response.statusText}`);
            }

            const data = await response.json();
            loadingMessage.textContent = `IA : ${data.response}`;
            loadingMessage.classList.remove('loading');
            loadingMessage.classList.add('ai-message');
            
        } catch (error) {
            loadingMessage.textContent = `IA : Erreur - ${error.message}`;
            loadingMessage.classList.remove('loading');
            loadingMessage.classList.add('ai-error');
            console.error("Erreur de l'assistant IA:", error);
        }

        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
}