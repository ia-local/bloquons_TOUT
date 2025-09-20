// Fichier : public/src/js/smartContract.js

export async function initSmartContractPage() {
    console.log("Initialisation de la page Smart Contracts...");

    const caisseSoldeEl = document.getElementById('caisse-solde');
    const totalTransactionsEl = document.getElementById('total-transactions');
    const transactionsListEl = document.getElementById('transactions-list');
    const decaisserBtn = document.getElementById('decaisser-btn');
    const recevoirBtn = document.getElementById('recevoir-btn');

    const fetchCaisseData = async () => {
        try {
            // Le chemin de l'API est maintenant préfixé par /smartContract
            const response = await fetch('/smartContract/api/contract-state');
            if (!response.ok) {
                throw new Error('Échec du chargement des données de la caisse.');
            }
            const data = await response.json();
            
            caisseSoldeEl.textContent = `${data.tresorerie.toFixed(2)} €`;
            totalTransactionsEl.textContent = data.nombreCitoyens;

            // Il manque l'historique des transactions dans l'API de contract-state.
            // Pour l'instant, on va simuler ou ajouter un autre appel d'API si nécessaire.
            // On peut appeler l'endpoint /api/caisse-manifestation si votre serveur le gère.
            const transactionsResponse = await fetch('/api/caisse-manifestation');
            const transactionsData = await transactionsResponse.json();
            
            transactionsListEl.innerHTML = '';
            transactionsData.transactions.forEach(tx => {
                const txEl = document.createElement('div');
                txEl.className = 'transaction-item';
                txEl.innerHTML = `
                    <p><strong>ID:</strong> ${tx.id}</p>
                    <p><strong>Type:</strong> ${tx.type}</p>
                    <p><strong>Montant:</strong> ${tx.montant.toFixed(2)} €</p>
                    <p><strong>Description:</strong> ${tx.description}</p>
                    <p><strong>Date:</strong> ${new Date(tx.date).toLocaleString()}</p>
                `;
                transactionsListEl.appendChild(txEl);
            });


        } catch (error) {
            console.error('Erreur lors de la récupération des données de la caisse:', error);
            caisseSoldeEl.textContent = 'Erreur';
            totalTransactionsEl.textContent = 'Erreur';
            transactionsListEl.innerHTML = `<p class="error-message">Impossible de charger les données: ${error.message}</p>`;
        }
    };

    decaisserBtn.addEventListener('click', async () => {
        try {
            // Le chemin de l'API est maintenant préfixé par /smartContract
            await fetch('/smartContract/api/decaisser-allocations', { method: 'POST' });
            alert('Décaissement des allocations lancé.');
            await fetchCaisseData();
        } catch (error) {
            alert('Erreur lors du décaissement.');
        }
    });

    recevoirBtn.addEventListener('click', async () => {
        const montant = parseFloat(prompt("Entrez le montant à ajouter :"));
        if (!isNaN(montant) && montant > 0) {
            try {
                // Le chemin de l'API est maintenant préfixé par /smartContract
                await fetch('/smartContract/api/collect-tva', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: montant })
                });
                alert('Fonds ajoutés avec succès !');
                await fetchCaisseData();
            } catch (error) {
                alert('Erreur lors de l\'ajout des fonds.');
            }
        }
    });

    fetchCaisseData();
}