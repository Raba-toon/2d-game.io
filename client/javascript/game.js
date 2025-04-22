// /src/game.js
// Point d'entrée principal du jeu

// Importations des modules
import { GameLoop } from './core/GameLoop.js';
import { Renderer } from './core/Renderer.js';
import { MapManager } from './managers/MapManager.js';
import { EntityManager } from './managers/EntityManager.js';
import { CollisionManager } from './managers/CollisionManager.js';
import { WebSocketManager } from './managers/WebSocketManager.js';
import { AuthService } from './services/AuthService.js';
import { GameStateService } from './services/GameStateService.js';
import { UIManager } from './ui/UIManager.js';
import { InputManager } from './utils/InputManager.js';

/**
 * Classe principale du jeu
 */
class Game {
  constructor() {
    // Initialiser les différents services et gestionnaires
    this.authService = new AuthService();
    this.inputManager = new InputManager();
    this.entityManager = new EntityManager();
    
    this.uiManager = new UIManager({
      authService: this.authService,
      onLogin: this.handleLogin.bind(this),
      onLogout: this.handleLogout.bind(this)
    });
    
    this.gameStateService = new GameStateService({
      uiManager: this.uiManager,
      entityManager: this.entityManager
    });
    
    this.mapManager = new MapManager(this.entityManager);
    
    this.collisionManager = new CollisionManager(
      this.mapManager,
      this.entityManager
    );
    
    // Les dépendances croisées doivent être gérées après l'initialisation
    this.webSocketManager = new WebSocketManager({
      authService: this.authService,
      entityManager: this.entityManager,
      mapManager: this.mapManager,
      gameStateService: this.gameStateService,
      uiManager: this.uiManager
    });
    
    this.renderer = new Renderer();
    
    // Configurer l'UI pour utiliser le webSocketManager
    this.uiManager.setWebSocketManager(this.webSocketManager);
    
    // Créer la boucle de jeu
    this.gameLoop = new GameLoop({
      renderer: this.renderer,
      entityManager: this.entityManager,
      mapManager: this.mapManager,
      inputManager: this.inputManager,
      webSocketManager: this.webSocketManager,
      gameStateService: this.gameStateService,
      authService: this.authService
    });
  }

  /**
   * Initialise le jeu
   */
  async initialize() {
    console.log("Initialisation du jeu...");
    
    // Initialiser l'interface utilisateur
    this.uiManager.initialize();
    
    // Connecter au serveur WebSocket
    try {
      await this.webSocketManager.connect();
      console.log("Connexion WebSocket établie avec succès");
      
      // Démarrer la boucle de jeu
      this.gameLoop.start();
      console.log("Boucle de jeu démarrée");
    } catch (error) {
      console.error("Erreur lors de l'initialisation du jeu:", error);
      this.uiManager.showMessage("Erreur de connexion au serveur", "error");
    }
  }

  /**
   * Gère la connexion d'un utilisateur
   * @param {string} username - Nom d'utilisateur
   */
  handleLogin(username) {
    console.log("Tentative de connexion avec:", username);
    this.webSocketManager.sendLoginRequest(username);
  }

  /**
   * Gère la déconnexion d'un utilisateur
   */
  handleLogout() {
    console.log("Déconnexion...");
    this.webSocketManager.sendLogoutRequest();
    this.authService.clearPlayerInfo();
    this.uiManager.showLogin();
    
    // Réinitialiser les données du jeu
    this.entityManager.localPlayer = null;
    this.entityManager.otherPlayers = {};
  }
}

// Initialiser le jeu lorsque la page est chargée
window.addEventListener('load', () => {
  console.log("Page chargée, démarrage du jeu");
  const game = new Game();
  game.initialize();
});