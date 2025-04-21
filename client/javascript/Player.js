const SPEED     = 120;
const PLAYER_W  = 30;

class Player {
  constructor(id, color) {
    this.id    = id;
    this.color = color;
    this.x     = 100;
    this.y     = 100;
    this.size  = PLAYER_W;
  }

  collidesWithWall(rect, map, tileSize) {
    const left   =  Math.floor(rect.x               / tileSize);
    const right  =  Math.floor((rect.x + rect.width  - 1) / tileSize);
    const top    =  Math.floor(rect.y               / tileSize);
    const bottom =  Math.floor((rect.y + rect.height - 1) / tileSize);

    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        if (map[y]?.[x] === 1) return true;
      }
    }
    return false;
  }

  update(keys, dt, map, tileSize) {
    const dirX = (keys["ArrowRight"] ? 1 : 0) - (keys["ArrowLeft"] ? 1 : 0);
    const dirY = (keys["ArrowDown"]  ? 1 : 0) - (keys["ArrowUp"]   ? 1 : 0);

    const nextX = this.x + dirX * SPEED * dt;
    const nextY = this.y + dirY * SPEED * dt;

    // Horizontal
    const testX = { x: nextX, y: this.y, width: this.size, height: this.size };
    if (!this.collidesWithWall(testX, map, tileSize)) {
      this.x = nextX;
    }

    // Vertical
    const testY = { x: this.x, y: nextY, width: this.size, height: this.size };
    if (!this.collidesWithWall(testY, map, tileSize)) {
      this.y = nextY;
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
