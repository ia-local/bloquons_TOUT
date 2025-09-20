// public/cv.js - Logique client pour CVNU

// --- CONSTANTES ---
const API_BASE_URL = window.location.origin; // Par exemple: http://localhost:3000

// --- Global state for modals (imported from modal.js) ---
import { showModal } from './modal.js';

// --- Global state for pagination (imported from pagination.js) ---
import { setConversations, renderChatConversationList, initPaginationControls, setActiveConversationId } from './pagination.js';


// --- État de l'application ---
let currentConversationId = null;
let currentChatPage = 1;
const CHAT_CONVERSATIONS_PER_PAGE = 5; // Nombre de conversations à afficher par page
let currentCvStructuredData = null; // Stocke la dernière structure JSON du CV

// --- Variables pour les éléments du DOM (déclarées ici mais initialisées dans DOMContentLoaded) ---
let mainNavbar, navLinks, contentSections, dynamicLeftNav, dynamicNavList, globalStatusMessage;

// Page Accueil
let promptInput, iaResponseOutput, generateResponseBtn, clearPromptBtn;

// Dashboard UTMi
let totalUtmiEl, totalEstimatedCostUSDEl, totalEstimatedCostEUREl, totalInteractionCountEl,
    averageUtmiPerInteractionEl, totalUtmiPerCostRatioEl, utmiByTypeEl, utmiByModelEl,
    utmiPerCostRatioByModelEl, utmiByCognitiveAxisEl, thematicUtmiMarketingEl,
    thematicUtmiAffiliationEl, thematicUtmiFiscalEconomicEl, mostValuableTopicsEl,
    mostCommonActivitiesEl, exchangeRatesEl, refreshDashboardBtn;

// Gestion du CV
let cvInput, generateCvBtn, clearCvInputBtn, cvOutput, downloadCvBtn,
    valorizeCvContentBtn, valorizationOutput, editCvBtn;

// Chatroom IA
let startNewConversationBtn, generateChatCvSummaryBtn,
    currentConversationIdSpan, chatWindow, chatInput, sendChatBtn,
    modalCvSummarySection, modalCvSummaryOutput, copyModalCvSummaryBtn;

// Dynamic elements for chat list and pagination within the left nav
let chatConversationListElement, chatPrevPageBtn, chatNextPageBtn, chatCurrentPageInfoSpan;


// --- Fonctions utilitaires ---
function showStatusMessage(message, type = 'info') {
    globalStatusMessage.textContent = message;
    globalStatusMessage.className = `status-message ${type} active`;
    setTimeout(() => {
        globalStatusMessage.classList.remove('active');
    }, 3000);
}

// Fonction pour afficher une section spécifique et masquer les autres
const showPage = (pageId) => {
    contentSections.forEach(section => {
        section.classList.remove('active');
    });
    const activeSection = document.getElementById(pageId + '-page');
    if (activeSection) {
        activeSection.classList.add('active');
        updateDynamicLeftNav(pageId); // Mettre à jour la nav latérale

        // Gérer les rendus spécifiques à la page si nécessaire
        if (pageId === 'dashboard') {
            fetchDashboardInsights(); // Recharger les données du dashboard
        } else if (pageId === 'home') {
            // Pas de graphique spécifique à rendre immédiatement sur la page d'accueil
        } else if (pageId === 'cv-management') {
            if (downloadCvBtn) downloadCvBtn.style.display = 'none'; // Cacher le bouton de téléchargement par défaut
            if (editCvBtn) editCvBtn.style.display = 'none'; // Cacher le bouton d'édition par default
            if (valorizeCvContentBtn) valorizeCvContentBtn.disabled = true; // Désactiver la valorisation par défaut
            if (cvOutput) cvOutput.innerHTML = '<p class="placeholder-text">Votre CV sera généré ici. Il affichera vos compétences et expériences structurées.</p>';
            if (valorizationOutput) valorizationOutput.innerHTML = '<p class="placeholder-text">La valorisation de vos compétences par l\'IA apparaîtra ici (ex: phrase d\'accroche, description des compétences, estimation UTMi).</p>';
            loadLastStructuredCvData(); // Tenter de charger le dernier CV structuré si disponible
        } else if (pageId === 'chatroom') {
            // Initial state for chat input/buttons
            if (chatInput) chatInput.disabled = true;
            if (sendChatBtn) sendChatBtn.disabled = true;
            if (generateChatCvSummaryBtn) generateChatCvSummaryBtn.style.display = 'none'; // Hide until chat has content
        }
    }
};

// Fonction pour définir le lien de navigation actif
const setActiveNavLink = (pageId) => {
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
};

