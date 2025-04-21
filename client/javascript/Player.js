const SPEED = 120;
const SIZE  = 30;

class Player {
  constructor(id, color) {
    this.id     = id;
    this.color  = color;
    this.size  = 30;  
    this.x      = 100;
    this.y      = 100;
    this.speed = 5;
  }

  collidesWithWall(rect, map) {
    const left   = Math.floor(rect.x / SIZE);
    const right  = Math.floor((rect.x + rect.width - 1) / SIZE);
    const top    = Math.floor(rect.y / SIZE);
    const bottom = Math.floor((rect.y + rect.height - 1) / SIZE);
  
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        if (map[y]?.[x] === 1) {
          return true; // collision avec un mur
        }
      }
    }
  
    return false;
  }

  update(keys, dt, map) {
    const moveX = (keys["ArrowRight"] ? 1 : 0) - (keys["ArrowLeft"] ? 1 : 0);
    const moveY = (keys["ArrowDown"]  ? 1 : 0) - (keys["ArrowUp"]   ? 1 : 0);
  
    const nextX = this.x + moveX * SPEED * dt;
    const nextY = this.y + moveY * SPEED * dt;
  
    // 1) Tester le déplacement horizontal
    const testX = {
      x: nextX,
      y: this.y,
      width: this.size,
      height: this.size
    };
    if (!collidesWithWall(testX, map)) {
      this.x = nextX;
    }
  
    // 2) Tester le déplacement vertical
    const testY = {
      x: this.x,
      y: nextY,
      width: this.size,
      height: this.size
    };
    if (!collidesWithWall(testY, map)) {
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
