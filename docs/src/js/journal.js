// Fichier : docs/src/js/journal.js

/**
 * Fonction d'initialisation de la page Journal.
 * Cette fonction est le point d'entrée pour toutes les pages liées au journal.
 * @param {string} pageType - Le type de page à charger ('accueil', 'edition', etc.)
 */
export async function initJournalPage(pageType) {
    console.log(`Initialisation de la page Journal - Type: ${pageType}...`);
    
    // On charge la sous-page correspondante
    switch (pageType) {
        case 'edition':
            setupEditionPage();
            break;
        case 'quotidien':
            await fetchAndRenderDailyPosts();
            break;
        case 'historique':
            await fetchAndRenderHistoricalTimeline();
            break;
        default: // 'accueil' ou un cas non spécifié
            await fetchAndRenderFeaturedArticle();
            break;
    }
}
/**
 * Configuration de la page d'édition.
 * Gère l'interface de création et de modification d'articles.
 */
function setupEditionPage() {
    console.log("Initialisation de la page Édition...");
    
    // Ajout d'écouteurs d'événements pour le générateur de brouillon
    const generateBtn = document.getElementById('generate-draft-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const topic = document.getElementById('journal-title-input').value;
            handleGenerateDraft(topic);
        });
    }

    // Ajout d'écouteurs d'événements pour les thématiques du menu latéral
    document.querySelectorAll('.journal-side-menu nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const topic = e.target.dataset.topic;
            document.getElementById('journal-title-input').value = topic;
            handleGenerateDraft(topic);
        });
    });
    
    // Écouteurs pour les boutons de régénération et de sauvegarde
    const saveBtn = document.getElementById('save-article-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveArticle);
    }
    document.getElementById('regenerate-title-btn')?.addEventListener('click', () => regenerateContent('title'));
    document.getElementById('regenerate-image-btn')?.addEventListener('click', () => regenerateContent('image'));
    document.getElementById('regenerate-article-btn')?.addEventListener('click', () => regenerateContent('article'));
}

/**
 * Gère la génération d'un brouillon d'article par l'IA.
 * @param {string} topic - La thématique de l'article.
 */
