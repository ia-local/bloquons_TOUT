// Fichier : database.js

const fs = require('fs/promises');
const path = require('path');

const DB_PATH = path.join(__dirname, 'public', 'src', 'json');

/**
 * Charge tous les fichiers JSON du dossier spécifié.
 * @returns {Promise<Object>} Un objet contenant les données de tous les fichiers JSON.
 */
async function loadDatabase() {
  const database = {};
  try {
    const files = await fs.readdir(DB_PATH);
    for (const file of files) {
      if (path.extname(file) === '.json') {
        const filePath = path.join(DB_PATH, file);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(fileContent);
        // Utilise le nom du fichier comme clé (ex: "boycotts.json" -> "boycotts")
        const key = path.basename(file, '.json');
        database[key] = data[key]; // Assurez-vous que le fichier JSON a une clé racine correspondante
      }
    }
    console.log('Base de données modulaire chargée avec succès.');
    return database;
  } catch (error) {
    console.error('Erreur lors du chargement de la base de données modulaire:', error);
    return {};
  }
}

/**
 * Sauvegarde les données dans leur fichier JSON respectif.
 * @param {Object} data L'objet de données à sauvegarder.
 * @param {string} key La clé de l'objet (ex: 'boycotts').
 * @returns {Promise<void>}
 */
async function saveData(data, key) {
  const filePath = path.join(DB_PATH, `${key}.json`);
  const fileData = { [key]: data }; // Recrée l'objet racine pour la sauvegarde
  try {
    await fs.writeFile(filePath, JSON.stringify(fileData, null, 2), 'utf8');
    console.log(`Fichier ${key}.json mis à jour avec succès.`);
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde du fichier ${key}.json:`, error);
  }
}

module.exports = {
  loadDatabase,
  saveData
};