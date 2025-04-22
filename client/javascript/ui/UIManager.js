// /src/ui/UIManager.js
import { LoginUI } from './LoginUI.js';
import { PlayersListUI } from './PlayersListUI.js';
import { GameUI } from './GameUI.js';

export class UIManager {
  constructor(dependencies) {
    this.authService = dependencies.authService;
    this.webSocketManager = null; // Sera défini ultérieurement
    
    // Interfaces
    this.loginUI = new LoginUI({
      authService: this.authService,
      onLogin: dependencies.onLogin,
      onLogout: dependencies.onLogout
    });
    
    this.playersListUI = new PlayersListUI({
      authService: this.authService
    });
    
    this.gameUI = new GameUI();
    
    // État de l'interface
    this.isLoginVisible = false;
  }

  /**
   * Définit la référence au WebSocketManager
   * @param {WebSocketManager} webSocketManager - Instance du gestionnaire WebSocket
   */
  setWebSocketManager(webSocketManager) {
    this.webSocketManager = webSocketManager;
    // Passer également aux sous-composants si nécessaire
    this.loginUI.setWebSocketManager(webSocketManager);
  }

  /**
   * Initialise l'interface utilisateur
   */
  initialize() {
    console.log("Initialisation de l'interface utilisateur");
    
    // Créer les composants d'interface
    this.playersListUI.createPlayersList();
    
    // Afficher le login si nécessaire
    if (!this.authService.isLoggedIn()) {
      this.showLogin();
    } else {
      this.createLogoutButton();
    }
  }

  /**
   * Affiche le formulaire de login
   */
  showLogin() {
    if (!this.isLoginVisible) {
      console.log("Affichage du formulaire de login");
      this.loginUI.show();
      this.isLoginVisible = true;
    }
  }

  /**
   * Cache le formulaire de login
   */
  hideLogin() {
    if (this.isLoginVisible) {
      console.log("Masquage du formulaire de login");
      this.loginUI.hide();
      this.isLoginVisible = false;
    }
  }

  /**
   * Crée et affiche le bouton de déconnexion
   */
  createLogoutButton() {
    this.loginUI.createLogoutButton();
  }

  /**
   * Met à jour la liste des joueurs
   * @param {Object} players - Liste des joueurs {id: username}
   */
  updatePlayersList(players) {
    this.playersListUI.updatePlayersList(players);
  }

  /**
   * Met à jour l'état du jeu dans l'interface
   * @param {Object} gameState - État du jeu
   */
  updateGameState(gameState) {
    this.gameUI.updateGameState(gameState);
  }

  /**
   * Affiche le résultat de la partie
   * @param {Object} result - Résultat de la partie
   */
  showGameResult(result) {
    this.gameUI.showGameResult(result);
  }

  /**
   * Affiche un message à l'utilisateur
   * @param {string} message - Message à afficher
   * @param {string} type - Type de message (info, error, success)
   */
  showMessage(message, type = 'info') {
    // Créer un élément de message
    const msgElement = document.createElement('div');
    msgElement.textContent = message;
    msgElement.classList.add('game-message', `message-${type}`);
    
    // Styles
    msgElement.style.position = 'absolute';
    msgElement.style.top = '20px';
    msgElement.style.left = '50%';
    msgElement.style.transform = 'translateX(-50%)';
    msgElement.style.padding = '10px 20px';
    msgElement.style.backgroundColor = type === 'error' ? 'rgba(255,0,0,0.7)' : 'rgba(0,0,0,0.7)';
    msgElement.style.color = 'white';
    msgElement.style.borderRadius = '5px';
    msgElement.style.zIndex = '2000';
    
    // Ajouter au DOM
    document.body.appendChild(msgElement);
    
    // Supprimer après un délai
    setTimeout(() => {
      msgElement.style.opacity = '0';
      msgElement.style.transition = 'opacity 0.5s ease';
      
      setTimeout(() => {
        document.body.removeChild(msgElement);
      }, 500);
    }, 3000);
  }
}