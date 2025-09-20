// Charger le fichier JSON
fetch('osint.json')
  .then(response => response.json())
  .then(data => {
    const container = document.getElementById('osint-content');
    
    data.OSINT_Methods.forEach(method => {
      // Crée un élément pour chaque catégorie
      const categoryElement = document.createElement('div');
      categoryElement.classList.add('category');
      categoryElement.textContent = method.Category;
      container.appendChild(categoryElement);
      
      // Crée un élément pour chaque algorithme
      method.Algorithms.forEach(algorithm => {
        const algorithmElement = document.createElement('div');
        algorithmElement.classList.add('algorithm');
        
        let content = `Nom: ${algorithm.Name}`;
        
        if (algorithm.Description) {
          content += ` - Description: ${algorithm.Description}`;
        }
        
        if (algorithm.Tools) {
          content += ` - Outils: ${algorithm.Tools.join(', ')}`;
        }
        
        if (algorithm.Examples) {
          content += ` - Exemples: ${algorithm.Examples.join(', ')}`;
        }
        
        algorithmElement.textContent = content;
        container.appendChild(algorithmElement);
      });
    });
  })
  .catch(error => {
    console.error('Erreur lors du chargement du fichier JSON :', error);
  });
