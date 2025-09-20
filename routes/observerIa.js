// File: observerIa.js

/**
 * Initializes the observer to watch the DOM.
 */
export function initObserver() {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    // Check if a Leaflet popup has been added
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
 * Checks for an image in an element and adds an analysis button.
 * @param {HTMLElement} container - The parent element (e.g., the popup).
 */
function checkAndAnalyzeImage(container) {
    // This is where you would put your logic to find the image.
    // For this example, let's assume the popup content contains a video link
    // from which we can extract a thumbnail.
    // In a real scenario, you would need a proper way to get the image URL.
    const videoLink = container.querySelector('a[href*="youtube.com"]');
    if (videoLink) {
        const imageUrl = `https://img.youtube.com/vi/${videoLink.href.split('v=')[1]}/0.jpg`; // A simplified way to get a YouTube thumbnail
        
        const analyzeButton = document.createElement('button');
        analyzeButton.textContent = 'Analyze Image with AI';
        analyzeButton.addEventListener('click', () => {
            handleImageAnalysisRequest(imageUrl, analyzeButton);
        });
        container.appendChild(analyzeButton);
    }
}

/**
 * Handles the image analysis request, adapting to the environment.
 * @param {string} imageUrl - The URL of the image to analyze.
 * @param {HTMLButtonElement} button - The button to update with status.
 */
async function handleImageAnalysisRequest(imageUrl, button) {
    button.disabled = true;
    button.textContent = 'Analysis in progress...';

    // Check if Electron API is available
    if (window.electronAPI) {
        window.electronAPI.sendAnalyzeImage(imageUrl);
        
        window.electronAPI.onImageAnalysisResult(report => {
            alert('AI Report:\n\n' + report);
            button.disabled = false;
            button.textContent = 'Analyze Image with AI';
        });
        window.electronAPI.onImageAnalysisError(error => {
            alert('Analysis Error: ' + error);
            button.disabled = false;
            button.textContent = 'Analyze Image with AI';
        });
    } else { // Fallback for web environment
        try {
            const response = await fetch('/visionai/analyze-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: imageUrl })
            });
            const data = await response.json();
            alert('AI Report:\n\n' + data.report);
        } catch (error) {
            alert('Analysis Error: ' + error.message);
        } finally {
            button.disabled = false;
            button.textContent = 'Analyze Image with AI';
        }
    }
}

// Initializing the observer. This is safe in both environments.
initObserver();