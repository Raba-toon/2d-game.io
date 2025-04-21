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

    // then start the loop (no darkness, just grid+players)
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

// 3) Ton init WebSocket et players restent inchangés...
const monId       = Math.random().toString(36).slice(2,9);
const localPlayer = new Player(monId, "blue");
const others      = {};

const keys = {};
document.addEventListener("keydown", e => { keys[e.key] = true; });
document.addEventListener("keyup",   e => { keys[e.key] = false; });

const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);

let lastTs = performance.now();
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

// 4) Boucle de jeu
function gameLoop(ts) {
  // 1) compute delta‑time
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;

  // 2) update + send your player
  localPlayer.update(keys, dt, mapData, TILE_SIZE);
  localPlayer.sendPosition(ws);

  // 3) clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 4) draw the grid each frame
  if (gridData) drawGrid();

  // 5) draw local player + others
  localPlayer.draw(ctx);
  Object.values(others).forEach(p => p.draw(ctx));

  // 6) schedule next frame
  requestAnimationFrame(gameLoop);
}


