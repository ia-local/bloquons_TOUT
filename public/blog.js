document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('blog-posts-container');
    const modal = document.getElementById('article-modal');
    const closeBtn = document.querySelector('.close-btn');

    try {
        const response = await fetch('/blog');
        if (!response.ok) {
            throw new Error('Erreur de chargement des articles.');
        }
        const posts = await response.json();

        container.innerHTML = ''; // Efface le message de chargement

        if (posts.length === 0) {
            container.innerHTML = '<p>Aucun article n\'a encore été enregistré.</p>';
            return;
        }

        posts.forEach(post => {
            const card = document.createElement('article');
            card.className = 'blog-card';
            // Stocker le contenu complet dans un attribut data pour l'afficher plus tard dans la modale
            card.dataset.content = post.content;

            const title = document.createElement('h3');
            title.textContent = post.title;

            const image = document.createElement('img');
            image.alt = post.title;
            image.src = post.image;



            card.appendChild(title);
            card.appendChild(image);

            // Gérer l'ouverture de la modale au clic
            card.addEventListener('click', () => {
                document.getElementById('modal-image').src = post.image;
                document.getElementById('modal-title').textContent = post.title;
                document.getElementById('modal-article-content').innerHTML = post.content;
                modal.style.display = 'block';
            });

            container.appendChild(card);
        });

    } catch (error) {
        console.error('Erreur :', error);
        container.innerHTML = `<p>Impossible de charger les articles : ${error.message}</p>`;
    }
    
    // Gérer la fermeture de la modale
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});