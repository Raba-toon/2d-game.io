// src/entities/Door.js
import { Entity } from './Entity.js';
import { TILE_SIZE } from '../utils/Constants.js';

/**
 * Classe représentant une porte dans le jeu
 * @extends Entity
 */
export class Door extends Entity {
  /**
   * @param {number} x - Position X en coordonnées de tuile
   * @param {number} y - Position Y en coordonnées de tuile
   * @param {boolean} isOpen - État initial de la porte (ouverte/fermée)
   */
  constructor(x, y, isOpen = false) {
    // Convertir les coordonnées de tuile en pixels
    super(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    
    // Propriétés spécifiques à la porte
    this.tileX = x;
    this.tileY = y;
    this.isOpen = isOpen;
  }
  
  /**
   * Change l'état de la porte (ouvert/fermé)
   * @returns {boolean} - Nouvel état de la porte
   */
  toggle() {
    this.isOpen = !this.isOpen;
    return this.isOpen;
  }
  
  /**
   * Vérifie si un joueur est adjacent à la porte
   * @param {Entity} player - Joueur à vérifier
   * @param {number} tileSize - Taille d'une tuile en pixels
   * @returns {boolean} - Vrai si le joueur est adjacent
   */
  isNear(player, tileSize) {
    const playerPos = player.getTilePosition(tileSize);
    const dx = Math.abs(playerPos.tileX - this.tileX);
    const dy = Math.abs(playerPos.tileY - this.tileY);
    
    // Uniquement adjacent horizontalement ou verticalement (pas en diagonale)
    return (dx + dy === 1);
  }
  
  /**
   * Dessine la porte sur le canvas
   * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
   * @param {number} tileSize - Taille d'une tuile en pixels
   */
  draw(ctx, tileSize = TILE_SIZE) {
    ctx.fillStyle = this.isOpen ? "#555" : "sienna"; // gris si ouvert, brun si fermé
    ctx.fillRect(this.tileX * tileSize, this.tileY * tileSize, tileSize, tileSize);
  }
  
  /**
   * Convertit la porte en objet simple pour la sérialisation
   * @returns {Object} - Représentation simple de la porte
   */
  toJSON() {
    return {
      x: this.tileX,
      y: this.tileY,
      isOpen: this.isOpen
    };
  }
  
  /**
   * Crée une porte à partir d'un objet
   * @param {Object} data - Données de la porte
   * @returns {Door} - Instance de porte
   */
  static fromJSON(data) {
    return new Door(data.x, data.y, data.isOpen);
  }
}