// Fonction pour mettre à jour la navigation latérale dynamique
const updateDynamicLeftNav = (currentPageId) => {
    let navContent = '';
    let navTitle = `<i class="fas fa-bars"></i> Menu Thématique`;

    dynamicNavList.innerHTML = ''; // Clear existing content first
    dynamicLeftNav.querySelector('.dynamic-nav-title').innerHTML = navTitle; // Reset title

    if (currentPageId === 'chatroom') {
        navTitle = `<i class="fas fa-comment-dots"></i> Conversations`;
        dynamicLeftNav.querySelector('.dynamic-nav-title').innerHTML = navTitle;

        // Dynamically create conversation list and pagination elements
        const conversationListContainer = document.createElement('div');
        conversationListContainer.className = 'conversation-list-container'; // Reuse existing chat styles
        conversationListContainer.innerHTML = `
            <h3 class="card-subtitle"><i class="fas fa-list"></i> Vos Conversations</h3>
            <ul id="conversation-list" class="conversation-list custom-scrollbar">
                <p class="placeholder-text">Chargement des conversations...</p>
            </ul>
            <div class="pagination-controls" id="conversation-pagination">
                <button class="btn btn-icon" data-page-action="prev" disabled><i class="fas fa-chevron-left"></i></button>
                <span id="current-page-info">Page 1/1</span>
                <button class="btn btn-icon" data-page-action="next" disabled><i class="fas fa-chevron-right"></i></button>
            </div>
        `;
        dynamicNavList.appendChild(conversationListContainer);

        // Get references to the newly created elements
        chatConversationListElement = conversationListContainer.querySelector('#conversation-list');
        chatPrevPageBtn = conversationListContainer.querySelector('[data-page-action="prev"]');
        chatNextPageBtn = conversationListContainer.querySelector('[data-page-action="next"]');
        chatCurrentPageInfoSpan = conversationListContainer.querySelector('#current-page-info');

        // Initialize pagination controls for the dynamically created elements
        initPaginationControls(
            chatPrevPageBtn,
            chatNextPageBtn,
            chatCurrentPageInfoSpan,
            fetchConversations,
            selectConversation,
            deleteConversation
        );

        // Fetch and render conversations immediately
        fetchConversations(currentChatPage);

    } else {
        // Default static navigation links
        switch (currentPageId) {
            case 'home':
                navTitle = `<i class="fas fa-info-circle"></i> Accueil`;
                navContent = `
                    <li><a href="#home-page .card:nth-of-type(1)">Assistant IA</a></li>
                    <li><a href="#home-page .card:nth-of-type(2)">Interaction Ponctuelle</a></li>
                `;
                break;
            case 'dashboard':
                navTitle = `<i class="fas fa-chart-line"></i> Dashboard UTMi`;
                navContent = `
                    <li><a href="#dashboard-page .grid-metrics">Aperçu Global</a></li>
                    <li><a href="#dashboard-page .grid-details">Détails & Répartitions</a></li>
                    <li><a href="#refreshDashboardBtn">Actualiser</a></li>
                `;
                break;
            case 'user-profile':
                navTitle = `<i class="fas fa-user-circle"></i> Votre Profil`;
                navContent = `
                    <li><a href="#user-profile-page .card:nth-of-type(1)">Identité CVNU</a></li>
                    <li><a href="#user-profile-page .card:nth-of-type(2)">Comptes Liés</a></li>
                    <li><a href="#user-profile-page .card:nth-of-type(3)">Sécurité</a></li>
                `;
                break;
            case 'cv-management':
                navTitle = `<i class="fas fa-address-card"></i> Gestion CV`;
                navContent = `
                    <li><a href="#cv-management-page .card:nth-of-type(1)">Générateur de CV</a></li>
                    <li><a href="#cv-management-page #cv-output">Aperçu CV</a></li>
                    <li><a href="#cv-management-page .card:nth-of-type(2)">Valorisation Compétences</a></li>
                `;
                break;
            case 'workspace':
                navTitle = `<i class="fas fa-briefcase"></i> Mon Espace`;
                navContent = `
                    <li><a href="#workspace-page .card:nth-of-type(1)">Outils Personnalisés</a></li>
                    <li><a href="#workspace-page .card:nth-of-type(2)">Projets Actifs</a></li>
                `;
                break;
            case 'documentation':
                navTitle = `<i class="fas fa-book-open"></i> Documentation`;
                navContent = `
                    <li><a href="#documentation-page .card:nth-of-type(1)">Guide d'Utilisation</a></li>
                    <li><a href="#documentation-page .card:nth-of-type(2)">Référence Développeur</a></li>
                `;
                break;
            case 'contact':
                navTitle = `<i class="fas fa-headset"></i> Contact`;
                navContent = `
                    <li><a href="#contact-page .card:nth-of-type(1)">Par Email</a></li>
                    <li><a href="#contact-page .card:nth-of-type(2)">Support</a></li>
                    <li><a href="#contact-page .card:nth-of-type(3)">Adresse</a></li>
                `;
                break;
            default:
                navContent = `<li class="placeholder-text">Sélectionnez une section...</li>`;
                break;
        }
        dynamicLeftNav.querySelector('.dynamic-nav-title').innerHTML = navTitle;
        dynamicNavList.innerHTML = navContent;

        // Add click listeners to dynamic nav links for smooth scrolling
        dynamicNavList.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSelector = link.getAttribute('href');
                const targetElement = document.querySelector(targetSelector);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
                // Add 'active' class to the clicked dynamic nav link
                dynamicNavList.querySelectorAll('a').forEach(subLink => subLink.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // Automatically set the first dynamic link as active if available
        if (dynamicNavList.firstElementChild && dynamicNavList.firstElementChild.firstElementChild) {
            dynamicNavList.firstElementChild.firstElementChild.classList.add('active');
        }
    }
};


// --- Logique de l'application ---

// Initialisation des éléments DOM et attachement des écouteurs d'événements après chargement complet du DOM
document.addEventListener('DOMContentLoaded', () => {
    // Initialisation des éléments DOM
    mainNavbar = document.getElementById('mainNavbar');
    navLinks = document.querySelectorAll('.navbar-main-links .nav-link');
    contentSections = document.querySelectorAll('.content-section');
    dynamicLeftNav = document.getElementById('dynamic-left-nav');
    dynamicNavList = document.getElementById('dynamic-nav-list');
    globalStatusMessage = document.getElementById('globalStatusMessage');

    // Page Accueil
    promptInput = document.getElementById('prompt-input');
    iaResponseOutput = document.getElementById('ia-response-output');
    generateResponseBtn = document.getElementById('generateResponseBtn');
    clearPromptBtn = document.getElementById('clearPromptBtn');

    // Dashboard UTMi
    totalUtmiEl = document.getElementById('totalUtmi');
    totalEstimatedCostUSDEl = document.getElementById('totalEstimatedCostUSD');
    totalEstimatedCostEUREl = document.getElementById('totalEstimatedCostEUR');
    totalInteractionCountEl = document.getElementById('totalInteractionCount');
    averageUtmiPerInteractionEl = document.getElementById('averageUtmiPerInteraction');
    totalUtmiPerCostRatioEl = document.getElementById('totalUtmiPerCostRatio');
    utmiByTypeEl = document.getElementById('utmiByType');
    utmiByModelEl = document.getElementById('utmiByModel');
    utmiPerCostRatioByModelEl = document.getElementById('utmiPerCostRatioByModel');
    utmiByCognitiveAxisEl = document.getElementById('utmiByCognitiveAxis');
    thematicUtmiMarketingEl = document.getElementById('thematicUtmiMarketing');
    thematicUtmiAffiliationEl = document.getElementById('thematicUtmiAffiliation');
    thematicUtmiFiscalEconomicEl = document.getElementById('thematicUtmiFiscalEconomic');
    mostValuableTopicsEl = document.getElementById('mostValuableTopics');
    mostCommonActivitiesEl = document.getElementById('mostCommonActivities');
    exchangeRatesEl = document.getElementById('exchangeRates');
    refreshDashboardBtn = document.getElementById('refreshDashboardBtn');

    // Gestion du CV
    cvInput = document.getElementById('cv-input');
    generateCvBtn = document.getElementById('generateCvBtn');
    clearCvInputBtn = document.getElementById('clearCvInputBtn');
    cvOutput = document.getElementById('cv-output');
    downloadCvBtn = document.getElementById('downloadCvBtn');
    valorizeCvContentBtn = document.getElementById('valorizeCvContentBtn');
    valorizationOutput = document.getElementById('valorization-output');
    editCvBtn = document.getElementById('editCvBtn');

    // Chatroom IA
    startNewConversationBtn = document.getElementById('startNewConversationBtn');
    generateChatCvSummaryBtn = document.getElementById('generateChatCvSummaryBtn');
    // conversationList (old) is now dynamically created in updateDynamicLeftNav
    currentConversationIdSpan = document.getElementById('current-conversation-id');
    chatWindow = document.getElementById('chat-window');
    chatInput = document.getElementById('chat-input');
    sendChatBtn = document.getElementById('send-chat-btn'); // Corrected ID
    modalCvSummarySection = document.getElementById('modalCvSummarySection');
    modalCvSummaryOutput = document.getElementById('modalCvSummaryOutput');
    copyModalCvSummaryBtn = document.getElementById('copyModalCvSummaryBtn');


    // Afficher la page d'accueil par default
    showPage('home');
    setActiveNavLink('home');

    // Adapter le padding du body pour la navbar fixe
    const navbarHeight = mainNavbar.offsetHeight;
    document.body.style.paddingTop = `${navbarHeight + 20}px`; // Ajoute un peu de marge

    // Gestion de la navigation principale
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const pageId = link.getAttribute('data-page');
            showPage(pageId);
            setActiveNavLink(pageId);
        });
    });

    // Assurer que les événements pour les éléments du Dashboard sont attachés
    if (refreshDashboardBtn) {
        refreshDashboardBtn.addEventListener('click', fetchDashboardInsights);
    }
    // Gérer l'interaction ponctuelle sur la page d'accueil
    if (generateResponseBtn) {
        generateResponseBtn.addEventListener('click', generateResponse);
    }
    if (clearPromptBtn) {
        clearPromptBtn.addEventListener('click', () => {
            if (promptInput) promptInput.value = '';
            if (iaResponseOutput) iaResponseOutput.innerHTML = '<p class="placeholder-text">La réponse de l\'IA apparaîtra ici.</p>';
        });
    }

    // Gérer la gestion du CV
    if (generateCvBtn) {
        generateCvBtn.addEventListener('click', generateCv);
    }
    if (clearCvInputBtn) {
        clearCvInputBtn.addEventListener('click', () => {
            if (cvInput) cvInput.value = '';
            if (cvOutput) cvOutput.innerHTML = '<p class="placeholder-text">Votre CV sera généré ici. Il affichera vos compétences et expériences structurées.</p>';
            if (valorizationOutput) valorizationOutput.innerHTML = '<p class="placeholder-text">La valorisation de vos compétences par l\'IA apparaîtra ici (ex: phrase d\'accroche, description des compétences, estimation UTMi).</p>';
            if (downloadCvBtn) downloadCvBtn.style.display = 'none';
            if (editCvBtn) editCvBtn.style.display = 'none'; // Cacher le bouton d'édition
            if (valorizeCvContentBtn) valorizeCvContentBtn.disabled = true; // Désactiver jusqu'à ce qu'un CV soit généré
            currentCvStructuredData = null; // Réinitialiser les données structurées
        });
    }
    if (downloadCvBtn) {
        downloadCvBtn.addEventListener('click', downloadCv);
    }
    if (valorizeCvContentBtn) {
        valorizeCvContentBtn.addEventListener('click', valorizeCvContent);
    }
    // Gérer le nouveau bouton d'édition du CV
    if (editCvBtn) {
        editCvBtn.addEventListener('click', openCvEditorModal);
    }


    // Gérer la chatroom
    if (startNewConversationBtn) {
        startNewConversationBtn.addEventListener('click', startNewConversation);
    }
    if (sendChatBtn) {
        sendChatBtn.addEventListener('click', sendMessage);
    }
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !sendChatBtn.disabled) {
                sendMessage();
            }
        });
    }
    if (generateChatCvSummaryBtn) {
        generateChatCvSummaryBtn.addEventListener('click', generateChatCvSummary);
    }
    if (copyModalCvSummaryBtn) {
        copyModalCvSummaryBtn.addEventListener('click', () => {
            if (modalCvSummaryOutput && cvInput && modalCvSummaryOutput.textContent) {
                cvInput.value = modalCvSummaryOutput.textContent;
                showStatusMessage('Résumé copié dans le champ CV.', 'success');
            } else {
                showStatusMessage('Rien à copier.', 'warning');
            }
        });
    }

    // Initial theme setup (from modal.js example or local storage)
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        // Set initial icon based on theme
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.querySelector('.toggle-circle').innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            themeToggle.querySelector('.toggle-circle').innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    // Open CMS modal button
    const openCmsModalBtn = document.getElementById('openCmsModalBtn');
    if (openCmsModalBtn) {
        openCmsModalBtn.addEventListener('click', async () => {
            await showModal('Gestion de Contenu (CMS)', '<p>Bienvenue dans votre interface de gestion de contenu. Ceci est un exemple de modal.</p>', 'alert');
        });
    }

    // Navbar search functionality
    const navbarSearchInput = document.getElementById('navbarSearchInput');
    const navbarSearchBtn = document.getElementById('navbarSearchBtn');
    if (navbarSearchBtn) {
        navbarSearchBtn.addEventListener('click', () => {
            const query = navbarSearchInput.value.trim();
            if (query) {
                showStatusMessage(`Recherche lancée pour : "${query}"`, 'info');
                // Implement actual search logic here
            } else {
                showStatusMessage('Veuillez entrer un terme de recherche.', 'info');
            }
        });
    }
    if (navbarSearchInput) {
        navbarSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                navbarSearchBtn.click();
            }
        });
    }
});


