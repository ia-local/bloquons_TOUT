// Fichier : public/src/js/db-ascii-timestamp.js
// Ce module génère un timestamp au format ASCII Art.

import { asciiArt, maxLetterHeightInLines } from './db_ascii.js';

/**
 * Génère une chaîne de caractères ASCII Art à partir d'un texte.
 * @param {string} text - Le texte à convertir en ASCII Art.
 * @returns {string} Le texte formaté en ASCII Art.
 */
export function generateAsciiArt(text) {
    let result = '';

    // Initialisation des lignes pour le résultat
    const lines = Array.from({ length: maxLetterHeightInLines }, () => '');

    // Parcourir chaque caractère du texte
    for (const char of text) {
        const letter = asciiArt[char.toUpperCase()] || asciiArt[' '];
        
        // Ajouter la lettre ASCII ligne par ligne
        for (let i = 0; i < maxLetterHeightInLines; i++) {
            lines[i] += (letter[i] || '').padEnd(maxLetterHeightInLines, ' ');
        }
    }

    result = lines.join('\n');
    return result;
}

/**
 * Génère le timestamp actuel au format `HH:MM:SS` en ASCII Art.
 * @returns {string} Le timestamp actuel en ASCII Art.
 */
export function generateTimestampAsciiArt() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    // Formatage du timestamp
    const timestamp = `${hours}:${minutes}:${seconds}`;

    // Conversion du timestamp en ASCII Art
    const asciiTimestamp = generateAsciiArt(timestamp);
    
    return asciiTimestamp;
}