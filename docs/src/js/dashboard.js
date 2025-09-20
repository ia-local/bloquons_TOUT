// Fichier : public/src/js/dashboard.js
// Ce fichier gère la logique du tableau de bord.

// --- Imports des modules de l'application ---
// RETIRÉ: import { initMap } from './map.js';
import { initJournalPage } from './journal.js';
import { initMissionsPage } from './missions.js';
import { initRicPage } from './rics.js';
import { initLegalPage } from './legal.js';
import { initCvnuPage } from './cvnu.js';
import { initSmartContractPage } from './smartContract.js';
import { initOrganisationPage } from './timeline.js';
import { initOperatorChat } from './operatorChat.js';
import { initDetailModal, showDetailsAsync } from './detailModal.js';
import { generateTimestampAsciiArt } from './db-ascii-timestamp.js';
import { openDashboardModal } from './dashboardModal.js';

/**
 * Fonction utilitaire pour récupérer des données JSON à partir d'une URL.
 * @param {string} url - L'URL de l'API.
 * @returns {Promise<object>} Les données JSON.
 */
async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Erreur de l'API ${url}: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Point d'entrée pour l'initialisation du tableau de bord.
 * Gère le chargement asynchrone des données et la mise à jour de l'interface.
 */
export async function initDashboard() {
    console.log("Initialisation du tableau de bord...");

    const asciiTimestampEl = document.getElementById('ascii-timestamp');
    if (asciiTimestampEl) {
        setInterval(() => {
            asciiTimestampEl.textContent = generateTimestampAsciiArt();
        }, 1000);
    }
    initDetailModal();

    try {
        const [
            summaryData,
            prefecturesData,
            mairiesData,
            roundaboutData,
            porteData,
            strategicData,
            telegramData,
            caisseData,
            missionsData,
            utmiInsightsData,
            smartContractData 
        ] = await Promise.all([
            fetchData('/api/dashboard/summary'),
            fetchData('/api/prefectures'),
            fetchData('/api/mairies'),
            fetchData('/api/roundabout-points'),
            fetchData('/api/porte-points'),
            fetchData('/api/strategic-locations'),
            fetchData('/api/telegram-sites'),
            fetchData('/api/caisse-manifestation'),
            fetchData('/api/missions'),
            fetchData('/api/dashboard/utmi-insights'),
            fetchData('/smartContract/api/dashboard-data')
        ]);
        
        updateStatsDisplay({ 
            ...summaryData,
            prefectureCount: prefecturesData.length,
            mairiesCount: mairiesData.length,
            roundaboutCount: roundaboutData.length,
            strategicCount: strategicData.length,
            missionsCount: missionsData.length,
            porteCount: porteData.length,
            telegramCount: telegramData.length
        });
        
        updateCountdown(summaryData.prochaineManif);
        displayCaisseTransactions(caisseData.transactions);
        displayMissionsList(missionsData);
        await fetchAIInsights(); 
        setupFormHandlers();
        
        updateUtmiInsights(utmiInsightsData, smartContractData);
        attachCardClickEvents(utmiInsightsData);
        
        initOperatorChat();

    } catch (error) {
        console.error('Erreur fatale lors de l\'initialisation du tableau de bord:', error);
        const dashboardContainer = document.getElementById('dashboard-container');
        if (dashboardContainer) {
            dashboardContainer.innerHTML = `<div class="error-message">
                <h2>Erreur de chargement</h2>
                <p>Une erreur est survenue lors de la récupération des données. Veuillez vérifier la connexion au serveur et la base de données.</p>
                <p>Détails de l'erreur : ${error.message}</p>
            </div>`;
        }
    }
}

/**
 * Gère le chargement et l'affichage des insights de l'opérateur IA.
 */
async function fetchAIInsights() {
    try {
        const [operatorSummaryData, operatorPlanData] = await Promise.all([
            fetchData('/api/operator/summary'),
            fetchData('/api/operator/plan')
        ]);
        
        const summaryElement = document.getElementById('ai-summary-insight');
        if (summaryElement) summaryElement.textContent = operatorSummaryData.summary;
        const planElement = document.getElementById('ai-plan-insight');
        if (planElement) planElement.innerHTML = operatorPlanData.plan;
        
        console.log("Insights de l'opérateur IA chargés avec succès.");
    } catch (error) {
        console.error("Échec du chargement des insights de l'opérateur IA:", error);
        const summaryElement = document.getElementById('ai-summary-insight');
        if (summaryElement) summaryElement.textContent = "Erreur: Le résumé est trop long pour être généré.";
        const planElement = document.getElementById('ai-plan-insight');
        if (planElement) planElement.textContent = "Erreur: Le plan de développement est trop long pour être généré.";
    }
}

/**
 * Met à jour l'affichage des cartes de statistiques de base.
 */
