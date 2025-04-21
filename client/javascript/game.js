/* game.js – version "halo de lumière" */
import { Door } from './Door.js';
import { Player } from './Player.js';
import { HidingSpot } from './Hide.js';

// Variable globale pour stocker les informations du joueur
let playerInfo = {
  id: null,
  username: null
};

// Liste des joueurs connectés
let connectedPlayers = {};

/* ──────────────────────────────────
   Canvas principaux
   ────────────────────────────────── */
const gameCan = document.getElementById('gameCanvas');
const gameCtx = gameCan.getContext('2d');

const lightCan = document.getElementById('lightCanvas'); // <-- overlay
const lightCtx = lightCan.getContext('2d');

/* ──────────────────────────────────
   Constantes & état
   ────────────────────────────────── */
const TILE_SIZE = 60;
const LIGHT_RADIUS = 180;          // vision ≈ 3 cases

let mapData = null;
let gridData = null;
let doors = {};  // Utiliser un objet au lieu d'un tableau pour faciliter la synchronisation
let hidingSpots = {};

const localPlayer = new Player(null, 'blue');  // ID sera défini lors de la connexion
const others = {};
const keys = {};

/* ──────────────────────────────────
   Gestion clavier
   ────────────────────────────────── */
document.addEventListener('keydown', e => { keys[e.key] = true; });
document.addEventListener('keyup', e => { keys[e.key] = false; });

/* ──────────────────────────────────
   Resize canvases
   ────────────────────────────────── */
function resizeCanvas() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  gameCan.width = lightCan.width = w;
  gameCan.height = lightCan.height = h;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/* ──────────────────────────────────
   WebSocket connection
   ────────────────────────────────── */
let socket = null;
let lastTs = performance.now();

const connectWebSocket = () => {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
  socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log("Connexion WebSocket établie");
    
    // Vérifier si l'utilisateur a déjà une session sauvegardée
    const savedPlayerInfo = localStorage.getItem('playerInfo');
    if (savedPlayerInfo) {
      try {
        const parsed = JSON.parse(savedPlayerInfo);
        // Réutiliser les identifiants sauvegardés pour se reconnecter
        if (parsed.id && parsed.username) {
          console.log("Reconnexion automatique...");
          socket.send(JSON.stringify({
            type: "reconnect",
            player_id: parsed.id,
            username: parsed.username
          }));
        }
      } catch (e) {
        console.error("Erreur lors de la lecture des données sauvegardées:", e);
        localStorage.removeItem('playerInfo');
        setup_login();
      }
    }
  };

  document.addEventListener('keydown', e => {
    keys[e.key] = true;
  
    // 🔆 Toggle lampe quand on appuie sur "f" ou "F"
    if ((e.key === 'f' || e.key === 'F') && playerInfo.id) {
      // inversion côté client (latence quasi nulle)
      localPlayer.lightOn = !localPlayer.lightOn;
  
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "toggleLight" }));
      }
    }
  });
  document.addEventListener('keyup', e => { keys[e.key] = false; });
  
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    // Traiter la réponse de login ou de reconnexion
    if (data.type === "login_response" || data.type === "reconnect_response") {
      if (data.success) {
        // Stocker les infos du joueur
        playerInfo.id = data.player_id;
        playerInfo.username = data.username;
        localPlayer.id = data.player_id;
        
        // Sauvegarder dans le localStorage
        localStorage.setItem('playerInfo', JSON.stringify(playerInfo));
        
        console.log("Connexion réussie !", playerInfo);
        
        // Cacher le login et démarrer le jeu
        const loginFrame = document.getElementById('frame_login');
        if (loginFrame) {
          loginFrame.style.display = "none";
        }
        
        // Ajouter le bouton de déconnexion s'il n'existe pas déjà
        if (!document.getElementById('logout-button')) {
          createLogoutButton();
        }
        
        // Charger la carte
        loadMap();
      } else {
        alert("Échec de la connexion : " + (data.message || "Erreur inconnue"));
        // Effacer les données en cas d'échec de reconnexion
        if (data.type === "reconnect_response") {
          localStorage.removeItem('playerInfo');
        }
      }
    }
    
    // Traiter la liste des joueurs connectés
    if (data.type === "player_list") {
      connectedPlayers = data.players;
      updatePlayersList();
    }
    
    // Traiter l'état du jeu (positions des joueurs et portes)
    if (data.type === "state") {
      // Positions des joueurs
      for (const [id, pos] of Object.entries(data.positions)) {
        if (id === playerInfo.id) continue;
        if (!others[id]) others[id] = new Player(id, 'red');
        others[id].setPositionFromServer(pos.x, pos.y);
      }

      // Synchroniser état des portes
      for (const [key, isOpen] of Object.entries(data.doors)) {
        const [x, y] = key.split(',').map(Number);
        doors[key] = isOpen;
        if (mapData && mapData[y] && mapData[y][x] !== undefined) {
          mapData[y][x] = isOpen ? 0 : 2;
        }
      }
      if (data.lights) {
        Object.entries(data.lights).forEach(([id, isOn]) => {
          if (id === playerInfo.id) {
            localPlayer.lightOn = isOn;
          } else {
            if (!others[id]) others[id] = new Player(id, 'red');
            others[id].lightOn = isOn;
          }
        });
      }
    }
  };
  
  socket.onclose = () => {
    console.log("Connexion WebSocket fermée");
  };
  
  socket.onerror = (error) => {
    console.error("Erreur WebSocket:", error);
  };
};

