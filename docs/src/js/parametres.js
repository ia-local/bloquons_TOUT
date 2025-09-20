// Fichier : public/src/js/parametres.js
import { initJournalModal } from './journalModal.js';

export function initParametresPage() {
    console.log('Initialisation de la page des paramètres.');
    
    const openJournalModalBtn = document.getElementById('open-journal-modal-btn');
    const journalModal = document.getElementById('journal-modal');

    if (openJournalModalBtn && journalModal) {
        initJournalModal(); // Only run if elements exist
    } else {
        console.warn("Éléments de la modal du journal introuvables. Fonctionnalité de la modal désactivée pour cette page.");
        // We use console.warn to log the issue without halting script execution.
    }
}