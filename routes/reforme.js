const express = require('express');
const path = require('path');
const IA = require('groq-sdk');
const fs = require('fs');

// Au lieu de créer une application, on crée un routeur
const router = express.Router();
const Groq = new IA({ apiKey: process.env.GROQ_API_KEY });
const SMART_CONTRACT_API_URL = `http://localhost:${process.env.PORT || 3000}/smartContract/api`;

// Données de référence
const lawArticles = `
    Objectifs de la réforme :
    - Améliorer la valorisation des compétences.
    - Favoriser la formation et la professionnalisation.
    - Encourager l'innovation et la création d'emplois qualifiés.

    Modifications du Code du Travail :
    - Article L3121-1 : Définition du travail pour inclure la monétisation des compétences basée sur le CVNU (CV numérique).
    - Article L4331-1 (nouvel article) : Smart contracts pour la sécurisation et la transparence des transactions liées à la monétisation des compétences (CV numérique).
    - Article L3222-1 : Redéfinition de la durée légale de travail et de sa monétisation.
    - Article L4334-1 : Utilisation de la TVA pour financer la formation et l'emploi en fonction des compétences validées sur le CVNU (CV numérique).
    - Article L4333-1 (nouvel article) : Suivi régulier de la répartition des recettes de la TVA.
    
    Référence au Code Général des Impôts :
    - Article 256 : Cet article du CGI définit le champ d'application de la TVA en France. La réforme propose de réaffecter une fraction de cette taxe existante pour financer les dispositifs de formation et d'emploi.
`;

const lawCorpus = `
    **TITRE I : Redéfinition du Droit au Travail et à la Rémunération des Compétences**
    **Article L3121-1 :** Le travail est défini comme toute activité productive ou d'apprentissage qui génère une compétence valorisable et reconnue au sein du Curriculum Vitae Numérique Universel (CVNU). Ce droit au travail à vie est effectif à partir de l'âge de 16 ans et garantit une rémunération progressive des compétences acquises, en dehors ou en complément d'un emploi salarié traditionnel.
    **Article L3222-1 :** Il est institué une allocation mensuelle universelle, progressive, et personnalisée, d'un montant compris entre 500 € et 5 000 €. Cette allocation est versée à chaque citoyen détenteur d'un CVNU actif et validé, en fonction de la progression de ses compétences. Le montant est calculé par un algorithme transparent et évolutif, basé sur la pertinence et le niveau des compétences enregistrées.
    **TITRE II : Mécanismes de Financement et de Sécurité des Transactions**
    **Article L4331-1 (nouvel article) :** Toutes les transactions financières liées au financement et à la redistribution des recettes fiscales, ainsi qu'au versement de l'allocation, sont sécurisées, automatisées et transparentes par l'utilisation de smart contracts. Ces contrats intelligents, basés sur la technologie de la blockchain, garantissent l'inaltérabilité des données et la traçabilité des fonds.
    **Article L4334-1 :** Un pourcentage défini des recettes de la Taxe sur la Valeur Ajoutée (TVA) est affecté de manière spécifique à un fonds de redistribution. Ce fonds est exclusivement dédié au financement de l'allocation universelle et de la formation professionnelle. Les décaissements sont opérés par l'algorithme des smart contracts et versés directement sur le Relevé d'Identité Bancaire (RIB) associé au CVNU de chaque citoyen.
    
    **LIEN AVEC LE CODE GÉNÉRAL DES IMPÔTS**
    La mise en œuvre de l'économie circulaire repose sur une réaffectation d'une partie des recettes de la Taxe sur la Valeur Ajoutée (TVA), telle que définie par le **Code Général des Impôts (CGI)**. Cette approche garantit la pérennité du financement en s'appuyant sur un impôt stable et directement lié à la consommation. En particulier, l'**article 256 du CGI** sert de base légale à cette disposition, en soulignant que la TVA s'applique aux livraisons de biens et aux prestations de services effectuées à titre onéreux par un assujetti.
`;

const detailedDevelopmentPlan = `
    Étape 1 : Conception et élaboration technique
    - Modélisation du Smart Contract de l'Allocation (entrées, logique, sorties)
    - Développement d'une classe de compte dédiée aux opérations de la blockchain.
    - Mise en place d'une API sécurisée pour interagir avec les systèmes fiscaux et bancaires.
    Étape 2 : Simulation et banc d'essai
    - Déploiement sur un Testnet.
    - Utilisation de données anonymisées pour simuler des transactions.
    - Rapport de performance pour valider la viabilité.
    Étape 3 : Rédaction et intégration du plan de développement dans le projet de loi
    - Rédaction du cahier des charges technique
    - Intégration des références au cadre algorithmique dans le texte de loi.
    Étape 4 : Débats Parlementaires et Modifications
    - Présentation technique de l'algorithme aux parlementaires
    - Ajustements de l'algorithme en fonction des débats.
    Étape 5 : Promulgation et Mise en Œuvre
    - Déploiement sur la blockchain principale avec un audit de sécurité
    - Lancement d'un programme pilote
    - Mise en place d'un système de suivi et d'ajustement.
    Étape 6 : Opérations de Routine
    - Automatisation des opérations de comptabilité et de décaissement via l'algorithme
    - Maintenance et mises à jour régulières de l'algorithme.
`;

