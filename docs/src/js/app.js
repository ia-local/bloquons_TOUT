// Fichier : public/src/js/app.js

// --- Imports des modules de l'application ---
import { initMap } from './map.js';
import { initJournalPage } from './journal.js';
import { initMissionsPage } from './missions.js';
import { initRicPage } from './rics.js';
import { initDashboard } from './dashboard.js';
import { initLegalPage } from './legal.js';
import { initCvnuPage } from './cvnu.js';
import { initSmartContractPage } from './smartContract.js';
import { initCvnuModal } from './modalCvnu.js';
import { initOrganisationPage } from './timeline.js';
import { initPlaygroundPage } from './playground.js';
import { initMapModal } from './modalMap.js';
import { initObserver } from './observerIa.js';
import { initJournalModal } from './journalModal.js';
import { initJournalAdminPage } from './journal-admin.js';
import { initTreasuryPage } from './treasury.js';
import { initBoycottageForm } from './boycottageForm.js';
import { initHomePage } from './home.js';
import { initContactsPage } from './contacts.js';
import { initReseauPage } from './reseau.js';
import { initParametresPage } from './parametres.js';
import { initDemocratiePage } from './democratie.js';

/**
 * Fonction principale d'initialisation de l'application au chargement de la page.
 */
function initializeApp() {
    loadAsideMenu();
    attachProfileMenuEvent();
    attachNavigationEvents();
    loadPage('home'); // Cette ligne charge le contenu de 'home.html' et appelle initHomePage() via le switch.
    initCvnuModal();
    initMapModal();
    initObserver();

    const loadingScreen = document.querySelector('.loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
}

// --- Fonctions de navigation ---
/**
 * Attache l'écouteur d'événement pour le menu déroulant du profil.
 */
function attachProfileMenuEvent() {
    const profileBtn = document.getElementById('user-profile-btn');
    const profileMenu = document.getElementById('profile-menu');
    
    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!profileMenu.contains(e.target) && !profileBtn.contains(e.target)) {
                profileMenu.classList.remove('show');
            }
        });
    } else {
        console.error("Profile button or menu not found. Check your index.html.");
    }
}

/**
 * Charge le menu latéral de l'application.
 */
function loadAsideMenu() {
    const mainNavigation = document.getElementById('main-navigation');
    if (mainNavigation) {
        mainNavigation.innerHTML = `
            <div class="logo">
                <h3>----</h3>
            </div>
            <ul id="aside-menu">
                <li><a href="#" data-page="home"><i class="fas fa-home"></i><span>Accueil</span></a></li>
                <li><a href="#" data-page="dashboard"><i class="fas fa-chart-line"></i><span>Tableau de bord</span></a></li>
                <li><a href="#" data-page="democratie"><i class="fas fa-briefcase"></i><span>Démocraties</span></a></li>
                <li><a href="#" data-page="cvnu"><i class="fas fa-id-card"></i><span>CV Numérique</span></a></li>
                <li><a href="#" data-page="missions"><i class="fas fa-tasks"></i><span>Missions</span></a></li>
                <li><a href="#" data-page="playground"><i class="fas fa-code"></i><span>Playground</span></a></li>
                <li><a href="#" data-page="ric"><i class="fas fa-balance-scale"></i><span>RIC</span></a></li>
                <li><a href="#" data-page="smartContract"><i class="fas fa-file-contract"></i><span>Smart Contract</span></a></li>
                <li><a href="#" data-page="journal"><i class="fas fa-book"></i><span>Journal</span></a></li>
                <li><a href="#" data-page="map"><i class="fas fa-map-marked-alt"></i><span>Carte</span></a></li>
                <li><a href="#" data-page="treasury"><i class="fas fa-wallet"></i><span>Trésorerie</span></a></li>
                <li><a href="#" data-page="contacts"><i class="fas fa-address-book"></i><span>Contacts</span></a></li>
                <li><a href="#" data-page="reseau"><i class="fas fa-network-wired"></i><span>Réseau</span></a></li>
                 <li><a href="#" data-page="organisation"><i class="fas fa-sitemap"></i><span>Organisation</span></a></li>
                <li><a href="#" data-page="parametres"><i class="fas fa-cog"></i><span>Paramètres</span></a></li>
            </ul>
        `;
    }
}
/**
 * Attache les écouteurs d'événements de clic aux liens de navigation.
 * Gère les liens de l'aside et du footer.
 */