/**
 * Toggles between light and dark themes.
 */
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Update toggle icon
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.querySelector('.toggle-circle').innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    }
}


// --- Fonctions d'API et de logique métier ---

/**
 * Gère l'interaction IA ponctuelle (page Accueil).
 */
async function generateResponse() {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        showStatusMessage('Veuillez entrer une requête pour l\'IA.', 'warning');
        return;
    }

    showStatusMessage('Génération de la réponse IA...', 'info');
    if (iaResponseOutput) iaResponseOutput.innerHTML = '<p>Chargement...</p>';
    if (generateResponseBtn) generateResponseBtn.disabled = true;
    if (clearPromptBtn) clearPromptBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });

        if (!response.ok) {
            const errorData = await response.json();
            // Spécialement gérer l'erreur 429
            if (response.status === 429) {
                throw new Error("Trop de requêtes. Veuillez patienter un instant avant de réessayer.");
            }
            throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        if (iaResponseOutput) {
            iaResponseOutput.innerHTML = `
                <pre>${data.response}</pre>
                <p class="meta-info">UTMi généré: ${data.utmi.toFixed(2)} EUR | Coût estimé: ${data.estimatedCost.toFixed(6)} USD</p>
            `;
        }
        showStatusMessage('Réponse générée avec succès.', 'success');
        fetchDashboardInsights(); // Refresh dashboard after interaction
    } catch (error) {
        console.error('Erreur lors de la génération de la réponse IA:', error);
        if (iaResponseOutput) iaResponseOutput.innerHTML = `<p class="error-message">Erreur: ${error.message}</p>`;
        showStatusMessage('Erreur lors de la génération de la réponse.', 'error');
    } finally {
        if (generateResponseBtn) generateResponseBtn.disabled = false;
        if (clearPromptBtn) clearPromptBtn.disabled = false;
    }
}


/**
 * Récupère et affiche les insights du tableau de bord.
 */
