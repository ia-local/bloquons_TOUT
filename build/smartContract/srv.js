// Importation des modules nécessaires
const express = require('express');
const path = require('path');
const IA = require('groq-sdk');
const fs = require('fs');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('api-docs/swagger.yaml');
require('dotenv').config();

const app = express();
const port = 8641;
const Groq = new IA({ apiKey: process.env.GROQ_API_KEY });

// Utilisation du middleware pour les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'output')));

app.use(express.json());
app.use(cors());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Données de référence
const lawArticles = `
    Objectifs de la réforme :
    - Améliorer la valorisation des compétences.
    - Favoriser la formation et la professionnalisation.
    - Encourager l'innovation et la création d'emplois qualifiés.

    Modifications du Code du Travail :
    - Article L3121-1 : Définition du travail pour inclure la monétisation des compétences basée sur le CVNU.
    - Article L4331-1 (nouvel article) : Smart contracts pour la sécurisation et la transparence des transactions liées à la monétisation des compétences.
    - Article L3222-1 : Redéfinition de la durée légale de travail et de sa monétisation.
    - Article L4334-1 : Utilisation de la TVA pour financer la formation et l'emploi en fonction des compétences validées sur le CVNU.
    - Article L4333-1 : Suivi régulier de la répartition des recettes de la TVA.
    - Article L2345-1 (nouvel article) : L'allocation universelle est versée automatiquement tous les 28 jours.
`;

const taxesList = {
    IR: "Impôt sur le revenu",
    RSA: "Revenus salariaux et assimilés",
    RPPM: "Revenus et profits du patrimoine mobilier",
    RFPI: "Revenus fonciers et profits du patrimoine immobilier",
    BA: "Bénéfices agricoles",
    BNC: "Bénéfices non commerciaux",
    BIC: "Bénéfices industriels et commerciaux",
    IS: "Impôt sur les sociétés",
    TVA: "Taxe sur la valeur ajoutée",
    TCA: "Taxes sur le chiffre d'affaires",
    CVAE: "Cotisation sur la Valeur Ajoutée des Entreprises",
    TPS: "Taxes et participations sur les salaires",
    TFP: "Taxes sur les facteurs de production",
    AIS: "Autres impositions sectorielles",
    IF: "Impôts fonciers",
    PAT: "Impôts sur le patrimoine",
    ENR: "Enregistrement",
    TCAS: "Taxe sur les conventions d'assurances et assimilées",
    REC: "Recouvrement",
    DAE: "Droit à l'erreur",
    CF: "Contrôle fiscal",
    CTX: "Contentieux",
    SJ: "Sécurité juridique",
    INT: "Fiscalité internationale",
    CAD: "Cadastre",
    DJC: "Dispositions juridiques communes",
    RES: "Rescrits",
    RIC: "Réseau, Intelligent connecté"
};

// Simulation de l'état du smart contract en mémoire
let tresorerieCompteCampagne = 0;
const citoyensSimules = [];

// Fonction pour générer des compétences aléatoires et progressives
const generateSkills = (baseDescription) => {
    const keywords = baseDescription.toLowerCase().split(/\s*,\s*|\s+/).filter(word => word.length > 2);
    const uniqueKeywords = [...new Set(keywords)];
    
    // Si la description est vide, on retourne des compétences de base
    if (uniqueKeywords.length === 0) {
        return [
            { name: 'Travail d\'équipe', score: 0.5 },
            { name: 'Communication', score: 0.6 },
            { name: 'Résolution de problèmes', score: 0.7 }
        ];
    }

    const skills = uniqueKeywords.map(keyword => {
        // Logique simplifiée pour attribuer un score de compétence
        const score = Math.random() * 0.5 + 0.5; // Score entre 0.5 et 1.0
        return { name: keyword.charAt(0).toUpperCase() + keyword.slice(1), score: parseFloat(score.toFixed(2)) };
    });
    
    return skills;
};

// Fonction pour calculer l'allocation en fonction des compétences
const calculateAllocation = (skills) => {
    if (!skills || skills.length === 0) {
        return 500; // Allocation de base
    }
    const totalScore = skills.reduce((sum, skill) => sum + skill.score, 0);
    const averageScore = totalScore / skills.length;
    // L'allocation progressive est basée sur le score moyen
    // Minimum 500€, Maximum 5000€
    return Math.round(500 + (averageScore * 4500));
};

