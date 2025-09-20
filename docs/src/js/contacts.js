// Fichier : public/src/js/contacts.js

/**
 * Initialise la page des contacts en affichant les données des utilisateurs.
 */
export async function initContactsPage() {
    const usersData = await fetchContactsData();

    if (usersData && usersData.users) {
        renderContactCards(usersData.users);
    } else {
        console.error("Données des contacts non trouvées ou invalides.");
    }
}

/**
 * Récupère les données des utilisateurs depuis le fichier JSON.
 * @returns {Promise<Object>} Une promesse qui résout avec les données JSON des utilisateurs.
 */
async function fetchContactsData() {
    try {
        const response = await fetch('/src/json/users.json');
        if (!response.ok) {
            throw new Error(`Erreur de chargement des données des contacts: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Erreur lors de la récupération des données des contacts:", error);
        return {};
    }
}

/**
 * Génère et affiche les cartes des contacts.
 * @param {Array<Object>} contacts - Le tableau d'objets des contacts.
 */
function renderContactCards(contacts) {
    const container = document.getElementById('contacts-container');
    if (!container) {
        console.error("Conteneur des contacts non trouvé.");
        return;
    }

    container.innerHTML = ''; // Nettoyer le contenu existant

    contacts.forEach(contact => {
        const contactCard = document.createElement('div');
        contactCard.className = 'contact-card';
        contactCard.innerHTML = `
            <img src="${contact.profile_picture}" alt="${contact.name}" class="profile-pic">
            <h3>${contact.name}</h3>
            <h4>
                <i class="fas ${getIconForRole(contact.role)} contact-role-icon"></i>
                <span>${contact.role}</span>
            </h4>
            <p>${contact.description}</p>
        `;
        container.appendChild(contactCard);
    });
}

/**
 * Retourne une classe d'icône Font Awesome en fonction du rôle.
 * @param {string} role - La chaîne de caractère du rôle.
 * @returns {string} La classe d'icône Font Awesome correspondante.
 */
function getIconForRole(role) {
    if (role.includes("Développeur")) {
        return "fa-code";
    } else if (role.includes("Économie")) {
        return "fa-chart-line";
    } else if (role.includes("Militant")) {
        return "fa-bullhorn";
    } else {
        return "fa-user-circle";
    }
}