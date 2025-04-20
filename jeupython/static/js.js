// → Récupération du canvas
const canvas = document.getElementById("game");
const ctx    = canvas.getContext("2d");

// → Identifiant unique pour ce joueur
const monId = Math.random().toString(36).substring(2,9);

// → Position et vitesse (en pixels par seconde)
let x = 50, y = 50;
const speed = 120;  // équivaut environ à 2px * 60fps = 120px/s

// → Stockage des positions des autres joueurs
const others = {};  // { autreId: { x, y } }

// → Gestion des touches
const keys = {};
document.addEventListener("keydown", e => { keys[e.key] = true; });
document.addEventListener("keyup",   e => { keys[e.key] = false; });

// → WebSocket
const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);

ws.onopen = () => {
  console.log("WS ouvert, monId =", monId);
  // initialise le timestamp pour le premier frame
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

// → Envoie de MA position au serveur
function sendPosition() {
  ws.send(JSON.stringify({
    type: "position",
    id: monId,
    x: x,
    y: y
  }));
}

// → Boucle principale avec delta‑time
let lastTs = 0;
function gameLoop(ts) {
  // 1) Calcul du delta time (en secondes)
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;

  // 2) Mise à jour de MA position selon les touches et dt
  if (keys["ArrowUp"])    y -= speed * dt;
  if (keys["ArrowDown"])  y += speed * dt;
  if (keys["ArrowLeft"])  x -= speed * dt;
  if (keys["ArrowRight"]) x += speed * dt;

  // 3) Envoi de MA position
  sendPosition();

  // 4) Dessin
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 4a) Mon carré (en bleu)
  ctx.fillStyle = "blue";
  ctx.fillRect(x, y, 20, 20);

  // 4b) Les carrés des autres (en rouge)
  ctx.fillStyle = "red";
  for (const pos of Object.values(others)) {
    ctx.fillRect(pos.x, pos.y, 20, 20);
  }

  // 5) Prochain frame
  requestAnimationFrame(gameLoop);
}
