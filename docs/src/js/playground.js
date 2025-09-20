// Fichier : public/src/js/playground.js

async function loadComponent(componentName) {
    const container = document.querySelector('.playground-container');
    try {
        const response = await fetch(`src/pages/playground/${componentName}.html`);
        if (!response.ok) {
            throw new Error(`Échec du chargement du composant ${componentName}.html`);
        }
        const html = await response.text();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        container.appendChild(tempDiv.firstElementChild);
    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

export async function initPlaygroundPage() {
    console.log("Initialisation de la page Playground...");
    const container = document.querySelector('.playground-container');
    container.innerHTML = '<div class="loading-spinner">Chargement du Playground...</div>';

    await loadComponent('input');
    await loadComponent('output');

    const form = document.getElementById('playground-form');
    const promptInput = document.getElementById('prompt-input');
    const outputDisplay = document.getElementById('output-display');
    const generateBtn = form.querySelector('.action-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prompt = promptInput.value;
        if (!prompt) return;

        outputDisplay.innerHTML = '<div class="loading-spinner">Génération en cours...</div>';
        generateBtn.disabled = true;

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: prompt })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error);
            }

            const result = await response.json();
            outputDisplay.textContent = result.response;

        } catch (error) {
            console.error('Erreur lors de la génération IA:', error);
            outputDisplay.innerHTML = `<div class="error-message">Erreur : ${error.message}</div>`;
        } finally {
            generateBtn.disabled = false;
        }
    });
}