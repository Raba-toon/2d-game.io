const SPEED = 130;

class Hunter {
  constructor(id, color) {
    this.id    = id;
    this.color = color;
    this.size  = 30;
    this.x     = 100;
    this.y     = 100;
    this.carriedPlayer = null; // id du joueur transporté
  }

  rectsOverlap(a, b) {
    return !(
      a.x + a.width  <= b.x ||
      a.x            >= b.x + b.width ||
      a.y + a.height <= b.y ||
      a.y            >= b.y + b.height
    );
  }

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

  collidesWithPlayers(rect, others) {
    for (const [id, other] of Object.entries(others)) {
      const box = { x: other.x, y: other.y, width: other.size, height: other.size };
      if (this.rectsOverlap(rect, box)) {
        return id; // retourne l'id du joueur touché
      }
    }
    return null;
  }

  update(keys, dt, map, tileSize, others) {
    let dirX = (keys["ArrowRight"] ? 1 : 0) - (keys["ArrowLeft"] ? 1 : 0);
    let dirY = (keys["ArrowDown"]  ? 1 : 0) - (keys["ArrowUp"]   ? 1 : 0);

    const len = Math.hypot(dirX, dirY);
    if (len > 0) {
      dirX /= len;
      dirY /= len;
    }

    const moveX = dirX * SPEED * dt;
    const moveY = dirY * SPEED * dt;

    const testX = { x: this.x + moveX, y: this.y, width: this.size, height: this.size };
    const wallX = this.collidesWithWall(testX, map, tileSize);
    if (!wallX) {
      this.x += moveX;
    }

    const testY = { x: this.x, y: this.y + moveY, width: this.size, height: this.size };
    const wallY = this.collidesWithWall(testY, map, tileSize);
    if (!wallY) {
      this.y += moveY;
    }

    // Si pas encore de joueur attrapé, on teste la collision joueur
    if (!this.carriedPlayer) {
      const overlapId = this.collidesWithPlayers({ x: this.x, y: this.y, width: this.size, height: this.size }, others);
      if (overlapId) {
        this.carriedPlayer = overlapId;
        if (others[overlapId]) {
          others[overlapId].isCarried = true;
          others[overlapId].color = "purple"; // couleur différente pour le joueur attrapé
        }
      }
    }

    // Si on transporte un joueur, on le positionne exactement sur le Hunter
    if (this.carriedPlayer && others[this.carriedPlayer]) {
      const carried = others[this.carriedPlayer];
      carried.x = this.x;
      carried.y = this.y;
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
    ctx.fillStyle = this.color;
    ctx.fillRect(
      this.x - cameraX,
      this.y - cameraY,
      this.size,
      this.size
    );
  }
}

// export { Hunter }; // décommenter si modules
