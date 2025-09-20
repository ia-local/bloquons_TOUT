// Fichier : public/src/js/modalMap.js
// Ce fichier gère l'ouverture et la fermeture de la modal de la carte.

export function initMapModal() {
    const modal = document.getElementById('map-modal');
    const openBtn = document.getElementById('open-map-modal-btn');
    const closeBtn = document.getElementById('close-map-modal-btn');
    const mapModalBody = document.getElementById('map-modal-body');

    openBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        modal.style.display = 'block';

        try {
            // Charge le contenu HTML de la page map.html
            const response = await fetch('src/pages/map.html');
            if (!response.ok) {
                throw new Error('Échec du chargement de la page de la carte.');
            }
            mapModalBody.innerHTML = await response.text();

            // S'assure que Leaflet a le temps de se rendre
            await new Promise(r => setTimeout(r, 10));

            // Initialise la carte avec les données du serveur
            const data = await fetch('/database.json').then(res => res.json());
            window.initMap(data);

        } catch (error) {
            console.error('Erreur lors du chargement de la carte:', error);
            mapModalBody.innerHTML = '<p>Erreur lors du chargement de la carte. Veuillez réessayer.</p>';
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        if (window.map && window.map.remove) {
            window.map.remove();
        }
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            if (window.map && window.map.remove) {
                window.map.remove();
            }
        }
    });
}