const SPEED = 120;

export class Player {
  constructor(id, color) {
    this.id    = id;
    this.color = color;
    this.size  = 30;
    this.x     = 100;
    this.y     = 100;
    this.lightOn = true;           // 🔆 état de la lampe

    //IMAGES
    this.image = new Image();
    this.image.src = "images/players/baby-crawl-white.png";
    this.frame = 0;          // Numéro de frame
    this.frameTimer = 0;     // Timer pour l'animation
    this.frameInterval = 0.2; // Temps entre frames (secondes)
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
// Dans Player.js
collidesWithWall(rect, map, tileSize) {
  const left   =  Math.floor(rect.x               / tileSize);
  const right  =  Math.floor((rect.x + rect.width  - 1) / tileSize);
  const top    =  Math.floor(rect.y               / tileSize);
  const bottom =  Math.floor((rect.y + rect.height - 1) / tileSize);

  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      if (map[y]?.[x] === 1 || map[y]?.[x] === 2) {
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
    // Calcul du vecteur direction
    let dirX = (keys["ArrowRight"] ? 1 : 0) - (keys["ArrowLeft"] ? 1 : 0);
    let dirY = (keys["ArrowDown"]  ? 1 : 0) - (keys["ArrowUp"]   ? 1 : 0);

    // Normalisation pour éviter un déplacement diagonal plus rapide
    const len = Math.hypot(dirX, dirY);
    if (len > 0) {
      dirX /= len;
      dirY /= len;
    }

    // Calcul du déplacement
    const moveX = dirX * SPEED * dt;
    const moveY = dirY * SPEED * dt;

    // Test de collision horizontal
    const testX = { x: this.x + moveX, y: this.y, width: this.size, height: this.size };
    const wallX = this.collidesWithWall(testX, map, tileSize);
    const playerX = this.collidesWithPlayers(testX, others);
    if (!wallX && !playerX) {
      this.x += moveX;
    }

    // Test de collision vertical
    const testY = { x: this.x, y: this.y + moveY, width: this.size, height: this.size };
    const wallY = this.collidesWithWall(testY, map, tileSize);
    const playerY = this.collidesWithPlayers(testY, others);
    if (!wallY && !playerY) {
      this.y += moveY;
    }

    // Si bloqué sur les deux axes, débloquer en forçant un axe si possible
    const movedX = !wallX && !playerX;
    const movedY = !wallY && !playerY;
    if (!movedX && !movedY && (dirX !== 0 || dirY !== 0)) {
      if (!wallX) this.x += moveX;
      else if (!wallY) this.y += moveY;
    }

    // Animation
    this.frameTimer += dt;
    if (this.frameTimer >= this.frameInterval) {
      this.frame = (this.frame + 1) % 18; // 18 frames 
      this.frameTimer = 0;
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

  draw(ctx, cameraX = 0, cameraY = 0) {
    ctx.drawImage(
      this.image,
      this.x - cameraX,
      this.y - cameraY,
      this.size,
      this.size
    );



    //ctx.fillStyle = this.color;
    //ctx.fillRect(
    //  this.x - cameraX,
    //  this.y - cameraY,
    //  this.size,
    //  this.size
    //);
  }
}

// Assurez-vous d'exposer Player si vous utilisez modules
// export { Player };
