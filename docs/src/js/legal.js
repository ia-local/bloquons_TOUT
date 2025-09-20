export function initLegalPage() {
    const contentSection = document.getElementById('content');
    const navItems = document.querySelectorAll('.legal-page-container .nav-item');
    const saveButton = document.getElementById('save-button');
    const statusMessage = document.getElementById('status-message');
    const loader = document.querySelector('.loader-container');

    let currentContentType = '';

    const fetchContent = async (audience) => {
        let url;
        // Adapte les URL pour qu'elles correspondent aux routes du serveur unifié
        if (audience === 'cvnu') {
            url = '/reforme/generate/cvnu';
        } else if (audience === 'smart-contracts') {
            url = '/reforme/generate/smart-contracts';
        } else if (audience === 'circular-economy') {
            url = '/reforme/generate/circular-economy';
        } else {
            url = `/reforme/generate-law-content?audience=${audience}`;
        }

        loader.style.display = 'flex'; // Affiche le loader
        contentSection.innerHTML = '';
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
        } finally {
            loader.style.display = 'none'; // Masque le loader une fois terminé
        }
    };

    const saveContent = async () => {
        const content = contentSection.innerHTML;
        const type = currentContentType;
        statusMessage.textContent = 'Enregistrement en cours...';

        try {
            // Adapte l'URL pour qu'elle corresponde à la nouvelle route
            const response = await fetch('/reforme/save-content', {
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

    // Affiche un message d'accueil initial
    contentSection.innerHTML = `<div class="welcome-message">
        <h2>Bienvenue sur le Générateur de Contenu Législatif</h2>
        <p>Utilisez le menu à gauche pour générer des présentations sur les différents aspects de la réforme.</p>
    </div>`;
}