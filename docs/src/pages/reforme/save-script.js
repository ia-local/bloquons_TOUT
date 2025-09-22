document.addEventListener('DOMContentLoaded', () => {
    const savedList = document.getElementById('saved-list');
    const statusMessageSaved = document.getElementById('status-message-saved');

    const fetchSavedContentList = async () => {
        savedList.innerHTML = '';
        statusMessageSaved.textContent = 'Chargement des sauvegardes...';
        
        try {
            const response = await fetch('/list-saved-content');
            const files = await response.json();
            
            if (response.ok) {
                if (files.length === 0) {
                    savedList.innerHTML = '<li>Aucune sauvegarde trouvée.</li>';
                    statusMessageSaved.textContent = '';
                } else {
                    files.forEach(file => {
                        const li = document.createElement('li');
                        li.textContent = file;
                        li.addEventListener('click', () => {
                            window.location.href = `/${file}`;
                        });
                        savedList.appendChild(li);
                    });
                    statusMessageSaved.textContent = '';
                }
            } else {
                statusMessageSaved.textContent = 'Erreur lors du chargement des sauvegardes.';
                statusMessageSaved.style.color = 'red';
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des sauvegardes:', error);
            statusMessageSaved.textContent = 'Erreur lors du chargement des sauvegardes.';
            statusMessageSaved.style.color = 'red';
        }
    };

    fetchSavedContentList();
});