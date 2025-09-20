const fs = require("fs");
const Groq = require("groq-sdk");
const groq = new Groq();
const db = new Groq({});

async function main() {
  // Liste des CTFs avec leurs détails
  const CTF = [
  {
    "id": 3,
    "title": "R2D2 - L'IA au service de la justice sociale",
    "Description": "Histoire d'aliCIA au coeur R2D2 le radar automatique +${Makefile}, une intelligence artificielle résidant dans un radar, qui lutte contre l'évasion fiscale et les infractions routières en s'appuyant sur la déontologie et les principes anthropiques.",
    "objective": "Étudier le cas d'aliCIA, analyser son impact sur la prévention des accidents de la route et de la fraude fiscale, puis proposer des solutions pour promouvoir la justice sociale en encourageant l'adoption de radars et d'IA dédiés à ces causes.",
    "tasks": [
    "Comprendre le rôle d'aliCIA -ia le coeur du radar automatique +${Makefile} R2D2  dans l'enquête d'affaires d'évasion fiscale et de prévention des infractions routières.",
    "Évaluer l'efficacité d'aliCIA en tant qu'IA et son impact sur la sécurité routière et la lutte contre la fraude fiscale.",
    "Identifier les meilleures pratiques pour encourager l'adoption de radars et d'IA, comme aliCIA, pour renforcer la justice sociale et la prévention.",
    "Proposer des recommandations et un plan d'action pour la mise en œuvre d'une stratégie de prévention reposant sur l'utilisation d'IA dans les radars et l'encouragement à l'adoption de ces technologies."
    ],
    "phases": [
    "Analyse - Collecte et étude des données et informations disponibles sur aliCIA, sa fonction et son impact sur la justice sociale et la prévention.",
    "Étude de cas - Examen approfondi de l'utilisation d'aliCIA dans les enquêtes et la prévention, en identifiant les points forts et les domaines d'amélioration.",
    "Documentation - Rédaction d'un rapport présentant les conclusions de l'étude de cas, les recommandations et le plan d'action pour une stratégie de prévention reposant sur l'IA et l'adoption de radars."
    ]
    }
  ];

  // Exemple d'algorithme pour générer la documentation
  for (const ctf of CTF) {
    const ctfDetails = `
# ${ctf.title}
# ${ctf.Description}
**Objectif**: ${ctf.objective}
**Phases**: ${ctf.phases.join(", ")}

## Tâches
${ctf.tasks.map((task, index) => `- ${index + 1}. ${task}`).join("\n")}

---
    `;
  const R2D2 = {
      "CTF": {
        "id": 3,
        "title": "R2D2 - aliCIA L'IA, coeur du RADAR.js R2D2 aux service de la justice sociale 🤖",
        "description": "Histoire d'aliCIA, une IA qui lutte contre l'évasion fiscale et les infractions routières.",
        "objectif": "Étudier le rôle d'aliCIA et son impact sur la prévention et la justice sociale.",
        "phases": ["Analyse", "Étude de cas", "Documentation"],
        "tasks": [
          "Comprendre le rôle d'aliCIA dans la prévention des infractions.",
          "Évaluer son efficacité et son impact.",
          "Proposer des recommandations pour encourager l'adoption de l'IA."
        ],
        "OSINT_Methods": [
          {
            "Category": "Collecte et Extraction de Données",
            "Algorithms": [
              {
                "Name": "Web Scraping",
                "Tools": ["BeautifulSoup", "Scrapy", "Selenium"]
              },
              {
                "Name": "API Calls",
                "Description": "Automatisation des requêtes vers des services et plateformes"
              },
              {
                "Name": "Search Engine Automation",
                "Tools": ["Selenium"]
              }
            ]
          },
          {
            "Category": "Analyse de Texte et Extraction de Motifs",
            "Algorithms": [
              {
                "Name": "Natural Language Processing (NLP)",
                "Tools": ["spaCy", "NLTK"]
              },
              {
                "Name": "Sentiment Analysis",
                "Description": "Analyse des émotions ou opinions exprimées"
              },
              {
                "Name": "Text Clustering",
                "Algorithms": ["K-means", "DBSCAN"]
              }
            ]
          },
          {
            "Category": "Traitement des Données Géospatiales",
            "Algorithms": [
              {
                "Name": "Reverse Geocoding",
                "Description": "Conversion des coordonnées GPS en adresses"
              },
              {
                "Name": "Heatmaps",
                "Tools": ["Leaflet.js", "Google Maps API"]
              }
            ]
          },
          {
            "Category": "Analyse des Réseaux Sociaux",
            "Algorithms": [
              {
                "Name": "Social Network Analysis (SNA)",
                "Description": "Analyse des relations et interactions"
              },
              {
                "Name": "Graph Algorithms",
                "Examples": ["PageRank", "Betweenness Centrality", "Community Detection"]
              }
            ]
          },
          {
            "Category": "Détection de Modèles et Anomalies",
            "Algorithms": [
              {
                "Name": "Machine Learning",
                "Description": "Modèles de classification pour identifier des comportements suspects"
              },
              {
                "Name": "Time Series Analysis",
                "Description": "Détection de tendances et événements inhabituels"
              },
              {
                "Name": "Anomaly Detection",
                "Algorithms": ["Isolation Forest", "Local Outlier Factor (LOF)", "Autoencoders"]
              }
            ]
          },
          {
            "Category": "Fusion et Corrélation des Données",
            "Algorithms": [
              {
                "Name": "Data Fusion Techniques",
                "Description": "Combinaison d'informations de diverses sources"
              },
              {
                "Name": "Entity Resolution",
                "Description": "Identification et fusion d'enregistrements concernant la même entité"
              }
            ]
          },
          {
            "Category": "Visualisation des Données",
            "Algorithms": [
              {
                "Name": "Dashboards",
                "Tools": ["Tableau", "Power BI", "Plotly"]
              },
              {
                "Name": "Graph Visualisation",
                "Tools": ["D3.js", "Gephi"]
              }
            ]
          },
          {
            "Category": "Automatisation et Surveillance Active",
            "Algorithms": [
              {
                "Name": "Alert Systems",
                "Description": "Systèmes d'alerte en temps réel avec règles spécifiques"
              },
              {
                "Name": "Automated Monitoring",
                "Tools": ["RSS feeds", "Scripts de scraping"]
              }
            ]
          }
        ],
        "projectTeam": {
          "Description": "Équipe interdisciplinaire avec des experts en technologie, en déontologie, en anthropisme et en communication pour couvrir tous les aspects de la mission.",
          "Members": [
            "Expert en technologie",
            "Spécialiste en déontologie",
            "Anthropologue",
            "Communicateur"
          ]
        },
        "entropyAnalysis": {
          "Description": "Étude des dilemmes éthiques potentiels liés au radar policier, et identification des meilleures pratiques pour appliquer la déontologie.",
          "Steps": [
            "Analyse des implications éthiques",
            "Définition des meilleures pratiques"
          ]
        },
        "radarDesign": {
          "Description": "Conception d'un radar qui respecte les normes techniques et déontologiques.",
          "Collaboration": "Travail avec des experts en technologie et en sécurité routière"
        },
        "lawEnforcementPartnerships": {
          "Description": "Partenariat avec la police pour définir les besoins opérationnels et les normes éthiques.",
          "Steps": [
            "Identification des standards",
            "Développement des protocoles"
          ]
        },
        "testingAndEvaluation": {
          "Description": "Tester le radar dans des conditions réelles, en évaluant son efficacité et son impact éthique.",
          "Steps": [
            "Tests en conditions réelles",
            "Évaluation des résultats"
          ]
        },
        "deployment": {
          "Description": "Déploiement du radar dans différentes zones avec des règles éthiques strictes.",
          "Communication": "Informer le public pour garantir une utilisation appropriée"
        },
        "continuousImprovement": {
          "Description": "Suivi des performances, collecte des retours et adaptation de la technologie.",
          "Steps": [
            "Collecte des retours",
            "Amélioration continue"
          ]
        }
      }
    }
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          name: "[📔.codex]",
          content: "phase[00]:[DATE]:[initialisation des variables dans contexte D'une enquête parlementaire]",
        },
        {role: "assistant",name: "[📔.codex]",content: `${CTF}+${R2D2}`},
      ],
      model: "gemma2-9b-it",
      temperature: 0.5,
      max_tokens: 2024,
      top_p: 1,
      stop: null,
      stream: false,
    });

    const mdContent = chatCompletion.choices[0]?.message?.content;
    const fileName = `CTF_${ctf.id}_${ctf.title.replace(/ /g, "_")}.md`;
    fs.writeFileSync(fileName, ctfDetails + mdContent);
    console.log(`Documentation générée : ${fileName}`);
  }

  console.log("Toutes les documentations des CTF ont été générées avec succès !");
}

main();