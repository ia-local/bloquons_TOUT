
document.addEventListener('DOMContentLoaded', () => {
    const taxesListContainer = document.getElementById('taxes-list-container');
    const aiExplanationContainer = document.getElementById('ai-explanation');
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const openModalBtn = document.getElementById('openModalBtn');
    const modal = document.getElementById('myModal');
    const closeBtn = document.querySelector('.close-btn');
    const cvForm = document.getElementById('cv-form');

    const tresorerieValue = document.getElementById('tresorerie-value');
    const citoyensActifsValue = document.getElementById('citoyens-actifs-value');
    const collectBtn = document.getElementById('collect-btn');
    const decaisserBtn = document.getElementById('decaisser-btn');
    const transactionsLog = document.getElementById('transactions-log');
    
    const CYCLE_DURATION_MS = 28 * 24 * 60 * 60 * 1000;
    let lastPaymentTimestamp = Date.now();

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = e.target.getAttribute('href').substring(1);

            pages.forEach(page => {
                if (page.id === targetId) {
                    page.classList.add('active');
                } else {
                    page.classList.remove('active');
                }
            });
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    openModalBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    async function initCharts(data) {
        const recettesCtx = document.getElementById('recettesChart').getContext('2d');
        new Chart(recettesCtx, {
            type: 'pie',
            data: {
                labels: ['TVA réaffectée', 'Autres recettes'],
                datasets: [{
                    data: [data.recettesParSource.TVA, data.recettesParSource.Autres],
                    backgroundColor: ['#004d99', '#99c2ff'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Origine des Recettes de la Réforme', color: '#002366' }
                }
            }
        });

        const depensesCtx = document.getElementById('depensesChart').getContext('2d');
        const depensesLabels = Object.keys(data.distributionAllocation);
        const depensesData = Object.values(data.distributionAllocation);
        new Chart(depensesCtx, {
            type: 'bar',
            data: {
                labels: depensesLabels,
                datasets: [{
                    label: 'Nombre de bénéficiaires',
                    data: depensesData,
                    backgroundColor: '#004d99',
                    borderColor: '#002366',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false }, title: { display: true, text: 'Distribution de l\'Allocation par Tranche', color: '#002366' } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    async function initSkillsChart(data) {
        const skillsCtx = document.getElementById('skillsChart').getContext('2d');
        const labels = data.skills.map(skill => skill.name);
        const scores = data.skills.map(skill => skill.score);

        new Chart(skillsCtx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Score de compétence',
                    data: scores,
                    backgroundColor: 'rgba(0, 77, 153, 0.4)',
                    borderColor: '#004d99',
                    borderWidth: 1,
                    pointBackgroundColor: '#002366'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        angleLines: { display: false },
                        suggestedMin: 0,
                        suggestedMax: 1,
                        pointLabels: { color: '#002366' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    title: { display: false }
                }
            }
        });
    }

    async function fetchDashboardData() {
        try {
            const response = await fetch('/api/dashboard-data');
            const data = await response.json();
            initCharts(data);
            if (tresorerieValue) {
                tresorerieValue.textContent = `${data.tresorerie} €`;
            }
        } catch (error) {
            console.error("Impossible de récupérer les données du tableau de bord:", error);
        }
    }

    async function fetchTaxes() {
        try {
            const response = await fetch('/api/taxes');
            const taxes = await response.json();
            displayTaxes(taxes);
        } catch (error) {
            console.error("Impossible de récupérer la liste des impôts:", error);
            taxesListContainer.innerHTML = '<li>Erreur de chargement des données.</li>';
        }
    }

    async function fetchAIExplanation() {
        try {
            const response = await fetch('/api/redistribution');
            const data = await response.json();
            aiExplanationContainer.innerHTML = `<p>${data.explicationIA}</p>`;
        } catch (error) {
            console.error("Impossible de récupérer l'explication AI:", error);
            aiExplanationContainer.innerHTML = '<p>Erreur lors du chargement de l\'explication AI.</p>';
        }
    }

    cvForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const numeroFiscal = document.getElementById('numero-fiscal').value;
        const description = document.getElementById('description').value;

        const cvDataContainer = document.getElementById('cvnu-details');
        cvDataContainer.innerHTML = '<p>Génération de votre CV en cours...</p>';

        try {
            const response = await fetch('/api/generate-cv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ numeroFiscal, descriptionMetier: description })
            });
            const data = await response.json();
            
            // Utilisation du nouveau module de template
            cvDataContainer.innerHTML = template.generateCvHtml(data);

            initSkillsChart(data);
        } catch (error) {
            console.error("Impossible de générer le CV:", error);
            cvDataContainer.innerHTML = '<p>Erreur lors de la génération du CV. Veuillez réessayer.</p>';
        }
    });

    function displayTaxes(taxes) {
        taxesListContainer.innerHTML = '';
        for (const key in taxes) {
            if (taxes.hasOwnProperty(key)) {
                const li = document.createElement('li');
                li.textContent = `${key}: ${taxes[key]}`;
                taxesListContainer.appendChild(li);
            }
        }
    }

    async function fetchContractState() {
        try {
            const response = await fetch('/api/contract-state');
            const data = await response.json();
            tresorerieValue.textContent = `${data.tresorerie} €`;
            citoyensActifsValue.textContent = `${data.nombreCitoyens} citoyens actifs`;
        } catch (error) {
            console.error("Erreur de récupération de l'état du contrat:", error);
        }
    }

    async function collectTVA() {
        try {
            const response = await fetch('/api/collect-tva', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 1000 }) });
            const data = await response.json();
            if (data.success) {
                logTransaction(`✅ Caisse (partenaire) : +1000€. Trésorerie : ${data.message.split(': ')[1]}`);
                await fetchContractState();
                await fetchDashboardData();
            }
        } catch (error) {
            console.error("Erreur lors de la collecte de TVA:", error);
        }
    }

    async function decaisserAllocations() {
        try {
            const response = await fetch('/api/decaisser-allocations');
            const data = await response.json();
            if (data.success) {
                logTransaction(`💰 Décaissement : ${data.totalVerse}€ versés à ${data.allocations.length} citoyens.`);
                logTransaction(`🔗 Trésorerie restante : ${data.tresorerieRestante}€`);
                await fetchContractState();
                await fetchDashboardData();
            }
        } catch (error) {
            console.error("Erreur lors du décaissement:", error);
        }
    }

    function logTransaction(message) {
        const li = document.createElement('li');
        li.textContent = message;
        transactionsLog.prepend(li);
    }

    collectBtn.addEventListener('click', collectTVA);
    decaisserBtn.addEventListener('click', decaisserAllocations);

    fetchDashboardData();
    fetchTaxes();
    fetchAIExplanation();
    fetchContractState();
});