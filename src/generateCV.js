// generateCV.js

/**
 * Génère un CV complet au format HTML/CSS à partir des logs de conversation analysés.
 * @param {Array<Object>} conversationLogs - Tableau des objets de log issus de logs.json.
 * @returns {string} - Le contenu HTML du CV.
 */
async function generateCurriculumVitae(conversationLogs) {
    console.log("Génération du CV à partir des logs...");

    let allSkills = new Set();
    let allSoftSkills = new Set();
    let allProjects = [];

    // Agrégation des données de toutes les conversations
    conversationLogs.forEach(log => {
        if (log.analysis) {
            log.analysis.identified_skills.forEach(skill => allSkills.add(skill));
            log.analysis.soft_skills_demonstrated.forEach(softSkill => allSoftSkills.add(softSkill));
            // Pour les projets, nous les ajoutons tels quels, ils peuvent être révisés par Groq plus tard
            if (log.analysis.potential_projects) {
                 log.analysis.potential_projects.forEach(project => allProjects.push(project));
            }
        }
    });

    // Éliminer les doublons pour les projets si nécessaire (si format texte exact)
    allProjects = [...new Set(allProjects)];


    // --- Construction du HTML du CV ---
    // C'est un template très simple. Vous pouvez le rendre beaucoup plus sophistiqué avec du CSS.
    const cvHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Curriculum Vitae</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f9f9f9; }
        .cv-container { max-width: 800px; margin: 20px auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #3498db; margin-top: 25px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        ul { list-style-type: none; padding: 0; margin: 0; }
        li { margin-bottom: 8px; padding-left: 20px; position: relative; }
        li:before { content: '•'; color: #3498db; position: absolute; left: 0; }
        .section-content { margin-left: 20px; }
        .project-item { margin-bottom: 15px; border-left: 3px solid #f39c12; padding-left: 10px; }
        .project-item h3 { margin: 0 0 5px 0; color: #555; }
        .project-item p { margin: 0; font-size: 0.95em; color: #666; }
        .summary { text-align: center; font-style: italic; color: #555; margin-bottom: 30px; }
    </style>
</head>
<body>
    <div class="cv-container">
        <h1>Curriculum Vitae</h1>
        
        <div class="summary">
            <p>Ce CV a été généré automatiquement à partir de mes interactions professionnelles avec une intelligence artificielle, mettant en lumière mes compétences techniques et soft skills.</p>
        </div>

        <h2>Compétences Techniques</h2>
        <div class="section-content">
            <ul>
                ${Array.from(allSkills).map(skill => `<li>${skill}</li>`).join('')}
            </ul>
        </div>

        <h2>Compétences Comportementales (Soft Skills)</h2>
        <div class="section-content">
            <ul>
                ${Array.from(allSoftSkills).map(skill => `<li>${skill}</li>`).join('')}
            </ul>
        </div>

        <h2>Projets et Réalisations</h2>
        <div class="section-content">
            ${allProjects.length > 0 ? 
                allProjects.map(project => `
                <div class="project-item">
                    <h3>${project.split(':')[0].trim()}</h3>
                    <p>${project.split(':').length > 1 ? project.split(':').slice(1).join(':').trim() : project}</p>
                </div>
                `).join('')
                : '<p>Aucun projet majeur détecté dans les conversations.</p>'}
        </div>

        </div>
</body>
</html>
    `;

    return cvHtml;
}

module.exports = { generateCurriculumVitae };