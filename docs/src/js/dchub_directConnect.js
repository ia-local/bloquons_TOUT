// Fichier : public/src/js/dchub_directConnect.js

/**
 * Définit la couleur d'une connexion en fonction de son type.
 * @param {string} type Le type de connexion (e.g., 'direct_connect', 'dchub').
 * @returns {string} Le code couleur.
 */
function getConnectionColor(type) {
    switch (type) {
        case 'dchub':
            return 'rgba(255, 165, 0, 0.7)'; // Orange pour les hubs
        case 'direct_connect':
            return 'rgba(0, 128, 0, 0.7)'; // Vert pour les connexions directes
        default:
            return 'rgba(100, 100, 100, 0.5)'; // Gris par défaut
    }
}

/**
 * Dessine toutes les connexions sur le canvas.
 * @param {CanvasRenderingContext2D} ctx Le contexte du canvas.
 * @param {Array<Object>} connections Les données de connexion.
 * @param {Array<Object>} iconPositions Les positions des icônes des utilisateurs.
 */
export function drawConnections(ctx, connections, iconPositions) {
    if (!connections || !iconPositions) return;

    connections.forEach(conn => {
        const sourceNode = iconPositions.find(p => p.user.id === conn.source_id);
        const targetNode = iconPositions.find(p => p.user.id === conn.target_id);

        if (sourceNode && targetNode) {
            ctx.beginPath();
            ctx.moveTo(sourceNode.x, sourceNode.y);
            ctx.lineTo(targetNode.x, targetNode.y);
            ctx.strokeStyle = getConnectionColor(conn.type);
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
}