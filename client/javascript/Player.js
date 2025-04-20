const SPEED = 120;
const SIZE  = 30;

class Player {
  constructor(id, color) {
    this.id     = id;
    this.color  = color;
    this.x      = 50;
    this.y      = 50;
  }


  update(keys, dt) {
    if (keys["ArrowUp"])    this.y -= SPEED * dt;
    if (keys["ArrowDown"])  this.y += SPEED * dt;
    if (keys["ArrowLeft"])  this.x -= SPEED * dt;
    if (keys["ArrowRight"]) this.x += SPEED * dt;
  }

  sendPosition(ws) {
    ws.send(JSON.stringify({
      type: "position",
      id:   this.id,
      x:    this.x,
      y:    this.y
    }));
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, SIZE, SIZE);
  }
}
