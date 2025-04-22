// /src/core/Renderer.js
import { TILE_SIZE, LIGHT_RADIUS } from '../config/constants.js';
import { GAME_SETTINGS } from '../config/settings.js';

export class Renderer {
  constructor() {
    // Canvas principal pour le jeu
    this.gameCanvas = document.getElementById('gameCanvas');
    this.gameCtx = this.gameCanvas.getContext('2d');
    
    // Canvas pour l'overlay de lumière
    this.lightCanvas = document.getElementById('lightCanvas');
    this.lightCtx = this.lightCanvas.getContext('2d');
    
    // S'assurer que les canvases sont à la bonne taille
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas.bind(this));
  }
  
  resizeCanvas() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.gameCanvas.width = this.lightCanvas.width = w;
    this.gameCanvas.height = this.lightCanvas.height = h;
  }
  
  render(mapData, entities, localPlayer) {
    // Effacer le canvas du jeu
    this.gameCtx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
    
    // Calculer les offsets de caméra centrés sur le joueur local
    const cameraOffsetX = localPlayer.x - this.gameCanvas.width / 2 + localPlayer.size / 2;
    const cameraOffsetY = localPlayer.y - this.gameCanvas.height / 2 + localPlayer.size / 2;
    
    // Dessiner avec transformation de caméra
    this.gameCtx.save();
    this.gameCtx.translate(-cameraOffsetX, -cameraOffsetY);
    
    // Dessiner la grille (murs, sols, portes)
    this.drawGrid(mapData);
    
    // Dessiner les entités
    this.drawEntities(entities);
    
    // Restaurer le contexte
    this.gameCtx.restore();
    
    // Appliquer l'effet de halo de lumière
    this.renderLighting(entities, cameraOffsetX, cameraOffsetY);
  }
  
  drawGrid(mapData) {
    if (!mapData) return;
    
    for (let y = 0; y < mapData.length; y++) {
      for (let x = 0; x < mapData[y].length; x++) {
        // Déterminer la couleur en fonction du type de case
        let color;
        switch (mapData[y][x]) {
          case 1: // Mur
            color = GAME_SETTINGS.renderSettings.wallColor;
            break;
          case 0: // Sol
          default:
            color = GAME_SETTINGS.renderSettings.backgroundColor;
            break;
        }
        
        // Dessiner la case
        this.gameCtx.fillStyle = color;
        this.gameCtx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }
  
  drawEntities(entities) {
    // Dessiner les portes
    if (entities.doors) {
      Object.values(entities.doors).forEach(door => {
        door.draw(this.gameCtx);
      });
    }
    
    // Dessiner les cachettes
    if (entities.hidingSpots) {
      entities.hidingSpots.forEach(spot => {
        spot.draw(this.gameCtx);
      });
    }
    
    // Dessiner le joueur local
    if (entities.localPlayer) {
      entities.localPlayer.draw(this.gameCtx);
    }
    
    // Dessiner les autres joueurs
    if (entities.otherPlayers) {
      Object.values(entities.otherPlayers).forEach(player => {
        player.draw(this.gameCtx);
      });
    }
    
    // Dessiner les chasseurs
    if (entities.hunters) {
      entities.hunters.forEach(hunter => {
        hunter.draw(this.gameCtx);
      });
    }
  }
  
  renderLighting(entities, offsetX, offsetY) {
    // 1) Voile noir opaque
    this.lightCtx.globalCompositeOperation = "source-over";
    this.lightCtx.fillStyle = GAME_SETTINGS.renderSettings.overlayShadowColor;
    this.lightCtx.fillRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);

    // 2) Chaque cercle découpe un trou
    this.lightCtx.globalCompositeOperation = "destination-out";
    this.lightCtx.fillStyle = "white";  // opaque ⇒ supprime le noir
    
    // Récupérer tous les acteurs qui émettent de la lumière
    const allActors = [
      entities.localPlayer,
      ...Object.values(entities.otherPlayers || {})
    ];
    
    // Ajouter les chasseurs s'ils existent
    if (entities.hunters) {
      allActors.push(...entities.hunters);
    }
    
    // Dessiner un cercle de lumière pour chaque acteur
    allActors.forEach(actor => {
      if (!actor) return;
      
      const centerX = actor.x - offsetX + actor.size / 2;
      const centerY = actor.y - offsetY + actor.size / 2;

      this.lightCtx.beginPath();
      this.lightCtx.arc(centerX, centerY, LIGHT_RADIUS, 0, Math.PI * 2);
      this.lightCtx.fill();
    });
  }
}