// Fichier : public/src/js/card.js

/**
 * Crée un composant de carte pour un article de blog.
 * @param {Object} post - L'objet contenant les données de l'article (titre, média, article, date).
 * @returns {HTMLElement} L'élément HTML de la carte.
 */
export function createBlogCard(post) {
    const card = document.createElement('div');
    card.className = 'card-blog';
    card.innerHTML = `
        <div class="card-blog-media">
            <img src="${post.media}" alt="${post.title}">
        </div>
        <div class="card-blog-content">
            <h3>${post.title}</h3>
            <p>${post.article.substring(0, 100)}...</p>
            <span class="card-date">${post.date}</span>
        </div>
    `;
    return card;
}