// src/systems/NetworkSystem.js

/**
 * Système responsable de la communication avec le serveur
 */
export class NetworkSystem {
    constructor(gameState, eventEmitter) {
      this.state = gameState;
      this.events = eventEmitter;
      this.socket = null;
      this.isConnected = false;
      this.lastPositionSent = { x: 0, y: 0 };
      this.positionUpdateInterval = 50; // ms entre deux envois de position
      this.lastPositionUpdate = 0;
      
      // Lier les méthodes au contexte
      this.connect = this.connect.bind(this);
      this.disconnect = this.disconnect.bind(this);
      this.login = this.login.bind(this);
      this.logout = this.logout.bind(this);
      this.sendPlayerPosition = this.sendPlayerPosition.bind(this);
      this.setupEventHandlers = this.setupEventHandlers.bind(this);
    }
    
    /**
     * Établit la connexion WebSocket
     * @returns {Promise} - Résout quand la connexion est établie
     */
    connect() {
      return new Promise((resolve, reject) => {
        try {
          const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
          
          this.socket = new WebSocket(wsUrl);
          
          this.socket.onopen = () => {
            console.log("Connexion WebSocket établie");
            this.isConnected = true;
            this.events.emit('network:connected');
            this.setupEventHandlers();
            resolve();
          };
          
          this.socket.onerror = (error) => {
            console.error("Erreur WebSocket:", error);
            this.isConnected = false;
            this.events.emit('network:error', error);
            reject(error);
          };
          
          this.socket.onclose = () => {
            console.log("Connexion WebSocket fermée");
            this.isConnected = false;
            this.events.emit('network:disconnected');
          };
        } catch (error) {
          console.error("Erreur lors de la connexion:", error);
          reject(error);
        }
      });
    }
    
