// /src/ui/PlayersListUI.js

export class PlayersListUI {
    constructor(dependencies) {
      this.authService = dependencies.authService;
      this.playersListElement = null;
    }
  
    /**
     * Crée et ajoute la liste des joueurs au DOM
     */
    createPlayersList() {
      // Ne pas créer la liste si elle existe déjà
      if (document.getElementById('players-list')) {
        this.playersListElement = document.getElementById('players-list');
        return this.playersListElement;
      }
      
      // Créer l'élément conteneur
      this.playersListElement = document.createElement('div');
      this.playersListElement.id = 'players-list';
      
      // Appliquer les styles
      this.applyPlayersListStyles(this.playersListElement);
      
      // Ajouter au DOM
      document.body.appendChild(this.playersListElement);
      
      // Initialiser avec un contenu vide
      this.updatePlayersList({});
      
      return this.playersListElement;
    }
  
    /**
     * Applique les styles à la liste des joueurs
     * @param {HTMLElement} element - Élément conteneur de la liste
     */
    applyPlayersListStyles(element) {
      // Styles de base
      element.style.position = 'absolute';
      element.style.top = '10px';
      element.style.right = '10px';
      element.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      element.style.color = 'white';
      element.style.padding = '15px';
      element.style.borderRadius = '5px';
      element.style.minWidth = '150px';
      element.style.fontFamily = 'Arial, sans-serif';
      element.style.fontSize = '14px';
      element.style.zIndex = '1000';
    }
  
    /**
     * Met à jour la liste des joueurs
     * @param {Object} players - Liste des joueurs {id: username}
     */
    updatePlayersList(players) {
      if (!this.playersListElement) {
        this.createPlayersList();
      }
      
      // Vider la liste actuelle
      this.playersListElement.innerHTML = '';
      
      // Titre de la liste
      const title = document.createElement('h3');
      title.textContent = 'Joueurs connectés';
      title.style.marginTop = '0';
      title.style.marginBottom = '10px';
      this.playersListElement.appendChild(title);
      
      // Créer la liste
      const ul = document.createElement('ul');
      ul.style.listStyleType = 'none';
      ul.style.padding = '0';
      ul.style.margin = '0';
      
      // Si aucun joueur, afficher un message
      if (Object.keys(players).length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Aucun joueur connecté';
        li.style.padding = '3px 0';
        ul.appendChild(li);
      } else {
        // Ajouter chaque joueur à la liste
        Object.entries(players).forEach(([id, username]) => {
          const li = document.createElement('li');
          li.textContent = username;
          
          // Mettre en évidence le joueur actuel
          if (id === this.authService.getPlayerId()) {
            li.style.fontWeight = 'bold';
            li.textContent += ' (vous)';
          }
          
          li.style.padding = '3px 0';
          ul.appendChild(li);
        });
      }
      
      // Ajouter la liste au conteneur
      this.playersListElement.appendChild(ul);
    }
  
    /**
     * Cache la liste des joueurs
     */
    hide() {
      if (this.playersListElement) {
        this.playersListElement.style.display = 'none';
      }
    }
  
    /**
     * Affiche la liste des joueurs
     */
    show() {
      if (this.playersListElement) {
        this.playersListElement.style.display = 'block';
      }
    }
  }