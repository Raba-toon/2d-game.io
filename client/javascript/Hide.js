// Classe représentant un objet que le joueur peut ouvrir/fermer (ex : porte, casier, etc.)
export class Hide {
    constructor(x, y, isOpen = false) {
      this.x = x;               // Coordonnée X sur la grille
      this.y = y;               // Coordonnée Y sur la grille
      this.isOpen = isOpen;     // État ouvert ou fermé
    }
  
    // Change l'état (ouvert/fermé)
    toggle() {
      this.isOpen = !this.isOpen;
    }
  
    // Vérifie si le joueur est adjacent (haut, bas, gauche ou droite)
    isNear(player, tileSize) {
      const playerTileX = Math.floor((player.x + player.size / 2) / tileSize);
      const playerTileY = Math.floor((player.y + player.size / 2) / tileSize);
      const dx = Math.abs(playerTileX - this.x);
      const dy = Math.abs(playerTileY - this.y);
      return (dx + dy === 1); // Case voisine
    }
  
    // Affiche la cachette à l'écran
    draw(ctx, tileSize) {
      ctx.fillStyle = this.isOpen ? "#555" : "sienna";
      ctx.fillRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);
    }
  }
  
  // Classe représentant un endroit où le joueur peut se cacher (ex : buisson, placard, etc.)
  export class HidingSpot {
    constructor(x, y) {
      this.x = x;                  // Coordonnée X sur la grille
      this.y = y;                  // Coordonnée Y sur la grille
      this.isOccupied = false;     // Indique si un joueur est caché ici
    }
  
    // Vérifie si le joueur est exactement sur cette case
    isAt(player, tileSize) {
      const playerTileX = Math.floor((player.x + player.size / 2) / tileSize);
      const playerTileY = Math.floor((player.y + player.size / 2) / tileSize);
      return playerTileX === this.x && playerTileY === this.y;
    }
  
    // Dessine la cachette à l'écran
    draw(ctx, tileSize) {
      ctx.fillStyle = "#66bb66"; // Couleur verte = cachette
      ctx.fillRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);
    }
  
    // Active ou désactive le camouflage du joueur s’il est dans la cachette
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
  