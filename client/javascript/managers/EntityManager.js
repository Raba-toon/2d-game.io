// /src/managers/EntityManager.js
import { Player } from '../entities/Player.js';
import { Hunter } from '../entities/Hunter.js';
import { Door } from '../entities/Door.js';
import { TILE_SIZE } from '../config/constants.js';
import { GAME_SETTINGS } from '../config/settings.js';

export class EntityManager {
  constructor() {
    this.localPlayer = null;
    this.otherPlayers = {};
    this.hunters = {};
    this.doors = {};
    this.hidingSpots = [];
  }

  /**
   * Initialise le joueur local
   * @param {string} id - Identifiant du joueur
   * @returns {Player} - Instance du joueur local
   */
  initLocalPlayer(id) {
    this.localPlayer = new Player(id, GAME_SETTINGS.playerColors.local);
    return this.localPlayer;
  }

  /**
   * Ajoute ou met à jour un joueur distant
   * @param {string} id - Identifiant du joueur
   * @param {number} x - Position X
   * @param {number} y - Position Y
   */
  updateRemotePlayer(id, x, y) {
    if (!this.otherPlayers[id]) {
      this.otherPlayers[id] = new Player(id, GAME_SETTINGS.playerColors.remote);
    }
    
    this.otherPlayers[id].x = x;
    this.otherPlayers[id].y = y;
  }

  /**
   * Ajoute une porte au gestionnaire
   * @param {Door} door - Instance de porte
   */
  addDoor(door) {
    const key = `${door.x},${door.y}`;
    this.doors[key] = door;
  }

  /**
   * Met à jour l'état des portes depuis le serveur
   * @param {Object} doorStates - États des portes (clé -> isOpen)
   */
  updateDoors(doorStates) {
    for (const [key, isOpen] of Object.entries(doorStates)) {
      if (this.doors[key]) {
        this.doors[key].isOpen = isOpen;
      } else {
        // Créer la porte si elle n'existe pas
        const [x, y] = key.split(',').map(Number);
        this.doors[key] = new Door(x, y, isOpen);
      }
    }
  }

  /**
   * Recherche une porte près du joueur et la retourne
   * @param {Player} player - Instance du joueur
   * @returns {Door|null} - La porte trouvée ou null
   */
  findDoorNearPlayer(player) {
    for (const key in this.doors) {
      const door = this.doors[key];
      if (door.isNear(player)) {
        return door;
      }
    }
    return null;
  }

  /**
   * Ouvre/ferme une porte près du joueur et retourne les coordonnées
   * @param {Player} player - Instance du joueur
   * @returns {Object|null} - Coordonnées de la porte {x, y} ou null
   */
  toggleDoorNearPlayer(player) {
    const door = this.findDoorNearPlayer(player);
    if (door) {
      return { x: door.x, y: door.y };
    }
    return null;
  }

  /**
   * Supprime un joueur distant
   * @param {string} id - Identifiant du joueur
   */
  removePlayer(id) {
    delete this.otherPlayers[id];
  }

  /**
   * Obtient le joueur local
   * @returns {Player|null} - Joueur local ou null
   */
  getLocalPlayer() {
    return this.localPlayer;
  }

  /**
   * Obtient les autres joueurs
   * @returns {Object} - Mapping des autres joueurs
   */
  getOtherPlayers() {
    return this.otherPlayers;
  }

  /**
   * Obtient toutes les entités pour le rendu
   * @returns {Object} - Toutes les entités organisées par type
   */
  getAllEntities() {
    return {
      localPlayer: this.localPlayer,
      otherPlayers: this.otherPlayers,
      hunters: Object.values(this.hunters),
      doors: this.doors,
      hidingSpots: this.hidingSpots
    };
  }

  /**
   * Met à jour toutes les cachettes par rapport au joueur local
   */
  updateHidingSpots() {
    if (!this.localPlayer) return;
    
    this.hidingSpots.forEach(spot => {
      spot.hidePlayerIfInside(this.localPlayer);
    });
  }
}