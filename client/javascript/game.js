// game.js avec camera centrée et canvas réactif

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 60;
let mapData = null;

let gridData = null;

// --- Canvas responsive ---
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Charge la map et démarre le jeu ---
fetch('/client/json/matrice1.json')
  .then(res => res.json())
  .then(grille => {
    mapData = grille;
    gridData = grille;
    canvas.width  = grille[0].length * TILE_SIZE;
    canvas.height = grille.length    * TILE_SIZE;

    // draw once immediately
    drawGrid();

    // then start the loop
    requestAnimationFrame(gameLoop);
  })
  .catch(err => console.error("Erreur chargement grille :", err));

// --- Dessine seulement ce que la camera voit ---
function drawGrid(cameraX, cameraY) {
  const rows = gridData.length;
  const cols = gridData[0].length;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const tile = gridData[y][x];
      const screenX = x * TILE_SIZE - cameraX;
      const screenY = y * TILE_SIZE - cameraY;

      if (
        screenX + TILE_SIZE >= 0 && screenX < canvas.width &&
        screenY + TILE_SIZE >= 0 && screenY < canvas.height
      ) {
        ctx.fillStyle = tile === 1 ? '#333' : '#eee';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}

// --- Joueurs et WS ---
const monId = Math.random().toString(36).slice(2, 9);
const localPlayer = new Player(monId, "blue");
const others = {};

const keys = {};
document.addEventListener("keydown", e => { keys[e.key] = true; });
document.addEventListener("keyup",   e => { keys[e.key] = false; });
const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);

let lastTs = performance.now();
ws.onopen = () => requestAnimationFrame(gameLoop);
ws.onmessage = ({ data }) => {
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
ws.onerror = err => console.error("WS erreur :", err);

// --- Boucle principale ---
function gameLoop(ts) {
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;

  localPlayer.update(keys, dt, mapData, TILE_SIZE, others);
  localPlayer.sendPosition(ws);

  const cameraX = localPlayer.x - canvas.width / 2 + localPlayer.size / 2;
  const cameraY = localPlayer.y - canvas.height / 2 + localPlayer.size / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gridData) drawGrid(cameraX, cameraY);

  localPlayer.draw(ctx, cameraX, cameraY);
  Object.values(others).forEach(p => p.draw(ctx, cameraX, cameraY));

  requestAnimationFrame(gameLoop);
}
