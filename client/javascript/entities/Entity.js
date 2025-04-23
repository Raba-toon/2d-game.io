// src/entities/Entity.js

/**
 * Classe de base pour toutes les entités du jeu
 * Fournit les fonctionnalités communes comme la position et la détection de collision
 */
export class Entity {
    /**
     * @param {number} x - Position X initiale
     * @param {number} y - Position Y initiale
     * @param {number} width - Largeur de l'entité
     * @param {number} height - Hauteur de l'entité
     */
    constructor(x = 0, y = 0, width = 0, height = 0) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }
    
    /**
     * Vérifie si deux rectangles se chevauchent
     * @param {Object} other - Autre rectangle {x, y, width, height}
     * @returns {boolean} - Vrai si les rectangles se chevauchent
     */
    rectsOverlap(other) {
      return !(
        this.x + this.width <= other.x ||
        this.x >= other.x + other.width ||
        this.y + this.height <= other.y ||
        this.y >= other.y + other.height
      );
    }
    
    /**
     * Calcule la distance entre cette entité et une autre position
     * @param {number} x - Position X à comparer
     * @param {number} y - Position Y à comparer
     * @returns {number} - Distance en pixels
     */
    distanceTo(x, y) {
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      
      return Math.sqrt(
        Math.pow(centerX - x, 2) + 
        Math.pow(centerY - y, 2)
      );
    }
    
    /**
     * Calcule la distance entre cette entité et une autre entité
     * @param {Entity} entity - Autre entité
     * @returns {number} - Distance en pixels entre les centres
     */
    distanceToEntity(entity) {
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      const otherCenterX = entity.x + entity.width / 2;
      const otherCenterY = entity.y + entity.height / 2;
      
      return Math.sqrt(
        Math.pow(centerX - otherCenterX, 2) + 
        Math.pow(centerY - otherCenterY, 2)
      );
    }
    
    /**
     * Convertit les coordonnées de pixel en coordonnées de tuile
     * @param {number} tileSize - Taille d'une tuile en pixels
     * @returns {Object} - Coordonnées de tuile {tileX, tileY}
     */
    getTilePosition(tileSize) {
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      
      return {
        tileX: Math.floor(centerX / tileSize),
        tileY: Math.floor(centerY / tileSize)
      };
    }
    
    /**
     * Vérifie si l'entité est sur la même tuile qu'une position donnée
     * @param {number} tileX - Coordonnée X de la tuile
     * @param {number} tileY - Coordonnée Y de la tuile
     * @param {number} tileSize - Taille d'une tuile en pixels
     * @returns {boolean} - Vrai si l'entité est sur la tuile spécifiée
     */
    isOnTile(tileX, tileY, tileSize) {
      const pos = this.getTilePosition(tileSize);
      return pos.tileX === tileX && pos.tileY === tileY;
    }
    
    /**
     * Méthode de dessin de base (à surcharger dans les classes dérivées)
     * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
     */
    draw(ctx) {
      // Implémentation par défaut: rectangle simple
      ctx.fillStyle = 'gray';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }