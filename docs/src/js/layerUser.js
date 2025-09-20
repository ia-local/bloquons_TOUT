// Fichier : public/src/js/layerUser.js

let userData = {};

/**
 * Initialise le module de gestion des données utilisateur.
 * @param {Object} data - L'objet contenant toutes les données de la base de données.
 */
export function initUserLayer(data) {
    userData = data;
    console.log("Module utilisateur initialisé.");
    // Vous pouvez ajouter ici d'autres logiques d'initialisation de l'interface utilisateur
    // comme l'affichage du nom de l'utilisateur ou d'autres données du CV.
    
    // Exemple de fonction pour afficher des données utilisateur
    renderUserCvList();
}

/**
 * Récupère et affiche la liste des utilisateurs de la base de données.
 */
function renderUserCvList() {
    const userCvContainer = document.getElementById('users-cv');
    if (!userCvContainer) return;

    if (userData.users_cv && userData.users_cv.length > 0) {
        userCvContainer.innerHTML = userData.users_cv.map(user => `
            <div class="user-cv-card">
                <h3>${user.name}</h3>
                <p>Score CVNU: ${user.cvnu_score}</p>
            </div>
        `).join('');
    } else {
        userCvContainer.innerHTML = '<p>Aucun utilisateur trouvé.</p>';
    }
}

/**
 * Fonctions pour interagir avec les données utilisateur.
 */
export function getUserData(userId) {
    return userData.users_cv.find(user => user.id === userId);
}