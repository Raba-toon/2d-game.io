// /src/core/GameLoop.js

export class GameLoop {
    constructor(dependencies) {
      this.renderer = dependencies.renderer;
      this.entityManager = dependencies.entityManager;
      this.mapManager = dependencies.mapManager;
      this.inputManager = dependencies.inputManager;
      this.webSocketManager = dependencies.webSocketManager;
      this.gameStateService = dependencies.gameStateService;
      this.authService = dependencies.authService;
      
      this.lastTimestamp = performance.now();
      this.isRunning = false;
      this.lastToggleDoorTime = 0; // Pour éviter les multiples actions de toggle rapprochées
    }
  
    start() {
      if (!this.isRunning) {
        this.isRunning = true;
        this.loop(performance.now());
      }
    }
  
    stop() {
      this.isRunning = false;
    }
  
    loop(timestamp) {
      // Calculer delta time en secondes
      const dt = (timestamp - this.lastTimestamp) / 1000;
      this.lastTimestamp = timestamp;
  
      // Traiter les entrées utilisateur
      this.processInput(dt);
      
      // Mettre à jour l'état du jeu
      this.update(dt);
      
      // Rendre le jeu
      this.render();
  
      // Continuer la boucle si toujours en cours
      if (this.isRunning) {
        requestAnimationFrame(this.loop.bind(this));
      }
    }
  
    processInput(dt) {
      // Ne pas traiter les entrées si l'utilisateur n'est pas connecté
      if (!this.authService.isLoggedIn()) return;
      
      const keys = this.inputManager.getKeys();
      const localPlayer = this.entityManager.getLocalPlayer();
      
      // Pas de traitement si pas de joueur local
      if (!localPlayer) return;
      
      // Gestion de l'ouverture/fermeture des portes
      const now = performance.now();
      if ((keys[' '] || keys['Space']) && now - this.lastToggleDoorTime > 300) {
        console.log("Tentative d'actionnement de porte");
        const doorCoords = this.entityManager.toggleDoorNearPlayer(localPlayer);
        if (doorCoords) {
          console.log("Porte trouvée, envoi au serveur:", doorCoords);
          this.webSocketManager.sendToggleDoor(doorCoords.x, doorCoords.y);
          this.lastToggleDoorTime = now;
        }
        this.inputManager.clearKey(' ');
        this.inputManager.clearKey('Space');
      }
    }
  
    update(dt) {
      // Ne mettre à jour que si l'utilisateur est connecté
      if (!this.authService.isLoggedIn()) return;
      
      // Mise à jour du joueur local
      const localPlayer = this.entityManager.getLocalPlayer();
      if (localPlayer) {
        // Mise à jour de la position du joueur
        localPlayer.update(
          this.inputManager.getKeys(), 
          dt, 
          this.mapManager.getMapData(), 
          this.entityManager.getOtherPlayers()
        );
        
        // Envoyer la position au serveur
        this.webSocketManager.sendPlayerPosition(localPlayer);
      }
    }
  
    render() {
      // Ne rendre que si la carte est chargée et le joueur connecté
      if (!this.mapManager.isMapLoaded() || !this.authService.isLoggedIn()) return;
      
      // Obtenir le joueur local pour centrer la caméra
      const localPlayer = this.entityManager.getLocalPlayer();
      
      // Vérifier que le joueur local existe
      if (!localPlayer) return;
      
      // Effectuer le rendu
      this.renderer.render(
        this.mapManager.getMapData(),
        this.entityManager.getAllEntities(),
        localPlayer
      );
    }
  }