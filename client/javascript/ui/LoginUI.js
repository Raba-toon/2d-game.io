// /src/ui/LoginUI.js

export class LoginUI {
    constructor(dependencies) {
      this.authService = dependencies.authService;
      this.onLogin = dependencies.onLogin || function() {};
      this.onLogout = dependencies.onLogout || function() {};
      this.webSocketManager = null; // Sera défini ultérieurement
      
      this.loginFrame = null;
      this.logoutButton = null;
    }
  
    /**
     * Définit la référence au WebSocketManager
     * @param {WebSocketManager} webSocketManager - Instance du gestionnaire WebSocket
     */
    setWebSocketManager(webSocketManager) {
      this.webSocketManager = webSocketManager;
    }
  
    /**
     * Affiche le formulaire de connexion
     */
    show() {
      // Si le formulaire existe déjà, l'afficher
      if (document.getElementById('frame_login')) {
        document.getElementById('frame_login').style.display = "flex";
        return;
      }
      
      // Créer le formulaire
      this.createLoginForm();
    }
  
    /**
     * Cache le formulaire de connexion
     */
    hide() {
      if (this.loginFrame) {
        this.loginFrame.style.display = "none";
      } else if (document.getElementById('frame_login')) {
        document.getElementById('frame_login').style.display = "none";
      }
    }
  
    /**
     * Crée le formulaire de connexion
     */
    createLoginForm() {
      // Créer les éléments du formulaire
      this.loginFrame = document.createElement('div');
      this.loginFrame.id = 'frame_login';
      
      const input = document.createElement('input');
      const button = document.createElement('button');
      
      // Configurer le bouton de connexion
      button.addEventListener('click', () => {
        const username = input.value;
        
        if (!username) {
          alert("Veuillez entrer un nom d'utilisateur");
          return;
        }
        
        // Déclencher l'événement de login
        this.onLogin(username);
      });
      
      // Permettre l'envoi en appuyant sur Entrée
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          button.click();
        }
      });
      
      // Configurer les textes
      button.innerText = "Se connecter";
      input.placeholder = "Nom d'utilisateur";
      
      // Assembler le formulaire
      this.loginFrame.append(input);
      this.loginFrame.append(button);
      document.body.append(this.loginFrame);
      
      // Appliquer les styles
      this.applyLoginFormStyles(this.loginFrame, input);
      
      // Focus sur le champ de saisie
      input.focus();
    }
  
    /**
     * Applique les styles au formulaire de connexion
     * @param {HTMLElement} frame - Élément conteneur du formulaire
     * @param {HTMLElement} input - Champ de saisie
     */
    applyLoginFormStyles(frame, input) {
      // Styles du conteneur
      frame.style.position = "absolute";
      frame.style.display = "flex";
      frame.style.flexDirection = "column";
      frame.style.justifyContent = "space-between";
      frame.style.alignItems = "center";
      frame.style.padding = "2rem";
      frame.style.borderRadius = "1rem";
      frame.style.backgroundColor = "rgba(0,0,0,0.5)";
      frame.style.top = "50%";
      frame.style.left = "50%";
      frame.style.transform = "translate(-50%, -50%)";
      frame.style.zIndex = "1001";
      
      // Espacement entre les éléments
      input.style.marginBottom = "1rem";
    }
  
    /**
     * Crée le bouton de déconnexion
     * @returns {HTMLElement} - Bouton de déconnexion
     */
    createLogoutButton() {
      // Ne pas créer le bouton s'il existe déjà
      if (document.getElementById('logout-button')) {
        return document.getElementById('logout-button');
      }
      
      // Créer le bouton
      this.logoutButton = document.createElement('button');
      this.logoutButton.id = 'logout-button';
      this.logoutButton.textContent = 'Déconnexion';
      
      // Appliquer les styles
      this.applyLogoutButtonStyles(this.logoutButton);
      
      // Ajouter l'action de déconnexion
      this.logoutButton.addEventListener('click', this.handleLogout.bind(this));
      
      // Ajouter au DOM
      document.body.appendChild(this.logoutButton);
      
      return this.logoutButton;
    }
  
    /**
     * Applique les styles au bouton de déconnexion
     * @param {HTMLElement} button - Bouton de déconnexion
     */
    applyLogoutButtonStyles(button) {
      // Styles de base
      button.style.position = 'absolute';
      button.style.top = '10px';
      button.style.left = '10px';
      button.style.padding = '8px 15px';
      button.style.backgroundColor = '#ff4d4d';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '5px';
      button.style.fontFamily = 'Arial, sans-serif';
      button.style.fontSize = '14px';
      button.style.cursor = 'pointer';
      button.style.zIndex = '1000';
      
      // Effets de survol
      button.addEventListener('mouseover', () => {
        button.style.backgroundColor = '#ff3333';
      });
      
      button.addEventListener('mouseout', () => {
        button.style.backgroundColor = '#ff4d4d';
      });
    }
  
    /**
     * Gère l'action de déconnexion
     */
    handleLogout() {
      // Déclencher l'événement de déconnexion
      this.onLogout();
      
      // Supprimer le bouton de déconnexion
      if (this.logoutButton) {
        this.logoutButton.remove();
        this.logoutButton = null;
      }
      
      // Afficher à nouveau le formulaire de login
      this.show();
    }
  }