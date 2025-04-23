/* Player.js with sprite-based animation */

const SPEED = 120;
const SPRITE_WIDTH = 32;
const SPRITE_HEIGHT = 32;
const FRAME_COUNT = 18;
const FRAME_DURATION = 0.1; // seconds per frame

// Load the sprite sheet (update the path to your sprite image)
const spriteImage = new Image();
spriteImage.src = '/client/images/players/baby-crawl-white.png';

export class Player {
  constructor(id, color) {
    this.id = id;
    this.color = color;
    this.size = SPRITE_WIDTH * 1.5;  // draw size (can scale)
    this.x = 100;
    this.y = 100;
    this.lightOn = true;       // state of the lamp
    this.isHidden = false;
    
    this.facingRight = true;

    // Animation state
    this.frame = 0;
    this.frameTime = 0;
  }

  // Check if two rectangles overlap
  rectsOverlap(a, b) {
    return !(  
      a.x + a.width  <= b.x ||
      a.x            >= b.x + b.width ||
      a.y + a.height <= b.y ||
      a.y            >= b.y + b.height
    );
  }

  // Collision with walls
  collidesWithWall(rect, map, tileSize) {
    const left   = Math.floor(rect.x / tileSize);
    const right  = Math.floor((rect.x + rect.width - 1) / tileSize);
    const top    = Math.floor(rect.y / tileSize);
    const bottom = Math.floor((rect.y + rect.height - 1) / tileSize);

    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        if (map[y]?.[x] === 1 || map[y]?.[x] === 2) {
          return true;
        }
      }
    }
    return false;
  }

  // Collision with other players
  collidesWithPlayers(rect, others) {
    return Object.values(others).some(other => {
      const box = { x: other.x, y: other.y, width: other.size, height: other.size };
      return this.rectsOverlap(rect, box);
    });
  }

  /**
   * Update player position and animation
   * @param {Object} keys       keys state
   * @param {number} dt         delta-time in seconds
   * @param {Array}  map        map grid
   * @param {number} tileSize   tile size in px
   * @param {Object} others     other players
   */
  update(keys, dt, map, /** tileSize */ tileSize, others) {   // ←← renommé
    
    let dirX = (keys['d'] ? 1 : 0) - (keys['a'] ? 1 : 0);
    let dirY = (keys['s'] ? 1 : 0) - (keys['w'] ? 1 : 0);

    if (dirX > 0) this.facingRight = true;
    else if (dirX < 0) this.facingRight = false;

    const len = Math.hypot(dirX, dirY);
    if (len) { dirX /= len; dirY /= len; }

    const moveX = dirX * SPEED * dt;
    const moveY = dirY * SPEED * dt;

    // collisions (inchangé, mais maintenant tileSize existe)
    const testX = { x: this.x + moveX, y: this.y, width: this.size, height: this.size };
    const wallX = this.collidesWithWall(testX, map, tileSize);
    const playerX = this.collidesWithPlayers(testX, others);
    if (!wallX && !playerX) this.x += moveX;

    const testY = { x: this.x, y: this.y + moveY, width: this.size, height: this.size };
    const wallY = this.collidesWithWall(testY, map, tileSize);
    const playerY = this.collidesWithPlayers(testY, others);
    if (!wallY && !playerY) this.y += moveY;

    if (!wallX && wallY) this.x += moveX;
    if (!wallY && wallX) this.y += moveY;

    /* animation locale */
    if (dirX || dirY) this.animate(dt);
    else { this.frame = 0; this.frameTime = 0; }
  }

  sendPosition(ws) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'position', id: this.id, x: this.x, y: this.y }));
    }
  }

  setPositionFromServer(newX, newY) {
    if (newX > this.x)      this.facingRight = true;
    else if (newX < this.x) this.facingRight = false;

    this.x = newX;
    this.y = newY;
  }

  animate(dt) {
    this.frameTime += dt;
    if (this.frameTime >= FRAME_DURATION) {
      this.frameTime -= FRAME_DURATION;
      this.frame = (this.frame + 1) % FRAME_COUNT;
    }
  }

  draw(ctx, camX = 0, camY = 0) {
    if(this.isHidden)
      return;
    ctx.save();
    if (!this.facingRight) {
      ctx.translate(this.x - camX + this.size, this.y - camY);
      ctx.scale(-1, 1);
      ctx.drawImage(spriteImage,
        this.frame * SPRITE_WIDTH, 0,
        SPRITE_WIDTH, SPRITE_HEIGHT,
        0, 0, this.size, this.size);
    } else {
      ctx.drawImage(spriteImage,
        this.frame * SPRITE_WIDTH, 0,
        SPRITE_WIDTH, SPRITE_HEIGHT,
        this.x - camX, this.y - camY,
        this.size, this.size);
    }
    ctx.restore();
  }
}