// Routes de l'API
app.post('/api/generate-cv', async (req, res) => {
    const { numeroFiscal, descriptionMetier } = req.body;

    if (!numeroFiscal || !descriptionMetier) {
        return res.status(400).json({ success: false, message: 'Le numéro fiscal et la description sont requis.' });
    }

    try {
        const skills = generateSkills(descriptionMetier);
        const allocation = calculateAllocation(skills);
        const age = Math.floor(Math.random() * 40) + 20; // Âge aléatoire entre 20 et 60 ans

        const newCitizen = {
            numeroFiscal,
            descriptionMetier,
            age,
            skills,
            allocation,
        };

        const existingCitizenIndex = citoyensSimules.findIndex(c => c.numeroFiscal === numeroFiscal);
        if (existingCitizenIndex > -1) {
            citoyensSimules[existingCitizenIndex] = newCitizen;
        } else {
            citoyensSimules.push(newCitizen);
        }

        res.json({
            citoyen: `Citoyen de ${newCitizen.age} ans`,
            numeroFiscal: newCitizen.numeroFiscal,
            allocation: newCitizen.allocation,
            age: newCitizen.age,
            skills: newCitizen.skills,
            detailsReforme: {
                objectifs: lawArticles.split('\n').filter(line => line.includes('- ')).map(line => line.trim().substring(2)),
                modifications: {
                    L3121_1: 'Définition du travail pour inclure la monétisation des compétences basée sur le CVNU.',
                    L4331_1: 'Smart contracts pour la sécurisation et la transparence des transactions liées à la monétisation des compétences.',
                    L3222_1: 'Redéfinition de la durée légale de travail et de sa monétisation.'
                },
                reference_cgi: {
                    article: 'Article L4334-1'
                }
            }
        });

    } catch (error) {
        console.error("Erreur lors de la génération du CV:", error);
        res.status(500).json({ success: false, message: "Erreur lors de la génération du CV." });
    }
});

app.post('/api/collect-tva', (req, res) => {
    const amount = req.body.amount || 1000;
    tresorerieCompteCampagne += amount;
    res.json({ success: true, message: `Collecte de ${amount}€ effectuée. Trésorerie actuelle : ${tresorerieCompteCampagne}€` });
});

app.get('/api/decaisser-allocations', (req, res) => {
    let totalVerse = 0;
    const allocationsVersees = [];

    citoyensSimules.forEach(citoyen => {
        if (tresorerieCompteCampagne >= citoyen.allocation) {
            tresorerieCompteCampagne -= citoyen.allocation;
            totalVerse += citoyen.allocation;
            allocationsVersees.push({ numeroFiscal: citoyen.numeroFiscal, montant: citoyen.allocation });
        }
    });

    res.json({
        success: true,
        message: 'Décaissement des allocations réussi.',
        totalVerse,
        tresorerieRestante: tresorerieCompteCampagne,
        allocations: allocationsVersees,
    });
});

app.get('/api/contract-state', (req, res) => {
    res.json({
        tresorerie: tresorerieCompteCampagne,
        nombreCitoyens: citoyensSimules.length,
    });
});

app.get('/api/dashboard-data', (req, res) => {
    const recettesTVA = tresorerieCompteCampagne;
    const depenses = citoyensSimules.reduce((sum, citoyen) => sum + citoyen.allocation, 0);

    const distributionAllocation = citoyensSimules.reduce((acc, citoyen) => {
        const tranche = Math.floor(citoyen.allocation / 1000) * 1000;
        acc[tranche] = (acc[tranche] || 0) + 1;
        return acc;
    }, {});

    res.json({
        totalRecettes: recettesTVA,
        totalDepenses: depenses,
        recettesParSource: {
            TVA: recettesTVA,
            Autres: 0,
        },
        nombreBeneficiaires: citoyensSimules.length,
        distributionAllocation,
        tresorerie: tresorerieCompteCampagne,
    });
});

app.get('/api/taxes', (req, res) => {
    res.json(taxesList);
});

app.get('/api/redistribution', async (req, res) => {
    try {
        const recettesFiscalesTotales = tresorerieCompteCampagne;
        const nombreCVNUActifs = citoyensSimules.length;
        
        const chatCompletion = await Groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: `Expliquez le processus de décaissement et de redistribution de la Taxe sur la Valeur Ajoutée (TVA) pour financer le Curriculum Vitae Numérique Universel (CVNU). Précisez que la redistribution est effectuée de manière automatisée via des smart contracts et que le montant alloué à chaque citoyen (entre 500 et 5000€) dépend de ses compétences enregistrées. Le montant total des recettes est de ${recettesFiscalesTotales}€ pour ${nombreCVNUActifs} bénéficiaires.`
                }
            ],
            model: "gemma2-9b-it",
            temperature: 0.2,
            max_tokens: 2048,
            top_p: 1,
            stream: false
        });

        const texteExplicatif = chatCompletion.choices[0]?.message?.content || "Impossible de générer l'explication. Veuillez réessayer.";

        res.json({
            statut: "Opération réussie",
            recettesTotales: recettesFiscalesTotales,
            nombreBeneficiaires: nombreCVNUActifs,
            explicationIA: texteExplicatif
        });

    } catch (error) {
        console.error("Erreur lors de la requête à l'API Groq:", error);
        res.status(500).json({ erreur: "Erreur lors de la génération de l'explication AI." });
    }
});

// Route pour enregistrer le contenu
app.post('/save-content', (req, res) => {
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

// Nouvelle route pour lister les fichiers sauvegardés
app.get('/list-saved-content', (req, res) => {
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


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
    console.log(`Documentation de l'API disponible sur http://localhost:${port}/api-docs`);
});
