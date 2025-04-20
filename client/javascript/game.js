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

const monId       = Math.random().toString(36).slice(2,9);
const localPlayer = new Player(monId, "blue");
const others      = {};

const keys = {};
document.addEventListener("keydown", e => { keys[e.key] = true; });
document.addEventListener("keyup",   e => { keys[e.key] = false; });

const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);

let lastTs = performance.now();
ws.onopen = () => requestAnimationFrame(gameLoop);
ws.onmessage = ({data}) => {
  const msg = JSON.parse(data);
  if (msg.type === "positions") {
    for (const [id, pos] of Object.entries(msg.positions)) {
      if (id === monId) continue;
      if (!others[id]) others[id] = new Player(id, "red");
      others[id].x = pos.x;
      others[id].y = pos.y;
    }
  }
};

ws.onerror = err => console.error("WS erreur :", err);

function gameLoop(ts) {
  const dt = (ts - lastTs)/1000;
  lastTs = ts;

  localPlayer.update(keys, dt);
  localPlayer.sendPosition(ws);

  ctx.clearRect(0,0,canvas.width,canvas.height);
  localPlayer.draw();
  Object.values(others).forEach(p => p.draw());

  requestAnimationFrame(gameLoop);
}