async function fetchDashboardInsights() {
    showStatusMessage('Chargement du Dashboard...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard-insights`);
        if (!response.ok) {
            // Spécialement gérer l'erreur 429
            if (response.status === 429) {
                throw new Error("Trop de requêtes. Veuillez patienter un instant avant de réessayer.");
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const insights = await response.json();

        // Mettre à jour les éléments du DOM avec les données du dashboard
        if (totalUtmiEl) totalUtmiEl.textContent = `${(insights.totalUtmi ?? 0).toFixed(2)}`;
        if (totalEstimatedCostUSDEl) totalEstimatedCostUSDEl.textContent = `${(insights.totalEstimatedCostUSD ?? 0).toFixed(2)}`;
        if (totalEstimatedCostEUREl) totalEstimatedCostEUREl.textContent = `${(insights.totalEstimatedCostEUR ?? 0).toFixed(2)}`;
        if (totalInteractionCountEl) totalInteractionCountEl.textContent = insights.totalInteractionCount ?? 0;
        if (averageUtmiPerInteractionEl) averageUtmiPerInteractionEl.textContent = `${(insights.averageUtmiPerInteraction ?? 0).toFixed(2)}`;
        if (totalUtmiPerCostRatioEl) totalUtmiPerCostRatioEl.textContent = `${(insights.totalUtmiPerCostRatio ?? 0).toFixed(2)}`;

        // Helper to render list items
        const renderList = (element, data, itemFormatter) => {
            if (!element) return;
            element.innerHTML = data.map(item => `<li>${itemFormatter(item)}</li>`).join('');
        };
        const renderObjectList = (element, data, itemFormatter) => {
            if (!element) return;
            element.innerHTML = Object.entries(data).map(([key, value]) => `<li>${itemFormatter(key, value)}</li>`).join('');
        };

        renderList(utmiByTypeEl, insights.utmiByType || [], item => `<strong>${item.name}:</strong> ${(item.utmi ?? 0).toFixed(2)} EUR`);
        renderList(utmiByModelEl, insights.utmiByModel || [], item => `<strong>${item.name}:</strong> ${(item.utmi ?? 0).toFixed(2)} EUR`);
        renderObjectList(utmiPerCostRatioByModelEl, insights.utmiPerCostRatioByModel || {}, (key, value) => `<strong>${key}:</strong> ${(value ?? 0).toFixed(2)}`);
        renderList(utmiByCognitiveAxisEl, insights.utmiByCognitiveAxis || [], item => `<strong>${item.name}:</strong> ${(item.utmi ?? 0).toFixed(2)} EUR`);

        if (thematicUtmiMarketingEl) thematicUtmiMarketingEl.textContent = (insights.thematicUtmi?.marketing ?? 0).toFixed(2);
        if (thematicUtmiAffiliationEl) thematicUtmiAffiliationEl.textContent = (insights.thematicUtmi?.affiliation ?? 0).toFixed(2);
        if (thematicUtmiFiscalEconomicEl) thematicUtmiFiscalEconomicEl.textContent = (insights.thematicUtmi?.fiscalEconomic ?? 0).toFixed(2);

        renderList(mostValuableTopicsEl, insights.mostValuableTopics || [], item => `${item.name} (${(item.utmi ?? 0).toFixed(2)} EUR)`);
        renderList(mostCommonActivitiesEl, insights.mostCommonActivities || [], item => `${item.name} (${item.count ?? 0} fois)`);
        renderObjectList(exchangeRatesEl, insights.exchangeRates || {}, (key, value) => `1 EUR = ${(value ?? 0)} ${key}`);

        // Update User Profile section (simplified for now)
        const userIdDisplay = document.getElementById('userIdDisplay');
        const cvnuAddressDisplay = document.getElementById('cvnuAddressDisplay');
        if (userIdDisplay) userIdDisplay.textContent = 'User_CVNU_ID_12345'; // Placeholder
        if (cvnuAddressDisplay) cvnuAddressDisplay.textContent = '0x123...abc'; // Placeholder for blockchain address

        showStatusMessage('Dashboard actualisé.', 'success');

    } catch (error) {
        console.error('Erreur lors du chargement des insights du dashboard:', error);
        showStatusMessage('Erreur lors du chargement du dashboard: ' + error.message, 'error');
        // Fallback text in case of error
        const elementsToUpdate = [
            totalUtmiEl, totalEstimatedCostUSDEl, totalEstimatedCostEUREl, totalInteractionCountEl,
            averageUtmiPerInteractionEl, totalUtmiPerCostRatioEl, thematicUtmiMarketingEl,
            thematicUtmiAffiliationEl, thematicUtmiFiscalEconomicEl
        ];
        elementsToUpdate.forEach(el => { if(el) el.textContent = 'Erreur...'; });
        const listElementsToUpdate = [
            utmiByTypeEl, utmiByModelEl, utmiPerCostRatioByModelEl, utmiByCognitiveAxisEl,
            mostValuableTopicsEl, mostCommonActivitiesEl, exchangeRatesEl
        ];
        listElementsToUpdate.forEach(el => { if(el) el.innerHTML = '<li>Erreur de chargement...</li>'; });
    }
}

/**
 * Génère un CV à partir du texte brut saisi ou des données structurées actuelles.
 * Si du texte brut est fourni, il est d'abord structuré via l'IA.
 * Ensuite, les données structurées sont utilisées pour générer le HTML du CV.
 */
async function generateCv() {
    const rawCvContent = cvInput.value.trim();
    if (!rawCvContent && !currentCvStructuredData) {
        showStatusMessage('Veuillez saisir du contenu ou charger un CV pour générer/afficher le CV.', 'warning');
        return;
    }

    showStatusMessage('Génération du CV en cours...', 'info');
    if (generateCvBtn) generateCvBtn.disabled = true;
    if (clearCvInputBtn) clearCvInputBtn.disabled = true;
    if (valorizeCvContentBtn) valorizeCvContentBtn.disabled = true;
    if (editCvBtn) editCvBtn.disabled = true; // Désactiver le bouton d'édition pendant la génération
    if (downloadCvBtn) downloadCvBtn.style.display = 'none';
    if (cvOutput) cvOutput.innerHTML = '<p class="placeholder-text">Génération en cours...</p>';
    if (valorizationOutput) valorizationOutput.innerHTML = '<p class="placeholder-text">En attente de valorisation...</p>';

    try {
        let cvDataToRender = currentCvStructuredData;

        if (rawCvContent) { // If raw input is provided, parse it
            const parseResponse = await fetch(`${API_BASE_URL}/api/cv/parse-and-structure`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cvContent: rawCvContent }),
            });

            if (!parseResponse.ok) {
                const errorData = await parseResponse.json();
                if (parseResponse.status === 429) {
                    throw new Error("Trop de requêtes. Veuillez patienter un instant avant de réessayer de structurer le CV.");
                }
                throw new Error(errorData.error || 'Échec de l\'analyse et de la structuration du CV.');
            }
            cvDataToRender = await parseResponse.json();
            currentCvStructuredData = cvDataToRender; // Mettre à jour l'état local
        } else if (!currentCvStructuredData) {
            // This case should ideally not be reached due to initial check, but as a fallback
            throw new Error('Aucune donnée de CV disponible pour la génération.');
        }

        // Render HTML from the structured data (either new or existing)
        const renderHtmlResponse = await fetch(`${API_BASE_URL}/api/cv/render-html`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cvData: cvDataToRender }),
        });

        if (!renderHtmlResponse.ok) {
            const errorText = await renderHtmlResponse.text();
            throw new Error(`Échec du rendu HTML du CV: ${errorText}`);
        }

        const generatedCvHtmlContent = await renderHtmlResponse.text();
        if (cvOutput) cvOutput.innerHTML = generatedCvHtmlContent;
        if (downloadCvBtn) downloadCvBtn.style.display = 'inline-flex';
        if (editCvBtn) editCvBtn.style.display = 'inline-flex'; // Activer le bouton d'édition
        if (valorizeCvContentBtn) valorizeCvContentBtn.disabled = false; // Activer la valorisation
        showStatusMessage('CV généré avec succès !', 'success');

    } catch (error) {
        console.error('Erreur lors de la génération du CV:', error);
        showStatusMessage(`Erreur de génération du CV: ${error.message}`, 'error');
        if (cvOutput) cvOutput.innerHTML = `<p class="placeholder-text error-message">Erreur lors de la génération du CV: ${error.message}</p>`;
        if (valorizationOutput) valorizationOutput.innerHTML = `<p class="placeholder-text error-message">Veuillez d'abord générer un CV valide pour la valorisation.</p>`;
    } finally {
        if (generateCvBtn) generateCvBtn.disabled = false;
        if (clearCvInputBtn) clearCvInputBtn.disabled = false;
        if (editCvBtn) editCvBtn.disabled = false; // Réactiver le bouton d'édition
    }
}

/**
 * Charge la dernière structure JSON de CV sauvegardée côté serveur.
 */
