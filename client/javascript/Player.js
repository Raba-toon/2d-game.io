const SPEED = 120;

class Player {
  constructor(id, color) {
    this.id    = id;
    this.color = color;
    this.size  = 30;  // largeur et hauteur du carré
    this.x     = 100;
    this.y     = 100;
  }

  // Vérifie si deux rectangles se chevauchent
  rectsOverlap(a, b) {
    return !(  
      a.x + a.width  <= b.x ||
      a.x            >= b.x + b.width ||
      a.y + a.height <= b.y ||
      a.y            >= b.y + b.height
    );
  }

  // Collision avec un mur de la map
  collidesWithWall(rect, map, tileSize) {
    const left   =  Math.floor(rect.x               / tileSize);
    const right  =  Math.floor((rect.x + rect.width  - 1) / tileSize);
    const top    =  Math.floor(rect.y               / tileSize);
    const bottom =  Math.floor((rect.y + rect.height - 1) / tileSize);

    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        if (map[y]?.[x] === 1) {
          return true;
        }
      }
    }
    return false;
  }

  // Collision avec les autres joueurs
  collidesWithPlayers(rect, others) {
    return Object.values(others).some(other => {
      const box = { x: other.x, y: other.y, width: other.size, height: other.size };
      return this.rectsOverlap(rect, box);
    });
  }

  /**
   * @param {Object} keys       état des touches
   * @param {number} dt         delta-time en secondes
   * @param {Array}  map        grille de la carte
   * @param {number} tileSize   taille d'une case en px
   * @param {Object} others     mapping id→Player pour collision joueurs
   */
  update(keys, dt, map, tileSize, others) {
    const dirX = (keys["ArrowRight"] ? 1 : 0) - (keys["ArrowLeft"] ? 1 : 0);
    const dirY = (keys["ArrowDown"]  ? 1 : 0) - (keys["ArrowUp"]   ? 1 : 0);

    const nextX = this.x + dirX * SPEED * dt;
    const nextY = this.y + dirY * SPEED * dt;

    const len = Math.hypot(dx, dy); // √(dx² + dy²)
    if (len > 0) {
      dx /= len;
      dy /= len;
    }
    // Tests pour chaque axe
    const testX = { x: nextX, y: this.y, width: this.size, height: this.size };
    const wallX = this.collidesWithWall(testX, map, tileSize);
    const playerX = this.collidesWithPlayers(testX, others);

    if (!wallX && !playerX) {
      this.x = nextX;
    }

    const testY = { x: this.x, y: nextY, width: this.size, height: this.size };
    const wallY = this.collidesWithWall(testY, map, tileSize);
    const playerY = this.collidesWithPlayers(testY, others);

    if (!wallY && !playerY) {
      this.y = nextY;
    }

    // Si bloqué sur les deux axes, on débloque en ignorant la collision joueur sur un axe
    const movedX = !wallX && !playerX;
    const movedY = !wallY && !playerY;
    if (!movedX && !movedY && (dirX !== 0 || dirY !== 0)) {
      // Priorité à l'horizontale si possible
      if (!wallX) {
        this.x = nextX;
      } else if (!wallY) {
        this.y = nextY;
      }
    }
  }

  sendPosition(ws) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "position",
        id:   this.id,
        x:    this.x,
        y:    this.y
      }));
    }
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}

// Assurez-vous d'exposer Player si vous utilisez modules
// export { Player };
