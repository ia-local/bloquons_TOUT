// Fichier : public/src/js/home.js

import { initModalSlides } from './modalSlide.js';

/**
 * Loads data from the database.json file.
 * @returns {Promise<Object>} A promise that resolves with the JSON data.
 */
async function fetchProjectData() {
    try {
        const response = await fetch('src/json/home.json');
        if (!response.ok) {
            throw new Error(`Erreur de chargement de la base de données : ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la récupération des données du projet:', error);
        return {};
    }
}

/**
 * Initializes the home page carousel and its interactions.
 */
export async function initHomePage() {
    const projectData = await fetchProjectData();
    let slideIndex = 1;

    // Retrieve DOM elements once at the start
    const slides = document.getElementsByClassName("slide");
    const dots = document.getElementsByClassName("dot");
    const prevBtn = document.querySelector('.slides-container .prev');
    const nextBtn = document.querySelector('.slides-container .next');
    const dotsContainer = document.querySelector('.slide-dots');

    // --- Internal functions for slide management ---
    function showSlides(n) {
        if (slides.length === 0 || dots.length === 0) {
            console.error("Les éléments du carrousel ne sont pas trouvés.");
            return;
        }

        // Correctly manage the slide index for looping
        if (n > slides.length) {
            slideIndex = 1;
        } else if (n < 1) {
            slideIndex = slides.length;
        } else {
            slideIndex = n;
        }

        for (let i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
        }

        for (let i = 0; i < dots.length; i++) {
            dots[i].className = dots[i].className.replace(" active", "");
        }

        slides[slideIndex - 1].style.display = "flex";
        dots[slideIndex - 1].className += " active";
    }

    // --- Dynamic content rendering functions ---
    function renderTeamCards(team) {
        const container = document.getElementById('team-cards-container');
        if (!container) {
            return;
        }
        console.log("Données de l'équipe reçues:", team); // AJOUTEZ CETTE LIGNE
        container.innerHTML = '';
        if (team && Array.isArray(team)) {
            team.forEach(member => {
                const card = document.createElement('div');
                card.className = 'team-card';
                card.innerHTML = `
                    <h3>${member.role}</h3>
                    <p>${member.description}</p>
                    <i class="fas ${getIconForRole(member.role)}"></i>
                `;
                container.appendChild(card);
            });
        }
    }

    function getIconForRole(role) {
        if (role.includes("Développeur")) { return "fa-code"; }
        if (role.includes("Économiste")) { return "fa-wallet"; }
        if (role.includes("Designer")) { return "fa-paint-brush"; }
        if (role.includes("Militant")) { return "fa-users"; }
        return "fa-user-tie";
    }

    function renderFinanceChart(projections) {
        const financeChartCanvas = document.getElementById('financeChart');
        if (!financeChartCanvas) {
            return;
        }
        if (typeof Chart === 'undefined') {
            console.error("Chart.js n'est pas chargé. Veuillez l'ajouter dans votre index.html.");
            return;
        }
        const existingChart = Chart.getChart("financeChart");
        if (existingChart) {
            existingChart.destroy();
        }

        const ctx = financeChartCanvas.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: projections.labels,
                datasets: [{
                    label: 'Projections de financement',
                    data: projections.data,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Montant (en millions €)'
                        }
                    }
                }
            }
        });
    }

    // --- Appel des fonctions d'initialisation ---
    if (projectData && projectData.team) {
        renderTeamCards(projectData.team);
    }
    if (projectData && projectData.projections) {
        renderFinanceChart(projectData.projections);
    }
    initModalSlides(projectData);
    showSlides(slideIndex);

    // --- Attachement des écouteurs d'événements ---
    if (prevBtn) {
        prevBtn.addEventListener('click', () => showSlides(slideIndex - 1));
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => showSlides(slideIndex + 1));
    }
    if (dotsContainer) {
        dotsContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('dot')) {
                const index = Array.from(dotsContainer.children).indexOf(event.target);
                showSlides(index + 1);
            }
        });
    }
}