async function loadLastStructuredCvData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/cv/last-structured-data`);
        if (response.ok) {
            const data = await response.json();
            currentCvStructuredData = data;
            if (cvInput) cvInput.value = JSON.stringify(data, null, 2); // Afficher le JSON dans l'input pour référence
            generateCv(); // Générer le CV HTML à partir des données chargées
            showStatusMessage('Dernier CV structuré chargé.', 'info');
        } else if (response.status === 404) {
            showStatusMessage('Aucun CV structuré précédent trouvé.', 'info');
        } else {
             // Spécialement gérer l'erreur 429
             if (response.status === 429) {
                throw new Error("Trop de requêtes. Veuillez patienter un instant avant de réessayer.");
            }
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
    } catch (error) {
        console.error('Erreur lors du chargement du dernier CV structuré:', error);
        showStatusMessage(`Erreur de chargement du dernier CV: ${error.message}`, 'error');
    }
}


/**
 * Télécharge le CV généré sous forme de fichier HTML.
 */
function downloadCv() {
    const cvHtmlContent = cvOutput ? cvOutput.innerHTML : '';
    if (!cvHtmlContent || cvHtmlContent.includes('placeholder-text') || cvHtmlContent.includes('error-message')) {
        showStatusMessage('Rien à télécharger : le contenu du CV est vide ou invalide.', 'warning');
        return;
    }

    const blob = new Blob([cvHtmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mon_cv_cvnu.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatusMessage('CV téléchargé.', 'success');
}

/**
 * Valorise le contenu du CV via l'IA.
 * Appelle l'API backend pour l'analyse et la valorisation (`/api/valorize-cv`).
 */
async function valorizeCvContent() {
    const contentToValorize = cvInput ? cvInput.value.trim() : ''; // Use the raw input as the source for valorization
    if (!contentToValorize) {
        showStatusMessage('Veuillez saisir du texte dans le champ CV pour le valoriser.', 'warning');
        return;
    }

    showStatusMessage('Valorisation des compétences par l\'IA...', 'info');
    if (valorizeCvContentBtn) valorizeCvContentBtn.disabled = true;
    if (valorizationOutput) valorizationOutput.innerHTML = '<p class="placeholder-text">Analyse et valorisation en cours...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/valorize-cv`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cvContent: contentToValorize }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 429) {
                throw new Error("Trop de requêtes. Veuillez patienter un instant avant de réessayer de valoriser le CV.");
            }
            throw new Error(errorData.message || `Échec de la valorisation: ${response.status}`);
        }

        const result = await response.json();
        let valorizationHtml = `
            <h3>Synthèse de Valorisation</h3>
            <p><strong>Message:</strong> ${result.message || 'N/A'}</p>
            <p><strong>Valorisation Détaillée:</strong></p>
            <pre>${JSON.stringify(result.valorization, null, 2)}</pre>
        `;
        if (valorizationOutput) valorizationOutput.innerHTML = valorizationHtml;
        showStatusMessage('Valorisation terminée.', 'success');
    } catch (error) {
        console.error('Erreur lors de la valorisation du CV:', error);
        showStatusMessage(`Erreur de valorisation du CV: ${error.message}`, 'error');
        if (valorizationOutput) valorizationOutput.innerHTML = `<p class="placeholder-text error-message">Erreur lors de la valorisation du CV: ${error.message}</p>`;
    } finally {
        if (valorizeCvContentBtn) valorizeCvContentBtn.disabled = false;
    }
}

/**
 * Ouvre une modale pour éditer les données structurées du CV.
 * Cette fonction est un placeholder qui sera étendue avec le vrai contenu de la modale.
 */
async function openCvEditorModal() {
    // Si nous n'avons pas encore de données structurées, on peut avertir l'utilisateur
    if (!currentCvStructuredData) {
        await showModal('Attention', 'Veuillez générer ou charger un CV d\'abord pour pouvoir l\'éditer.', 'alert');
        return;
    }

    // Fonction utilitaire pour créer des champs d'entrée dynamiques pour les expériences
    const createExperienceFields = (exp, index) => `
        <div class="form-group card-light mb-2 p-3 rounded-md border border-gray-200">
            <h5 class="text-lg font-semibold mb-2">Expérience ${index + 1}</h5>
            <label class="label-text">Titre :</label>
            <input type="text" class="input-field mb-1" data-field="titre" value="${exp.titre || ''}">
            <label class="label-text">Entreprise :</label>
            <input type="text" class="input-field mb-1" data-field="entreprise" value="${exp.entreprise || ''}">
            <label class="label-text">Durée :</label>
            <input type="text" class="input-field mb-1" data-field="duree" value="${exp.duree || ''}">
            <label class="label-text">Description :</label>
            <textarea class="input-field mt-1" rows="3" data-field="description">${exp.description || ''}</textarea>
            <button type="button" class="btn btn-secondary btn-sm mt-2 remove-experience-btn"><i class="fas fa-trash-alt"></i> Supprimer</button>
        </div>
    `;

    // Construire le contenu HTML du formulaire d'édition pour la modale
    let modalFormHtml = `
        <div class="space-y-4">
            <div class="form-group">
                <label for="edit-nom" class="label-text">Nom :</label>
                <input type="text" id="edit-nom" class="input-field" value="${currentCvStructuredData.nom || ''}">
            </div>
            <div class="form-group">
                <label for="edit-email" class="label-text">Email :</label>
                <input type="email" id="edit-email" class="input-field" value="${currentCvStructuredData.email || ''}">
            </div>
            <div class="form-group">
                <label for="edit-phone" class="label-text">Téléphone :</label>
                <input type="tel" id="edit-phone" class="input-field" value="${currentCvStructuredData.telephone || ''}">
            </div>
            <div class="form-group">
                <label for="edit-address" class="label-text">Adresse :</label>
                <input type="text" id="edit-address" class="input-field" value="${currentCvStructuredData.adresse || ''}">
            </div>
            <div class="form-group">
                <label for="edit-resume" class="label-text">Résumé professionnel :</label>
                <textarea id="edit-resume" class="input-field" rows="4">${currentCvStructuredData.resume || ''}</textarea>
            </div>

            <h4 class="text-xl font-bold mt-6 mb-3 text-gray-800 dark:text-gray-200">Expériences</h4>
            <div id="edit-experiences-container" class="space-y-4">
                ${currentCvStructuredData.experiences.map(createExperienceFields).join('')}
            </div>
            <button type="button" id="add-experience-btn" class="btn btn-primary btn-sm mt-2"><i class="fas fa-plus"></i> Ajouter Expérience</button>

            <h4 class="text-xl font-bold mt-6 mb-3 text-gray-800 dark:text-gray-200">Formation (simplifié)</h4>
            <div id="edit-formation-container" class="space-y-4">
                ${currentCvStructuredData.formation.map((edu, index) => `
                    <div class="form-group card-light mb-2 p-3 rounded-md border border-gray-200">
                        <h5 class="text-lg font-semibold mb-2">Formation ${index + 1}</h5>
                        <label class="label-text">Diplôme :</label>
                        <input type="text" class="input-field mb-1" data-field="diplome" value="${edu.diplome || ''}">
                        <label class="label-text">Établissement :</label>
                        <input type="text" class="input-field mb-1" data-field="etablissement" value="${edu.etablissement || ''}">
                        <label class="label-text">Durée :</label>
                        <input type="text" class="input-field" data-field="duree" value="${edu.duree || ''}">
                        <button type="button" class="btn btn-secondary btn-sm mt-2 remove-formation-btn"><i class="fas fa-trash-alt"></i> Supprimer</button>
                    </div>
                `).join('')}
                <button type="button" id="add-formation-btn" class="btn btn-primary btn-sm mt-2"><i class="fas fa-plus"></i> Ajouter Formation</button>
            </div>

            <h4 class="text-xl font-bold mt-6 mb-3 text-gray-800 dark:text-gray-200">Compétences (séparées par des virgules)</h4>
            <div class="form-group">
                <textarea id="edit-competences" class="input-field" rows="3">${currentCvStructuredData.competences ? currentCvStructuredData.competences.join(', ') : ''}</textarea>
            </div>

            <h4 class="text-xl font-bold mt-6 mb-3 text-gray-800 dark:text-gray-200">Langues (Ex: Français (Courant), Anglais (Intermédiaire))</h4>
            <div class="form-group">
                <textarea id="edit-langues" class="input-field" rows="3">${currentCvStructuredData.langues ? currentCvStructuredData.langues.map(l => `${l.langue} (${l.niveau})`).join(', ') : ''}</textarea>
            </div>

            <h4 class="text-xl font-bold mt-6 mb-3 text-gray-800 dark:text-gray-200">Projets (simplifié)</h4>
            <div id="edit-projets-container" class="space-y-4">
                ${currentCvStructuredData.projets.map((proj, index) => `
                    <div class="form-group card-light mb-2 p-3 rounded-md border border-gray-200">
                        <h5 class="text-lg font-semibold mb-2">Projet ${index + 1}</h5>
                        <label class="label-text">Nom :</label>
                        <input type="text" class="input-field mb-1" data-field="nom" value="${proj.nom || ''}">
                        <label class="label-text">Description :</label>
                        <textarea class="input-field mt-1" rows="3" data-field="description">${proj.description || ''}</textarea>
                        <label class="label-text">Technologies (virgule séparée):</label>
                        <input type="text" class="input-field mt-1" data-field="technologies" value="${proj.technologies ? proj.technologies.join(', ') : ''}">
                        <button type="button" class="btn btn-secondary btn-sm mt-2 remove-projet-btn"><i class="fas fa-trash-alt"></i> Supprimer</button>
                    </div>
                `).join('')}
                <button type="button" id="add-projet-btn" class="btn btn-primary btn-sm mt-2"><i class="fas fa-plus"></i> Ajouter Projet</button>
            </div>
        </div>
    `;

    const result = await showModal('Modifier les informations du CV', modalFormHtml, 'confirm', '900px'); // Augmenter la largeur de la modale

    if (result) {
        // Récupérer les données modifiées de la modale
        const updatedData = {
            nom: document.getElementById('edit-nom')?.value || 'N/A',
            email: document.getElementById('edit-email')?.value || 'N/A',
            telephone: document.getElementById('edit-phone')?.value || 'N/A',
            adresse: document.getElementById('edit-address')?.value || 'N/A',
            resume: document.getElementById('edit-resume')?.value || 'N/A',
            experiences: [],
            formation: [],
            competences: document.getElementById('edit-competences')?.value.split(',').map(s => s.trim()).filter(s => s) || [],
            langues: document.getElementById('edit-langues')?.value.split(',').map(l => {
                const parts = l.split('(');
                if (parts.length === 2) {
                    return { langue: parts[0].trim(), niveau: parts[1].replace(')', '').trim() };
                }
                return { langue: l.trim(), niveau: 'N/A' };
            }).filter(l => l.langue) || [],
            projets: []
        };

        // Parse experiences
        document.querySelectorAll('#edit-experiences-container > .form-group').forEach(expDiv => {
            updatedData.experiences.push({
                titre: expDiv.querySelector('[data-field="titre"]').value,
                entreprise: expDiv.querySelector('[data-field="entreprise"]').value,
                duree: expDiv.querySelector('[data-field="duree"]').value,
                description: expDiv.querySelector('[data-field="description"]').value
            });
        });

        // Parse formation
        document.querySelectorAll('#edit-formation-container > .form-group').forEach(eduDiv => {
            updatedData.formation.push({
                diplome: eduDiv.querySelector('[data-field="diplome"]').value,
                etablissement: eduDiv.querySelector('[data-field="etablissement"]').value,
                duree: eduDiv.querySelector('[data-field="duree"]').value
            });
        });

        // Parse projets
        document.querySelectorAll('#edit-projets-container > .form-group').forEach(projDiv => {
            updatedData.projets.push({
                nom: projDiv.querySelector('[data-field="nom"]').value,
                description: projDiv.querySelector('[data-field="description"]').value,
                technologies: projDiv.querySelector('[data-field="technologies"]').value.split(',').map(s => s.trim()).filter(s => s)
            });
        });

        currentCvStructuredData = updatedData; // Mettre à jour l'état local avec les données modifiées

        // Régénérer et afficher le CV avec les nouvelles données
        showStatusMessage('Mise à jour du CV...', 'info');
        generateCv(); // Appelle generateCv sans texte brut, il utilisera currentCvStructuredData
    } else {
        showStatusMessage('Modification du CV annulée.', 'info');
    }
}

