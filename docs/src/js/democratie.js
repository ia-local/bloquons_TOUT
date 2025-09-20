// Fichier : public/src/js/democratie.js

/**
 * Fonction d'initialisation de la page Démocratie.
 * Attache les écouteurs d'événements et charge les articles existants.
 */
export async function initDemocratiePage() {
    console.log("Initialisation de la page Démocratie...");

    // Attacher les écouteurs d'événements pour le menu et le bouton de génération initial
    document.getElementById('generate-draft-btn')?.addEventListener('click', () => handleGenerateDraft());
    
    document.querySelectorAll('.democratie-side-menu nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const topic = e.target.dataset.topic;
            // Met à jour l'input avec le topic sélectionné
            document.getElementById('democratie-title-input').value = topic;
            handleGenerateDraft(topic);
        });
    });

    // Masquer les boutons de régénération et de sauvegarde au chargement initial
    document.querySelector('.regenerate-controls').style.display = 'none';
    document.getElementById('save-article-btn').style.display = 'none';

    await fetchAndRenderPosts();
}

/**
 * Attache les écouteurs d'événements aux boutons de régénération et de sauvegarde.
 * Cette fonction est appelée APRÈS la génération d'un brouillon par l'IA.
 */
function setupRegenerateAndSaveEvents() {
    const saveBtn = document.getElementById('save-article-btn');
    const regenerateTitleBtn = document.getElementById('regenerate-title-btn');
    const regenerateImageBtn = document.getElementById('regenerate-image-btn');
    const regenerateArticleBtn = document.getElementById('regenerate-article-btn');

    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveArticle);
        saveBtn.style.display = 'block'; // Afficher le bouton
    }

    if (regenerateTitleBtn) {
        regenerateTitleBtn.addEventListener('click', () => regenerateContent('title'));
    }
    if (regenerateImageBtn) {
        regenerateImageBtn.addEventListener('click', () => regenerateContent('image'));
    }
    if (regenerateArticleBtn) {
        regenerateArticleBtn.addEventListener('click', () => regenerateContent('article'));
    }
    // Afficher les contrôles de régénération
    document.querySelector('.regenerate-controls').style.display = 'flex';
}

/**
 * Gère la génération d'un brouillon d'article par l'IA.
 * @param {string} topic - La thématique de l'article.
 */
