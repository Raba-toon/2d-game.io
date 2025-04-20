fetch('/client/json/matrice1.json')
  .then(res => res.json())
  .then(grille => {
    // Créer dynamiquement le conteneur de la grille
    const grilleDiv = document.createElement('div');
    grilleDiv.classList.add('grille');

    // Générer les cases à partir de la matrice
    grille.forEach((ligne, y) => {
      ligne.forEach((valeur, x) => {
        const caseDiv = document.createElement('div');
        caseDiv.classList.add('case');
        caseDiv.classList.add(valeur === 1 ? 'mur' : 'sol');
        grilleDiv.appendChild(caseDiv);
      });
    });

    // Ajouter la grille dans le <body>
    document.body.appendChild(grilleDiv);
  })
  .catch(err => console.error("Erreur chargement grille :", err));

const monId = Math.random().toString(36).substring(2,9);
const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);

ws.onopen = () => {
  console.log("WS ouvert, monId =", monId);
  lastTs = performance.now();
  requestAnimationFrame(gameLoop);
};

ws.onmessage = ({ data }) => {
  const msg = JSON.parse(data);
  if (msg.type === "positions") {
    Object.assign(others, msg.positions);
    delete others[monId];
  }
};

ws.onerror = err => console.error("WS erreur :", err);

function gameLoop(ts) {
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;

  requestAnimationFrame(gameLoop);
}