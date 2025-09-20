const fs = require("fs");
const Groq = require("groq-sdk");
const groq = new Groq();
const db = new Groq({});

async function main() {
  // Liste des CTFs avec leurs détails

   const CTF = [
    {
      "CTF": "R2D2",
      "id": 3,
      "title": "R2D2 - adapte un radar.com",
      "Description": "Histoire d'Alicia, une intelligence artificielle résidant dans un radar, qui lutte contre l'évasion fiscale et les infractions routières en s'appuyant sur la déontologie et les principes anthropiques.",
      "objective": "Étudier le cas d'Alicia, analyser son impact sur la prévention des accidents de la route et de la fraude fiscale, puis proposer des solutions pour promouvoir la justice sociale en encourageant l'adoption de radars et d'IA dédiés à ces causes.",
      "tasks": [
        "Comprendre le rôle d'Alicia dans l'enquête d'affaires d'évasion fiscale et de prévention des infractions routières.",
        "Évaluer l'efficacité d'Alicia en tant qu'IA et son impact sur la sécurité routière et la lutte contre la fraude fiscale.",
        "Identifier les meilleures pratiques pour encourager l'adoption de radars et d'IA, comme Alicia, pour renforcer la justice sociale et la prévention.",
        "Proposer des recommandations et un plan d'action pour la mise en œuvre d'une stratégie de prévention reposant sur l'utilisation d'IA dans les radars et l'encouragement à l'adoption de ces technologies."
      ],
      "phases": [
        "Analyse - Collecte et étude des données et informations disponibles sur Alicia, sa fonction et son impact sur la justice sociale et la prévention.",
        "Étude de cas - Examen approfondi de l'utilisation d'Alicia dans les enquêtes et la prévention, en identifiant les points forts et les domaines d'amélioration.",
        "Documentation - Rédaction d'un rapport présentant les conclusions de l'étude de cas, les recommandations et le plan d'action pour une stratégie de prévention reposant sur l'IA et l'adoption de radars."
      ]
    }
  ]

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

const R2D2 = "l'intelligence artificielle au service de la justice Pour défendre les victimes de la répression financière Et l'Évasion Fiscale"    
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