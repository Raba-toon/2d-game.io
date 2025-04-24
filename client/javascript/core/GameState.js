// src/core/GameState.js
import { Player } from '../entities/Player.js';
import { Door } from '../entities/Door.js';
import { HidingSpot } from '../entities/HidingSpot.js';
import { TILE_SIZE } from '../utils/constants.js';

/**
 * Gestionnaire centralisé de l'état du jeu
 * Tous les changements d'état passent par cette classe
 */
export class GameState {
  constructor(eventEmitter) {
    this.events = eventEmitter;
    
    // Informations du joueur
    this.playerInfo = {
      id: null,
      username: null
    };
    
    // État de la partie
    this.mapData = null;
    this.localPlayer = new Player(null, 'blue');
    this.remotePlayers = {};
    this.doors = {};
    this.hidingSpots = {};
    this.connectedPlayers = {};
    this.hunters = {};
    
    // Lier les méthodes au contexte
    this.isPlayerLoggedIn = this.isPlayerLoggedIn.bind(this);
    this.updateLocalPlayer = this.updateLocalPlayer.bind(this);
  }
  
  /**
   * Vérifie si le joueur est connecté
   * @returns {boolean} - True si le joueur est connecté
   */
  isPlayerLoggedIn() {
    return this.playerInfo.id !== null;
  }
  
  /**
   * Définit les informations du joueur après la connexion
   * @param {Object} info - Informations du joueur
   */
  setPlayerInfo(info) {
    this.playerInfo = { ...info };
    this.localPlayer.id = info.id;
    this.events.emit('player:infoUpdated', this.playerInfo);
  }
  
  /**
   * Réinitialise les informations du joueur après la déconnexion
   */
  clearPlayerInfo() {
    this.playerInfo = {
      id: null,
      username: null
    };
    this.localPlayer.id = null;
    this.events.emit('player:infoUpdated', this.playerInfo);
  }
  
  /**
   * Met à jour la liste des joueurs connectés
   * @param {Object} players - Liste des joueurs
   */
  updateConnectedPlayers(players) {
    this.connectedPlayers = { ...players };
    
    // Nettoyer les joueurs déconnectés
    for (const id in this.remotePlayers) {
      if (!this.connectedPlayers[id]) {
        delete this.remotePlayers[id];
      }
    }
    
    this.events.emit('players:listUpdated', this.connectedPlayers);
  }
  
  /**
   * Définit les données de la carte
   * @param {Array} mapData - Données de la carte
   */
  setMapData(mapData) {
    this.mapData = mapData;
    
    // Initialiser les portes et les cachettes
    this.initDoorsAndHidingSpots();
    
    this.events.emit('map:updated', this.mapData);
  }
  
  /**
   * Initialise les portes et les cachettes à partir des données de la carte
   */
  initDoorsAndHidingSpots() {
    if (!this.mapData) return;
    
    this.doors = {};
    this.hidingSpots = {};
    
    for (let y = 0; y < this.mapData.length; y++) {
      for (let x = 0; x < this.mapData[y].length; x++) {
        // Initialiser les portes (2)
        if (this.mapData[y][x] === 2) {
          const doorKey = `${x},${y}`;
          this.doors[doorKey] = new Door(x, y, false);
        }
        
        // Initialiser les cachettes (3)
        if (this.mapData[y][x] === 3) {
          const spotKey = `${x},${y}`;
          this.hidingSpots[spotKey] = new HidingSpot(x, y);
        }
      }
    }
  }
  
  /**
   * Met à jour l'état des portes
   * @param {Object} doorsState - État des portes
   */
  updateDoorsState(doorsState) {
    for (const [key, isOpen] of Object.entries(doorsState)) {
      this.doors[key] = isOpen;
      
      // Mettre à jour la carte pour les collisions
      const [x, y] = key.split(',').map(Number);
      if (this.mapData && this.mapData[y] && this.mapData[y][x] !== undefined) {
        this.mapData[y][x] = isOpen ? 0 : 2;
      }
    }
    
    this.events.emit('doors:updated', this.doors);
  }
  
  /**
   * Met à jour l'état d'éclairage de tous les joueurs
   * @param {Object} lightsState - État des lumières
   */
  updateLightsState(lightsState) {
    Object.entries(lightsState).forEach(([id, isOn]) => {
      if (id === this.playerInfo.id) {
        this.localPlayer.lightOn = isOn;
      } else {
        if (!this.remotePlayers[id]) {
          this.remotePlayers[id] = new Player(id, 'red');
        }
        this.remotePlayers[id].lightOn = isOn;
      }
    });
    
    this.events.emit('lights:updated', lightsState);
  }
  
