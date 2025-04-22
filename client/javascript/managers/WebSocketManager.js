// /src/managers/WebSocketManager.js
import { GAME_SETTINGS } from '../config/settings.js';

export class WebSocketManager {
  constructor(dependencies) {
    this.authService = dependencies.authService;
    this.entityManager = dependencies.entityManager;
    this.mapManager = dependencies.mapManager;
    this.gameStateService = dependencies.gameStateService;
    this.uiManager = dependencies.uiManager || null;
    
    this.socket = null;
    this.connected = false;
    this.messageHandlers = {};
    this.reconnecting = false;
    
    // Enregistrement des handlers de messages
    this.registerMessageHandlers();
  }

  /**
   * Initialise la connexion WebSocket
   * @returns {Promise} Promise résolue lorsque la connexion est établie
   */
  connect() {
    return new Promise((resolve, reject) => {
      // Ne pas recréer une connexion si déjà connecté
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        resolve(this.socket);
        return;
      }
      
      const wsUrl = `${GAME_SETTINGS.wsProtocol}//${window.location.host}${GAME_SETTINGS.wsPath}`;
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log("Connexion WebSocket établie");
        this.connected = true;
        
        // Tentative de reconnexion automatique si des identifiants existent
        if (!this.reconnecting) {
          this.attemptAutoReconnect();
        }
        
        resolve(this.socket);
      };
      
      this.socket.onmessage = this.handleMessage.bind(this);
      
      this.socket.onclose = () => {
        console.log("Connexion WebSocket fermée");
        this.connected = false;
      };
      
      this.socket.onerror = (error) => {
        console.error("Erreur WebSocket:", error);
        reject(error);
      };
    });
  }

  /**
   * Tente une reconnexion automatique avec les identifiants sauvegardés
   */
  attemptAutoReconnect() {
    const savedInfo = this.authService.getSavedPlayerInfo();
    
    if (savedInfo && savedInfo.id && savedInfo.username) {
      console.log("Reconnexion automatique...");
      this.reconnecting = true;
      this.sendMessage({
        type: "reconnect",
        player_id: savedInfo.id,
        username: savedInfo.username
      });
    }
  }

  /**
   * Enregistre les gestionnaires de messages
   */
  registerMessageHandlers() {
    // Réponse de login
    this.registerHandler("login_response", this.handleLoginResponse.bind(this));
    
    // Réponse de reconnexion
    this.registerHandler("reconnect_response", this.handleReconnectResponse.bind(this));
    
    // Liste des joueurs
    this.registerHandler("player_list", this.handlePlayerList.bind(this));
    
    // État du jeu
    this.registerHandler("state", this.handleGameState.bind(this));
  }

  /**
   * Enregistre un gestionnaire pour un type de message
   * @param {string} type - Type de message
   * @param {Function} handler - Fonction de traitement
   */
  registerHandler(type, handler) {
    this.messageHandlers[type] = handler;
  }

  /**
   * Traite un message reçu du serveur
   * @param {MessageEvent} event - Événement message
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      
      // Trouver et exécuter le gestionnaire approprié
      if (data.type && this.messageHandlers[data.type]) {
        this.messageHandlers[data.type](data);
      } else {
        console.warn("Message de type inconnu:", data.type);
      }
    } catch (error) {
      console.error("Erreur lors du traitement du message:", error);
    }
  }

  /**
   * Gère la réponse de login
   * @param {Object} data - Données de réponse
   */
  handleLoginResponse(data) {
    if (data.success) {
      // Stocker les informations du joueur
      this.authService.setPlayerInfo(data.player_id, data.username);
      
      // Initialiser le joueur local
      const localPlayer = this.entityManager.initLocalPlayer(data.player_id);
      
      // Définir la position du joueur si fournie
      if (data.position) {
        localPlayer.x = data.position.x;
        localPlayer.y = data.position.y;
      }
      
      // Cacher le formulaire de login
      if (this.uiManager) {
        this.uiManager.hideLogin();
        this.uiManager.createLogoutButton();
      }
      
      // Charger la carte
      this.mapManager.loadMap();
    } else {
      alert("Échec de la connexion : " + (data.message || "Erreur inconnue"));
    }
    
    this.reconnecting = false;
  }

  /**
   * Gère la réponse de reconnexion
   * @param {Object} data - Données de réponse
   */
  handleReconnectResponse(data) {
    if (data.success) {
      // Stocker les informations du joueur
      this.authService.setPlayerInfo(data.player_id, data.username);
      
      // Initialiser le joueur local
      const localPlayer = this.entityManager.initLocalPlayer(data.player_id);
      
      // Définir la position du joueur si fournie
      if (data.position) {
        localPlayer.x = data.position.x;
        localPlayer.y = data.position.y;
      }
      
      // Cacher le formulaire de login
      if (this.uiManager) {
        this.uiManager.hideLogin();
        this.uiManager.createLogoutButton();
      }
      
      // Charger la carte
      this.mapManager.loadMap();
    } else {
      alert("Échec de la reconnexion : " + (data.message || "Erreur inconnue"));
      
      // Effacer les données en cas d'échec
      this.authService.clearPlayerInfo();
      
      // Afficher le formulaire de login
      if (this.uiManager) {
        this.uiManager.showLogin();
      }
    }
    
    this.reconnecting = false;
  }

  /**
   * Gère la liste des joueurs
   * @param {Object} data - Données de la liste des joueurs
   */
  handlePlayerList(data) {
    this.gameStateService.updatePlayersList(data.players);
  }

  /**
   * Gère l'état du jeu
   * @param {Object} data - Données d'état
   */
  handleGameState(data) {
    // Mettre à jour les positions des joueurs
    for (const [id, pos] of Object.entries(data.positions)) {
      // Ignorer le joueur local
      if (id === this.authService.getPlayerId()) continue;
      
      // Mettre à jour ou créer le joueur distant
      this.entityManager.updateRemotePlayer(id, pos.x, pos.y);
    }

    // Mettre à jour l'état des portes
    this.entityManager.updateDoors(data.doors);
    
    // Mettre à jour la carte en fonction des portes
    for (const [key, isOpen] of Object.entries(data.doors)) {
      const [x, y] = key.split(',').map(Number);
      this.mapManager.updateTile(x, y, isOpen ? 0 : 2);
    }
  }

  /**
   * Envoie un message au serveur
   * @param {Object} message - Message à envoyer
   * @returns {boolean} - True si le message a été envoyé
   */
  sendMessage(message) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn("Tentative d'envoi avec une connexion fermée");
      return false;
    }
    
    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      return false;
    }
  }

  /**
   * Envoie la position du joueur au serveur
   * @param {Player} player - Joueur dont la position doit être envoyée
   */
  sendPlayerPosition(player) {
    this.sendMessage({
      type: "position",
      x: player.x,
      y: player.y
    });
  }

  /**
   * Envoie une demande d'ouverture/fermeture de porte
   * @param {number} x - Coordonnée X de la porte
   * @param {number} y - Coordonnée Y de la porte
   */
  sendToggleDoor(x, y) {
    this.sendMessage({
      type: "toggleDoor",
      x: x,
      y: y
    });
  }

  /**
   * Envoie une demande de connexion
   * @param {string} username - Nom d'utilisateur
   */
  sendLoginRequest(username) {
    this.sendMessage({
      type: "login",
      username: username
    });
  }

  /**
   * Envoie une demande de déconnexion
   */
  sendLogoutRequest() {
    const playerId = this.authService.getPlayerId();
    if (playerId) {
      this.sendMessage({
        type: "logout",
        player_id: playerId
      });
    }
  }
}