// Fichier : public/src/js/routes/reseauRouter.js

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs/promises');

// Chemin vers votre fichier de données
const CONNECTIONS_FILE_PATH = path.join(__dirname, '..', '..', 'json', 'reseau.json');
const USERS_FILE_PATH = path.join(__dirname, '..', '..', 'json', 'users.json');

// Route pour obtenir les données des connexions
router.get('/api/connections', async (req, res) => {
    try {
        const connectionsData = await fs.readFile(CONNECTIONS_FILE_PATH, 'utf8');
        res.json(JSON.parse(connectionsData));
    } catch (error) {
        console.error('Erreur lors du chargement des connexions:', error);
        res.status(500).json({ error: 'Échec du chargement des données de connexion.' });
    }
});

// Route pour obtenir les données des utilisateurs (si vous en avez besoin sur le serveur)
router.get('/api/users', async (req, res) => {
    try {
        const usersData = await fs.readFile(USERS_FILE_PATH, 'utf8');
        res.json(JSON.parse(usersData));
    } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        res.status(500).json({ error: 'Échec du chargement des données des utilisateurs.' });
    }
});

module.exports = router;