function updateStatsDisplay(data) {
    const idsToUpdate = [
        { id: 'caisse-solde', value: `Solde : ${(data.caisseSolde ?? 0).toFixed(2)} €` },
        { id: 'boycott-count', value: `${data.boycottCount ?? 0} enseignes listées` },
        { id: 'ric-count', value: `${data.ricCount ?? 0} propositions actives` },
        { id: 'manifestant-count', value: `${data.estimatedManifestantCount ?? 0} manifestants estimés` },
        { id: 'telegram-group-count', value: `${data.telegramGroupCount ?? 0} groupes de mobilisation` },
        { id: 'prefecture-count', value: `${data.prefectureCount ?? 0} préfectures suivies` },
        { id: 'roundabout-count', value: `${data.roundaboutCount ?? 0} ronds-points` },
        { id: 'strategic-count', value: `${data.strategicCount ?? 0} lieux répertoriés` },
        { id: 'mairies-count', value: `${data.mairiesCount ?? 0} mairies répertoriées` },
        { id: 'missions-count', value: `${data.missionsCount ?? 0} missions en cours` }
    ];

    idsToUpdate.forEach(item => {
        const element = document.getElementById(item.id);
        if (element) element.textContent = item.value;
        else console.warn(`Avertissement: L'élément avec l'ID '${item.id}' est introuvable.`);
    });
}

/**
 * Gère la logique du compte à rebours pour la prochaine manifestation.
 */
function updateCountdown(prochaineManif) {
    const countdownElement = document.getElementById('dashboard-countdown');
    const nextEventTitle = document.getElementById('next-event-title');

    if (prochaineManif && countdownElement && nextEventTitle) {
        nextEventTitle.textContent = prochaineManif.title;
        const targetDate = new Date(prochaineManif.start_date);
        
        const update = () => {
            const now = new Date();
            const diff = targetDate - now;

            if (diff <= 0) {
                countdownElement.textContent = "L'événement est en cours !";
                clearInterval(interval);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            countdownElement.textContent = `J-${days} H-${hours} M-${minutes} S-${seconds}`;
        };

        const interval = setInterval(update, 1000);
        update();
    } else if (nextEventTitle && countdownElement) {
        nextEventTitle.textContent = "Aucun événement prévu";
        countdownElement.textContent = "Date inconnue";
    }
}

/**
 * Affiche la liste des transactions de la caisse.
 */
function displayCaisseTransactions(transactions) {
    const caisseTransactionsList = document.getElementById('caisse-transactions-list');
    if (caisseTransactionsList) {
        if (transactions && transactions.length > 0) {
            caisseTransactionsList.innerHTML = transactions.map(t => `
                <li class="${t.type === 'entrée' ? 'transaction-entree' : 'transaction-depense'}">
                    <strong>${t.type === 'entrée' ? 'Recette' : 'Dépense'} :</strong> 
                    ${t.description} - ${t.montant} € (${new Date(t.date).toLocaleDateString()})
                </li>
            `).join('');
        } else {
            caisseTransactionsList.innerHTML = '<li>Aucune transaction enregistrée.</li>';
        }
    }
}

/**
 * Affiche la liste des missions sous forme de cartes simplifiées.
 */
function displayMissionsList(missions) {
    const missionsListEl = document.getElementById('missions-list');
    if (!missionsListEl) return;
    
    missionsListEl.innerHTML = missions.map(mission => `
        <li>
            <h4>${mission.title}</h4>
            <p>${mission.description}</p>
            <button class="details-button" data-mission-id="${mission.id}">Détails</button>
        </li>
    `).join('');

    document.querySelectorAll('.details-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const missionId = event.target.dataset.missionId;
            const mission = missions.find(m => m.id === missionId);
            if (mission) {
                showDetailsAsync('/api/missions', mission.id, 'Détails de la Mission');
            }
        });
    });
}

/**
 * Gère l'envoi de messages à l'assistant IA.
 */
async function handleAIChat() {
    const input = document.getElementById('ai-input');
    const history = document.getElementById('ai-chat-history');
    const message = input.value;
    
    if (!message) return;
    
    const userMessage = document.createElement('p');
    userMessage.textContent = `Vous : ${message}`;
    history.appendChild(userMessage);
    input.value = '';
    
    const aiResponse = document.createElement('p');
    aiResponse.textContent = `IA : ...`;
    history.appendChild(aiResponse);
    history.scrollTop = history.scrollHeight;

    try {
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        
        if (!response.ok) {
            throw new Error(`Erreur API: ${response.statusText}`);
        }
        
        const data = await response.json();
        aiResponse.textContent = `IA : ${data.response}`;
        
    } catch (error) {
        aiResponse.textContent = `IA : Erreur - ${error.message}`;
        console.error("Erreur de l'assistant IA:", error);
    }
    history.scrollTop = history.scrollHeight;
}

/**
 * Gère la soumission du formulaire de transaction.
 */
async function handleTransactionSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const transaction = {
        type: formData.get('type'),
        montant: parseFloat(formData.get('montant')),
        description: formData.get('description'),
    };

    try {
        const response = await fetch('/api/caisse-manifestation/transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction)
        });

        if (!response.ok) {
            throw new Error(`Erreur lors de l'ajout de la transaction: ${response.statusText}`);
        }
        
        console.log('Transaction ajoutée avec succès.');
        form.reset();
        initDashboard();
    } catch (error) {
        console.error('Échec de l ajout de la transaction:', error);
        alert('Erreur lors de l ajout de la transaction. Veuillez réessayer.');
    }
}


