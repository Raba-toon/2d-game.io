// /src/managers/CollisionManager.js
import { TILE_SIZE } from '../config/constants.js';
import { CollisionUtils } from '../utils/CollisionUtils.js';

export class CollisionManager {
  constructor(mapManager, entityManager) {
    this.mapManager = mapManager;
    this.entityManager = entityManager;
  }

  /**
   * Vérifie si un mouvement est valide (pas de collision)
   * @param {Object} entity - Entité à déplacer (player, hunter, etc.)
   * @param {number} newX - Nouvelle position X
   * @param {number} newY - Nouvelle position Y
   * @returns {boolean} - True si le mouvement est valide
   */
  isValidMove(entity, newX, newY) {
    const rect = {
      x: newX,
      y: newY,
      width: entity.size,
      height: entity.size
    };
    
    // Vérifier collision avec les murs
    if (this.collidesWithWall(rect)) {
      return false;
    }
    
    // Vérifier collision avec les portes fermées
    if (this.collidesWithClosedDoors(rect)) {
      return false;
    }
    
    // Vérifier collision avec d'autres joueurs (si c'est un joueur)
    if (entity.constructor.name === "Player" && this.collidesWithPlayers(rect, entity.id)) {
      return false;
    }
    
    return true;
  }

  /**
   * Vérifie la collision avec un mur
   * @param {Object} rect - Rectangle à vérifier {x, y, width, height}
   * @returns {boolean} - True s'il y a collision
   */
  collidesWithWall(rect) {
    const map = this.mapManager.getMapData();
    return CollisionUtils.collidesWithWall(rect, map, TILE_SIZE);
  }

  /**
   * Vérifie la collision avec les portes fermées
   * @param {Object} rect - Rectangle à vérifier {x, y, width, height}
   * @returns {boolean} - True s'il y a collision
   */
  collidesWithClosedDoors(rect) {
    const doors = this.entityManager.doors;
    
    for (const key in doors) {
      const door = doors[key];
      
      // Ignorer les portes ouvertes
      if (door.isOpen) continue;
      
      const doorRect = door.getRect();
      
      if (CollisionUtils.rectsOverlap(rect, doorRect)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Vérifie la collision avec d'autres joueurs
   * @param {Object} rect - Rectangle à vérifier {x, y, width, height}
   * @param {string} excludeId - ID du joueur à exclure
   * @returns {boolean} - True s'il y a collision
   */
  collidesWithPlayers(rect, excludeId) {
    const otherPlayers = this.entityManager.getOtherPlayers();
    
    for (const [id, player] of Object.entries(otherPlayers)) {
      // Ne pas tester la collision avec soi-même
      if (id === excludeId) continue;
      
      // Ignorer les joueurs cachés
      if (player.isHidden) continue;
      
      const playerRect = {
        x: player.x,
        y: player.y,
        width: player.size,
        height: player.size
      };
      
      if (CollisionUtils.rectsOverlap(rect, playerRect)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Vérifie si un joueur est près d'une porte
   * @param {Player} player - Joueur à vérifier
   * @returns {Door|null} - Porte à proximité ou null
   */
  getDoorNearPlayer(player) {
    return this.entityManager.toggleDoorNearPlayer(player);
  }
  
  /**
   * Vérifie si un chasseur touche un joueur
   * @param {Hunter} hunter - Chasseur
   * @returns {string|null} - ID du joueur touché ou null
   */
  getPlayerTouchedByHunter(hunter) {
    const rect = {
      x: hunter.x,
      y: hunter.y,
      width: hunter.size,
      height: hunter.size
    };
    
    const otherPlayers = this.entityManager.getOtherPlayers();
    
    for (const [id, player] of Object.entries(otherPlayers)) {
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
}