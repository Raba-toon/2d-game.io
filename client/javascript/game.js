// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let mapData = null;
const TILE_SIZE = 60;
let gridData = null;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
fetch('/client/json/matrice1.json')
  .then(res => res.json())
  .then(grille => {
    mapData = grille;
    gridData = grille;
    drawGrid();
    requestAnimationFrame(gameLoop);
  })
  .catch(err => console.error('Erreur chargement grille :', err));

function drawGrid() {
  for (let y = 0; y < gridData.length; y++) {
    for (let x = 0; x < gridData[y].length; x++) {
      const cell = gridData[y][x];
      switch (cell) {
        case 1: ctx.fillStyle = '#333'; break; // mur
        case 2: ctx.fillStyle = 'sienna'; break; // porte fermée
        default: ctx.fillStyle = '#eee';
      }
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
}

const monId = Math.random().toString(36).slice(2,9);
const localPlayer = new Player(monId, 'blue');
const others = {};
const keys = {};

document.addEventListener('keydown', e => { keys[e.key] = true; });
document.addEventListener('keyup',   e => { keys[e.key] = false; });

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);
let lastTs = performance.now();

ws.onopen    = () => requestAnimationFrame(gameLoop);
ws.onmessage = ({data}) => {
  const msg = JSON.parse(data);
  if (msg.type === 'positions') {
    for (const [id, pos] of Object.entries(msg.positions)) {
      if (id === monId) continue;
      if (!others[id]) others[id] = new Player(id, 'red');
      others[id].x = pos.x;
      others[id].y = pos.y;
    }
  }
};
ws.onerror = err => console.error('WS erreur :', err);

function gameLoop(ts) {
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;

  // Gestion ouverture porte
  if (keys[' '] || keys['Space']) {
    const tileX = Math.floor((localPlayer.x + localPlayer.size/2) / TILE_SIZE);
    const tileY = Math.floor((localPlayer.y + localPlayer.size/2) / TILE_SIZE);
    if (mapData[tileY]?.[tileX] === 2) mapData[tileY][tileX] = 0;
    keys[' '] = keys['Space'] = false;
  }

  localPlayer.update(keys, dt, mapData, TILE_SIZE, others);
  localPlayer.sendPosition(ws);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Caméra : on centre le joueur
  const offsetX = localPlayer.x - canvas.width/2 + localPlayer.size/2;
  const offsetY = localPlayer.y - canvas.height/2 + localPlayer.size/2;

  ctx.save();
    ctx.translate(-offsetX, -offsetY);
    drawGrid();
    localPlayer.draw(ctx);
    Object.values(others).forEach(p => p.draw(ctx));
  ctx.restore();

  requestAnimationFrame(gameLoop);
}