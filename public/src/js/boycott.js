// Fichier : public/src/js/boycott.js

/**
 * Mappe les noms d'entités spécifiques aux fichiers d'icônes correspondants.
 */
const iconMap = {
    'Leclerc': 'Leclerc.png',
    'Carrefour': 'Carrefour.png',
    'Intermarché': 'Intermarche.png',
    'Super U': 'U.png',
    'Lidl': 'Lidl.png',
    'Aldi': 'Aldi.png',
    'Monoprix': 'Monoprix.png',
    'Proxy/Cocci-MARKET': 'Proxy_Cocci-MARKET.png',
    'Total': 'total.png',
    'HSBC': 'HSBC.png',
    'Société Générale': 'SocieteGenerale.png',
    'Crédit Coopératif': 'CreditCooperatif.png',
    'Crédit Agricole': 'CreditAgricole.png',
    'La Poste': 'LaPoste.png',
    'Crédit Lyonnais': 'CreditLyonnais.png',
    'Crédit Mutuel': 'CreditMutuel.png',
    'CIC': 'CIC.png',
    'EUROPAFI': 'europafi.png',
    'McDonald\'s': 'McDonalds.png',
    'Boulangerie': 'store.png' // Utilise une icône générique de magasin
};

/**
 * Initialise et affiche la liste des enseignes à boycotter.
 * @param {Array<Object>} boycottData - Les données des enseignes à boycotter.
 */
export function initBoycottList(boycottData) {
    const entitiesListContainer = document.getElementById('entities-list');
    if (!entitiesListContainer) {
        // La page ne contient pas l'élément, on sort sans erreur.
        console.warn("L'élément 'entities-list' est manquant, la liste des boycotts ne sera pas affichée.");
        return;
    }
    
    entitiesListContainer.innerHTML = ''; // Nettoyer le conteneur

    if (!boycottData || boycottData.length === 0) {
        entitiesListContainer.innerHTML = `<p>Aucune enseigne à boycotter n'est listée pour le moment.</p>`;
        return;
    }

    boycottData.forEach(entity => {
        const entityCard = document.createElement('div');
        entityCard.className = 'boycott-card';

        // Utilise le nom de l'entité pour chercher l'icône, sinon utilise 'store.png'
        const iconFileName = iconMap[entity.name] || 'store.png';
        const iconPath = `src/img/${iconFileName}`;
        const iconHtml = `<img src="${iconPath}" alt="Icône ${entity.type}" onerror="this.src='src/img/store.png'">`;
        
        const locationsList = entity.locations ? entity.locations.map(loc => `<li>${loc.name || loc.city} (${loc.level})</li>`).join('') : '';

        entityCard.innerHTML = `
            <div class="card-header">
                ${iconHtml}
                <h4>${entity.name}</h4>
            </div>
            <p><strong>Type:</strong> ${entity.type}</p>
            <p>${entity.description}</p>
            ${locationsList ? `<h5>Lieux:</h5><ul>${locationsList}</ul>` : ''}
        `;

        entitiesListContainer.appendChild(entityCard);
    });
}