import { Door } from './Door.js';
import { Player } from './Player.js';

// Variable globale pour stocker les informations du joueur
let playerInfo = {
  id: null,
  username: null
};

// Liste des joueurs connectés
let connectedPlayers = {};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let mapData = null;
const TILE_SIZE = 60;
let gridData = null;
let doors = {};  // Utiliser un objet au lieu d'un tableau pour faciliter la synchronisation

const localPlayer = new Player(null, 'blue');  // ID sera défini lors de la connexion
const others = {};
const keys = {};

document.addEventListener('keydown', e => { keys[e.key] = true; });
document.addEventListener('keyup', e => { keys[e.key] = false; });

// Établir la connexion WebSocket
let socket = null;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

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
        others[id].x = pos.x;
        others[id].y = pos.y;
      }

      // Synchroniser état des portes
      for (const [key, isOpen] of Object.entries(data.doors)) {
        const [x, y] = key.split(',').map(Number);
        doors[key] = isOpen;
        if (mapData && mapData[y] && mapData[y][x] !== undefined) {
          mapData[y][x] = isOpen ? 0 : 2;
        }
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
            doors[doorKey] = false;
          }
        }
      }

      requestAnimationFrame(gameLoop);
    });
}

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

function drawGrid() {
  for (let y = 0; y < gridData.length; y++) {
    for (let x = 0; x < gridData[y].length; x++) {
      if (gridData[y][x] === 1) ctx.fillStyle = '#333';
      else ctx.fillStyle = '#eee';
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      
      // Dessiner les portes
      if (mapData[y][x] === 2) {
        ctx.fillStyle = '#8B4513'; // Porte fermée (marron)
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
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

let lastTs = performance.now();

function gameLoop(ts) {
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;

  // Vérification des touches
  if (keys[' '] || keys['Space']) {
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

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Ne dessiner le jeu que si la carte est chargée et joueur est connecté
  if (mapData && playerInfo.id) {
    // Gestion de la caméra centrée sur le joueur
    const offsetX = localPlayer.x - canvas.width / 2 + localPlayer.size / 2;
    const offsetY = localPlayer.y - canvas.height / 2 + localPlayer.size / 2;

    ctx.save();
      ctx.translate(-offsetX, -offsetY);
      drawGrid();
      localPlayer.draw(ctx);
      Object.values(others).forEach(p => p.draw(ctx));
    ctx.restore();
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