// Fonction pour ajouter dynamiquement une nouvelle expérience
function addExperienceField() {
    const container = document.getElementById('edit-experiences-container');
    if (container) {
        const newExpDiv = document.createElement('div');
        newExpDiv.className = 'form-group card-light mb-2 p-3 rounded-md border border-gray-200';
        newExpDiv.innerHTML = `
            <h5 class="text-lg font-semibold mb-2">Nouvelle Expérience</h5>
            <label class="label-text">Titre :</label>
            <input type="text" class="input-field mb-1" data-field="titre" value="">
            <label class="label-text">Entreprise :</label>
            <input type="text" class="input-field mb-1" data-field="entreprise" value="">
            <label class="label-text">Durée :</label>
            <input type="text" class="input-field mb-1" data-field="duree" value="">
            <label class="label-text">Description :</label>
            <textarea class="input-field mt-1" rows="3" data-field="description"></textarea>
            <button type="button" class="btn btn-secondary btn-sm mt-2 remove-experience-btn"><i class="fas fa-trash-alt"></i> Supprimer</button>
        `;
        container.appendChild(newExpDiv);
        newExpDiv.querySelector('.remove-experience-btn').addEventListener('click', () => newExpDiv.remove());
    }
}

// Fonction pour ajouter dynamiquement une nouvelle formation
function addFormationField() {
    const container = document.getElementById('edit-formation-container');
    if (container) {
        const newEduDiv = document.createElement('div');
        newEduDiv.className = 'form-group card-light mb-2 p-3 rounded-md border border-gray-200';
        newEduDiv.innerHTML = `
            <h5 class="text-lg font-semibold mb-2">Nouvelle Formation</h5>
            <label class="label-text">Diplôme :</label>
            <input type="text" class="input-field mb-1" data-field="diplome" value="">
            <label class="label-text">Établissement :</label>
            <input type="text" class="input-field mb-1" data-field="etablissement" value="">
            <label class="label-text">Durée :</label>
            <input type="text" class="input-field" data-field="duree" value="">
            <button type="button" class="btn btn-secondary btn-sm mt-2 remove-formation-btn"><i class="fas fa-trash-alt"></i> Supprimer</button>
        `;
        container.appendChild(newEduDiv);
        newEduDiv.querySelector('.remove-formation-btn').addEventListener('click', () => newEduDiv.remove());
    }
}

// Fonction pour ajouter dynamiquement un nouveau projet
function addProjetField() {
    const container = document.getElementById('edit-projets-container');
    if (container) {
        const newProjDiv = document.createElement('div');
        newProjDiv.className = 'form-group card-light mb-2 p-3 rounded-md border border-gray-200';
        newProjDiv.innerHTML = `
            <h5 class="text-lg font-semibold mb-2">Nouveau Projet</h5>
            <label class="label-text">Nom :</label>
            <input type="text" class="input-field mb-1" data-field="nom" value="">
            <label class="label-text">Description :</label>
            <textarea class="input-field mt-1" rows="3" data-field="description"></textarea>
            <label class="label-text">Technologies (virgule séparée):</label>
            <input type="text" class="input-field mt-1" data-field="technologies" value="">
            <button type="button" class="btn btn-secondary btn-sm mt-2 remove-projet-btn"><i class="fas fa-trash-alt"></i> Supprimer</button>
        `;
        container.appendChild(newProjDiv);
        newProjDiv.querySelector('.remove-projet-btn').addEventListener('click', () => newProjDiv.remove());
    }
}


