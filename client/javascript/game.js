const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let mapData = null;
const TILE_SIZE = 60; // Taille de chaque case en pixels

fetch('/client/json/matrice1.json')
  .then(res => res.json())
  .then(grille => {
    mapData = grille; 
    drawGrid(grille);
  });

function drawGrid(grille) {
  for (let y = 0; y < grille.length; y++) {
    for (let x = 0; x < grille[y].length; x++) {
      const val = grille[y][x];

      if (val === 1) {
        ctx.fillStyle = '#333'; // mur
      } else {
        ctx.fillStyle = '#eee'; // sol
      }

      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
}

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

  localPlayer.update(keys, dt, mapData);
  localPlayer.sendPosition(ws);

  ctx.clearRect(0,0,canvas.width,canvas.height);
  localPlayer.draw();
  Object.values(others).forEach(p => p.draw());

  requestAnimationFrame(gameLoop);
}
