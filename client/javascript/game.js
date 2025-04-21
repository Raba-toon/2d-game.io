import { Door } from './Door.js';
import { Player } from './Player.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let mapData = null;
const TILE_SIZE = 60;
let gridData = null;
let doors = [];

const monId = Math.random().toString(36).slice(2,9);
const localPlayer = new Player(monId, 'blue');
const others = {};
const keys = {};

document.addEventListener('keydown', e => { keys[e.key] = true; });
document.addEventListener('keyup', e => { keys[e.key] = false; });

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);
let lastTs = performance.now();

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

fetch('/client/json/matrice1.json')
  .then(res => res.json())
  .then(grille => {
    mapData = grille;
    gridData = grille;

    for (let y = 0; y < mapData.length; y++) {
      for (let x = 0; x < mapData[y].length; x++) {
        if (mapData[y][x] === 2) {
          doors.push(new Door(x, y, false));
        }
      }
    }

    drawGrid();
    requestAnimationFrame(gameLoop);
  });

function toggleDoorNearPlayer(player) {
  doors.forEach(door => {
    if (door.isNear(player, TILE_SIZE)) {
      ws.send(JSON.stringify({
        type: "toggleDoor",
        x: door.x,
        y: door.y
      }));
    }
  });
}
  

function drawGrid() {
  for (let y = 0; y < gridData.length; y++) {
    for (let x = 0; x < gridData[y].length; x++) {
      if (gridData[y][x] === 1) ctx.fillStyle = '#333';
      else ctx.fillStyle = '#eee';
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }

  doors.forEach(door => door.draw(ctx, TILE_SIZE));
}

ws.onopen = () => requestAnimationFrame(gameLoop);
ws.onmessage = ({data}) => {
  const msg = JSON.parse(data);

  if (msg.type === 'state') {
    // Positions des joueurs
    for (const [id, pos] of Object.entries(msg.positions)) {
      if (id === monId) continue;
      if (!others[id]) others[id] = new Player(id, 'red');
      others[id].x = pos.x;
      others[id].y = pos.y;
    }

    // Synchroniser état des portes
    doors.forEach(door => {
      const key = `${door.x},${door.y}`;
      door.isOpen = msg.doors[key] || false;
      mapData[door.y][door.x] = door.isOpen ? 0 : 2;
    });
  }
};


ws.onerror = err => console.error('WS erreur :', err);

function gameLoop(ts) {
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;

  // Vérification des touches (ici c'est sécurisé)
  if (keys[' '] || keys['Space']) {
    toggleDoorNearPlayer(localPlayer);
    keys[' '] = keys['Space'] = false;
  }

  localPlayer.update(keys, dt, mapData, TILE_SIZE, others);
  localPlayer.sendPosition(ws);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Gestion de la caméra centrée sur le joueur
  const offsetX = localPlayer.x - canvas.width / 2 + localPlayer.size / 2;
  const offsetY = localPlayer.y - canvas.height / 2 + localPlayer.size / 2;

  ctx.save();
    ctx.translate(-offsetX, -offsetY);
    drawGrid();
    localPlayer.draw(ctx);
    Object.values(others).forEach(p => p.draw(ctx));
  ctx.restore();

  requestAnimationFrame(gameLoop);
}
