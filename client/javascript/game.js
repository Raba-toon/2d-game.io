/* game.js – version “halo de lumière” */

import { Door }   from "./Door.js";
import { Player } from "./Player.js";

/* ──────────────────────────────────
   Canvas principaux
   ────────────────────────────────── */
const gameCan  = document.getElementById("gameCanvas");
const gameCtx  = gameCan.getContext("2d");

const lightCan = document.getElementById("lightCanvas"); // <-- overlay
const lightCtx = lightCan.getContext("2d");

/* ──────────────────────────────────
   Constantes & état
   ────────────────────────────────── */
const TILE_SIZE   = 60;
const LIGHT_RADIUS = 180;          // vision ≈ 3 cases

let mapData  = null;
let gridData = null;
let doors    = [];

const monId       = Math.random().toString(36).slice(2, 9);
const localPlayer = new Player(monId, "blue");
const others      = {};
const keys        = {};

/* ──────────────────────────────────
   Gestion clavier
   ────────────────────────────────── */
document.addEventListener("keydown", e => (keys[e.key] = true));
document.addEventListener("keyup",   e => (keys[e.key] = false));

/* ──────────────────────────────────
   Resize canvases
   ────────────────────────────────── */
function resizeCanvas() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  gameCan.width  = lightCan.width  = w;
  gameCan.height = lightCan.height = h;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* ──────────────────────────────────
   Chargement de la map & portes
   ────────────────────────────────── */
fetch("/client/json/matrice1.json")
  .then(res => res.json())
  .then(grille => {
    mapData = grille;
    gridData = grille;

    for (let y = 0; y < mapData.length; y++) {
      for (let x = 0; x < mapData[y].length; x++) {
        if (mapData[y][x] === 2) doors.push(new Door(x, y, false));
      }
    }
    requestAnimationFrame(gameLoop);
  });

/* ──────────────────────────────────
   WebSocket positions + portes
   ────────────────────────────────── */
const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const ws       = new WebSocket(`${protocol}://${window.location.host}/ws`);
let lastTs     = performance.now();

ws.onopen = () => requestAnimationFrame(gameLoop);

ws.onmessage = ({ data }) => {
  const msg = JSON.parse(data);

  if (msg.type === "state") {
    /* positions joueurs distants */
    for (const [id, pos] of Object.entries(msg.positions)) {
      if (id === monId) continue;
      if (!others[id]) others[id] = new Player(id, "red");
      others[id].x = pos.x;
      others[id].y = pos.y;
    }
    /* état des portes */
    doors.forEach(d => {
      const k = `${d.x},${d.y}`;
      d.isOpen = msg.doors[k] || false;
      mapData[d.y][d.x] = d.isOpen ? 0 : 2;
    });
  }
};

ws.onerror = err => console.error("WS erreur :", err);

/* ──────────────────────────────────
   Helpers dessin
   ────────────────────────────────── */
function drawGrid(ctx) {
  for (let y = 0; y < gridData.length; y++) {
    for (let x = 0; x < gridData[y].length; x++) {
      ctx.fillStyle = gridData[y][x] === 1 ? "#333" : "#eee";
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
  doors.forEach(d => d.draw(ctx, TILE_SIZE));
}

/* ──────────────────────────────────
   Halo de lumière sur overlay
   ────────────────────────────────── */
function renderLighting(offsetX, offsetY) {
  /* 1) voile noir opaque */
  lightCtx.globalCompositeOperation = "source-over";
  lightCtx.fillStyle = "black";
  lightCtx.fillRect(0, 0, lightCan.width, lightCan.height);

  /* 2) chaque cercle découpe un trou */
  lightCtx.globalCompositeOperation = "destination-out";
  lightCtx.fillStyle = "white";          // opaque ⇒ supprime le noir

  [localPlayer, ...Object.values(others)].forEach(p => {
    const cx = p.x - offsetX + p.size / 2;
    const cy = p.y - offsetY + p.size / 2;

    lightCtx.beginPath();
    lightCtx.arc(cx, cy, LIGHT_RADIUS, 0, Math.PI * 2);
    lightCtx.fill();
  });
}

/* ──────────────────────────────────
   Intéraction portes
   ────────────────────────────────── */
function toggleDoorNearPlayer(player) {
  doors.forEach(d => {
    if (d.isNear(player, TILE_SIZE)) {
      ws.send(JSON.stringify({ type: "toggleDoor", x: d.x, y: d.y }));
    }
  });
}

/* ──────────────────────────────────
   Boucle principale
   ────────────────────────────────── */
function gameLoop(ts) {
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;

  /* interaction porte */
  if (keys[" "] || keys["Space"]) {
    toggleDoorNearPlayer(localPlayer);
    keys[" "] = keys["Space"] = false;
  }

  /* update */
  localPlayer.update(keys, dt, mapData, TILE_SIZE, others);
  localPlayer.sendPosition(ws);

  /* clear canvas principal */
  gameCtx.clearRect(0, 0, gameCan.width, gameCan.height);

  /* caméra centrée */
  const offX = localPlayer.x - gameCan.width / 2 + localPlayer.size / 2;
  const offY = localPlayer.y - gameCan.height / 2 + localPlayer.size / 2;

  gameCtx.save();
    gameCtx.translate(-offX, -offY);
    drawGrid(gameCtx);
    localPlayer.draw(gameCtx);
    Object.values(others).forEach(p => p.draw(gameCtx));
  gameCtx.restore();

  /* overlay lumière */
  renderLighting(offX, offY);

  requestAnimationFrame(gameLoop);
}
