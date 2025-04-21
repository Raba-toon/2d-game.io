export class Door {
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
      return Math.abs(playerTileX - this.x) <= 1 && Math.abs(playerTileY - this.y) <= 1;
  }

  draw(ctx, tileSize) {
      ctx.fillStyle = this.isOpen ? "#555" : "sienna"; // gris clair si ouvert, brun si fermé
      ctx.fillRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);
  }
}