// Event delegation for dynamically added remove buttons in modal after it opens
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-experience-btn')) {
        e.target.closest('.form-group')?.remove();
    } else if (e.target.classList.contains('remove-formation-btn')) {
        e.target.closest('.form-group')?.remove();
    } else if (e.target.classList.contains('remove-projet-btn')) {
        e.target.closest('.form-group')?.remove();
    } else if (e.target.id === 'add-experience-btn') {
        addExperienceField();
    } else if (e.target.id === 'add-formation-btn') {
        addFormationField();
    } else if (e.target.id === 'add-projet-btn') {
        addProjetField();
    }
});


// --- Fonctions de gestion du Chatroom IA ---

/**
 * Démarre une nouvelle conversation.
 */
async function startNewConversation() {
    showStatusMessage('Démarrage d\'une nouvelle conversation...', 'info');
    if (startNewConversationBtn) startNewConversationBtn.disabled = true;
    if (generateChatCvSummaryBtn) generateChatCvSummaryBtn.style.display = 'none'; // Hide until chat has content
    if (modalCvSummarySection) modalCvSummarySection.style.display = 'none'; // Hide summary section
    if (modalCvSummaryOutput) modalCvSummaryOutput.innerHTML = '<p class="placeholder-text">Un résumé pertinent pour votre CV à partir de la conversation apparaîtra ici.</p>';
    if (copyModalCvSummaryBtn) copyModalCvSummaryBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/new`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        if (response.ok) {
            currentConversationId = data.id;
            await fetchConversations(1); // Reload and go to first page
            // If chat is active, ensure the specific chat elements are enabled
            if (chatInput) chatInput.disabled = false;
            if (sendChatBtn) sendChatBtn.disabled = false;
            if (currentConversationIdSpan) currentConversationIdSpan.textContent = `(ID: ${currentConversationId.substring(0, 8)}...)`;

            showStatusMessage('Nouvelle conversation démarrée !', 'success');
        } else {
            // Spécialement gérer l'erreur 429
            if (response.status === 429) {
                await showModal('Erreur', "Trop de requêtes. Veuillez patienter un instant avant de démarrer une nouvelle conversation.", 'alert');
            } else {
                await showModal('Erreur', `Impossible de démarrer une nouvelle conversation: ${data.error}`, 'alert');
            }
            showStatusMessage(`Erreur: ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Erreur lors du démarrage d\'une nouvelle conversation:', error);
        await showModal('Erreur', `Erreur de connexion lors du démarrage d\'une nouvelle conversation.`, 'alert');
        showStatusMessage(`Erreur de connexion: ${error.message}`, 'error');
    } finally {
        if (startNewConversationBtn) startNewConversationBtn.disabled = false;
    }
}

/**
 * Charge une conversation spécifique dans la fenêtre de chat.
 * Cette fonction est appelée par `pagination.js` via un callback.
 * @param {string} id - L'ID de la conversation à charger.
 */
async function selectConversation(id) {
    showStatusMessage('Chargement de la conversation...', 'info');
    if (generateChatCvSummaryBtn) {
        generateChatCvSummaryBtn.style.display = 'inline-block'; // Show summary button
        generateChatCvSummaryBtn.disabled = false; // Enable summary button
    }
    if (modalCvSummarySection) modalCvSummarySection.style.display = 'none'; // Hide summary section on new selection
    if (modalCvSummaryOutput) modalCvSummaryOutput.innerHTML = '<p class="placeholder-text">Un résumé pertinent pour votre CV à partir de la conversation apparaîtra ici.</p>';
    if (copyModalCvSummaryBtn) copyModalCvSummaryBtn.disabled = true;


    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${id}`);
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error("Trop de requêtes. Veuillez patienter un instant avant de recharger la conversation.");
            }
            throw new Error(`Erreur HTTP! Statut: ${response.status}`);
        }
        const conversation = await response.json();
        currentConversationId = conversation.id;
        // Filter out system messages for display
        const userVisibleMessages = conversation.messages.filter(msg => msg.role !== 'system');

        if (chatWindow) chatWindow.innerHTML = ''; // Clear existing messages
        userVisibleMessages.forEach(msg => {
            const div = document.createElement('div');
            div.className = `chat-message ${msg.role}`;
            const utmiInfo = msg.utmi !== undefined && msg.utmi !== null ? `UTMi: ${msg.utmi.toFixed(2)} EUR` : '';
            const costInfo = msg.estimated_cost_usd !== undefined && msg.estimated_cost_usd !== null ? `Coût: ${msg.estimated_cost_usd.toFixed(6)} USD` : '';
            const metaInfo = (utmiInfo || costInfo) ? `<br><small>${utmiInfo} ${costInfo}</small>` : '';

            div.innerHTML = `<strong>${msg.role === 'user' ? 'Vous' : 'IA'}:</strong> ${msg.content}${metaInfo}`;
            if (chatWindow) chatWindow.appendChild(div);
        });

        if (chatInput) chatInput.disabled = false;
        if (sendChatBtn) sendChatBtn.disabled = false;
        if (currentConversationIdSpan) currentConversationIdSpan.textContent = `(ID: ${currentConversationId.substring(0, 8)}...)`;
        if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom

        setActiveConversationId(id); // Inform pagination.js about active conversation

        showStatusMessage('Conversation chargée.', 'success');

    } catch (error) {
        console.error('Erreur lors du chargement de la conversation:', error);
        await showModal('Erreur', `Erreur de chargement de la conversation: ${error.message}`, 'alert');
        showStatusMessage(`Erreur de chargement de la conversation: ${error.message}`, 'error');
        if (chatWindow) chatWindow.innerHTML = '<p class="placeholder-text error-message">Erreur de chargement de la conversation.</p>';
        if (chatInput) chatInput.disabled = true;
        if (sendChatBtn) sendChatBtn.disabled = true;
        if (generateChatCvSummaryBtn) generateChatCvSummaryBtn.style.display = 'none';
    }
}

/**
 * Envoie un message dans la conversation active et gère la réponse de l'IA.
 */
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message || !currentConversationId) {
        showStatusMessage('Veuillez saisir un message ou démarrer une conversation.', 'warning');
        return;
    }

    // Afficher le message de l'utilisateur immédiatement
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = `chat-message user`;
    userMessageDiv.innerHTML = `<strong>Vous:</strong> ${message}`;
    if (chatWindow) chatWindow.appendChild(userMessageDiv);
    if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom

    if (chatInput) chatInput.value = '';
    if (chatInput) chatInput.disabled = true;
    if (sendChatBtn) sendChatBtn.disabled = true;
    showStatusMessage('Envoi du message et attente de la réponse IA...', 'info');

    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${currentConversationId}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();
        if (response.ok) {
            showStatusMessage('Réponse IA reçue.', 'success');
            // Recharger la conversation complète pour afficher la réponse de l'IA avec UTMi/coût
            await selectConversation(currentConversationId);
            await fetchConversations(currentChatPage); // Rafraîchir la liste pour montrer les mises à jour
            await fetchDashboardInsights(); // Refresh dashboard with new interaction data
        } else {
            // Spécialement gérer l'erreur 429
            if (response.status === 429) {
                await showModal('Erreur', "Trop de requêtes. Veuillez patienter un instant avant d'envoyer un nouveau message.", 'alert');
            } else {
                await showModal('Erreur', `Erreur lors de l\'envoi du message: ${data.error}`, 'alert');
            }
            showStatusMessage(`Erreur: ${data.error}`, 'error');
            // Remove the last user message if the server failed to process it
            if (chatWindow && userMessageDiv && chatWindow.contains(userMessageDiv)) {
                 chatWindow.removeChild(userMessageDiv);
            }
        }
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        await showModal('Erreur', `Erreur de connexion lors de l\'envoi du message.`, 'alert');
        showStatusMessage(`Erreur de connexion: ${error.message}`, 'error');
        if (chatWindow && userMessageDiv && chatWindow.contains(userMessageDiv)) {
            chatWindow.removeChild(userMessageDiv); // Remove user message on network error
        }
    } finally {
        if (chatInput) chatInput.disabled = false;
        if (sendChatBtn) sendChatBtn.disabled = false;
        if (chatInput) chatInput.focus();
    }
}

