// /src/entities/Player.js
import { PLAYER_SPEED, PLAYER_SIZE, TILE_SIZE } from '../config/constants.js';
import { CollisionUtils } from '../utils/CollisionUtils.js';

export class Player {
  constructor(id, color) {
    this.id = id;
    this.color = color;
    this.size = PLAYER_SIZE;
    this.x = 100;
    this.y = 100;
    this.isHidden = false;
    this.isCarried = false;
  }

  /**
   * Met à jour la position du joueur en fonction des touches pressées
   * @param {Object} keys - État des touches
   * @param {number} dt - Delta-time en secondes
   * @param {Array} map - Données de la carte
   * @param {Object} others - Autres joueurs pour les collisions
   */
  update(keys, dt, map, others) {
    // Calcul du vecteur direction
    let dirX = (keys["ArrowRight"] ? 1 : 0) - (keys["ArrowLeft"] ? 1 : 0);
    let dirY = (keys["ArrowDown"] ? 1 : 0) - (keys["ArrowUp"] ? 1 : 0);

    // Si le joueur est porté ou caché, pas de mouvement
    if (this.isCarried || this.isHidden) {
      return;
    }

    // Normalisation pour éviter un déplacement diagonal plus rapide
    const len = Math.hypot(dirX, dirY);
    if (len > 0) {
      dirX /= len;
      dirY /= len;
    }

    // Calcul du déplacement
    const moveX = dirX * PLAYER_SPEED * dt;
    const moveY = dirY * PLAYER_SPEED * dt;

    // Test de collision horizontal
    const testX = { x: this.x + moveX, y: this.y, width: this.size, height: this.size };
    const wallX = CollisionUtils.collidesWithWall(testX, map, TILE_SIZE);
    const playerX = CollisionUtils.collidesWithPlayers(testX, others);
    if (!wallX && !playerX) {
      this.x += moveX;
    }

    // Test de collision vertical
    const testY = { x: this.x, y: this.y + moveY, width: this.size, height: this.size };
    const wallY = CollisionUtils.collidesWithWall(testY, map, TILE_SIZE);
    const playerY = CollisionUtils.collidesWithPlayers(testY, others);
    if (!wallY && !playerY) {
      this.y += moveY;
    }

    // Si bloqué sur les deux axes, débloquer en forçant un axe si possible
    const movedX = !wallX && !playerX;
    const movedY = !wallY && !playerY;
    if (!movedX && !movedY && (dirX !== 0 || dirY !== 0)) {
      if (!wallX) this.x += moveX;
      else if (!wallY) this.y += moveY;
    }
  }

  /**
   * Dessine le joueur sur le canvas
   * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
   */
  draw(ctx) {
    // Si le joueur est caché, ne pas le dessiner
    if (this.isHidden) return;
    
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
  
  /**
   * Obtient la position du joueur en coordonnées de tuile
   * @returns {Object} Position en coordonnées de tuile {x, y}
   */
  getTilePosition() {
    return {
      x: Math.floor((this.x + this.size / 2) / TILE_SIZE),
      y: Math.floor((this.y + this.size / 2) / TILE_SIZE)
    };
  }
}