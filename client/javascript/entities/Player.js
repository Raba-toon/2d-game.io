// src/entities/Player.js
import { Entity } from './Entity.js';
import { PLAYER_SPEED, SPRITE_WIDTH, SPRITE_HEIGHT, PLAYER_FRAME_COUNT, PLAYER_FRAME_DURATION } from '/utils/Constants.js';

/**
 * Classe représentant un joueur dans le jeu
 * @extends Entity
 */
export class Player extends Entity {
  /**
   * @param {string} id - Identifiant unique du joueur
   * @param {string} color - Couleur du joueur (pour debug/fallback)
   */
  constructor(id, color = 'blue') {
    // Appeler le constructeur parent avec les dimensions du joueur
    super(100, 100, SPRITE_WIDTH * 1.5, SPRITE_WIDTH * 1.5);
    
    this.id = id;
    this.color = color;
    
    // État du joueur
    this.lightOn = true;
    this.isHidden = false;
    this.isCarried = false;
    
    // Direction
    this.facingRight = true;
    
    // Animation
    this.frame = 0;
    this.frameTime = 0;
    
    // Chargement du sprite
    this.sprite = new Image();
    this.sprite.src = '/client/images/players/baby-crawl-white.png';
  }
  
  /**
   * Vérifie si le joueur entre en collision avec des murs
   * @param {Object} rect - Rectangle à tester {x, y, width, height}
   * @param {Array} map - Grille de la carte
   * @param {number} tileSize - Taille d'une tuile
   * @returns {boolean} - Vrai si collision
   */
  collidesWithWall(rect, map, tileSize) {
    if (!map) return false;
    
    const left = Math.floor(rect.x / tileSize);
    const right = Math.floor((rect.x + rect.width - 1) / tileSize);
    const top = Math.floor(rect.y / tileSize);
    const bottom = Math.floor((rect.y + rect.height - 1) / tileSize);
    
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        // Vérifier que la tuile existe et est un mur (1) ou une porte fermée (2)
        if (map[y]?.[x] === 1 || map[y]?.[x] === 2) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Vérifie si le joueur entre en collision avec d'autres joueurs
   * @param {Object} rect - Rectangle à tester {x, y, width, height}
   * @param {Object} others - Autres joueurs
   * @returns {boolean} - Vrai si collision
   */
  collidesWithPlayers(rect, others) {
    return Object.values(others).some(other => {
      // Ignorer les joueurs cachés
      if (other.isHidden) return false;
      
      const otherRect = {
        x: other.x,
        y: other.y,
        width: other.width || other.size,
        height: other.height || other.size
      };
      
      return this.rectsOverlap(rect, otherRect);
    });
  }
  
  /**
   * Récupère un rectangle représentant les coordonnées et dimensions du joueur
   * @returns {Object} - Rectangle {x, y, width, height}
   */
  getRect() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
  
  /**
   * Met à jour la position et l'animation du joueur
   * @param {Object} keys - État des touches
   * @param {number} deltaTime - Temps écoulé depuis la dernière mise à jour (en secondes)
   * @param {Array} map - Grille de la carte
   * @param {number} tileSize - Taille d'une tuile
   * @param {Object} others - Autres joueurs
   */
  update(keys, deltaTime, map, tileSize, others) {
    // Ne pas mettre à jour si caché
    if (this.isHidden || this.isCarried) return;
    
    // Calculer la direction du mouvement
    let dirX = (keys['d'] ? 1 : 0) - (keys['a'] ? 1 : 0);
    let dirY = (keys['s'] ? 1 : 0) - (keys['w'] ? 1 : 0);
    
    // Mettre à jour la direction du joueur
    if (dirX > 0) this.facingRight = true;
    else if (dirX < 0) this.facingRight = false;
    
    // Normaliser le vecteur de direction
    const len = Math.hypot(dirX, dirY);
    if (len > 0) {
      dirX /= len;
      dirY /= len;
    }
    
    // Calculer le déplacement
    const moveX = dirX * PLAYER_SPEED * deltaTime;
    const moveY = dirY * PLAYER_SPEED * deltaTime;
    
    // Tester le mouvement horizontal
    const testX = { ...this.getRect(), x: this.x + moveX };
    const wallX = this.collidesWithWall(testX, map, tileSize);
    const playerX = this.collidesWithPlayers(testX, others);
    
    // Tester le mouvement vertical
    const testY = { ...this.getRect(), y: this.y + moveY };
    const wallY = this.collidesWithWall(testY, map, tileSize);
    const playerY = this.collidesWithPlayers(testY, others);
    
    // Appliquer les mouvements si pas de collision
    if (!wallX && !playerX) this.x += moveX;
    if (!wallY && !playerY) this.y += moveY;
    
    // Permettre de "glisser" le long des murs
    if (!wallX && wallY) this.x += moveX;
    if (!wallY && wallX) this.y += moveY;
    
    // Mettre à jour l'animation
    if (dirX || dirY) {
      this.animate(deltaTime);
    } else {
      // Réinitialiser l'animation si pas de mouvement
      this.frame = 0;
      this.frameTime = 0;
    }
  }
  
  /**
   * Met à jour l'état d'animation du joueur
   * @param {number} deltaTime - Temps écoulé depuis la dernière mise à jour (en secondes)
   */
  animate(deltaTime) {
    this.frameTime += deltaTime;
    
    if (this.frameTime >= PLAYER_FRAME_DURATION) {
      this.frameTime -= PLAYER_FRAME_DURATION;
      this.frame = (this.frame + 1) % PLAYER_FRAME_COUNT;
    }
  }
  
  /**
   * Met à jour la position du joueur à partir des données serveur
   * @param {number} newX - Nouvelle position X
   * @param {number} newY - Nouvelle position Y
   */
  setPositionFromServer(newX, newY) {
    // Mettre à jour la direction en fonction du mouvement
    if (newX > this.x) this.facingRight = true;
    else if (newX < this.x) this.facingRight = false;
    
    // Appliquer la nouvelle position
    this.x = newX;
    this.y = newY;
  }
  
  /**
   * Dessine le joueur sur le canvas
   * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
   * @param {number} camX - Décalage X de la caméra
   * @param {number} camY - Décalage Y de la caméra
   */
  draw(ctx, camX = 0, camY = 0) {
    // Ne pas dessiner si caché
    if (this.isHidden) return;
    
    ctx.save();
    
    // Dessiner le sprite en fonction de la direction
    if (!this.facingRight) {
      // Retourner horizontalement pour les mouvements vers la gauche
      ctx.translate(this.x - camX + this.width, this.y - camY);
      ctx.scale(-1, 1);
      
      ctx.drawImage(
        this.sprite,
        this.frame * SPRITE_WIDTH, 0,
        SPRITE_WIDTH, SPRITE_HEIGHT,
        0, 0,
        this.width, this.height
      );
    } else {
      // Dessin normal pour les mouvements vers la droite
      ctx.drawImage(
        this.sprite,
        this.frame * SPRITE_WIDTH, 0,
        SPRITE_WIDTH, SPRITE_HEIGHT,
        this.x - camX, this.y - camY,
        this.width, this.height
      );
    }
    
    ctx.restore();
  }
  
  /**
   * Active ou désactive la lampe du joueur
   * @returns {boolean} - Nouvel état de la lampe
   */
  toggleLight() {
    this.lightOn = !this.lightOn;
    return this.lightOn;
  }
  
  /**
   * Active ou désactive l'état caché du joueur
   * @returns {boolean} - Nouvel état caché
   */
  toggleHidden() {
    this.isHidden = !this.isHidden;
    return this.isHidden;
  }
}