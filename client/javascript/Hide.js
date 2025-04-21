export class HidingSpot {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.isOccupied = false;
    }
  
    isNear(player, tileSize) {
      const playerTileX = Math.floor((player.x + player.size / 2) / tileSize);
      const playerTileY = Math.floor((player.y + player.size / 2) / tileSize);
      const dx = Math.abs(playerTileX - this.x);
      const dy = Math.abs(playerTileY - this.y);
      return (dx + dy === 1);
    }
  
    draw(ctx, tileSize) {
      ctx.fillStyle = "#66bb66";
      ctx.fillRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);
    }
  }