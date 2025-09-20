// Fichier : public/src/js/generatorModal.js

export function openGeneratorModal() {
    const modal = document.createElement('div');
    modal.id = 'generator-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-button" onclick="closeGeneratorModal()">&times;</span>
            <h2>Générer un article de blog</h2>
            <form id="generator-form">
                <label for="blog-topic">Sujet de l'article :</label>
                <input type="text" id="blog-topic" name="topic" required>
                <button type="submit">Générer</button>
            </form>
            <div id="generation-status"></div>
            <div id="generated-article-preview" style="display:none;">
                <h3>Prévisualisation de l'article</h3>
                <h4 id="preview-title"></h4>
                <img id="preview-image" src="" alt="Image générée">
                <div id="preview-content"></div>
                <button onclick="saveArticle()">Sauvegarder l'article</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

export function closeGeneratorModal() {
    const modal = document.getElementById('generator-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

async function saveArticle() {
    // Cette fonction appellera la route /save de votre serveur
    const title = document.getElementById('preview-title').innerText;
    const topic = document.getElementById('blog-topic').value;
    const imageData = document.getElementById('preview-image').src.split(',')[1];
    const content = document.getElementById('preview-content').innerHTML;

    try {
        const response = await fetch('/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, topic, imageData, content })
        });

        if (response.ok) {
            alert('Article sauvegardé avec succès !');
            closeGeneratorModal();
            // Recharger la page du blog pour afficher le nouvel article
            loadPage('blog');
        } else {
            alert('Erreur lors de la sauvegarde de l\'article.');
        }
    } catch (error) {
        console.error('Erreur de sauvegarde:', error);
        alert('Une erreur est survenue lors de la sauvegarde.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const generatorForm = document.getElementById('generator-form');
    if (generatorForm) {
        generatorForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const topic = document.getElementById('blog-topic').value;
            const statusElement = document.getElementById('generation-status');
            const previewElement = document.getElementById('generated-article-preview');

            statusElement.innerText = "Génération en cours...";
            previewElement.style.display = 'none';

            try {
                // Appels asynchrones pour générer le titre, le contenu et l'image
                const [titleResponse, contentResponse, imageResponse] = await Promise.all([
                    fetch(`/title?topic=${topic}`),
                    fetch(`/content?topic=${topic}`),
                    fetch(`/image?topic=${topic}`)
                ]);

                const title = await titleResponse.text();
                const content = await contentResponse.text();
                const imageData = (await imageResponse.json()).image;

                // Affichage de la prévisualisation
                document.getElementById('preview-title').innerText = title;
                document.getElementById('preview-content').innerHTML = content;
                document.getElementById('preview-image').src = `data:image/webp;base64,${imageData}`;
                
                statusElement.innerText = "Génération terminée.";
                previewElement.style.display = 'block';

            } catch (error) {
                statusElement.innerText = 'Erreur de génération. Veuillez réessayer.';
                console.error('Erreur lors de la génération du contenu du blog:', error);
            }
        });
    }
});

// Rendre les fonctions globales
window.openGeneratorModal = openGeneratorModal;
window.closeGeneratorModal = closeGeneratorModal;
window.saveArticle = saveArticle;