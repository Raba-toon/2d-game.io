// /src/entities/Hide.js
import { TILE_SIZE } from '../config/constants.js';
import { GAME_SETTINGS } from '../config/settings.js';

/**
 * Classe représentant une porte de cachette (similaire à une porte normale)
 */
export class Hide {
  constructor(x, y, isOpen = false) {
    this.x = x;
    this.y = y;
    this.isOpen = isOpen;
  }

  /**
   * Ouvre ou ferme la cachette
   */
  toggle() {
    this.isOpen = !this.isOpen;
  }

  /**
   * Vérifie si un joueur est près de la cachette
   * @param {Player} player - Instance du joueur
   * @returns {boolean} - Vrai si le joueur est adjacent à la cachette
   */
  isNear(player) {
    const playerTile = player.getTilePosition();
    const dx = Math.abs(playerTile.x - this.x);
    const dy = Math.abs(playerTile.y - this.y);

    // Uniquement adjacent horizontalement ou verticalement (pas en diagonale)
    return (dx + dy === 1);
  }

  /**
   * Dessine la cachette sur le canvas
   * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
   */
  draw(ctx) {
    // Utiliser la couleur appropriée selon l'état de la cachette
    if (this.isOpen) {
      ctx.fillStyle = GAME_SETTINGS.renderSettings.doorOpenColor;
    } else {
      ctx.fillStyle = GAME_SETTINGS.renderSettings.doorClosedColor;
    }
    
    // Dessiner la cachette
    ctx.fillRect(this.x * TILE_SIZE, this.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
  
  /**
   * Obtient la clé unique pour cette cachette
   * @returns {string} - Clé unique basée sur les coordonnées
   */
  getKey() {
    return `hide_${this.x},${this.y}`;
  }
}

/**
 * Classe représentant un emplacement permettant de se cacher
 */
export class HidingSpot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.isOccupied = false;
  }

  /**
   * Vérifie si un joueur est sur la cachette
   * @param {Player} player - Instance du joueur
   * @returns {boolean} - Vrai si le joueur est sur la cachette
   */
  isAt(player) {
    const playerTile = player.getTilePosition();
    return playerTile.x === this.x && playerTile.y === this.y;
  }

  /**
   * Dessine la cachette sur le canvas
   * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
   */
  draw(ctx) {
    ctx.fillStyle = GAME_SETTINGS.renderSettings.hidingSpotColor;
    ctx.fillRect(this.x * TILE_SIZE, this.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }

  /**
   * Cache le joueur s'il est sur la cachette, ou le fait sortir s'il s'éloigne
   * @param {Player} player - Instance du joueur
   */
  hidePlayerIfInside(player) {
    if (this.isAt(player)) {
      // Le joueur entre dans la cachette
      player.isHidden = true;
      this.isOccupied = true;
    } else if (this.isOccupied && player.isHidden) {
      // Le joueur quitte la cachette
      player.isHidden = false;
      this.isOccupied = false;
    }
  }
  
  /**
   * Obtient la clé unique pour cette cachette
   * @returns {string} - Clé unique basée sur les coordonnées
   */
  getKey() {
    return `spot_${this.x},${this.y}`;
  }
}