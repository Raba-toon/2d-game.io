// src/systems/CollisionSystem.js
import { TILE_SIZE } from '../utils/Constants.js';

/**
 * Système de détection de collisions centralisé
 */
export class CollisionSystem {
  constructor(gameState) {
    this.state = gameState;
    this.collisionMap = null;
    
    // Lier les méthodes au contexte
    this.updateCollisionGrid = this.updateCollisionGrid.bind(this);
    this.checkCollisions = this.checkCollisions.bind(this);
  }
  
  /**
   * Met à jour la grille de collision basée sur les données de la carte
   * @param {Array} mapData - Données de la carte
   */
  updateCollisionGrid(mapData) {
    if (!mapData) {
      this.collisionMap = null;
      return;
    }
    
    // Cloner les données de la carte pour éviter de les modifier directement
    this.collisionMap = mapData.map(row => [...row]);
  }
  
  /**
   * Vérifie si un point est à l'intérieur d'un rectangle
   * @param {number} x - Coordonnée X du point
   * @param {number} y - Coordonnée Y du point
   * @param {Object} rect - Rectangle {x, y, width, height}
   * @returns {boolean} - Vrai si le point est dans le rectangle
   */
  isPointInRect(x, y, rect) {
    return (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    );
  }
  
  /**
   * Vérifie si deux rectangles se chevauchent
   * @param {Object} rect1 - Premier rectangle {x, y, width, height}
   * @param {Object} rect2 - Second rectangle {x, y, width, height}
   * @returns {boolean} - Vrai si les rectangles se chevauchent
   */
  rectsOverlap(rect1, rect2) {
    return !(
      rect1.x + rect1.width <= rect2.x ||
      rect1.x >= rect2.x + rect2.width ||
      rect1.y + rect1.height <= rect2.y ||
      rect1.y >= rect2.y + rect2.height
    );
  }
  
  /**
   * Vérifie si une entité entre en collision avec des murs
   * @param {Object} rect - Rectangle de l'entité {x, y, width, height}
   * @returns {boolean} - Vrai s'il y a collision
   */
  collidesWithWall(rect) {
    if (!this.collisionMap) return false;
    
    const left = Math.floor(rect.x / TILE_SIZE);
    const right = Math.floor((rect.x + rect.width - 1) / TILE_SIZE);
    const top = Math.floor(rect.y / TILE_SIZE);
    const bottom = Math.floor((rect.y + rect.height - 1) / TILE_SIZE);
    
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        // Vérifier que la tuile existe et est un mur (1) ou une porte fermée (2)
        if (this.collisionMap[y]?.[x] === 1 || this.collisionMap[y]?.[x] === 2) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Vérifie si une entité entre en collision avec d'autres joueurs
   * @param {Object} rect - Rectangle de l'entité {x, y, width, height}
   * @param {string} excludeId - ID du joueur à exclure (généralement lui-même)
   * @returns {string|null} - ID du joueur touché ou null
   */
  collidesWithPlayers(rect, excludeId) {
    const remotePlayers = this.state.remotePlayers;
    
    for (const [id, player] of Object.entries(remotePlayers)) {
      // Ignorer le joueur lui-même et les joueurs cachés
      if (id === excludeId || player.isHidden) continue;
      
      const playerRect = {
        x: player.x,
        y: player.y,
        width: player.width || player.size,
        height: player.height || player.size
      };
      
      if (this.rectsOverlap(rect, playerRect)) {
        return id;
      }
    }
    
    return null;
  }
  
  /**
   * Vérifie si le joueur est près d'une porte
   * @returns {string|null} - Clé de la porte (x,y) ou null
   */
  getDoorNearPlayer() {
    const player = this.state.localPlayer;
    if (!player) return null;
    
    for (const doorKey in this.state.doors) {
      const [x, y] = doorKey.split(',').map(Number);
      const doorX = x * TILE_SIZE + TILE_SIZE / 2;
      const doorY = y * TILE_SIZE + TILE_SIZE / 2;
      
      const distance = Math.sqrt(
        Math.pow(player.x + player.width/2 - doorX, 2) + 
        Math.pow(player.y + player.height/2 - doorY, 2)
      );
      
      if (distance < TILE_SIZE * 1.5) {
        return doorKey;
      }
    }
    
    return null;
  }
  
  /**
   * Vérifie si le joueur est sur une cachette
   * @returns {string|null} - Clé de la cachette ou null
   */
  getHidingSpotAtPlayer() {
    const player = this.state.localPlayer;
    if (!player) return null;
    
    for (const key in this.state.hidingSpots) {
      const spot = this.state.hidingSpots[key];
      
      if (spot.isAt(player, TILE_SIZE)) {
        return key;
      }
    }
    
    return null;
  }
  
  /**
   * Exécute toutes les vérifications de collision nécessaires
   * Appelée à chaque frame pour mettre à jour l'état du jeu
   * @param {number} deltaTime - Temps écoulé depuis la dernière mise à jour
   */
  checkCollisions(deltaTime) {
    if (!this.state.isPlayerLoggedIn()) return;
    
    // Cette méthode pourrait faire plus de choses comme:
    // - Détecter les collisions avec des objets dynamiques
    // - Gérer les événements de collision (ramassage d'items, etc.)
    // - Déclencher des événements pour les portes, cachettes, etc.
  }
}