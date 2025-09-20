// Fichier : public/src/js/cvnu.js

/**
 * Initialise les fonctionnalités de la page CV Numérique.
 */
export function initCvnuPage() {
    console.log("Initialisation de la page CVNU...");

    // Gestion de la navigation entre les sections
    const navLinks = document.querySelectorAll('.cvnu-nav ul li a');
    const sections = document.querySelectorAll('.cvnu-section');
    
    // Vérification de la présence des éléments DOM
    if (navLinks.length === 0 || sections.length === 0) {
        console.error("Erreur: Les éléments de navigation du CVNU sont manquants.");
        return;
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSectionId = link.dataset.section;

            // Masquer toutes les sections
            sections.forEach(section => {
                section.classList.remove('active');
            });

            // Retirer la classe 'active' de tous les liens de navigation
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });

            // Afficher la section ciblée et activer le lien
            document.getElementById(targetSectionId).classList.add('active');
            link.classList.add('active');
        });
    });

    // --- Logique du formulaire d'analyse de CV ---
    const form = document.getElementById('cv-analysis-form');
    const inputArea = document.getElementById('cv-content-input');
    const outputDisplay = document.getElementById('cv-output-display');

    if (form && inputArea && outputDisplay) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const cvContent = inputArea.value;
            if (cvContent.trim() === '') {
                alert("Veuillez coller le contenu de votre CV.");
                return;
            }

            outputDisplay.innerHTML = '<div class="loading-spinner"><p>Analyse en cours...</p></div>';

            try {
                const response = await fetch('/cvnu/api/cv/parse-and-structure', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cvContent })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erreur lors de la structuration du CV.');
                }

                const structuredCvData = await response.json();
                const jsonOutput = JSON.stringify(structuredCvData, null, 2);
                outputDisplay.innerHTML = `<pre>${jsonOutput}</pre>`;
                
                // Mettre à jour le score dans la carte de profil
                const scoreElement = document.getElementById('profile-score');
                if (scoreElement) {
                    scoreElement.textContent = `Score CVNU : ${structuredCvData.score.toFixed(2)}`;
                }
                
                // Mettre à jour le nom si disponible
                const nameElement = document.getElementById('profile-name');
                if (nameElement && structuredCvData.nom) {
                    nameElement.textContent = structuredCvData.nom;
                }

            } catch (error) {
                console.error('Erreur:', error);
                outputDisplay.innerHTML = `<div class="error-message"><p>Une erreur est survenue: ${error.message}</p></div>`;
            }
        });
    } else {
        console.error("Erreur: Les éléments du formulaire d'analyse de CV sont manquants.");
    }
}