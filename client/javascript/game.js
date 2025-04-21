// game.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let mapData = null;
const TILE_SIZE = 60; // Taille de chaque case en pixels
let gridData = null;

// 1) Charge la grille et démarre la boucle
fetch('/client/json/matrice1.json')
  .then(res => res.json())
  .then(grille => {
    mapData  = grille;
    gridData = grille;
    canvas.width  = grille[0].length * TILE_SIZE;
    canvas.height = grille.length    * TILE_SIZE;

    // draw once immediately
    drawGrid();

    // then start the loop
    requestAnimationFrame(gameLoop);
  })
  .catch(err => console.error("Erreur chargement grille :", err));

// 2) Fonction qui dessine la grille (appelée chaque frame)
function drawGrid() {
  for (let y = 0; y < gridData.length; y++) {
    for (let x = 0; x < gridData[y].length; x++) {
      ctx.fillStyle = gridData[y][x] === 1 ? '#333' : '#eee';
      ctx.fillRect(
        x * TILE_SIZE,
        y * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE
      );
    }
  }
}

// 3) Init WebSocket et joueurs
const monId       = Math.random().toString(36).slice(2,9);
const localPlayer = new Player(monId, "blue");
const others      = {};
const keys = {};
document.addEventListener("keydown", e => { keys[e.key] = true; });
document.addEventListener("keyup",   e => { keys[e.key] = false; });
const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);

ws.onopen    = () => requestAnimationFrame(gameLoop);
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

let lastTs = performance.now();

// 4) Boucle de jeu avec caméra suivie
function gameLoop(ts) {
  // a) delta-time
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;

  // b) mise à jour et envoi de la position
  localPlayer.update(keys, dt, mapData, TILE_SIZE, others);
  localPlayer.sendPosition(ws);

  // c) effacer le canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // d) calcul de l'offset caméra (on centre le joueur)
  const offsetX = localPlayer.x - canvas.width / 2 + localPlayer.size / 2;
  const offsetY = localPlayer.y - canvas.height / 2 + localPlayer.size / 2;

  // e) appliquer la transformation
  ctx.save();
  ctx.translate(-offsetX, -offsetY);

  // f) dessin du monde et des joueurs
  if (gridData) drawGrid();
  localPlayer.draw(ctx);
  Object.values(others).forEach(p => p.draw(ctx));

  // g) restaurer l'état du contexte
  ctx.restore();

  // h) prochaine frame
  requestAnimationFrame(gameLoop);
}