// Fichier: public/src/js/observerIa.js

/**
 * Initialise l'observateur pour surveiller le DOM.
 */
export function initObserver() {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    // Vérifie si un pop-up Leaflet a été ajouté
                    if (node.classList && node.classList.contains('leaflet-popup-pane')) {
                        const popupContent = node.querySelector('.leaflet-popup-content');
                        if (popupContent) {
                            checkAndAnalyzeImage(popupContent);
                        }
                    }
                });
            }
        });
    });

    const config = { childList: true, subtree: true };
    const targetNode = document.getElementById('app'); 
    if (targetNode) {
        observer.observe(targetNode, config);
    }
}

/**
 * Vérifie si un élément contient une image ou une vidéo à analyser et ajoute un bouton d'analyse.
 * @param {HTMLElement} container - L'élément parent (ex: le pop-up).
 */
function checkAndAnalyzeImage(container) {
    // Tente de trouver un lien vidéo pour l'analyse
    const videoLink = container.querySelector('a[href*="youtube.com"]');
    if (videoLink) {
        // Extraire l'ID de la vidéo pour générer l'URL d'une miniature
        const videoId = videoLink.href.split('v=')[1];
        const imageUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`; 
        
        const analyzeButton = document.createElement('button');
        analyzeButton.textContent = 'Analyser l\'image avec IA';
        analyzeButton.addEventListener('click', () => {
            handleImageAnalysisRequest(imageUrl, analyzeButton);
        });
        container.appendChild(analyzeButton);
    }
}

/**
 * Gère la requête d'analyse d'image, en s'adaptant à l'environnement (Electron ou Web).
 * @param {string} imageUrl - L'URL de l'image à analyser.
 * @param {HTMLButtonElement} button - Le bouton à mettre à jour avec le statut.
 */
async function handleImageAnalysisRequest(imageUrl, button) {
    button.disabled = true;
    button.textContent = 'Analyse en cours...';

    // Vérification de l'environnement : si l'API Electron est disponible
    if (window.electronAPI) {
        // Logique spécifique à Electron
        window.electronAPI.sendAnalyzeImage(imageUrl);
        
        window.electronAPI.onImageAnalysisResult(report => {
            alert('Rapport de l\'IA:\n\n' + report);
            button.disabled = false;
            button.textContent = 'Analyser l\'image avec IA';
        });
        window.electronAPI.onImageAnalysisError(error => {
            alert('Erreur d\'analyse: ' + error);
            button.disabled = false;
            button.textContent = 'Analyser l\'image avec IA';
        });
    } else {
        // Logique pour l'environnement web
        try {
            const response = await fetch('/visionai/analyze-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: imageUrl })
            });

            if (!response.ok) {
                throw new Error(`Erreur API: ${response.statusText}`);
            }
            
            const data = await response.json();
            alert('Rapport de l\'IA:\n\n' + data.report);
        } catch (error) {
            alert('Erreur d\'analyse: ' + error.message);
            console.error(error);
        } finally {
            button.disabled = false;
            button.textContent = 'Analyser l\'image avec IA';
        }
    }
}

// Initialisation de l'observateur.
initObserver();