function attachNavigationEvents() {
    document.addEventListener('click', (e) => {
        // Le sélecteur 'a[data-page]' cible tous les liens avec l'attribut data-page,
        // qu'ils soient dans l'aside ou le footer.
        const navLink = e.target.closest('a[data-page]');
        
        if (navLink) {
            e.preventDefault();
            const pageName = navLink.dataset.page;
            
            // Gérer un cas spécial pour la carte qui ouvre une modale
            if (pageName === 'map' && navLink.id === 'open-map-modal-btn') {
                initMapModal();
            } else {
                loadPage(pageName);
            }
            
            // Ferme le menu de profil s'il est ouvert après un clic sur un lien
            const profileMenu = document.getElementById('profile-menu');
            if (profileMenu) {
                profileMenu.classList.remove('show');
            }
        }
    });
}
/**
 * Charge une page HTML de manière dynamique dans le contenu principal.
 * @param {string} pageName - Le nom de la page à charger (ex: 'home', 'map').
 */
async function loadPage(pageName) {
    const mainContent = document.getElementById('main-content');
    const asideLinks = document.querySelectorAll('.main-aside a');

    asideLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.page === pageName);
    });

    try {
        const response = await fetch(`src/pages/${pageName}.html`);
        if (!response.ok) {
            throw new Error(`Erreur de chargement de la page ${pageName}: ${response.statusText}`);
        }
        const html = await response.text();
        mainContent.innerHTML = html;
        
        await new Promise(r => setTimeout(r, 10));
        
        // Exécuter la fonction d'initialisation spécifique à la page
        switch (pageName) {
            case 'home':
                initHomePage();
                break;
            case 'dashboard':
                initDashboard();
                break;
            case 'playground':
                initPlaygroundPage();
                break;
            case 'democratie':
                initDemocratiePage();
                break;
            case 'ric':
                initRicPage();
                break;
            case 'map':
                const data = await fetchAllData();
                const legendConfig = await getMapConfig();
                initMap(data, legendConfig);
                initBoycottageForm();
                break;
            case 'cvnu':
                initCvnuPage();
                break;
            case 'journal':
                initJournalPage();
                break;
            case 'missions':
                initMissionsPage();
                break;
            case 'smartContract':
                initSmartContractPage();
                break;
            case 'legal':
                initLegalPage();
                break;
            case 'organisation':
                initOrganisationPage();
                break;
            case 'treasury':
                initTreasuryPage();
                break;
            case 'contacts':
                initContactsPage();
                break;
            case 'reseau':
                initReseauPage();
                break;
            case 'parametres':
                 console.log('Page des paramètres chargée.');
                 initJournalModal();
                 initParametresPage();
                 break;
            default:
                console.log(`Page ${pageName} chargée, pas de fonction d'initialisation spécifique.`);
                break;
        }
    } catch (error) {
        console.error('Erreur lors du chargement de la page:', error);
        mainContent.innerHTML = `<div class="error-message"><h2>Erreur</h2><p>${error.message}</p></div>`;
    }
}

async function fetchAllData() {
    try {
        const response = await fetch('/database.json');
        if (!response.ok) {
            throw new Error(`Erreur de chargement de la base de données : ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        return {};
    }
}

// --- NOUVELLE FONCTION: Chargement de map.json ---
async function getMapConfig() {
    try {
        const response = await fetch('src/json/map.json');
        if (!response.ok) {
            throw new Error(`Erreur de chargement de la configuration de la légende : ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Erreur lors du chargement de map.json:', error);
        return {};
    }
}


document.addEventListener('DOMContentLoaded', initializeApp);

window.loadPage = loadPage;
window.initHomePage = initHomePage;
window.initDemocratiePage = initDemocratiePage;
window.initDemocratiePage = initDemocratiePage;
window.initReseauPage = initReseauPage;
window.initRicPage = initRicPage;
window.initMap = initMap;
window.initJournalPage = initJournalPage;
window.initMissionsPage = initMissionsPage;
window.initSmartContractPage = initSmartContractPage;
window.initCvnuPage = initCvnuPage;
window.initPlaygroundPage = initPlaygroundPage;
window.initLegalPage = initLegalPage;
window.initOrganisationPage = initOrganisationPage;
window.initMapModal = initMapModal;
window.initJournalAdminPage = initJournalAdminPage;
window.initTreasuryPage = initTreasuryPage;