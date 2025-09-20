// Fichier: public/src/js/journal-admin.js

/**
 * Point d'entrée pour l'initialisation de la page d'administration du journal.
 */
export function initJournalAdminPage() {
    console.log("Initialisation du panneau d'administration du journal.");

    // Attacher les écouteurs d'événements à tous les boutons de la modale
    setupJournalAdminEvents();

    // Récupérer l'article en cours depuis le localStorage s'il existe
    const currentArticle = JSON.parse(localStorage.getItem('currentArticle'));
    if (currentArticle) {
        renderDraftPreview(currentArticle.title, currentArticle.media, currentArticle.article);
        document.getElementById('journal-title-input').value = currentArticle.title;
        document.getElementById('journal-content-textarea').value = currentArticle.article;
        document.querySelector('.regenerate-controls').style.display = 'flex';
        document.getElementById('save-article-btn').style.display = 'block';
    }
}

/**
 * Configure les gestionnaires d'événements pour les boutons d'édition.
 */
function setupJournalAdminEvents() {
    document.getElementById('generate-draft-btn').addEventListener('click', () => handleGenerateDraft());
    document.getElementById('save-article-btn').addEventListener('click', handleSaveArticle);
    document.getElementById('regenerate-title-btn').addEventListener('click', () => regenerateContent('title'));
    document.getElementById('regenerate-image-btn').addEventListener('click', () => regenerateContent('image'));
    document.getElementById('regenerate-article-btn').addEventListener('click', () => regenerateContent('article'));

    // Écouteurs pour les thématiques du menu latéral
    document.querySelectorAll('.journal-side-menu nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const topic = e.target.dataset.topic;
            document.getElementById('journal-title-input').value = topic;
            handleGenerateDraft(topic);
        });
    });
}

/**
 * Gère la génération d'un brouillon d'article par l'IA.
 * @param {string} topic - La thématique de l'article.
 */
async function handleGenerateDraft(topic) {
    const title = document.getElementById('journal-title-input').value;
    const previewArea = document.getElementById('draft-preview');
    const contentArea = document.getElementById('journal-content-textarea');

    if (!title && !topic) {
        alert("Veuillez entrer un titre ou sélectionner une thématique.");
        return;
    }

    previewArea.innerHTML = '<h3>Aperçu du brouillon</h3><p>Génération en cours par l\'IA...</p>';
    
    try {
        const response = await fetch(`/journal/generate?topic=${encodeURIComponent(topic || title)}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }
        const newPost = await response.json();
        
        localStorage.setItem('currentArticle', JSON.stringify(newPost));
        
        renderDraftPreview(newPost.title, newPost.media, newPost.article);
        contentArea.value = newPost.article;

        // Afficher les boutons de régénération et de sauvegarde
        document.querySelector('.regenerate-controls').style.display = 'flex';
        document.getElementById('save-article-btn').style.display = 'block';
        
    } catch (error) {
        console.error('Erreur lors de la génération du brouillon:', error);
        previewArea.innerHTML = `<h3>Aperçu du brouillon</h3><p class="error-message">Erreur : ${error.message}</p>`;
    }
}

/**
 * Gère la régénération d'un élément de l'article.
 * @param {string} type - 'title', 'image', ou 'article'.
 */
async function regenerateContent(type) {
    const currentArticle = JSON.parse(localStorage.getItem('currentArticle'));
    if (!currentArticle) {
        alert("Veuillez d'abord générer un brouillon.");
        return;
    }

    const topic = document.getElementById('journal-title-input').value || currentArticle.title;
    let url = '';
    let method = 'GET';
    let body = null;

    if (type === 'title') {
        url = `/journal/regenerate-title?topic=${encodeURIComponent(topic)}`;
    } else if (type === 'article') {
        url = `/journal/regenerate-content?topic=${encodeURIComponent(topic)}`;
    } else if (type === 'image') {
        url = '/journal/regenerate-image';
        method = 'POST';
        body = JSON.stringify({ title: document.getElementById('journal-title-input').value, article: document.getElementById('journal-content-textarea').value });
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: body
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }
        const data = await response.json();

        // Mettre à jour l'article dans le localStorage et le DOM
        let updatedArticle = { ...currentArticle, ...data };
        localStorage.setItem('currentArticle', JSON.stringify(updatedArticle));
        renderDraftPreview(updatedArticle.title, updatedArticle.mediaUrl || updatedArticle.media, updatedArticle.article);
        document.getElementById('journal-title-input').value = updatedArticle.title;
        document.getElementById('journal-content-textarea').value = updatedArticle.article;

    } catch (error) {
        console.error(`Erreur lors de la régénération du ${type}:`, error);
        alert(`Erreur lors de la régénération du ${type}: ${error.message}`);
    }
}

/**
 * Gère la sauvegarde et la publication d'un article.
 */
async function handleSaveArticle() {
    const title = document.getElementById('journal-title-input').value;
    const content = document.getElementById('journal-content-textarea').value;
    
    const currentArticle = JSON.parse(localStorage.getItem('currentArticle'));
    if (!currentArticle || !title || !content) {
        alert("Le titre et le contenu ne peuvent pas être vides.");
        return;
    }

    try {
        const response = await fetch('/journal/save-article', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                content: content,
                mediaUrl: currentArticle.media,
                mediaBase64: currentArticle.mediaBase64
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }
        
        alert("Article publié avec succès !");
        
        localStorage.removeItem('currentArticle');
        document.getElementById('journal-title-input').value = '';
        document.getElementById('journal-content-textarea').value = '';
        document.getElementById('draft-preview').innerHTML = '';

        // Masquer les boutons après la sauvegarde
        document.querySelector('.regenerate-controls').style.display = 'none';
        document.getElementById('save-article-btn').style.display = 'none';

        // Mettre à jour la vue publique via la page principale de l'application
        window.location.reload(); 
        
    } catch (error) {
        console.error('Erreur lors de la publication:', error);
        alert(`Erreur: ${error.message}`);
    }
}

/**
 * Affiche l'aperçu du brouillon dans la section d'édition.
 */
function renderDraftPreview(title, mediaUrl, content) {
    const previewArea = document.getElementById('draft-preview');
    previewArea.innerHTML = `
        <h3>Aperçu du brouillon</h3>
        <div class="draft-content">
            <h4>${title}</h4>
            <img src="${mediaUrl}" alt="Image illustrant le sujet">
            <div>${content}</div>
        </div>
    `;
}