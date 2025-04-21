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
    let nextX = this.x;
    let nextY = this.y;

    if (keys["ArrowUp"])    this.y -= SPEED * dt;
    if (keys["ArrowDown"])  this.y += SPEED * dt;
    if (keys["ArrowLeft"])  this.x -= SPEED * dt;
    if (keys["ArrowRight"]) this.x += SPEED * dt;

    const tileX = Math.floor(nextX);
    const tileY = Math.floor(nextY);
    
    // 1) Horizontal test
    const testX = {
      x:      tileX,
      y:      this.y,
      width:  this.size,
      height: this.size
    };
    if (!this.collidesWithWall(testX, map)) {
      this.x = tileX;
    }
  
    // 2) Vertical tests
    const testY = {
      x:      this.x,
      y:      tileY,
      width:  this.size,
      height: this.size
    };
    if (!this.collidesWithWall(testY, map)) {
      this.y = tileY;
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