/* ──────────────────────────────────
   Chargement de la map & portes
   ────────────────────────────────── */
function loadMap() {
  fetch('/client/json/matrice1.json')
    .then(res => res.json())
    .then(grille => {
      mapData = grille;
      gridData = grille;

      for (let y = 0; y < mapData.length; y++) {
        for (let x = 0; x < mapData[y].length; x++) {
          if (mapData[y][x] === 2) {
            const doorKey = `${x},${y}`;
            doors[doorKey] = new Door(x, y, false);
          }
          if (mapData[y][x] === 3) {
            const key = `${x},${y}`;
            hidingSpots[key] = new HidingSpot(x, y);
          }
        }
      }

      requestAnimationFrame(gameLoop);
    });
}

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
  
  // Dessiner les portes
  for (const key in doors) {
    const [x, y] = key.split(',').map(Number);
    const door = doors[key];
    if (door instanceof Door) {
      door.draw(ctx, TILE_SIZE);
    } else {
      // Si on n'a pas d'objet Door, on dessine une porte basique
      const isOpen = door === true;
      if (!isOpen) {
        ctx.fillStyle = '#8B4513'; // Porte fermée (marron)
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  // 🌿 Dessiner les cachettes
  for (const key in hidingSpots) {
    hidingSpots[key].draw(ctx, TILE_SIZE);
  }
}

/* ──────────────────────────────────
   Halo de lumière sur overlay
   ────────────────────────────────── */
   function renderLighting(offsetX, offsetY) {
    lightCtx.globalCompositeOperation = "source-over";
    lightCtx.fillStyle = "black";
    lightCtx.fillRect(0,0, lightCan.width, lightCan.height);
  
    lightCtx.globalCompositeOperation = "destination-out";
    lightCtx.fillStyle = "white";
  
    [localPlayer, ...Object.values(others)].forEach(p => {
      if (!p.lightOn) return;          // 🔆 on ne dessine pas s’il est éteint
      const cx = p.x - offsetX + p.size/2;
      const cy = p.y - offsetY + p.size/2;
      lightCtx.beginPath();
      lightCtx.arc(cx, cy, LIGHT_RADIUS, 0, Math.PI*2);
      lightCtx.fill();
    });
  }

/* ──────────────────────────────────
   Intéraction portes
   ────────────────────────────────── */
function toggleDoorNearPlayer(player) {
  for (const doorKey in doors) {
    const [x, y] = doorKey.split(',').map(Number);
    const doorX = x * TILE_SIZE + TILE_SIZE / 2;
    const doorY = y * TILE_SIZE + TILE_SIZE / 2;
    
    const distance = Math.sqrt(
      Math.pow(player.x - doorX, 2) + 
      Math.pow(player.y - doorY, 2)
    );
    
    if (distance < TILE_SIZE * 1.5) {
      socket.send(JSON.stringify({
        type: "toggleDoor",
        x: x,
        y: y
      }));
      break;
    }
  }
}
function toggleHidingNearPlayer(player) {
  for (const key in hidingSpots) {
    const spot = hidingSpots[key];

    if (spot.isAt(player, TILE_SIZE)) {
      // Si déjà caché → sortir
      if (player.isHidden) {
        player.isHidden = false;
        spot.isOccupied = false;
      } 
      // Sinon → se cacher
      else if (!spot.isOccupied) {
        player.isHidden = true;
        spot.isOccupied = true;
      }

      break; // Un seul spot à la fois
    }
  }
}

// Mise à jour de la liste des joueurs
const updatePlayersList = () => {
  const playersList = document.getElementById('players-list');
  if (playersList) {
    // Vider la liste actuelle
    playersList.innerHTML = '';
    
    // Titre de la liste
    const title = document.createElement('h3');
    title.textContent = 'Joueurs connectés';
    title.style.marginTop = '0';
    title.style.marginBottom = '10px';
    playersList.appendChild(title);
    
    // Ajouter chaque joueur à la liste
    const ul = document.createElement('ul');
    ul.style.listStyleType = 'none';
    ul.style.padding = '0';
    ul.style.margin = '0';
    
    Object.entries(connectedPlayers).forEach(([id, username]) => {
      const li = document.createElement('li');
      li.textContent = username;
      // Mettre en évidence le joueur actuel
      if (id === playerInfo.id) {
        li.style.fontWeight = 'bold';
        li.textContent += ' (vous)';
      }
      li.style.padding = '3px 0';
      ul.appendChild(li);
    });
    
    playersList.appendChild(ul);
  }
};

// Créer et ajouter la liste des joueurs au DOM
const createPlayersList = () => {
  const playersList = document.createElement('div');
  playersList.id = 'players-list';
  
  // Styles pour la boîte
  playersList.style.position = 'absolute';
  playersList.style.top = '10px';
  playersList.style.right = '10px';
  playersList.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  playersList.style.color = 'white';
  playersList.style.padding = '15px';
  playersList.style.borderRadius = '5px';
  playersList.style.minWidth = '150px';
  playersList.style.fontFamily = 'Arial, sans-serif';
  playersList.style.fontSize = '14px';
  playersList.style.zIndex = '1000';
  
  document.body.appendChild(playersList);
  
  // Initialiser avec un contenu vide
  updatePlayersList();
};

// Créer le bouton de déconnexion
const createLogoutButton = () => {
  const logoutButton = document.createElement('button');
  logoutButton.id = 'logout-button';
  logoutButton.textContent = 'Déconnexion';
  
  // Styles pour le bouton
  logoutButton.style.position = 'absolute';
  logoutButton.style.top = '10px';
  logoutButton.style.left = '10px';
  logoutButton.style.padding = '8px 15px';
  logoutButton.style.backgroundColor = '#ff4d4d';
  logoutButton.style.color = 'white';
  logoutButton.style.border = 'none';
  logoutButton.style.borderRadius = '5px';
  logoutButton.style.fontFamily = 'Arial, sans-serif';
  logoutButton.style.fontSize = '14px';
  logoutButton.style.cursor = 'pointer';
  logoutButton.style.zIndex = '1000';
  
  // Effets de survol
  logoutButton.addEventListener('mouseover', () => {
    logoutButton.style.backgroundColor = '#ff3333';
  });
  
  logoutButton.addEventListener('mouseout', () => {
    logoutButton.style.backgroundColor = '#ff4d4d';
  });
  
  // Action de déconnexion
  logoutButton.addEventListener('click', logout);
  
  document.body.appendChild(logoutButton);
};

// Fonction pour se déconnecter
const logout = () => {
  // Informer le serveur de la déconnexion
  if (socket && socket.readyState === WebSocket.OPEN && playerInfo.id) {
    socket.send(JSON.stringify({
      type: "logout",
      player_id: playerInfo.id
    }));
  }
  
  // Nettoyer les données locales
  localStorage.removeItem('playerInfo');
  playerInfo.id = null;
  playerInfo.username = null;
  localPlayer.id = null;
  
  // Supprimer le bouton de déconnexion
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.remove();
  }
  
  // Afficher à nouveau le formulaire de login
  setup_login();
};

// Fonction pour configurer le formulaire de login
const setup_login = () => {
  // Vérifier si le formulaire existe déjà
  if (document.getElementById('frame_login')) {
    document.getElementById('frame_login').style.display = "flex";
    return;
  }
  
  let frame_login = document.createElement('div');
  frame_login.id = 'frame_login';
  
  let input_name = document.createElement('input');
  let button_login = document.createElement('button');
  
  button_login.addEventListener('click', (e) => {
    let username = input_name.value;
    
    if (!username) {
      alert("Veuillez entrer un nom d'utilisateur");
      return;
    }
    
    // Envoyer le nom d'utilisateur au serveur
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "login",
        username: username
      }));
    } else {
      alert("Erreur: Connexion au serveur impossible");
    }
  });

  // Permettre l'envoi en appuyant sur Entrée
  input_name.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      button_login.click();
    }
  });

  button_login.innerText = "Se connecter";
  input_name.placeholder = "Nom d'utilisateur";
  
  frame_login.append(input_name);
  frame_login.append(button_login);
  document.body.append(frame_login);
  
  // Vos styles existants
  frame_login.style.position = "absolute";
  frame_login.style.display = "flex";
  frame_login.style.flexDirection = "column";
  frame_login.style.justifyContent = "space-between";
  frame_login.style.alignItems = "center";
  frame_login.style.padding = "2rem";
  frame_login.style.borderRadius = "1rem";
  frame_login.style.backgroundColor = "rgba(0,0,0,0.5)";
  frame_login.style.top = "50%";
  frame_login.style.left = "50%";
  frame_login.style.transform = "translate(-50%, -50%)";
  frame_login.style.zIndex = "1001"; // S'assurer qu'il est au-dessus des autres éléments
  
  // Ajouter un peu d'espace entre les éléments
  input_name.style.marginBottom = "1rem";
  
  // Focus sur le champ de saisie
  input_name.focus();
};

