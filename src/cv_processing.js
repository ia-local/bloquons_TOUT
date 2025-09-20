// src/cv_processing.js
const Groq = require('groq-sdk'); // Assurez-vous que Groq est accessible
const { MODEL_QUALITY_SCORES } = require('../server_modules/model_quality_config'); // Assurez-vous que le chemin est correct

// Initialisation de Groq (assurez-vous que l'API key est passée ou configurée globalement si c'est un module serveur)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY }); // Utilise la variable d'environnement

/**
 * Tente de structurer un texte CV brut en un objet JSON.
 * Utilise Groq pour l'analyse NLP.
 * @param {string} rawCvText - Le texte brut du CV.
 * @returns {Promise<object>} - Un objet JSON représentant le CV structuré.
 */
async function generateStructuredCvData(rawCvText) {
    // Prompt pour demander à Groq de structurer le CV
    const prompt = `Convertissez le texte de CV suivant en un objet JSON structuré. Incluez les champs suivants:
    - nom: string
    - email: string
    - telephone: string
    - adresse: string
    - resume: string (une brève description professionnelle)
    - experiences: array of objects ({ titre: string, entreprise: string, duree: string, description: string (liste à puces si possible) })
    - formation: array of objects ({ diplome: string, etablissement: string, duree: string })
    - competences: array of strings (compétences techniques et soft skills)
    - langues: array of objects ({ langue: string, niveau: string })
    - projets: array of objects ({ nom: string, description: string, technologies: array of strings })

    Si une information est manquante, utilisez "N/A" ou une liste vide pour les tableaux. Ne générez que l'objet JSON.
    Texte du CV:
    "${rawCvText}"
    `;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gemma2-9b-it', // Ou un modèle adapté pour la structuration de données
            temperature: 0.2, // Température basse pour une sortie structurée et prévisible
            response_format: { type: "json_object" }, // IMPORTANT: Demander une réponse JSON
        });

        const jsonString = chatCompletion.choices[0]?.message?.content;
        return JSON.parse(jsonString);

    } catch (error) {
        console.error('Erreur lors de la structuration du CV par Groq:', error);
        // Retourne une structure vide en cas d'erreur
        return {
            nom: "N/A",
            email: "N/A",
            telephone: "N/A",
            adresse: "N/A",
            resume: "Erreur lors de l'analyse du CV.",
            experiences: [],
            formation: [],
            competences: [],
            langues: [],
            projets: []
        };
    }
}

/**
 * Rend un objet JSON de CV structuré en une chaîne HTML formatée.
 * @param {object} cvData - L'objet JSON structuré du CV.
 * @returns {string} - La chaîne HTML du CV.
 */
function renderCvHtml(cvData) {
    const defaultData = { // Assure une structure minimale pour éviter les erreurs d'affichage
        nom: "Nom Prénom", email: "email@example.com", telephone: "0123456789", adresse: "Adresse Ville",
        resume: "Votre résumé professionnel ira ici.",
        experiences: [], formation: [], competences: [], langues: [], projets: []
    };
    const data = { ...defaultData, ...cvData }; // Fusionne avec les données réelles

    return `
        <div class="cv-container">
            <header class="cv-header">
                <h1 class="cv-name">${data.nom}</h1>
                <p class="cv-contact-info">
                    ${data.email !== "N/A" ? `<i class="fas fa-envelope"></i> ${data.email}` : ''}
                    ${data.telephone !== "N/A" ? ` | <i class="fas fa-phone"></i> ${data.telephone}` : ''}
                    ${data.adresse !== "N/A" ? ` | <i class="fas fa-map-marker-alt"></i> ${data.adresse}` : ''}
                </p>
                <p class="cv-summary">${data.resume}</p>
            </header>

            ${data.experiences.length > 0 ? `
            <section class="cv-section">
                <h2 class="cv-section-title"><i class="fas fa-briefcase"></i> Expérience Professionnelle</h2>
                ${data.experiences.map(exp => `
                    <div class="cv-item">
                        <h3>${exp.titre} - ${exp.entreprise}</h3>
                        <p class="cv-item-duration">${exp.duree}</p>
                        <p>${exp.description}</p>
                    </div>
                `).join('')}
            </section>` : ''}

            ${data.formation.length > 0 ? `
            <section class="cv-section">
                <h2 class="cv-section-title"><i class="fas fa-graduation-cap"></i> Formation</h2>
                ${data.formation.map(edu => `
                    <div class="cv-item">
                        <h3>${edu.diplome} - ${edu.etablissement}</h3>
                        <p class="cv-item-duration">${edu.duree}</p>
                    </div>
                `).join('')}
            </section>` : ''}

            ${data.competences.length > 0 ? `
            <section class="cv-section">
                <h2 class="cv-section-title"><i class="fas fa-cogs"></i> Compétences</h2>
                <ul class="cv-skills-list">
                    ${data.competences.map(skill => `<li>${skill}</li>`).join('')}
                </ul>
            </section>` : ''}

            ${data.langues.length > 0 ? `
            <section class="cv-section">
                <h2 class="cv-section-title"><i class="fas fa-globe"></i> Langues</h2>
                <ul class="cv-languages-list">
                    ${data.langues.map(lang => `<li>${lang.langue} (${lang.niveau})</li>`).join('')}
                </ul>
            </section>` : ''}

            ${data.projets.length > 0 ? `
            <section class="cv-section">
                <h2 class="cv-section-title"><i class="fas fa-code-branch"></i> Projets</h2>
                ${data.projets.map(proj => `
                    <div class="cv-item">
                        <h3>${proj.nom}</h3>
                        <p>${proj.description}</p>
                        ${proj.technologies && proj.technologies.length > 0 ? `<p class="cv-item-tech"><strong>Technologies:</strong> ${proj.technologies.join(', ')}</p>` : ''}
                    </div>
                `).join('')}
            </section>` : ''}

        </div>
    `;
}

module.exports = {
    generateStructuredCvData,
    renderCvHtml
};