/**
 * Récupère la liste des conversations du backend avec pagination.
 * Cette fonction est appelée par `pagination.js` via un callback.
 * @param {number} page - Le numéro de page à récupérer.
 */
async function fetchConversations(page = 1) {
    showStatusMessage('Chargement des conversations...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations?page=${page}&limit=${CHAT_CONVERSATIONS_PER_PAGE}`);
        const data = await response.json(); // Data should include conversations array and totalPages
        currentChatPage = page;

        // Use pagination.js to render the list and update controls
        if (chatConversationListElement && chatPrevPageBtn && chatNextPageBtn && chatCurrentPageInfoSpan) {
            setConversations(data.conversations, data.totalCount, page, CHAT_CONVERSATIONS_PER_PAGE);
            renderChatConversationList(
                chatConversationListElement,
                chatPrevPageBtn,
                chatNextPageBtn,
                chatCurrentPageInfoSpan,
                selectConversation,
                deleteConversation
            );
        } else {
            console.warn("Éléments de pagination du chat non trouvés pour le rendu.");
            showStatusMessage('Erreur: Éléments de pagination du chat introuvables. Assurez-vous que la page est bien chargée.', 'error');
        }

        // Set active conversation visually
        if (currentConversationId) {
            const activeItem = chatConversationListElement?.querySelector(`.conversation-item[data-id="${currentConversationId}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
        }

        showStatusMessage('Conversations chargées.', 'success');
    } catch (error) {
        console.error('Error fetching chat conversations:', error);
        if (chatConversationListElement) chatConversationListElement.innerHTML = '<li class="placeholder-text error-message">Erreur de chargement des conversations.</li>';
        showStatusMessage('Erreur de chargement des conversations: ' + error.message, 'error');
        // If pagination elements exist, hide them
        if (chatPrevPageBtn) chatPrevPageBtn.disabled = true;
        if (chatNextPageBtn) chatNextPageBtn.disabled = true;
        if (chatCurrentPageInfoSpan) chatCurrentPageInfoSpan.textContent = 'Erreur...';
    }
}

/**
 * Supprime une conversation.
 * Cette fonction est appelée par `pagination.js` via un callback.
 * @param {string} id - L'ID de la conversation à supprimer.
 */
async function deleteConversation(id) {
    const confirmDelete = await showModal('Confirmer la suppression', `Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.`, 'confirm');
    if (!confirmDelete) {
        return;
    }

    showStatusMessage('Suppression de la conversation...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            showStatusMessage('Conversation supprimée avec succès !', 'success');
            if (currentConversationId === id) {
                currentConversationId = null;
                if (currentConversationIdSpan) currentConversationIdSpan.textContent = '(Sélectionnez une conversation)';
                if (chatInput) chatInput.disabled = true;
                if (sendChatBtn) sendChatBtn.disabled = true;
                if (generateChatCvSummaryBtn) generateChatCvSummaryBtn.style.display = 'none';
                if (modalCvSummarySection) modalCvSummarySection.style.display = 'none';
                if (modalCvSummaryOutput) modalCvSummaryOutput.innerHTML = '<p class="placeholder-text">Un résumé pertinent pour votre CV à partir de la conversation apparaîtra ici.</p>';
                if (copyModalCvSummaryBtn) copyModalCvSummaryBtn.disabled = true;
            }
            // Re-fetch to update list and pagination controls
            await fetchConversations(currentChatPage);
            await fetchDashboardInsights(); // Refresh dashboard
        } else {
            const data = await response.json();
            if (response.status === 429) {
                await showModal('Erreur', "Trop de requêtes. Veuillez patienter un instant avant de supprimer la conversation.", 'alert');
            } else {
                await showModal('Erreur', `Erreur lors de la suppression: ${data.error}`, 'alert');
            }
            showStatusMessage(`Erreur lors de la suppression: ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Erreur de connexion lors de la suppression de la conversation:', error);
        await showModal('Erreur', `Erreur de connexion lors de la suppression de la conversation.`, 'alert');
        showStatusMessage(`Erreur de connexion: ${error.message}`, 'error');
    }
}


/**
 * Génère un résumé de CV à partir de la conversation IA active.
 * Cette fonction appellera votre endpoint backend `/api/conversations/:id/cv-professional-summary`.
 */
async function generateChatCvSummary() {
    if (!currentConversationId) {
        await showModal('Attention', 'Veuillez sélectionner une conversation d\'abord pour générer le résumé.', 'alert');
        return;
    }

    showStatusMessage('Génération du résumé CV en cours...', 'info');
    if (generateChatCvSummaryBtn) generateChatCvSummaryBtn.disabled = true;
    if (modalCvSummarySection) modalCvSummarySection.style.display = 'block';
    if (modalCvSummaryOutput) modalCvSummaryOutput.innerHTML = '<p class="placeholder-text">Génération en cours...</p>';
    if (copyModalCvSummaryBtn) copyModalCvSummaryBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${currentConversationId}/cv-professional-summary`);
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error("Trop de requêtes. Veuillez patienter un instant avant de générer le résumé.");
            }
            const errorText = await response.text();
            throw new Error(`Échec HTTP (${response.status}): ${errorText}`);
        }

        const cvSummaryMarkdown = await response.text(); // Assuming backend returns markdown directly
        if (modalCvSummaryOutput) modalCvSummaryOutput.textContent = cvSummaryMarkdown;
        if (copyModalCvSummaryBtn) copyModalCvSummaryBtn.disabled = false;
        showStatusMessage('Résumé CV généré avec succès !', 'success');

    } catch (error) {
        console.error('Erreur lors de la génération du résumé CV depuis le chat:', error);
        if (modalCvSummaryOutput) modalCvSummaryOutput.innerHTML = `<p class="placeholder-text error-message">Erreur lors de la génération du résumé CV : ${error.message}</p>`;
        showStatusMessage(`Erreur lors de la génération du résumé CV: ${error.message}`, 'error');
    } finally {
        if (generateChatCvSummaryBtn) generateChatCvSummaryBtn.disabled = false;
    }
}


// --- Fonctions de rendu de graphique (Placeholders) ---
// Vous devrez implémenter la logique réelle des graphiques ici en utilisant Chart.js
// Assurez-vous que les IDs des canvas dans index.html correspondent.

function renderDashboardChart() {
    const ctx = document.getElementById('dashboardChart'); // Assurez-vous d'avoir un canvas avec cet ID dans le dashboard
    if (ctx) {
        if (Chart.getChart(ctx)) {
            Chart.getChart(ctx).destroy(); // Détruire l'ancien graphique s'il existe
        }
        // Example: a simple bar chart
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Total UTMi', 'Coût USD', 'Coût EUR'],
                datasets: [{
                    label: 'Values',
                    data: [
                        parseFloat(totalUtmiEl.textContent),
                        parseFloat(totalEstimatedCostUSDEl.textContent),
                        parseFloat(totalEstimatedCostEUREl.textContent)
                    ],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.6)', // Blue for UTMi
                        'rgba(255, 159, 64, 0.6)', // Orange for USD Cost
                        'rgba(75, 192, 192, 0.6)'  // Green for EUR Cost
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Aperçu Financier Principal'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}