/* ──────────────────────────────────
   Boucle principale
   ────────────────────────────────── */
function gameLoop(ts) {
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;

  // Vérification des touches
  if (keys[' '] || keys['Space']) {
    toggleHidingNearPlayer(localPlayer);
    toggleDoorNearPlayer(localPlayer);
    keys[' '] = keys['Space'] = false;
  }

  // Ne mettre à jour le joueur local que si connecté
  if (playerInfo.id) {
    localPlayer.update(keys, dt, mapData, TILE_SIZE, others);
    
    // Envoyer la position au serveur
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "position",
        x: localPlayer.x,
        y: localPlayer.y
      }));
    }
  }

  // Clear canvas principal
  gameCtx.clearRect(0, 0, gameCan.width, gameCan.height);

  // Ne dessiner le jeu que si la carte est chargée et joueur est connecté
  if (mapData && playerInfo.id) {
    // Gestion de la caméra centrée sur le joueur
    const offX = localPlayer.x - gameCan.width / 2 + localPlayer.size / 2;
    const offY = localPlayer.y - gameCan.height / 2 + localPlayer.size / 2;

    gameCtx.save();
    gameCtx.translate(-offX, -offY);
    drawGrid(gameCtx);
    localPlayer.draw(gameCtx);

    // animer puis dessiner chaque joueur distant
    Object.values(others).forEach(p => {
      p.animate(dt);
      p.draw(gameCtx);
    });
  gameCtx.restore();


    // Appliquer l'effet de halo de lumière
    renderLighting(offX, offY);
  }

  requestAnimationFrame(gameLoop);
}

// Initialisation
window.addEventListener('load', () => {
  connectWebSocket();
  createPlayersList();
  
  // Si les données de joueur sont déjà dans le localStorage, ne pas afficher le login
  const savedPlayerInfo = localStorage.getItem('playerInfo');
  if (savedPlayerInfo) {
    try {
      const parsed = JSON.parse(savedPlayerInfo);
      if (parsed.id && parsed.username) {
        // Créer directement le bouton de déconnexion
        createLogoutButton();
      } else {
        setup_login();
      }
    } catch (e) {
      setup_login();
    }
  } else {
    setup_login();
    requestAnimationFrame(gameLoop); // Démarrer la boucle de jeu même sans joueur
  }
});