async function handleGenerateDraft(topic) {
    const previewArea = document.getElementById('draft-preview');
    const contentArea = document.getElementById('journal-content-textarea');
    const titleInput = document.getElementById('journal-title-input');
    
    const finalTopic = topic;

    if (!finalTopic) {
        alert("Veuillez entrer un titre ou sélectionner une thématique.");
        return;
    }

    previewArea.innerHTML = '<h3>Aperçu du brouillon</h3><p>Génération en cours par l\'IA...</p>';
    
    try {
        const response = await fetch(`/journal/generate?topic=${encodeURIComponent(finalTopic)}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur inconnue lors de la génération.');
        }
        
        const newPost = await response.json();
        
        localStorage.setItem('currentArticle', JSON.stringify(newPost));
        
        // Mettre à jour le titre et le contenu pour la prévisualisation et l'édition
        titleInput.value = newPost.title;
        contentArea.value = newPost.article;

        renderDraftPreview(newPost.title, newPost.media, newPost.article);

        document.getElementById('save-article-btn').style.display = 'block';
        document.querySelector('.regenerate-controls').style.display = 'flex';
        
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

    const topic = document.getElementById('journal-title-input').value;
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
        body = JSON.stringify({ title: currentArticle.title, article: document.getElementById('journal-content-textarea').value });
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
            document.getElementById('journal-title-input').value = data.title;
        } else if (type === 'article') {
            updatedArticle.article = data.article;
            document.getElementById('journal-content-textarea').value = data.article;
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
            const errorText = await response.text();
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.error || 'Erreur inconnue');
            } catch (jsonError) {
                throw new Error(`Le serveur a renvoyé une erreur: ${response.status} ${response.statusText}. Réponse: ${errorText.substring(0, 50)}...`);
            }
        }
        
        alert("Article publié avec succès !");
        
        localStorage.removeItem('currentArticle');
        document.getElementById('journal-title-input').value = '';
        document.getElementById('journal-content-textarea').value = '';
        document.getElementById('draft-preview').innerHTML = '<h3>Aperçu du brouillon</h3>';

        document.querySelector('.regenerate-controls').style.display = 'none';
        document.getElementById('save-article-btn').style.display = 'none';
        
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
            <div class="post-content">${content}</div>
        </div>
    `;
}

/**
 * Récupère le contenu d'un article depuis un fichier HTML et l'insère dans le DOM.
 * @param {string} articlePath - Le chemin d'accès relatif au fichier HTML.
 * @returns {Promise<string>} Le contenu HTML de l'article.
 */
async function fetchArticleContent(articlePath) {
    try {
        if (!articlePath) {
            return `<p class="error-message">Contenu de l'article non trouvé.</p>`;
        }
        const response = await fetch(articlePath);
        if (!response.ok) {
            throw new Error(`Failed to fetch article content from ${articlePath}.`);
        }
        return await response.text();
    } catch (error) {
        console.error('Error fetching article content:', error);
        return `<p class="error-message">Erreur de chargement de l'article.</p>`;
    }
}
/**
 * Récupère et rend l'article à la une sur la page d'accueil (journal.html).
 */
async function fetchAndRenderFeaturedArticle() {
    const container = document.getElementById('featured-article-container');
    if (!container) return;
    
    container.innerHTML = '<p>Chargement de l\'article à la une...</p>';

    try {
        const response = await fetch('/journal/article-du-jour');
        
        if (!response.ok) {
            container.innerHTML = '<p>Aucun article à la une pour le moment.</p>';
            return;
        }
        const post = await response.json();
        
        const articleContent = await fetchArticleContent(post.articlePath);

        container.innerHTML = '';
        const postElement = document.createElement('article');
        postElement.className = 'journal-post-card featured-article';
        postElement.innerHTML = `
            <h3>${post.title}</h3>
            <p class="post-date">${new Date(post.date).toLocaleDateString()}</p>
            <img src="${post.media}" alt="${post.title}">
            <div class="post-content">${articleContent}</div>
        `;
        container.appendChild(postElement);

    } catch (error) {
        console.error('Erreur de chargement de l\'article à la une:', error);
        container.innerHTML = `<p class="error-message">Erreur de chargement : ${error.message}</p>`;
    }
}



/**
 * Récupère les articles quotidiens et les rend sur la page "Quotidien".
 */
async function fetchAndRenderDailyPosts() {
    const container = document.getElementById('daily-posts-container');
    if (!container) return;
    
    container.innerHTML = '<p>Chargement des articles...</p>';
    
    try {
        const response = await fetch('/journal/posts');
        if (!response.ok) {
            throw new Error('Échec du chargement des articles.');
        }
        const posts = await response.json();
        
        if (posts.length > 0) {
            container.innerHTML = '';
            for (const post of posts) {
                const articleContent = await fetchArticleContent(post.articlePath);
                
                const postElement = document.createElement('article');
                postElement.className = 'journal-post-card';
                postElement.innerHTML = `
                    <h3>${post.title}</h3>
                    <p class="post-date">${new Date(post.date).toLocaleDateString()}</p>
                    <img src="${post.media}" alt="${post.title}">
                    <div class="post-content">${articleContent}</div>
                `;
                container.appendChild(postElement);
            }
        } else {
            container.innerHTML = '<p>Aucun article n\'a encore été publié.</p>';
        }
        
    } catch (error) {
        console.error('Erreur de chargement des articles:', error);
        container.innerHTML = `<p class="error-message">Erreur de chargement : ${error.message}</p>`;
    }
}

/**
 * Récupère et rend la chronologie complète et les articles de journal sur la page "Historique".
 */
async function fetchAndRenderHistoricalTimeline() {
    const container = document.getElementById('historique-container');
    if (!container) return;
    
    container.innerHTML = '<p>Chargement de l\'historique...</p>';
    
    try {
        const response = await fetch('/journal/historique');
        if (!response.ok) {
            throw new Error('Échec du chargement de l\'historique.');
        }
        const historicalData = await response.json();

        if (historicalData.length > 0) {
            container.innerHTML = '';
            for (const item of historicalData) {
                const itemElement = document.createElement('div');
                itemElement.className = 'timeline-item';
                
                let contentHTML = '';
                if (item.type === 'chronology') {
                    contentHTML = `
                        <h4>${item.title} - ${item.subtitle}</h4>
                        <p class="timeline-date">${new Date(item.start_date).toLocaleDateString()}</p>
                        <p>${item.description}</p>
                        <p class="timeline-meta">Lieu : ${item.city}</p>
                    `;
                } else if (item.type === 'article') {
                    const articleContent = await fetchArticleContent(item.articlePath);
                    contentHTML = `
                        <h4>Article du Journal : ${item.title}</h4>
                        <p class="timeline-date">${new Date(item.date).toLocaleDateString()}</p>
                        <img src="${item.media}" alt="${item.title}">
                        <div class="post-content">${articleContent}</div>
                    `;
                }
                
                itemElement.innerHTML = contentHTML;
                container.appendChild(itemElement);
            }
        } else {
            container.innerHTML = '<p>Aucun événement ou article n\'a encore été enregistré.</p>';
        }
        
    } catch (error) {
        console.error('Erreur de chargement de l\'historique:', error);
        container.innerHTML = `<p class="error-message">Erreur de chargement : ${error.message}</p>`;
    }
}