    /**
     * Configure les gestionnaires d'événements WebSocket
     */
    setupEventHandlers() {
      if (!this.socket) return;
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Traiter les différents types de messages
          switch (data.type) {
            case "login_response":
            case "reconnect_response":
              this.handleLoginResponse(data);
              break;
              
            case "player_list":
              this.state.updateConnectedPlayers(data.players);
              break;
              
            case "state":
              this.handleGameState(data);
              break;
              
            default:
              console.warn("Message non reconnu:", data);
          }
        } catch (error) {
          console.error("Erreur lors du traitement d'un message:", error);
        }
      };
    }
    
    /**
     * Gère la réponse de connexion du serveur
     * @param {Object} data - Données de réponse
     */
    handleLoginResponse(data) {
      if (data.success) {
        // Stocker les infos du joueur
        const playerInfo = {
          id: data.player_id,
          username: data.username
        };
        
        this.state.setPlayerInfo(playerInfo);
        
        // Sauvegarder dans le localStorage
        localStorage.setItem('playerInfo', JSON.stringify(playerInfo));
        
        this.events.emit('player:login', playerInfo);
      } else {
        // Échec de la connexion
        if (data.type === "reconnect_response") {
          localStorage.removeItem('playerInfo');
        }
        
        this.events.emit('network:loginFailed', data.message || "Erreur inconnue");
      }
    }
    
    /**
     * Gère l'état du jeu reçu du serveur
     * @param {Object} data - État du jeu
     */
    handleGameState(data) {
      // Mettre à jour les positions des joueurs
      if (data.positions) {
        this.state.updatePlayersPositions(data.positions);
      }
      
      // Mettre à jour l'état des portes
      if (data.doors) {
        this.state.updateDoorsState(data.doors);
      }
      
      // Mettre à jour l'état des lumières
      if (data.lights) {
        this.state.updateLightsState(data.lights);
      }
      
      // Mettre à jour l'état des joueurs cachés
      if (data.hidden) {
        this.state.updateHiddenPlayers(data.hidden);
      }

      // Gérer les positions des chasseurs
      if (data.hunters) {
        // Mise à jour des positions
        for (const [id, pos] of Object.entries(data.hunters)) {
        if (!this.state.hunters[id]) {
            this.state.addHunter(id);
        }
        this.state.hunters[id].x = pos.x;
        this.state.hunters[id].y = pos.y;
        this.state.hunters[id].carriedPlayer = pos.carrying || null;
        }
      }
    }
    
    /**
     * Vérifie si des identifiants sont stockés localement
     * @returns {boolean} - True si des identifiants sont stockés
     */
    hasStoredCredentials() {
      const savedPlayerInfo = localStorage.getItem('playerInfo');
      if (!savedPlayerInfo) return false;
      
      try {
        const parsed = JSON.parse(savedPlayerInfo);
        return !!(parsed.id && parsed.username);
      } catch (e) {
        console.error("Erreur lors de la lecture des données sauvegardées:", e);
        localStorage.removeItem('playerInfo');
        return false;
      }
    }
    
    /**
     * Tente de se reconnecter avec les identifiants stockés
     */
    attemptReconnect() {
      if (!this.socket || !this.isConnected) return;
      
      const savedPlayerInfo = localStorage.getItem('playerInfo');
      if (!savedPlayerInfo) return;
      
      try {
        const parsed = JSON.parse(savedPlayerInfo);
        if (parsed.id && parsed.username) {
          this.sendMessage({
            type: "reconnect",
            player_id: parsed.id,
            username: parsed.username
          });
        }
      } catch (e) {
        console.error("Erreur lors de la lecture des données sauvegardées:", e);
        localStorage.removeItem('playerInfo');
      }
    }
    
    /**
     * Envoie une demande de connexion
     * @param {string} username - Nom d'utilisateur
     */
    login(username) {
      if (!username || !this.socket || !this.isConnected) return;
      
      this.sendMessage({
        type: "login",
        username: username
      });
    }
    
    /**
     * Envoie une demande de déconnexion
     */
    logout() {
      if (!this.socket || !this.isConnected) return;
      
      const playerInfo = this.state.playerInfo;
      if (playerInfo.id) {
        this.sendMessage({
          type: "logout",
          player_id: playerInfo.id
        });
      }
      
      // Nettoyer les données locales
      localStorage.removeItem('playerInfo');
      this.state.clearPlayerInfo();
    }
    
    /**
     * Ferme la connexion WebSocket
     */
    disconnect() {
      if (this.socket) {
        this.socket.close();
        this.socket = null;
        this.isConnected = false;
      }
    }
    
    /**
     * Envoie la position du joueur au serveur
     * Optimisé pour ne pas envoyer si la position n'a pas changé
     */
    sendPlayerPosition() {
      if (!this.socket || !this.isConnected || !this.state.isPlayerLoggedIn()) return;
      
      const player = this.state.localPlayer;
      const now = performance.now();
      
      // Vérifier si on doit envoyer une mise à jour
      // 1. Le temps minimum est passé
      // 2. La position a changé
      if (
        now - this.lastPositionUpdate >= this.positionUpdateInterval &&
        (this.lastPositionSent.x !== player.x || this.lastPositionSent.y !== player.y)
      ) {
        this.sendMessage({
          type: "position",
          x: player.x,
          y: player.y
        });
        
        // Mettre à jour l'horodatage et la dernière position envoyée
        this.lastPositionUpdate = now;
        this.lastPositionSent = { x: player.x, y: player.y };
      }
    }
    
    /**
     * Envoie une demande pour basculer une porte
     * @param {string} doorKey - Clé de la porte (x,y)
     */
    toggleDoor(doorKey) {
      if (!this.socket || !this.isConnected) return;
      
      const [x, y] = doorKey.split(',').map(Number);
      
      this.sendMessage({
        type: "toggleDoor",
        x: x,
        y: y
      });
    }
    
    /**
     * Envoie une demande pour se cacher/découvrir
     */
    toggleHiding() {
      if (!this.socket || !this.isConnected) return;
      
      this.sendMessage({
        type: "toggleHiding"
      });
    }
    
    /**
     * Envoie une demande pour activer/désactiver la lumière
     */
    toggleLight() {
      if (!this.socket || !this.isConnected) return;
      
      this.sendMessage({
        type: "toggleLight"
      });
    }
    
    /**
     * Envoie un message au serveur
     * @param {Object} message - Message à envoyer
     */
    sendMessage(message) {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        console.warn("Impossible d'envoyer le message, socket fermé");
        return;
      }
      
      try {
        this.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error("Erreur lors de l'envoi d'un message:", error);
      }
    }
  }