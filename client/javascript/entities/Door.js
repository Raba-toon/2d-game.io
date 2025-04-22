// /src/entities/Door.js
import { TILE_SIZE } from '../config/constants.js';
import { GAME_SETTINGS } from '../config/settings.js';

export class Door {
  constructor(x, y, isOpen = false) {
    this.x = x;
    this.y = y;
    this.isOpen = isOpen;
  }

  /**
   * Ouvre ou ferme la porte
   */
  toggle() {
    this.isOpen = !this.isOpen;
  }

  /**
   * Vérifie si un joueur est près de la porte
   * @param {Player} player - Instance du joueur
   * @returns {boolean} - Vrai si le joueur est adjacent à la porte
   */
  isNear(player) {
    const playerTile = player.getTilePosition();
    const dx = Math.abs(playerTile.x - this.x);
    const dy = Math.abs(playerTile.y - this.y);

    // Uniquement adjacent horizontalement ou verticalement (pas en diagonale)
    return (dx + dy === 1);
  }

  /**
   * Dessine la porte sur le canvas
   * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
   */
  draw(ctx) {
    // Utiliser la couleur appropriée selon l'état de la porte
    if (this.isOpen) {
      ctx.fillStyle = GAME_SETTINGS.renderSettings.doorOpenColor;
    } else {
      ctx.fillStyle = GAME_SETTINGS.renderSettings.doorClosedColor;
    }
    
    // Dessiner la porte
    ctx.fillRect(this.x * TILE_SIZE, this.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
  
  /**
   * Obtient la clé unique pour cette porte
   * @returns {string} - Clé unique basée sur les coordonnées
   */
  getKey() {
    return `${this.x},${this.y}`;
  }
  
  /**
   * Obtient les coordonnées en pixels de la porte
   * @returns {Object} - Coordonnées {x, y, width, height} en pixels
   */
  getRect() {
    return {
      x: this.x * TILE_SIZE,
      y: this.y * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE
    };
  }
}