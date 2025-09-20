// La fonction d'initialisation que app.js va importer
export function initBlogPage() {
    console.log("Initialisation de la page Blog...");

    const mainContent = document.getElementById('main-content');
    const titleElement = document.getElementById('article-title');
    const imageContainer = document.getElementById('imageTopic');
    const resultatsTopic = document.getElementById('resultatsTopic');
    const controls = document.querySelector('.controls');

    // Génération du contenu textuel (article)
    const generateContent = async (topic) => {
        resultatsTopic.innerHTML = '<p>Chargement de l\'article...</p>';
        try {
            const response = await fetch(`/blog/content?topic=${topic}`);
            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }
            const content = await response.text();
            resultatsTopic.innerHTML = content;
        } catch (error) {
            console.error('Erreur lors de la génération du contenu :', error);
            resultatsTopic.innerHTML = `Une erreur est survenue lors de la génération de l'article : ${error.message}`;
        }
    };

    // Génération de l'image
    const generateImage = async (topic) => {
        imageContainer.innerHTML = '<p>Chargement de l\'image...</p>';
        try {
            const response = await fetch(`/blog/image?topic=${topic}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error);
            }
            const imageData = await response.json();
            const imageElement = document.createElement('img');
            imageElement.src = `data:image/webp;base64,${imageData.image}`;
            imageElement.alt = `Image illustrant le thème ${topic}`;
            imageContainer.innerHTML = '';
            imageContainer.appendChild(imageElement);
        } catch (error) {
            console.error('Erreur lors de la génération de l\'image :', error);
            imageContainer.innerHTML = `Une erreur est survenue : ${error.message}`;
        }
    };

    // Génération du titre
    const generateTitle = async (topic) => {
        titleElement.innerHTML = '<p>Chargement du titre...</p>';
        try {
            const response = await fetch(`/blog/title?topic=${topic}`);
            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }
            const title = await response.text();
            titleElement.innerHTML = title;
        } catch (error) {
            console.error('Erreur lors de la génération du titre :', error);
            titleElement.innerHTML = `Erreur de titre : ${error.message}`;
        }
    };

    // Gestionnaire de clic pour les liens du menu
    document.querySelectorAll('.side-menu nav a').forEach(link => {
        link.addEventListener('click', async (event) => {
            event.preventDefault();
            const topic = link.dataset.topic;

            // Afficher le menu de contrôle
            controls.classList.remove('hidden');

            // Générer tout le contenu
            await generateTitle(topic);
            await generateImage(topic);
            await generateContent(topic);

            // Mettre à jour les gestionnaires de clic pour la nouvelle thématique
            document.querySelector('.regenerate-title').onclick = () => generateTitle(topic);
            document.querySelector('.regenerate-image').onclick = () => generateImage(topic);
            document.querySelector('.regenerate-content').onclick = () => generateContent(topic);
            document.querySelector('.save-content').onclick = async () => {
                const imageElement = imageContainer.querySelector('img');
                const content = resultatsTopic.innerHTML;
                const title = titleElement.textContent;

                if (imageElement && content && title) {
                    const imageData = imageElement.src.split(',')[1];
                    try {
                        const response = await fetch('/blog/save', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ title, topic, imageData, content }),
                        });
                        if (response.ok) {
                            alert('Contenu enregistré avec succès !');
                        } else {
                            const errorText = await response.text();
                            alert(`Erreur lors de l'enregistrement : ${errorText}`);
                        }
                    } catch (error) {
                        console.error('Erreur :', error);
                        alert('Erreur lors de l\'enregistrement du contenu.');
                    }
                } else {
                    alert('Titre, image ou contenu manquant.');
                }
            };
        });
    });
    
    // Ajout d'un message initial pour la page
    titleElement.innerHTML = 'Bienvenue sur le Blog';
    imageContainer.innerHTML = '';
    resultatsTopic.innerHTML = '<p>Sélectionnez une thématique dans le menu de gauche pour générer un article de blog complet.</p>';
    controls.classList.add('hidden');

}

// Note: Le "DOMContentLoaded" est retiré car c'est maintenant app.js qui gère le chargement
// document.addEventListener('DOMContentLoaded', initBlogPage);