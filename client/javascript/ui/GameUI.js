// /src/ui/GameUI.js

export class GameUI {
    constructor() {
      this.gameOverlay = null;
      this.objectivesPanel = null;
    }
  
    /**
     * Initialise l'interface du jeu
     */
    initialize() {
      // Créer le panneau d'objectifs
      this.createObjectivesPanel();
    }
  
    /**
     * Crée le panneau d'objectifs
     */
    createObjectivesPanel() {
      // Ne pas créer le panneau s'il existe déjà
      if (document.getElementById('objectives-panel')) {
        this.objectivesPanel = document.getElementById('objectives-panel');
        return this.objectivesPanel;
      }
      
      // Créer l'élément conteneur
      this.objectivesPanel = document.createElement('div');
      this.objectivesPanel.id = 'objectives-panel';
      
      // Appliquer les styles
      this.applyObjectivesPanelStyles(this.objectivesPanel);
      
      // Ajouter au DOM
      document.body.appendChild(this.objectivesPanel);
      
      // Cacher par défaut
      this.objectivesPanel.style.display = 'none';
      
      return this.objectivesPanel;
    }
  
    /**
     * Applique les styles au panneau d'objectifs
     * @param {HTMLElement} panel - Panneau d'objectifs
     */
    applyObjectivesPanelStyles(panel) {
      // Styles de base
      panel.style.position = 'absolute';
      panel.style.bottom = '10px';
      panel.style.left = '10px';
      panel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      panel.style.color = 'white';
      panel.style.padding = '15px';
      panel.style.borderRadius = '5px';
      panel.style.minWidth = '200px';
      panel.style.fontFamily = 'Arial, sans-serif';
      panel.style.fontSize = '14px';
      panel.style.zIndex = '1000';
    }
  
    /**
     * Met à jour l'état du jeu dans l'interface
     * @param {Object} gameState - État du jeu
     */
    updateGameState(gameState) {
      // Si le panneau n'existe pas, le créer
      if (!this.objectivesPanel) {
        this.createObjectivesPanel();
      }
      
      // Afficher le panneau si une partie est en cours
      if (gameState.inProgress) {
        this.objectivesPanel.style.display = 'block';
        
        // Mettre à jour le contenu du panneau
        this.objectivesPanel.innerHTML = '';
        
        // Titre du panneau
        const title = document.createElement('h3');
        title.textContent = 'Objectifs';
        title.style.marginTop = '0';
        title.style.marginBottom = '10px';
        this.objectivesPanel.appendChild(title);
        
        // Liste des objectifs
        if (gameState.objectives && gameState.objectives.length > 0) {
          const ul = document.createElement('ul');
          ul.style.listStyleType = 'none';
          ul.style.padding = '0';
          ul.style.margin = '0';
          
          gameState.objectives.forEach(objective => {
            const li = document.createElement('li');
            li.textContent = objective.description;
            
            // Ajouter une marque pour les objectifs complétés
            if (objective.completed) {
              li.style.textDecoration = 'line-through';
              li.style.color = '#aaa';
            }
            
            li.style.padding = '3px 0';
            ul.appendChild(li);
          });
          
          this.objectivesPanel.appendChild(ul);
        } else {
          const noObjectives = document.createElement('p');
          noObjectives.textContent = 'Aucun objectif défini';
          this.objectivesPanel.appendChild(noObjectives);
        }
      } else {
        // Cacher le panneau si aucune partie en cours
        this.objectivesPanel.style.display = 'none';
      }
    }
  
    /**
     * Affiche le résultat de la partie
     * @param {Object} result - Résultat de la partie
     */
    showGameResult(result) {
      // Créer l'overlay de fin de partie
      if (!this.gameOverlay) {
        this.gameOverlay = document.createElement('div');
        
        // Appliquer les styles à l'overlay
        this.gameOverlay.style.position = 'absolute';
        this.gameOverlay.style.top = '0';
        this.gameOverlay.style.left = '0';
        this.gameOverlay.style.width = '100%';
        this.gameOverlay.style.height = '100%';
        this.gameOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.gameOverlay.style.display = 'flex';
        this.gameOverlay.style.flexDirection = 'column';
        this.gameOverlay.style.justifyContent = 'center';
        this.gameOverlay.style.alignItems = 'center';
        this.gameOverlay.style.zIndex = '2000';
        
        document.body.appendChild(this.gameOverlay);
      }
      
      // Mettre à jour le contenu de l'overlay
      this.gameOverlay.innerHTML = '';
      
      // Titre du résultat
      const title = document.createElement('h2');
      title.textContent = result.win ? 'Victoire !' : 'Défaite...';
      title.style.color = result.win ? '#66bb66' : '#ff6666';
      title.style.marginBottom = '20px';
      title.style.fontSize = '32px';
      
      // Message du résultat
      const message = document.createElement('p');
      message.textContent = result.message || '';
      message.style.color = 'white';
      message.style.fontSize = '18px';
      message.style.marginBottom = '30px';
      
      // Bouton pour rejouer
      const button = document.createElement('button');
      button.textContent = 'Rejouer';
      button.style.padding = '10px 20px';
      button.style.fontSize = '16px';
      button.style.backgroundColor = '#4d4dff';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '5px';
      button.style.cursor = 'pointer';
      
      // Ajouter l'action pour rejouer
      button.addEventListener('click', () => {
        this.hideGameResult();
        
        // Déclencher l'événement pour rejouer
        if (typeof this.onPlayAgain === 'function') {
          this.onPlayAgain();
        }
      });
      
      // Ajouter les éléments à l'overlay
      this.gameOverlay.appendChild(title);
      this.gameOverlay.appendChild(message);
      this.gameOverlay.appendChild(button);
      
      // Afficher l'overlay
      this.gameOverlay.style.display = 'flex';
    }
  
    /**
     * Cache le résultat de la partie
     */
    hideGameResult() {
      if (this.gameOverlay) {
        this.gameOverlay.style.display = 'none';
      }
    }
  
    /**
     * Définit le callback pour l'action de rejouer
     * @param {Function} callback - Fonction à appeler
     */
    setOnPlayAgainCallback(callback) {
      this.onPlayAgain = callback;
    }
  }