// Fonction utilitaire pour la génération de contenu
async function generateContent(res, prompt) {
    try {
        const chatCompletion = await Groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: "gemma2-9b-it",
            temperature: 0.5,
            stream: false,
        });
        const generatedHtml = chatCompletion.choices[0]?.message?.content || "Erreur de génération.";
        res.send(generatedHtml);
    } catch (error) {
        console.error("Erreur lors de la génération du contenu :", error);
        res.status(500).send("Erreur lors de la génération du contenu.");
    }
}

// Les chemins statiques sont gérés par le serveur principal
// Les middlewares comme cors et body-parser sont aussi gérés par le serveur principal

// Routes pour les pages dédiées (maintenant des routes API qui renvoient du HTML)
router.get('/cvnu', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cvnu.html'));
});

router.get('/smart_contracts', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'smart_contracts.html'));
});

router.get('/circular_economy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'circular_economy.html'));
});

router.get('/developpement', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'developpement.html'));
});

// Routes pour générer le contenu de chaque page
router.get('/generate/cvnu', async (req, res) => {
    const prompt = `Génère une présentation détaillée du Curriculum Vitae Numérique Universel (CVNU) en te basant sur le texte de loi. Explique son rôle, comment il est alimenté et validé, et pourquoi il est central à la réforme. Le rendu doit être uniquement en HTML.
    Texte de référence : ${lawCorpus}`;
    await generateContent(res, prompt);
});

router.get('/generate/smart-contracts', async (req, res) => {
    try {
        const solFilesResponse = await axios.get(`${SMART_CONTRACT_API_URL}/sol-files`);
        const solFiles = solFilesResponse.data.map(file => `<li>${file}</li>`).join('');

        const prompt = `Génère une présentation détaillée des Smart Contracts dans le cadre du projet de loi. Définis ce que c'est et comment ils assurent la sécurité, la transparence et l'automatisation des transactions financières. Le rendu doit être uniquement en HTML. Fais référence aux fichiers Solidity suivants : <ul>${solFiles}</ul>`;
        await generateContent(res, prompt);
    } catch (error) {
        console.error("Erreur lors de la génération du contenu des smart contracts:", error);
        res.status(500).send("Erreur lors de la génération du contenu.");
    }
});
router.get('/generate/circular-economy', async (req, res) => {
    const prompt = `Génère une présentation détaillée du modèle d'économie circulaire basé sur la TVA. Décris le processus de collecte, de décaissement et de redistribution des recettes de la TVA. Utilise un tableau HTML. Le rendu doit être uniquement en HTML.
    Texte de référence : ${lawCorpus}`;
    await generateContent(res, prompt);
});

router.get('/generate/etude-impact-economique', async (req, res) => {
    const prompt = `
        Rédige une ébauche d'étude d'impact économique pour ce projet de loi en te basant sur le texte de loi et les objectifs suivants :
        - Le financement d'un revenu digne (entre 500€ et 5000€) via la valeur du CVNU et non le métier.
        - La valeur du CVNU et le montant de l'allocation universelle dépendent intégralement du niveau de formation, de qualification et d'expérience professionnelle validée.
        - Le financement est basé sur un "certificat cvnu.sol" et non sur la monétisation des compétences en soi.
        - L'impact sur le chômage, la précarité et la pauvreté est majeur.
        - Le financement par la sociabilisation des recettes de la TVA s'inscrit dans un modèle d'économie circulaire.

        Le rendu doit être uniquement en HTML et doit inclure :
        1.  Une introduction textuelle qui expose clairement ces objectifs et la logique du "certificat cvnu.sol".
        2.  Un tableau HTML présentant des données fictives sur 5 ans pour la valeur moyenne du CVNU et la réduction de la précarité.
        3.  Deux balises <canvas> avec des IDs uniques et obligatoires : "cvnuValueChart" et "povertyReductionChart".
        4.  Un bloc de code JSON (<script type="application/json">) qui contient les données des graphiques. Cet objet JSON doit avoir une structure stricte, avec deux clés de niveau supérieur, "cvnu" et "pauvreté". Chacune doit contenir un sous-objet "data" avec les clés "labels" et "datasets". Les données à utiliser pour les graphiques doivent refléter la progression du certificat cvnu.sol au fil du temps et son impact sur la société :
            - **Graphique Ligne (Valeur du CVNU)** :
                - Labels : ['Année 0 (16 ans)', 'Année 1', 'Année 2', 'Année 3', 'Année 4']
                - Données (valeur moyenne du CVNU en €) : [800, 1200, 2000, 3500, 5000]
            - **Graphique Barres (Réduction de la Pauvreté)** :
                - Labels : ['Année 0', 'Année 1', 'Année 2', 'Année 3', 'Année 4']
                - Données (pourcentage de réduction de la précarité/pauvreté) : [0, 5, 15, 30, 50]
        5.  Une conclusion textuelle qui résume les bénéfices de cette approche, en liant le financement vertueux (TVA, économie circulaire) aux résultats sur le "certificat cvnu.sol" et la dignité citoyenne.
        
        Texte de référence : ${lawCorpus}
        Articles du projet : ${lawArticles}
    `;
    await generateContent(res, prompt);
});

