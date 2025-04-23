// src/ui/UIManager.js

/**
 * Gestionnaire centralisé de l'interface utilisateur
 */
export class UIManager {
    constructor(gameState, eventEmitter) {
      this.state = gameState;
      this.events = eventEmitter;
      
      // Éléments UI
      this.loginFrame = null;
      this.playersList = null;
      this.logoutButton = null;
      
      // Lier les méthodes au contexte
      this.init = this.init.bind(this);
      this.createLoginScreen = this.createLoginScreen.bind(this);
      this.createPlayersList = this.createPlayersList.bind(this);
      this.createLogoutButton = this.createLogoutButton.bind(this);
      this.updatePlayersList = this.updatePlayersList.bind(this);
      this.showLoginScreen = this.showLoginScreen.bind(this);
      this.hideLoginScreen = this.hideLoginScreen.bind(this);
      this.showMessage = this.showMessage.bind(this);
      
      // Écouter les événements pertinents
      this.setupEventListeners();
    }
    
    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
      this.events.on('players:listUpdated', () => {
        this.updatePlayersList();
      });
      
      this.events.on('network:loginFailed', (message) => {
        this.showError(message || "Échec de la connexion");
      });
    }
    
    /**
     * Initialise l'interface utilisateur
     */
    init() {
      // Créer les éléments UI de base
      this.createPlayersList();
      
      // L'écran de login et le bouton de déconnexion sont créés selon les besoins
    }
    
    /**
     * Crée et affiche l'écran de connexion
     */
    createLoginScreen() {
      // Vérifier si l'écran existe déjà
      if (this.loginFrame) {
        this.loginFrame.style.display = "flex";
        return this.loginFrame;
      }
      
      // Créer les éléments
      this.loginFrame = document.createElement('div');
      this.loginFrame.id = 'frame_login';
      
      const inputName = document.createElement('input');
      inputName.placeholder = "Nom d'utilisateur";
      
      const buttonLogin = document.createElement('button');
      buttonLogin.innerText = "Se connecter";
      
      // Configurer les événements
      buttonLogin.addEventListener('click', () => {
        const username = inputName.value.trim();
        
        if (!username) {
          this.showError("Veuillez entrer un nom d'utilisateur");
          return;
        }
        
        // Déclencher l'événement de connexion
        this.events.emit('ui:login', username);
      });
      
      // Permettre l'envoi par la touche Entrée
      inputName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          buttonLogin.click();
        }
      });
      
      // Assembler et styler l'écran de connexion
      this.loginFrame.appendChild(inputName);
      this.loginFrame.appendChild(buttonLogin);
      document.body.appendChild(this.loginFrame);
      
      // Appliquer les styles
      this.loginFrame.style.position = "absolute";
      this.loginFrame.style.display = "flex";
      this.loginFrame.style.flexDirection = "column";
      this.loginFrame.style.justifyContent = "space-between";
      this.loginFrame.style.alignItems = "center";
      this.loginFrame.style.padding = "2rem";
      this.loginFrame.style.borderRadius = "1rem";
      this.loginFrame.style.backgroundColor = "rgba(0,0,0,0.5)";
      this.loginFrame.style.top = "50%";
      this.loginFrame.style.left = "50%";
      this.loginFrame.style.transform = "translate(-50%, -50%)";
      this.loginFrame.style.zIndex = "1001";
      
      // Espace entre les éléments
      inputName.style.marginBottom = "1rem";
      
      // Focus sur le champ de saisie
      inputName.focus();
      
      return this.loginFrame;
    }
    
    /**
     * Crée et ajoute la liste des joueurs au DOM
     */
    createPlayersList() {
      if (this.playersList) return this.playersList;
      
      this.playersList = document.createElement('div');
      this.playersList.id = 'players-list';
      
      // Styles pour la boîte
      this.playersList.style.position = 'absolute';
      this.playersList.style.top = '10px';
      this.playersList.style.right = '10px';
      this.playersList.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      this.playersList.style.color = 'white';
      this.playersList.style.padding = '15px';
      this.playersList.style.borderRadius = '5px';
      this.playersList.style.minWidth = '150px';
      this.playersList.style.fontFamily = 'Arial, sans-serif';
      this.playersList.style.fontSize = '14px';
      this.playersList.style.zIndex = '1000';
      
      document.body.appendChild(this.playersList);
      
      // Initialiser avec un contenu vide
      this.updatePlayersList();
      
      return this.playersList;
    }
    
    /**
     * Crée et ajoute le bouton de déconnexion
     */
    createLogoutButton() {
      if (this.logoutButton) return this.logoutButton;
      
      this.logoutButton = document.createElement('button');
      this.logoutButton.id = 'logout-button';
      this.logoutButton.textContent = 'Déconnexion';
      
      // Styles pour le bouton
      this.logoutButton.style.position = 'absolute';
      this.logoutButton.style.top = '10px';
      this.logoutButton.style.left = '10px';
      this.logoutButton.style.padding = '8px 15px';
      this.logoutButton.style.backgroundColor = '#ff4d4d';
      this.logoutButton.style.color = 'white';
      this.logoutButton.style.border = 'none';
      this.logoutButton.style.borderRadius = '5px';
      this.logoutButton.style.fontFamily = 'Arial, sans-serif';
      this.logoutButton.style.fontSize = '14px';
      this.logoutButton.style.cursor = 'pointer';
      this.logoutButton.style.zIndex = '1000';
      
      // Effets de survol
      this.logoutButton.addEventListener('mouseover', () => {
        this.logoutButton.style.backgroundColor = '#ff3333';
      });
      
      this.logoutButton.addEventListener('mouseout', () => {
        this.logoutButton.style.backgroundColor = '#ff4d4d';
      });
      
      // Action de déconnexion
      this.logoutButton.addEventListener('click', () => {
        this.events.emit('ui:logout');
      });
      
      document.body.appendChild(this.logoutButton);
      
      return this.logoutButton;
    }
    
    /**
     * Met à jour la liste des joueurs connectés
     */
    updatePlayersList() {
      if (!this.playersList) this.createPlayersList();
      
      // Vider la liste actuelle
      this.playersList.innerHTML = '';
      
      // Titre de la liste
      const title = document.createElement('h3');
      title.textContent = 'Joueurs connectés';
      title.style.marginTop = '0';
      title.style.marginBottom = '10px';
      this.playersList.appendChild(title);
      
      // Ajouter chaque joueur à la liste
      const ul = document.createElement('ul');
      ul.style.listStyleType = 'none';
      ul.style.padding = '0';
      ul.style.margin = '0';
      
      Object.entries(this.state.connectedPlayers).forEach(([id, username]) => {
        const li = document.createElement('li');
        li.textContent = username;
        
        // Mettre en évidence le joueur actuel
        if (id === this.state.playerInfo.id) {
          li.style.fontWeight = 'bold';
          li.textContent += ' (vous)';
        }
        
        li.style.padding = '3px 0';
        ul.appendChild(li);
      });
      
      this.playersList.appendChild(ul);
    }
    
    /**
     * Affiche l'écran de connexion
     */
    showLoginScreen() {
      if (!this.loginFrame) {
        this.createLoginScreen();
      } else {
        this.loginFrame.style.display = "flex";
      }
      
      // Masquer le bouton de déconnexion s'il existe
      if (this.logoutButton) {
        this.logoutButton.style.display = "none";
      }
    }
    
    /**
     * Masque l'écran de connexion
     */
    hideLoginScreen() {
      if (this.loginFrame) {
        this.loginFrame.style.display = "none";
      }
      
      // Afficher le bouton de déconnexion
      if (!this.logoutButton) {
        this.createLogoutButton();
      } else {
        this.logoutButton.style.display = "block";
      }
    }
    
    /**
     * Affiche un message d'erreur
     * @param {string} message - Message d'erreur à afficher
     */
    showError(message) {
      alert(message);
    }
    
    /**
     * Affiche un message d'information
     * @param {string} message - Message à afficher
     */
    showMessage(message) {
      const messageElement = document.createElement('div');
      messageElement.textContent = message;
      messageElement.style.position = 'absolute';
      messageElement.style.top = '50%';
      messageElement.style.left = '50%';
      messageElement.style.transform = 'translate(-50%, -50%)';
      messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      messageElement.style.color = 'white';
      messageElement.style.padding = '15px 25px';
      messageElement.style.borderRadius = '5px';
      messageElement.style.fontFamily = 'Arial, sans-serif';
      messageElement.style.fontSize = '16px';
      messageElement.style.zIndex = '2000';
      
      document.body.appendChild(messageElement);
      
      // Disparaître après 3 secondes
      setTimeout(() => {
        document.body.removeChild(messageElement);
      }, 3000);
    }
  }