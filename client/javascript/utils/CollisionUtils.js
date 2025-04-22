// /src/utils/CollisionUtils.js
import { TILE_SIZE } from '../config/constants.js';

export const CollisionUtils = {
  /**
   * Vérifie si deux rectangles se chevauchent
   * @param {Object} a - Premier rectangle {x, y, width, height}
   * @param {Object} b - Second rectangle {x, y, width, height}
   * @returns {boolean} - True si les rectangles se chevauchent
   */
  rectsOverlap(a, b) {
    return !(
      a.x + a.width <= b.x ||
      a.x >= b.x + b.width ||
      a.y + a.height <= b.y ||
      a.y >= b.y + b.height
    );
  },
  
  /**
   * Vérifie la collision avec un mur de la carte
   * @param {Object} rect - Rectangle à vérifier {x, y, width, height}
   * @param {Array} map - Données de la carte
   * @param {number} tileSize - Taille d'une case
   * @returns {boolean} - True s'il y a collision avec un mur
   */
  collidesWithWall(rect, map, tileSize) {
    if (!map) return false;
    
    const left = Math.floor(rect.x / tileSize);
    const right = Math.floor((rect.x + rect.width - 1) / tileSize);
    const top = Math.floor(rect.y / tileSize);
    const bottom = Math.floor((rect.y + rect.height - 1) / tileSize);
    
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        // Vérifier si la case existe et si c'est un mur (1) ou une porte fermée (2)
        if (map[y]?.[x] === 1 || map[y]?.[x] === 2) {
          return true;
        }
      }
    }
    
    return false;
  },
  
  /**
   * Vérifie la collision avec d'autres joueurs
   * @param {Object} rect - Rectangle à vérifier {x, y, width, height}
   * @param {Object} players - Liste des joueurs
   * @returns {boolean} - True s'il y a collision avec un joueur
   */
  collidesWithPlayers(rect, players) {
    if (!players) return false;
    
    return Object.values(players).some(player => {
      // Ignorer les joueurs cachés
      if (player.isHidden) return false;
      
      const playerRect = {
        x: player.x,
        y: player.y,
        width: player.size,
        height: player.size
      };
      
      return this.rectsOverlap(rect, playerRect);
    });
  },
  
  /**
   * Calcule la distance entre deux points
   * @param {number} x1 - Coordonnée X du premier point
   * @param {number} y1 - Coordonnée Y du premier point
   * @param {number} x2 - Coordonnée X du second point
   * @param {number} y2 - Coordonnée Y du second point
   * @returns {number} - Distance entre les points
   */
  distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  },
  
  /**
   * Vérifie si un point est dans un rayon autour d'un autre point
   * @param {number} x1 - Coordonnée X du premier point
   * @param {number} y1 - Coordonnée Y du premier point
   * @param {number} x2 - Coordonnée X du second point
   * @param {number} y2 - Coordonnée Y du second point
   * @param {number} radius - Rayon maximum
   * @returns {boolean} - True si le point est dans le rayon
   */
  isPointInRadius(x1, y1, x2, y2, radius) {
    return this.distance(x1, y1, x2, y2) <= radius;
  },
  
  /**
   * Vérifie si une entité est près d'une autre entité
   * @param {Object} entity1 - Première entité avec propriétés x, y, size
   * @param {Object} entity2 - Seconde entité avec propriétés x, y, size
   * @param {number} maxDistance - Distance maximale en pixels
   * @returns {boolean} - True si les entités sont proches
   */
  isEntityNear(entity1, entity2, maxDistance) {
    const center1X = entity1.x + entity1.size / 2;
    const center1Y = entity1.y + entity1.size / 2;
    const center2X = entity2.x + entity2.size / 2;
    const center2Y = entity2.y + entity2.size / 2;
    
    return this.isPointInRadius(center1X, center1Y, center2X, center2Y, maxDistance);
  },
  
  /**
   * Convertit des coordonnées en pixels en coordonnées de tuile
   * @param {number} x - Coordonnée X en pixels
   * @param {number} y - Coordonnée Y en pixels
   * @returns {Object} - Coordonnées de tuile {x, y}
   */
  pixelToTileCoords(x, y) {
    return {
      x: Math.floor(x / TILE_SIZE),
      y: Math.floor(y / TILE_SIZE)
    };
  },
  
  /**
   * Convertit des coordonnées de tuile en coordonnées en pixels
   * @param {number} tileX - Coordonnée X de tuile
   * @param {number} tileY - Coordonnée Y de tuile
   * @returns {Object} - Coordonnées en pixels {x, y}
   */
  tileToPixelCoords(tileX, tileY) {
    return {
      x: tileX * TILE_SIZE,
      y: tileY * TILE_SIZE
    };
  }
};