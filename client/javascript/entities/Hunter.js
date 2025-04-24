// entities/Hunter.js
import { Entity } from './Entity.js';
import { HUNTER_SPEED } from '../utils/Constants.js';

export class Hunter extends Entity {
  constructor(id, x = 100, y = 100) {
    super(x, y, 40, 40); // Taille légèrement plus grande que les joueurs
    this.id = id;
    this.carriedPlayer = null;
    this.targetPlayer = null;
    this.color = 'red';
    this.pathfindingCooldown = 0;
  }
  
  update(deltaTime, map, tileSize, players) {
    // Logique de mouvement vers le joueur cible
    if (this.targetPlayer && players[this.targetPlayer]) {
      const target = players[this.targetPlayer];
      // Calculer le vecteur direction
      // Appliquer le mouvement
      // Gérer les collisions
    }
    
    // Si porte un joueur, le déplacer avec soi
    if (this.carriedPlayer && players[this.carriedPlayer]) {
      const carried = players[this.carriedPlayer];
      carried.x = this.x;
      carried.y = this.y;
    }
  }
  
  // Méthodes spécifiques au Hunter
  capturePlayer(playerId) {
    this.carriedPlayer = playerId;
    this.events.emit('hunter:playerCaptured', playerId);
  }
  
  releasePlayer() {
    const released = this.carriedPlayer;
    this.carriedPlayer = null;
    this.events.emit('hunter:playerReleased', released);
  }
  
  draw(ctx, camX = 0, camY = 0) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - camX, this.y - camY, this.width, this.height);
  }
}