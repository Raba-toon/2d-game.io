export class HidingSpot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.isOccupied = false;
  }

  // Permet d'interagir si le joueur est adjacent (comme pour les portes)
  isNear(player, tileSize) {
    const playerTileX = Math.floor((player.x + player.size / 2) / tileSize);
    const playerTileY = Math.floor((player.y + player.size / 2) / tileSize);
    const dx = Math.abs(playerTileX - this.x);
    const dy = Math.abs(playerTileY - this.y);
    return (dx + dy === 1);
  }

  // Vérifie si le joueur est *exactement* dessus (utile pour cacher automatiquement si tu veux plus tard)
  isAt(player, tileSize) {
    const playerTileX = Math.floor((player.x + player.size / 2) / tileSize);
    const playerTileY = Math.floor((player.y + player.size / 2) / tileSize);
    return playerTileX === this.x && playerTileY === this.y;
  }

  draw(ctx, tileSize) {
    ctx.fillStyle = "#66bb66"; // couleur verte
    ctx.fillRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);
  }
}
