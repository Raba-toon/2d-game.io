// Dans js/systems/RenderSystem.js

export class RenderSystem {
    constructor(gameState, eventEmitter) {
      this.state = gameState;
      this.events = eventEmitter;
      this.debugCanvas = null;
      this.debugCtx = null;
    }
    
    // Crée un canvas de débogage pour tester le rendu
    startDebugRender() {
      // Créer un canvas de débogage qui se superpose au jeu
      if (!this.debugCanvas) {
        this.debugCanvas = document.createElement('canvas');
        this.debugCanvas.id = 'debug-canvas';
        this.debugCanvas.style.position = 'absolute';
        this.debugCanvas.style.top = '0';
        this.debugCanvas.style.left = '0';
        this.debugCanvas.style.pointerEvents = 'none'; // Les clics passent à travers
        this.debugCanvas.style.zIndex = '999';
        this.debugCanvas.style.opacity = '0.7'; // Semi-transparent
        this.debugCanvas.width = window.innerWidth;
        this.debugCanvas.height = window.innerHeight;
        document.body.appendChild(this.debugCanvas);
        this.debugCtx = this.debugCanvas.getContext('2d');
      }
      
      // Démarrer le rendu de débogage
      this.renderDebug();
      console.log("Rendu de débogage activé");
    }
    
    // Fonction de rendu de débogage
    renderDebug() {
      if (!this.debugCtx) return;
      
      // Effacer le canvas
      this.debugCtx.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);
      
      // Dessiner un cadre
      this.debugCtx.strokeStyle = 'lime';
      this.debugCtx.lineWidth = 2;
      this.debugCtx.strokeRect(10, 10, this.debugCanvas.width - 20, this.debugCanvas.height - 20);
      
      // Texte de débogage
      this.debugCtx.fillStyle = 'lime';
      this.debugCtx.font = '14px monospace';
      this.debugCtx.fillText('Nouveau système actif - Mode débogage', 20, 30);
      
      // Afficher la position du joueur local s'il existe
      if (this.state.localPlayer && this.state.localPlayer.x) {
        this.debugCtx.fillText(`Position du joueur: x=${Math.round(this.state.localPlayer.x)}, y=${Math.round(this.state.localPlayer.y)}`, 20, 50);
      }
      
      // Continuer le rendu
      requestAnimationFrame(() => this.renderDebug());
    }
  }