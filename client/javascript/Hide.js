export class Hide {
    constructor(x, y, isOpen = false) {
      this.x = x;
      this.y = y;
      this.isOpen = isOpen;
    }
  
    toggle() {
      this.isOpen = !this.isOpen;
    }
  
    isNear(player, tileSize) {
      const playerTileX = Math.floor((player.x + player.size / 2) / tileSize);
      const playerTileY = Math.floor((player.y + player.size / 2) / tileSize);
      const dx = Math.abs(playerTileX - this.x);
      const dy = Math.abs(playerTileY - this.y);
      return (dx + dy === 1);
    }
  
    draw(ctx, tileSize) {
      ctx.fillStyle = this.isOpen ? "#555" : "sienna";
      ctx.fillRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);
    }
  }
  
  export class HidingSpot {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.isOccupied = false;
    }
  
    isAt(player, tileSize) {
      const playerTileX = Math.floor((player.x + player.size / 2) / tileSize);
      const playerTileY = Math.floor((player.y + player.size / 2) / tileSize);
      return playerTileX === this.x && playerTileY === this.y;
    }
  
    draw(ctx, tileSize) {
      ctx.fillStyle = "#66bb66";
      ctx.fillRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);
    }
  
    hidePlayerIfInside(player, tileSize) {
      if (this.isAt(player, tileSize)) {
        player.isHidden = true;
        this.isOccupied = true;
      } else {
        if (this.isOccupied && player.isHidden) {
          player.isHidden = false;
          this.isOccupied = false;
        }
      }
    }
  }
  