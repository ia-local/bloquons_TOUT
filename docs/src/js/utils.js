// Fichier : public/src/js/utils.js

/**
 * Charge le fichier de configuration de la carte (map.json).
 * @returns {Promise<Object>} L'objet de configuration de la carte.
 */
export async function getMapConfig() {
    try {
        const response = await fetch('src/json/map.json');
        if (!response.ok) {
            throw new Error(`Erreur de chargement de la configuration de la légende : ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Erreur lors du chargement de map.json:', error);
        return {}; // Renvoie un objet vide en cas d'erreur
    }
}