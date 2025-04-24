// src/entities/HidingSpot.js
import { Entity } from '../entities/Entity.js';
import { TILE_SIZE } from '../utils/Constants.js';

/**
 * Classe représentant une cachette dans le jeu
 * @extends Entity
 */
export class HidingSpot extends Entity {
  /**
   * @param {number} x - Position X en coordonnées de tuile
   * @param {number} y - Position Y en coordonnées de tuile
   */
  constructor(x, y) {
    // Convertir les coordonnées de tuile en pixels
    super(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    
    // Propriétés spécifiques à la cachette
    this.tileX = x;
    this.tileY = y;
    this.isOccupied = false;
    this.occupiedBy = null; // ID du joueur qui se cache
  }
  
  /**
   * Vérifie si un joueur est adjacent à la cachette
   * @param {Entity} player - Joueur à vérifier
   * @param {number} tileSize - Taille d'une tuile en pixels
   * @returns {boolean} - Vrai si le joueur est adjacent
   */
  isNear(player, tileSize = TILE_SIZE) {
    const playerPos = player.getTilePosition(tileSize);
    const dx = Math.abs(playerPos.tileX - this.tileX);
    const dy = Math.abs(playerPos.tileY - this.tileY);
    
    // Uniquement adjacent horizontalement ou verticalement
    return (dx + dy === 1);
  }
  
  /**
   * Vérifie si un joueur est exactement sur la cachette
   * @param {Entity} player - Joueur à vérifier
   * @param {number} tileSize - Taille d'une tuile en pixels
   * @returns {boolean} - Vrai si le joueur est sur la cachette
   */
  isAt(player, tileSize = TILE_SIZE) {
    const playerPos = player.getTilePosition(tileSize);
    return playerPos.tileX === this.tileX && playerPos.tileY === this.tileY;
  }
  
  /**
   * Occupe la cachette avec un joueur
   * @param {string} playerId - ID du joueur qui se cache
   * @returns {boolean} - Vrai si la cachette a pu être occupée
   */
  occupy(playerId) {
    if (this.isOccupied) return false;
    
    this.isOccupied = true;
    this.occupiedBy = playerId;
    return true;
  }
  
  /**
   * Libère la cachette
   * @returns {string|null} - ID du joueur qui était caché, ou null
   */
  release() {
    const previousOccupant = this.occupiedBy;
    this.isOccupied = false;
    this.occupiedBy = null;
    return previousOccupant;
  }
  
  /**
   * Dessine la cachette sur le canvas
   * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
   * @param {number} tileSize - Taille d'une tuile en pixels
   */
  draw(ctx, tileSize = TILE_SIZE) {
    // Couleur différente selon que la cachette est occupée ou non
    ctx.fillStyle = this.isOccupied ? "#4a9d4a" : "#66bb66"; // vert plus foncé si occupé
    ctx.fillRect(this.tileX * tileSize, this.tileY * tileSize, tileSize, tileSize);
    
    // Ajouter une indication visuelle si la cachette est occupée
    if (this.isOccupied) {
      ctx.strokeStyle = "#2a5d2a";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        this.tileX * tileSize + 2, 
        this.tileY * tileSize + 2, 
        tileSize - 4, 
        tileSize - 4
      );
    }
  }
  
  /**
   * Convertit la cachette en objet simple pour la sérialisation
   * @returns {Object} - Représentation simple de la cachette
   */
  toJSON() {
    return {
      x: this.tileX,
      y: this.tileY,
      isOccupied: this.isOccupied,
      occupiedBy: this.occupiedBy
    };
  }
  
  /**
   * Crée une cachette à partir d'un objet
   * @param {Object} data - Données de la cachette
   * @returns {HidingSpot} - Instance de cachette
   */
  static fromJSON(data) {
    const spot = new HidingSpot(data.x, data.y);
    spot.isOccupied = data.isOccupied || false;
    spot.occupiedBy = data.occupiedBy || null;
    return spot;
  }
}