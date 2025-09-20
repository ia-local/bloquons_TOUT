/**
 * @fileoverview Ce module contient les fonctions de templating pour générer les interfaces utilisateur.
 * Il permet de séparer la logique de l'application de sa présentation.
 */

const template = {
    /**
     * Génère le HTML pour l'affichage d'un CV numérique.
     * @param {object} cvData Les données du CV, incluant le numéro fiscal, l'âge, l'allocation et les compétences.
     * @returns {string} Le fragment HTML stylisé du CV.
     */
    generateCvHtml: (cvData) => {
        const skillsHtml = cvData.skills.map(skill => `
            <div class="skill-item">
                <span class="skill-name">${skill.name}</span>
                <span class="skill-score">Score: ${Math.round(skill.score * 100)}%</span>
                <div class="skill-bar-container">
                    <div class="skill-bar" style="width: ${skill.score * 100}%"></div>
                </div>
            </div>
        `).join('');

        return `
            <div class="cv-card">
                <div class="cv-header">
                    <h3>Profil de citoyen</h3>
                    <div class="cv-header-details">
                        <p><strong>Numéro fiscal :</strong> ${cvData.numeroFiscal}</p>
                        <p><strong>Âge :</strong> ${cvData.age} ans</p>
                    </div>
                </div>
                <div class="cv-body">
                    <h4>Allocation mensuelle progressive :</h4>
                    <p class="allocation-amount">${cvData.allocation} €</p>
                    <h4>Détails des compétences :</h4>
                    <div class="skills-list">
                        ${skillsHtml}
                    </div>
                </div>
            </div>
        `;
    }
};
