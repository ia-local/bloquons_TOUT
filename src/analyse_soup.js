// analyse_soup.js

/**
 * Nettoie et structure une conversation Markdown brute en un tableau de messages.
 * Chaque message contient le rôle (utilisateur/ia) et le contenu.
 * @param {string} markdownText - Le contenu de la conversation au format Markdown.
 * @returns {Array<Object>} - Un tableau d'objets { role: 'user'|'ia', content: '...' }.
 */
function analyzeRawConversation(markdownText) {
    const messages = [];
    const lines = markdownText.split('\n');
    let currentRole = null;
    let currentContent = [];

    // Simple regex pour détecter les rôles
    const userRoleRegex = /^\*\*Utilisateur:\*\*\s*(.*)/i;
    const iaRoleRegex = /^\*\*Chabotes \(IA\):\*\*\s*(.*)/i; // Ou le nom de votre IA

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('#') || trimmedLine.startsWith('##') || trimmedLine.startsWith('###')) {
            // Ignorer les titres de section, ou extraire des métadonnées si besoin
            continue;
        }

        let matchUser = trimmedLine.match(userRoleRegex);
        let matchIA = trimmedLine.match(iaRoleRegex);

        if (matchUser) {
            // Si un rôle précédent était en cours, le stocker
            if (currentRole && currentContent.length > 0) {
                messages.push({ role: currentRole, content: currentContent.join('\n').trim() });
            }
            currentRole = 'user';
            currentContent = [matchUser[1].trim()]; // Contenu après le rôle
        } else if (matchIA) {
            if (currentRole && currentContent.length > 0) {
                messages.push({ role: currentRole, content: currentContent.join('\n').trim() });
            }
            currentRole = 'ia';
            currentContent = [matchIA[1].trim()];
        } else if (currentRole) {
            // Ligne de continuation du message précédent
            currentContent.push(trimmedLine);
        }
    }

    // Ajouter le dernier message s'il y en a un
    if (currentRole && currentContent.length > 0) {
        messages.push({ role: currentRole, content: currentContent.join('\n').trim() });
    }

    // Vous pouvez également extraire l'ID de conversation et la date ici si souhaité
    // Exemple simplifié, à adapter à la complexité de votre markdown
    const conversationIdMatch = markdownText.match(/ID:\s*([a-zA-Z0-9_.-]+)/);
    const dateMatch = markdownText.match(/Date:\s*([0-9-/:T\s]+)/); // Capture une date simple

    return {
        id: conversationIdMatch ? conversationIdMatch[1] : `unknown_conv_${Date.now()}`,
        date: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
        messages: messages
    };
}

module.exports = { analyzeRawConversation };