  /**
   * Met à jour l'état caché des joueurs
   * @param {Array} hiddenPlayers - Liste des joueurs cachés
   */
  updateHiddenPlayers(hiddenPlayers) {
    for (const id of Object.keys(this.remotePlayers)) {
      this.remotePlayers[id].isHidden = hiddenPlayers.includes(id);
    }
    
    this.events.emit('players:hiddenUpdated', hiddenPlayers);
  }
  
  /**
   * Met à jour la position des joueurs distants
   * @param {Object} positions - Positions des joueurs
   */
  updatePlayersPositions(positions) {
    for (const [id, pos] of Object.entries(positions)) {
      // Ignorer le joueur local
      if (id === this.playerInfo.id) continue;
      
      // Créer le joueur s'il n'existe pas
      if (!this.remotePlayers[id]) {
        this.remotePlayers[id] = new Player(id, 'red');
      }
      
      // Mettre à jour la position
      this.remotePlayers[id].setPositionFromServer(pos.x, pos.y);
    }
  }
  
  /**
   * Met à jour le joueur local en fonction des entrées
   * @param {Object} keys - État des touches
   * @param {number} deltaTime - Temps écoulé depuis la dernière mise à jour
   */
  updateLocalPlayer(keys, deltaTime) {
    if (!this.isPlayerLoggedIn() || !this.mapData) return;
    
    // Ne pas mettre à jour si caché
    if (this.localPlayer.isHidden) return;
    
    this.localPlayer.update(keys, deltaTime, this.mapData, TILE_SIZE, this.remotePlayers);
    
    this.events.emit('player:moved', {
      x: this.localPlayer.x,
      y: this.localPlayer.y
    });
  }
  
  /**
   * Met à jour l'animation des joueurs distants
   * @param {number} deltaTime - Temps écoulé depuis la dernière mise à jour
   */
  updateRemotePlayers(deltaTime) {
    Object.values(this.remotePlayers).forEach(player => {
      player.animate(deltaTime);
    });
    Object.values(this.hunters).forEach(hunter => {
        hunter.update(deltaTime, this.mapData, TILE_SIZE, {
          ...this.remotePlayers,
          [this.playerInfo.id]: this.localPlayer
        });
      });
  }
  
  /**
   * Bascule l'état d'éclairage du joueur local
   */
  togglePlayerLight() {
    if (!this.isPlayerLoggedIn()) return;
    
    this.localPlayer.lightOn = !this.localPlayer.lightOn;
    this.events.emit('player:lightToggled', this.localPlayer.lightOn);
  }
  
  /**
   * Vérifie si une porte est près du joueur
   * @returns {string|null} - Clé de la porte ou null
   */
  getDoorNearPlayer() {
    if (!this.localPlayer || !this.doors) return null;
    
    for (const doorKey in this.doors) {
      const [x, y] = doorKey.split(',').map(Number);
      const doorX = x * TILE_SIZE + TILE_SIZE / 2;
      const doorY = y * TILE_SIZE + TILE_SIZE / 2;
      
      const distance = Math.sqrt(
        Math.pow(this.localPlayer.x + this.localPlayer.size/2 - doorX, 2) + 
        Math.pow(this.localPlayer.y + this.localPlayer.size/2 - doorY, 2)
      );
      
      if (distance < TILE_SIZE * 1.5) {
        return doorKey;
      }
    }
    
    return null;
  }
  
  /**
   * Vérifie si une cachette est près du joueur
   * @returns {string|null} - Clé de la cachette ou null
   */
  getHidingSpotAtPlayer() {
    if (!this.localPlayer || !this.hidingSpots) return null;
    
    for (const key in this.hidingSpots) {
      const spot = this.hidingSpots[key];
      
      if (spot.isAt(this.localPlayer, TILE_SIZE)) {
        return key;
      }
    }
    
    return null;
  }

  /**
   * Ajoute une hunter dans la liste des hunters
   * @param {number} id 
   * @returns {*} Class Hunter
   */
  addHunter(id) {
    const hunter = new Hunter(id);
    this.hunters[id] = hunter;
    this.events.emit('hunters:added', hunter);
    return hunter;
  }
}