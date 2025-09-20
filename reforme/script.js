document.addEventListener('DOMContentLoaded', () => {
    const contentSection = document.getElementById('content');
    const navItems = document.querySelectorAll('.nav-item');
    const saveButton = document.getElementById('save-button');
    const statusMessage = document.getElementById('status-message');

    let currentContentType = '';

    const fetchContent = async (audience) => {
        let url;
        if (audience === 'cvnu') {
            url = '/generate/cvnu';
        } else if (audience === 'smart-contracts') {
            url = '/generate/smart-contracts';
        } else if (audience === 'circular-economy') {
            url = '/generate/circular-economy';
        } else {
            url = `/generate-law-content?audience=${audience}`;
        }
        
        contentSection.innerHTML = `<div class="loader-container"><div class="loader"></div><p>Génération de la présentation en cours...</p></div>`;
        saveButton.style.display = 'none';
        statusMessage.textContent = '';
        currentContentType = audience;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            const data = await response.text();
            contentSection.innerHTML = data;
            saveButton.style.display = 'block';
        } catch (error) {
            console.error('Erreur lors de la récupération du contenu:', error);
            contentSection.innerHTML = '<p class="error">Désolé, une erreur est survenue lors du chargement du contenu.</p>';
            saveButton.style.display = 'none';
        }
    };

    const saveContent = async () => {
        const content = contentSection.innerHTML;
        const type = currentContentType;
        statusMessage.textContent = 'Enregistrement en cours...';

        try {
            const response = await fetch('/save-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, type }),
            });

            const result = await response.json();
            if (response.ok) {
                statusMessage.textContent = result.message;
                statusMessage.style.color = 'green';
            } else {
                statusMessage.textContent = result.message;
                statusMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde :', error);
            statusMessage.textContent = 'Erreur lors de la sauvegarde.';
            statusMessage.style.color = 'red';
        }
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const selectedOption = item.dataset.option;
            fetchContent(selectedOption);
        });
    });

    saveButton.addEventListener('click', saveContent);
});