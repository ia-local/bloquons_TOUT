// Fichier : public/src/js/pagination.js
// Ce fichier est une base pour la gestion de la pagination si nécessaire.

/**
 * Gère la logique de pagination pour une liste d'éléments.
 * @param {HTMLElement} container - Le conteneur où les éléments sont affichés.
 * @param {Array} data - Le tableau des données à paginer.
 * @param {number} itemsPerPage - Le nombre d'éléments par page.
 */
function setupPagination(container, data, itemsPerPage) {
    let currentPage = 1;
    const totalPages = Math.ceil(data.length / itemsPerPage);

    function displayPage(page) {
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const items = data.slice(start, end);

        // Nettoyer le conteneur
        container.innerHTML = '';
        
        // Afficher les éléments de la page
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.textContent = `Élément ${item.id}`; // Exemple
            container.appendChild(itemElement);
        });
    }

    // Exemple de contrôles de pagination
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Précédent';
    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            displayPage(currentPage);
        }
    };

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Suivant';
    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayPage(currentPage);
        }
    };

    // Vous pouvez ajouter ces boutons à l'interface
    // document.body.appendChild(prevButton);
    // document.body.appendChild(nextButton);

    // Afficher la première page
    displayPage(currentPage);
}
