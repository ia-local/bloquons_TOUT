const chronoElement = document.getElementById('temps');
const progressBar = document.getElementById('progress-bar');

let startTime = Date.now();
let intervalId;

function updateChrono() {
  const elapsedTime = Date.now() - startTime;
  const hours = Math.floor(elapsedTime / 3600000);
  const minutes = Math.floor((elapsedTime % 3600000) / 60000);
  const seconds = Math.floor((elapsedTime % 60000) / 1000);

  chronoElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Mise à jour de la barre de progression (exemple avec une animation CSS)
  progressBar.style.width = `${(elapsedTime / (4 * 3600000)) * 100}%`;
}

// Démarrer le chronomètre
intervalId = setInterval(updateChrono, 1000);

// Arrêter le chronomètre après 4 heures (ajuster si besoin)
setTimeout(() => {
  clearInterval(intervalId);
}, 4 * 3600000);