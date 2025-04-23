// src/systems/RenderSystem.js
import { TILE_SIZE, LIGHT_RADIUS } from '/utils/Constants.js';

/**
 * Système responsable du rendu graphique du jeu
 */
export class RenderSystem {
  constructor(gameState) {
    this.state = gameState;
    
    // Canvas
    this.gameCanvas = null;
    this.gameCtx = null;
    this.lightCanvas = null;
    this.lightCtx = null;
    
    // État du rendu
    this.cameraX = 0;
    this.cameraY = 0;
    
    // Lier les méthodes au contexte
    this.render = this.render.bind(this);
    this.resizeCanvases = this.resizeCanvases.bind(this);
  }
  
  /**
   * Initialise les canvas et leurs contextes
   */
  initCanvases() {
    // Canvas principal pour le jeu
    this.gameCanvas = document.getElementById('gameCanvas');
    if (!this.gameCanvas) {
      this.gameCanvas = document.createElement('canvas');
      this.gameCanvas.id = 'gameCanvas';
      document.body.appendChild(this.gameCanvas);
    }
    this.gameCtx = this.gameCanvas.getContext('2d');
    
    // Canvas pour l'effet de lumière
    this.lightCanvas = document.getElementById('lightCanvas');
    if (!this.lightCanvas) {
      this.lightCanvas = document.createElement('canvas');
      this.lightCanvas.id = 'lightCanvas';
      this.lightCanvas.style.position = 'absolute';
      this.lightCanvas.style.top = '0';
      this.lightCanvas.style.left = '0';
      this.lightCanvas.style.pointerEvents = 'none'; // Pour que les clics passent à travers
      document.body.appendChild(this.lightCanvas);
    }
    this.lightCtx = this.lightCanvas.getContext('2d');
    
    // Redimensionner les canvas
    this.resizeCanvases();
  }
  
  /**
   * Redimensionne les canvas à la taille de la fenêtre
   */
  resizeCanvases() {
    if (!this.gameCanvas || !this.lightCanvas) return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.gameCanvas.width = this.lightCanvas.width = width;
    this.gameCanvas.height = this.lightCanvas.height = height;
  }
  
  /**
   * Effectue le rendu de la scène de jeu
   */
  render() {
    if (!this.gameCtx || !this.lightCtx || !this.state.mapData) return;
    
    // Effacer les canvas
    this.gameCtx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
    
    // Ne dessiner que si un joueur est connecté
    if (!this.state.isPlayerLoggedIn()) return;
    
    // Calculer la position de la caméra centrée sur le joueur local
    const localPlayer = this.state.localPlayer;
    this.cameraX = localPlayer.x - this.gameCanvas.width / 2 + localPlayer.size / 2;
    this.cameraY = localPlayer.y - this.gameCanvas.height / 2 + localPlayer.size / 2;
    
    // Dessiner la scène avec décalage de caméra
    this.gameCtx.save();
    this.gameCtx.translate(-this.cameraX, -this.cameraY);
    
    // Dessiner la grille et les éléments du niveau
    this.renderGrid();
    
    // Dessiner le joueur local
    localPlayer.draw(this.gameCtx);
    
    // Dessiner les autres joueurs
    Object.values(this.state.remotePlayers).forEach(player => {
      player.draw(this.gameCtx);
    });
    
    // Dessiner les chasseurs
    Object.values(this.state.hunters).forEach(hunter => {
        hunter.draw(this.gameCtx, this.cameraX, this.cameraY);
      });
    
    this.gameCtx.restore();
    
    // Appliquer l'effet de halo de lumière
    this.renderLighting();

    
  }
  
  /**
   * Dessine la grille du niveau, les portes et les cachettes
   */
  renderGrid() {
    const map = this.state.mapData;
    if (!map) return;
    
    // Dessiner les tuiles
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        this.gameCtx.fillStyle = map[y][x] === 1 ? "#333" : "#eee";
        this.gameCtx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
    
    // Dessiner les portes
    for (const key in this.state.doors) {
      const [x, y] = key.split(',').map(Number);
      const door = this.state.doors[key];
      
      if (door.draw) {
        // Si c'est un objet Door, utiliser sa méthode de dessin
        door.draw(this.gameCtx, TILE_SIZE);
      } else {
        // Sinon, dessiner une représentation basique
        const isOpen = door === true;
        if (!isOpen) {
          this.gameCtx.fillStyle = '#8B4513'; // Marron pour porte fermée
          this.gameCtx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }
    
    // Dessiner les cachettes
    for (const key in this.state.hidingSpots) {
      const spot = this.state.hidingSpots[key];
      spot.draw(this.gameCtx, TILE_SIZE);
    }
  }
  
  /**
   * Applique l'effet de halo de lumière sur le canvas dédié
   */
  renderLighting() {
    // Remplir l'écran avec du noir opaque
    this.lightCtx.globalCompositeOperation = "source-over";
    this.lightCtx.fillStyle = "black";
    this.lightCtx.fillRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);
    
    // Configurer le mode de composition pour "percer" l'obscurité
    this.lightCtx.globalCompositeOperation = "destination-out";
    this.lightCtx.fillStyle = "white";
    
    // Dessiner un cercle lumineux pour chaque joueur dont la lampe est allumée
    const allPlayers = [
      this.state.localPlayer,
      ...Object.values(this.state.remotePlayers)
    ];
    
    allPlayers.forEach(player => {
      if (!player.lightOn) return; // Ne pas dessiner si la lampe est éteinte
      
      const centerX = player.x - this.cameraX + player.size / 2;
      const centerY = player.y - this.cameraY + player.size / 2;
      
      this.lightCtx.beginPath();
      this.lightCtx.arc(centerX, centerY, LIGHT_RADIUS, 0, Math.PI * 2);
      this.lightCtx.fill();
    });
  }
}