async function handleGenerateDraft(topic) {
    const title = document.getElementById('democratie-title-input').value;
    const previewArea = document.getElementById('draft-preview');
    const contentArea = document.getElementById('democratie-content-textarea');

    if (!title && !topic) {
        alert("Veuillez entrer un titre ou sélectionner une thématique.");
        return;
    }

    previewArea.innerHTML = '<h3>Aperçu du brouillon</h3><p>Génération en cours par l\'IA...<i class="fas fa-spinner fa-spin ml-2"></i></p>';
    
    try {
        // L'URL de l'API doit pointer vers le routeur Express que nous avons créé
        const response = await fetch(`/democratie/generate?topic=${encodeURIComponent(topic || title)}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }
        const newPost = await response.json();
        
        // Sauvegarder l'article généré localement pour une utilisation future (régénération/sauvegarde)
        localStorage.setItem('currentArticle', JSON.stringify(newPost));
        
        renderDraftPreview(newPost.title, newPost.media, newPost.article);
        contentArea.value = newPost.article;

        setupRegenerateAndSaveEvents();
        
    } catch (error) {
        console.error('Erreur lors de la génération du brouillon:', error);
        previewArea.innerHTML = `<h3>Aperçu du brouillon</h3><p class="error-message">Erreur : ${error.message}</p>`;
    }
}

/**
 * Gère la régénération d'un élément de l'article (titre, image, texte).
 * Cette fonctionnalité n'est pas implémentée côté serveur, mais ce code est prêt.
 * @param {string} type - 'title', 'image', ou 'article'.
 */
async function regenerateContent(type) {
    const currentArticle = JSON.parse(localStorage.getItem('currentArticle'));
    if (!currentArticle) {
        alert("Veuillez d'abord générer un brouillon.");
        return;
    }

    const topic = document.getElementById('democratie-title-input').value || currentArticle.title;
    let url = '';
    let method = 'GET';
    let body = null;

    if (type === 'title') {
        url = `/democratie/regenerate-title?topic=${encodeURIComponent(topic)}`;
    } else if (type === 'article') {
        url = `/democratie/regenerate-content?topic=${encodeURIComponent(topic)}`;
    } else if (type === 'image') {
        url = `/democratie/regenerate-image`;
        method = 'POST';
        body = JSON.stringify({ title: currentArticle.title, article: document.getElementById('democratie-content-textarea').value });
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

        let updatedArticle = { ...currentArticle };
        
        if (type === 'title') {
            updatedArticle.title = data.title;
            document.getElementById('democratie-title-input').value = data.title;
        } else if (type === 'article') {
            updatedArticle.article = data.article;
            document.getElementById('democratie-content-textarea').value = data.article;
        } else if (type === 'image') {
            updatedArticle.media = data.mediaUrl;
            updatedArticle.mediaBase64 = data.mediaBase64;
        }

        localStorage.setItem('currentArticle', JSON.stringify(updatedArticle));
        renderDraftPreview(updatedArticle.title, updatedArticle.media, updatedArticle.article);

    } catch (error) {
        console.error(`Erreur lors de la régénération du ${type}:`, error);
        alert(`Erreur lors de la régénération du ${type}: ${error.message}`);
    }
}

/**
 * Gère la sauvegarde et la publication d'un article.
 */
async function handleSaveArticle() {
    const title = document.getElementById('democratie-title-input').value;
    const content = document.getElementById('democratie-content-textarea').value;
    
    const currentArticle = JSON.parse(localStorage.getItem('currentArticle'));
    if (!currentArticle || !title || !content) {
        alert("Le titre et le contenu ne peuvent pas être vides.");
        return;
    }

    try {
        // L'URL de l'API doit pointer vers le routeur Express que nous avons créé
        const response = await fetch('/democratie/save-article', {
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
        
        // Réinitialiser l'interface après la publication
        localStorage.removeItem('currentArticle');
        document.getElementById('democratie-title-input').value = '';
        document.getElementById('democratie-content-textarea').value = '';
        document.getElementById('draft-preview').innerHTML = '<h3>Aperçu du brouillon</h3>';

        // Masquer les boutons après la sauvegarde
        document.querySelector('.regenerate-controls').style.display = 'none';
        document.getElementById('save-article-btn').style.display = 'none';

        await fetchAndRenderPosts();
        
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

/**
 * Récupère les articles existants depuis l'API et les rend dans la galerie.
 */
async function fetchAndRenderPosts() {
    const postsContainer = document.getElementById('democratie-posts-container');
    if (!postsContainer) return;
    
    postsContainer.innerHTML = '<p>Chargement des articles...<i class="fas fa-spinner fa-spin ml-2"></i></p>';
    
    try {
        // L'URL de l'API doit pointer vers le routeur Express que nous avons créé
        const response = await fetch('/democratie/posts');
        if (!response.ok) {
            throw new Error('Échec du chargement des articles.');
        }
        const posts = await response.json();
        
        if (posts.length > 0) {
            postsContainer.innerHTML = '';
            posts.forEach(post => {
                const postElement = document.createElement('article');
                postElement.className = 'democratie-post-card';
                postElement.innerHTML = `
                    <div class="card-content">
                        <h3>${post.title}</h3>
                        <p class="post-date">${new Date(post.date).toLocaleDateString()}</p>
                        ${post.media ? `<img src="${post.media}" alt="${post.title}">` : ''}
                        <div class="post-content">${post.article}</div>
                    </div>
                `;
                postsContainer.appendChild(postElement);
            });
        } else {
            postsContainer.innerHTML = '<p>Aucun article n\'a encore été publié.</p>';
        }
        
    } catch (error) {
        console.error('Erreur de chargement des articles:', error);
        postsContainer.innerHTML = `<p class="error-message">Erreur de chargement : ${error.message}</p>`;
    }
}