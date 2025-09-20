export async function initOrganisationPage() {
    console.log("Initialisation de la page d'organisation...");

    const timelineEventList = document.getElementById('timeline-event-list');
    const chartCanvas = document.getElementById('canvasTimeline'); // NOUVEAU: Cible le nouvel ID
    const modal = document.getElementById('timeline-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    if (!chartCanvas || !modal) {
        console.error("Les éléments HTML nécessaires (canvas ou modal) sont introuvables.");
        return;
    }

    const showEventDetailsInModal = (event) => {
        document.getElementById('modal-event-title').textContent = event.title;
        document.getElementById('modal-event-subtitle').textContent = event.subtitle;
        document.getElementById('modal-event-description').textContent = event.description;
        modal.style.display = 'block';
    };

    const fetchAndRenderTimeline = async () => {
        try {
            const response = await fetch('/database.json');
            if (!response.ok) {
                throw new Error(`Erreur de chargement de la base de données: ${response.statusText}`);
            }
            const data = await response.json();
            const chronology = data.chronology || [];

            if (chronology.length === 0) {
                timelineEventList.innerHTML = '<p>Aucun événement n\'est programmé pour le moment.</p>';
                return;
            }

            timelineEventList.innerHTML = '';
            chronology.forEach(event => {
                const card = document.createElement('div');
                card.className = 'card timeline-event-card';
                card.dataset.eventId = event.id;
                card.innerHTML = `
                    <h3>${event.subtitle}</h3>
                    <h4>${event.title}</h4>
                `;
                timelineEventList.appendChild(card);

                card.addEventListener('click', () => {
                    document.querySelectorAll('.timeline-event-card').forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                    showEventDetailsInModal(event);
                });
            });
            
            modalCloseBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });

            window.addEventListener('click', (event) => {
                if (event.target == modal) {
                    modal.style.display = 'none';
                }
            });

            const eventLabels = chronology.map(event => event.subtitle);
            const eventDates = chronology.map(event => new Date(event.start_date));
            const chartData = {
                labels: eventLabels,
                datasets: [{
                    label: 'Chronologie du Mouvement',
                    data: eventDates.map(date => ({ x: date, y: 0 })),
                    backgroundColor: 'rgba(0, 123, 255, 0.5)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 2,
                    pointRadius: 8,
                    pointBackgroundColor: '#007bff',
                    pointHoverRadius: 10,
                    pointHoverBackgroundColor: 'red',
                }]
            };

            const chartConfig = {
                type: 'line',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            type: 'time',
                            time: { unit: 'day', tooltipFormat: 'll' },
                            title: { display: true, text: 'Date' },
                            position: 'bottom',
                            ticks: { maxRotation: 90, minRotation: 90 },
                        },
                        y: { display: false },
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const index = context.dataIndex;
                                    const event = chronology[index];
                                    return [`Événement: ${event.title}`, `Date: ${new Date(event.start_date).toLocaleDateString()}`, `Détails: ${event.description}`];
                                }
                            }
                        }
                    },
                    onClick: (evt, elements) => {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            const selectedEvent = chronology[index];
                            showEventDetailsInModal(selectedEvent);
                            
                            document.querySelectorAll('.timeline-event-card').forEach(c => c.classList.remove('active'));
                            document.querySelector(`[data-event-id="${selectedEvent.id}"]`).classList.add('active');

                            chartInstance.data.datasets[0].pointBackgroundColor = chronology.map((event, i) => i === index ? 'red' : '#007bff');
                            chartInstance.update();
                        }
                    }
                }
            };
            
            const existingChart = Chart.getChart("canvasTimeline"); // NOUVEAU: Cible le nouvel ID
            if (existingChart) {
                existingChart.destroy();
            }

            const chartInstance = new Chart(chartCanvas, chartConfig);

        } catch (error) {
            console.error('Erreur lors du chargement de la chronologie:', error);
            timelineEventList.innerHTML = `<p class="error-message">Impossible de charger la chronologie.</p>`;
        }
    };

    fetchAndRenderTimeline();
}