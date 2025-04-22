// /src/entities/Hunter.js
import { HUNTER_SPEED, PLAYER_SIZE, TILE_SIZE } from '../config/constants.js';
import { CollisionUtils } from '../utils/CollisionUtils.js';

export class Hunter {
  constructor(id, color) {
    this.id = id;
    this.color = color;
    this.size = PLAYER_SIZE;
    this.x = 100;
    this.y = 100;
    this.carriedPlayer = null; // id du joueur transporté
  }

  /**
   * Met à jour la position du chasseur en fonction des touches pressées
   * @param {Object} keys - État des touches
   * @param {number} dt - Delta-time en secondes
   * @param {Array} map - Données de la carte
   * @param {Object} players - Joueurs pour les collisions et capture
   */
  update(keys, dt, map, players) {
    // Calcul du vecteur direction
    let dirX = (keys["ArrowRight"] ? 1 : 0) - (keys["ArrowLeft"] ? 1 : 0);
    let dirY = (keys["ArrowDown"] ? 1 : 0) - (keys["ArrowUp"] ? 1 : 0);

    // Normalisation pour éviter un déplacement diagonal plus rapide
    const len = Math.hypot(dirX, dirY);
    if (len > 0) {
      dirX /= len;
      dirY /= len;
    }

    // Calcul du déplacement
    const moveX = dirX * HUNTER_SPEED * dt;
    const moveY = dirY * HUNTER_SPEED * dt;

    // Test de collision horizontal
    const testX = { x: this.x + moveX, y: this.y, width: this.size, height: this.size };
    const wallX = CollisionUtils.collidesWithWall(testX, map, TILE_SIZE);
    if (!wallX) {
      this.x += moveX;
    }

    // Test de collision vertical
    const testY = { x: this.x, y: this.y + moveY, width: this.size, height: this.size };
    const wallY = CollisionUtils.collidesWithWall(testY, map, TILE_SIZE);
    if (!wallY) {
      this.y += moveY;
    }

    // Si pas encore de joueur attrapé, on teste la collision avec les joueurs
    if (!this.carriedPlayer) {
      const playerRect = { x: this.x, y: this.y, width: this.size, height: this.size };
      const collidedPlayerId = this.checkPlayerCollision(playerRect, players);
      
      if (collidedPlayerId) {
        this.capturePlayer(collidedPlayerId, players);
      }
    }

    // Si on transporte un joueur, on le positionne exactement sur le chasseur
    this.updateCarriedPlayer(players);
  }

  /**
   * Vérifie si le chasseur entre en collision avec un joueur
   * @param {Object} rect - Rectangle du chasseur
   * @param {Object} players - Liste des joueurs
   * @returns {string|null} - ID du joueur en collision ou null
   */
  checkPlayerCollision(rect, players) {
    for (const [id, player] of Object.entries(players)) {
      // Ignorer les joueurs déjà cachés ou portés
      if (player.isHidden || player.isCarried) continue;
      
      const playerRect = { 
        x: player.x, 
        y: player.y, 
        width: player.size, 
        height: player.size 
      };
      
      if (CollisionUtils.rectsOverlap(rect, playerRect)) {
        return id;
      }
    }
    return null;
  }

  /**
   * Capture un joueur
   * @param {string} playerId - ID du joueur capturé
   * @param {Object} players - Liste de tous les joueurs
   */
  capturePlayer(playerId, players) {
    this.carriedPlayer = playerId;
    
    if (players[playerId]) {
      players[playerId].isCarried = true;
      players[playerId].color = "purple"; // couleur différente pour le joueur attrapé
    }
  }

  /**
   * Met à jour la position du joueur porté
   * @param {Object} players - Liste de tous les joueurs
   */
  updateCarriedPlayer(players) {
    if (this.carriedPlayer && players[this.carriedPlayer]) {
      const carried = players[this.carriedPlayer];
      carried.x = this.x;
      carried.y = this.y;
    }
  }

  /**
   * Dessine le chasseur sur le canvas
   * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
   */
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
  
  /**
   * Libère le joueur porté
   * @param {Object} players - Liste de tous les joueurs
   */
  releasePlayer(players) {
    if (this.carriedPlayer && players[this.carriedPlayer]) {
      players[this.carriedPlayer].isCarried = false;
      this.carriedPlayer = null;
    }
  }
}