router.get('/generate-law-content', async (req, res) => {
    const audience = req.query.audience || 'detailed_presentation';
    let promptInstruction;
    
    switch (audience) {
        case 'detailed_presentation':
            promptInstruction = `Génère un résumé exécutif de 3 points clés, suivi d'une présentation détaillée et structurée de la réforme en te basant sur le texte de référence et les articles suivants. Le rendu doit être uniquement en HTML.
            Texte de référence : ${lawCorpus}
            Articles du projet : ${lawArticles}`;
            break;
        case 'detailed_development_plan':
            promptInstruction = `Rédige un plan de développement étape par étape pour la mise en œuvre de l'algorithme de promulgation du projet de loi, en te basant sur les étapes suivantes. Le plan doit être clair, hiérarchisé et facile à comprendre. Le rendu doit être uniquement en HTML.
            Voici le plan de développement : ${detailedDevelopmentPlan}`;
            break;
        case 'public_general':
            promptInstruction = `Crée une présentation simple et accessible pour le grand public. Explique les concepts complexes avec des termes clairs et des analogies simples, en te basant sur le texte de référence et les articles de loi. Le rendu doit être uniquement en HTML.
            Texte de référence : ${lawCorpus}
            Articles du projet : ${lawArticles}`;
            break;
        case 'politicians':
            promptInstruction = `Rédige un argumentaire pour un public de politiciens. Mets en avant les bénéfices économiques, l'innovation, la compétitivité internationale, et les impacts sociaux positifs de la réforme, en te basant sur le texte de référence et les articles de loi. Commence par un résumé exécutif des principaux avantages. Le rendu doit être uniquement en HTML.
            Texte de référence : ${lawCorpus}
            Articles du projet : ${lawArticles}`;
            break;
        case 'swot':
            promptInstruction = `Génère une analyse SWOT (Forces, Faiblesses, Opportunités, Menaces) détaillée du projet de loi en te basant sur le texte de référence et les articles fournis. Le texte doit être structuré en HTML avec des titres et des listes.
            Texte de référence : ${lawCorpus}
            Articles du projet : ${lawArticles}`;
            break;
        case 'ai-impact':
            promptInstruction = `Analyse l'impact de l'intelligence artificielle sur ce projet de loi. Comment l'IA pourrait-elle être utilisée comme une opportunité et quelle menace pourrait-elle représenter ? Rédige le contenu uniquement en HTML, en te basant sur le texte de référence et les articles de loi.
            Texte de référence : ${lawCorpus}
            Articles du projet : ${lawArticles}`;
            break;
        case 'pros-cons':
            promptInstruction = `Rédige une liste des avantages et des inconvénients d'un tel projet de loi. Le texte doit être clair, concis, et structuré en deux parties distinctes : "Avantages" et "Inconvénients", sous forme de listes HTML, en te basant sur le texte de référence et les articles de loi.
            Texte de référence : ${lawCorpus}
            Articles du projet : ${lawArticles}`;
            break;
        case 'reference_text':
            res.send(lawCorpus);
            return;
        case 'articles_text':
            res.send(lawArticles);
            return;
        default:
            promptInstruction = `Génère une présentation par défaut de la réforme. Le contenu doit être concis et mettre en évidence les points clés, en te basant sur le texte de référence et les articles de loi. Le rendu doit être uniquement en HTML.
            Texte de référence : ${lawCorpus}
            Articles du projet : ${lawArticles}`;
            break;
    }
    await generateContent(res, promptInstruction);
});

router.post('/save-content', (req, res) => {
    const { content, type } = req.body;
    if (!content || !type) {
        return res.status(400).send('Contenu ou type manquant.');
    }
    const filename = `${type}_${Date.now()}.html`;
    const outputDir = path.join(__dirname, 'output');
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }
    
    fs.writeFile(path.join(outputDir, filename), content, (err) => {
        if (err) {
            console.error('Erreur lors de l\'enregistrement du fichier :', err);
            return res.status(500).send('Erreur lors de l\'enregistrement de la présentation.');
        }
        res.status(200).send({ message: 'Présentation enregistrée avec succès!', filename });
    });
});

router.get('/list-saved-content', (req, res) => {
    const outputDir = path.join(__dirname, 'output');
    fs.readdir(outputDir, (err, files) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(200).json([]);
            }
            console.error('Erreur lors de la lecture du répertoire :', err);
            return res.status(500).send('Erreur lors de la récupération de la liste des fichiers.');
        }
        res.status(200).json(files);
    });
});

// Exportation du routeur pour qu'il puisse être utilisé par le serveur principal
module.exports = router;