/**
 * Configure les gestionnaires d'événements pour les formulaires.
 */
function setupFormHandlers() {
    const aiSendButton = document.getElementById('ai-send-button');
    const aiInput = document.getElementById('ai-input');
    const transactionForm = document.getElementById('transaction-form');

    if (aiSendButton) {
        aiSendButton.addEventListener('click', handleAIChat);
    }
    if (aiInput) {
        aiInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleAIChat();
            }
        });
    }
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleTransactionSubmit);
    }
}

/**
 * Met à jour l'affichage des insights UTMi et des taxes.
 * @param {object} insightsData - Les données d'insights calculées par le back-end.
 * @param {object} smartContractData - Les données financières du smart contract.
 */
function updateUtmiInsights(insightsData, smartContractData) {
    const totalUtmiEl = document.getElementById('total-utmi');
    if (totalUtmiEl) totalUtmiEl.textContent = `${(insightsData.totalUtmi || 0).toFixed(2)} UTMi`;

    const totalCostEl = document.getElementById('total-cost');
    if (totalCostEl) totalCostEl.textContent = `${(smartContractData.tresorerie || 0).toFixed(2)} €`;

    const utmiPerCostEl = document.getElementById('utmi-per-cost-ratio');
    const ratio = (insightsData.totalUtmi || 0) / (smartContractData.tresorerie || 1); 
    if (utmiPerCostEl) utmiPerCostEl.textContent = `${ratio.toFixed(2)} UTMi/€`;

    const totalInteractionsEl = document.getElementById('total-interactions');
    if (totalInteractionsEl) totalInteractionsEl.textContent = `${insightsData.totalInteractionCount || 0}`;
    
    // Remplir la liste des taxes (liste simplifiée pour la carte)
    const taxAiList = document.getElementById('tax-ai-specific-list');
    if (taxAiList) {
        const taxSummary = insightsData.taxCollectionSummary;
        if (taxSummary && Object.keys(taxSummary).length > 0) {
            taxAiList.innerHTML = Object.keys(taxSummary).map(taxKey => {
                const tax = taxSummary[taxKey];
                return `<li>${tax.name}: ${(tax.utmi_value || 0).toFixed(2)} UTMi</li>`;
            }).join('');
        } else {
            taxAiList.innerHTML = '<li>Aucune donnée de taxe disponible.</li>';
        }
    }
}

/**
 * Attache les gestionnaires de clic aux cartes des insights pour afficher la modale.
 * @param {object} insightsData - Les données d'insights complètes.
 */
function attachCardClickEvents(insightsData) {
    const cardMap = {
        'tax-ai-specific-card': { 
            title: 'Détails des taxes AI',
            content: `<ul>${Object.keys(insightsData.taxCollectionSummary || {}).map(key => {
                const tax = insightsData.taxCollectionSummary[key];
                return `<li><strong>${tax.name}:</strong> ${tax.utmi_value.toFixed(2)} UTMi</li>`;
            }).join('') || '<li>Aucune donnée disponible.</li>'}</ul>`
        },
        'cognitive-axes-card': { 
            title: 'Détails par axe cognitif',
            content: `<ul>${insightsData.utmiByCognitiveAxis.map(item =>
                `<li><strong>${item.name}:</strong> ${item.utmi} UTMi</li>`
            ).join('')}</ul>`
        },
        'models-utmi-card': { 
            title: 'Détails par modèle d\'IA',
            content: `<ul>${insightsData.utmiByModel.map(item =>
                `<li><strong>${item.name}:</strong> ${item.utmi} UTMi</li>`
            ).join('')}</ul>`
        },
        'thematic-utmi-card': { 
            title: 'Détails par thématique',
            content: `<ul>
                <li><strong>Fiscal & Économique:</strong> ${(insightsData.thematicUtmi.fiscalEconomic || 0).toFixed(2)} UTMi</li>
                <li><strong>Marketing:</strong> ${(insightsData.thematicUtmi.marketing || 0).toFixed(2)} UTMi</li>
                <li><strong>Affiliation:</strong> ${(insightsData.thematicUtmi.affiliation || 0).toFixed(2)} UTMi</li>
            </ul>`
        },
        'common-activities-card': { 
            title: 'Détails des activités courantes',
            content: `<ul>${insightsData.mostCommonActivities.map(item =>
                `<li><strong>${item.name}:</strong> ${item.count} fois</li>`
            ).join('')}</ul>`
        },
    };

    Object.keys(cardMap).forEach(id => {
        const card = document.getElementById(id);
        if (card) {
            card.addEventListener('click', () => {
                openDashboardModal(cardMap[id].title, cardMap[id].content);
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('dashboard-container')) {
        initDashboard();
    }
});