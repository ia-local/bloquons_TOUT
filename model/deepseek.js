const fs = require("fs");
const Groq = require("groq-sdk");
const groq = new Groq();

async function main() {
  
  const Model = "deepSeek"; 
  const html = "[]";

  const boostrapCSS = `ttps://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.rtl.min.css" integrity="sha384-gXt9imSW0VcJVHezoNQsP+TNrjYXoGcrqBZJpry9zJt8PCQjobwmhMGaDHTASo9N`;
  const booststrapJS = `"https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM`
  const groqCDN = `https://cdn.jsdelivr.net/npm/groq-js@1.14.2/dist/index.min.js`
  const bootstrap = `${boostrapCSS}+${booststrapJS};`

  const chatCompletion = await groq.chat.completions.create({
    "messages": [
      //  {role: "system", content:"Phase 1: initalisation & brainstormin"},
      {role: 'system',content:`${Model}`},
      {role: 'assistant',content:`nous travaillons actuellement sur un algorithme de génération de contenu au format ${html} Aux normes du Web, sémantique W3C, veuillez attendre les instructions de l'utilisateur`},
      {role: 'user',content:`intégration du CDN ${groqCDN} _&_ ${bootstrap}, pour la programmation du Templet de réponse.html, aux format HTML, respectant les normes du Web sémantique W3C`},
    ],
    model: "deepseek-r1-distill-llama-70b",
    temperature: 0.6,
    max_tokens: 2048,
    top_p: 1,
    stop: null,
    stream: false
}).then((promptCompletion )=>{
    const htmlContent = promptCompletion .choices[0]?.message?.content;
    const outputFilePath = "assistant_" + new Date().toISOString().replace(/[-:TZ]/g, "") + ".html";
    fs.writeFileSync(outputFilePath, htmlContent);
    console.log("✨ Documentation généré et enregistré dans " + outputFilePath);
});
}
main();