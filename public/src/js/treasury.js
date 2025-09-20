// Fichier : public/src/js/treasury.js


// Conservez uniquement les imports nécessaires pour cette page.
//import { Chart } from 'chart-js';

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
 * Initialise la page de la trésorerie.
 */
export function initTreasuryPage() {
    console.log("Initialisation de la page Trésorerie...");

    const transactionsListEl = document.getElementById('transactions-list');
    const form = document.getElementById('transaction-form');
    const financialChartEl = document.getElementById('financial-chart');

    // Vérification de la présence des éléments
    if (!transactionsListEl || !form || !financialChartEl) {
        console.error("Éléments du DOM pour la page Trésorerie non trouvés.");
        return;
    }

    // Fonction pour récupérer et afficher les données de la caisse
    const fetchAndRenderCaisseData = async () => {
        try {
            const data = await fetchData('/api/caisse-manifestation');
            renderSummaryCards(data);
            renderTransactionsList(data.transactions);
            drawFinancialChart(data.transactions);
        } catch (error) {
            console.error('Erreur lors du chargement des données de la caisse:', error);
            transactionsListEl.innerHTML = `<div class="error-message"><p>${error.message}</p></div>`;
        }
    };

    // Soumission du formulaire
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const transaction = {
            type: formData.get('type'),
            montant: parseFloat(formData.get('montant')),
            description: formData.get('description')
        };

        try {
            await postTransaction(transaction);
            form.reset();
            fetchAndRenderCaisseData(); // Recharge les données après l'ajout
        } catch (error) {
            console.error("Erreur lors de l'ajout de la transaction:", error);
            alert("Erreur lors de l'ajout de la transaction.");
        }
    });

    // Fonctions d'aide pour le rendu
    const renderSummaryCards = (data) => {
        const soldeEl = document.getElementById('caisse-solde');
        const totalRevenueEl = document.getElementById('total-revenue');
        const totalExpensesEl = document.getElementById('total-expenses');

        if (soldeEl) soldeEl.textContent = `${data.solde.toFixed(2)} €`;

        const totalRevenue = data.transactions.filter(t => t.type === 'entrée').reduce((sum, t) => sum + t.montant, 0);
        const totalExpenses = data.transactions.filter(t => t.type === 'dépense').reduce((sum, t) => sum + t.montant, 0);

        if (totalRevenueEl) totalRevenueEl.textContent = `${totalRevenue.toFixed(2)} €`;
        if (totalExpensesEl) totalExpensesEl.textContent = `${totalExpenses.toFixed(2)} €`;
    };

    const renderTransactionsList = (transactions) => {
        if (transactions.length === 0) {
            transactionsListEl.innerHTML = '<p>Aucune transaction enregistrée.</p>';
            return;
        }
        transactionsListEl.innerHTML = `
            <ul>
                ${transactions.reverse().map(t => `
                    <li class="${t.type === 'entrée' ? 'transaction-revenue' : 'transaction-expense'}">
                        <strong>${t.description}</strong>: ${t.montant.toFixed(2)} € (${t.type})
                        <span class="transaction-date">${new Date(t.date).toLocaleDateString()}</span>
                    </li>
                `).join('')}
            </ul>
        `;
    };

    const drawFinancialChart = (transactions) => {
        const ctx = financialChartEl.getContext('2d');

        let cumulativeBalance = 0;
        const labels = [];
        const dataPoints = [];

        const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

        sortedTransactions.forEach(t => {
            cumulativeBalance += t.type === 'entrée' ? t.montant : -t.montant;
            labels.push(new Date(t.date).toLocaleDateString());
            dataPoints.push(cumulativeBalance);
        });

        if (window.financialChartInstance) {
            window.financialChartInstance.destroy();
        }

        window.financialChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Solde cumulé (€)',
                    data: dataPoints,
                    borderColor: '#0A192F',
                    backgroundColor: 'rgba(10, 25, 47, 0.2)',
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: { display: true, text: 'Date' }
                    },
                    y: {
                        title: { display: true, text: 'Solde (€)' }
                    }
                }
            }
        });
    };

    // Appel initial
    fetchAndRenderCaisseData();
}

// Fonctions d'API
async function postTransaction(transaction) {
    const response = await fetch('/api/caisse-manifestation/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
    });
    if (!response.ok) {
        throw new Error('Échec de l\'ajout de la transaction.');
    }
    return response.json();
}