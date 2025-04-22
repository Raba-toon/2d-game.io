// /src/utils/InputManager.js

export class InputManager {
    constructor() {
      this.keys = {};
      
      // Enregistrer les écouteurs d'événements
      document.addEventListener('keydown', this.handleKeyDown.bind(this));
      document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }
  
    /**
     * Gère l'événement keydown
     * @param {KeyboardEvent} e - Événement keydown
     */
    handleKeyDown(e) {
      this.keys[e.key] = true;
    }
  
    /**
     * Gère l'événement keyup
     * @param {KeyboardEvent} e - Événement keyup
     */
    handleKeyUp(e) {
      this.keys[e.key] = false;
    }
  
    /**
     * Vérifie si une touche est actuellement pressée
     * @param {string} key - Touche à vérifier
     * @returns {boolean} - True si la touche est pressée
     */
    isKeyPressed(key) {
      return this.keys[key] === true;
    }
  
    /**
     * Efface l'état d'une touche
     * @param {string} key - Touche à effacer
     */
    clearKey(key) {
      this.keys[key] = false;
    }
  
    /**
     * Retourne l'état de toutes les touches
     * @returns {Object} - État des touches
     */
    getKeys() {
      return { ...this.keys };
    }
  
    /**
     * Obtient la direction actuelle basée sur les touches fléchées
     * @returns {Object} - Vecteur de direction {x, y}
     */
    getDirection() {
      const dirX = (this.isKeyPressed("ArrowRight") ? 1 : 0) - (this.isKeyPressed("ArrowLeft") ? 1 : 0);
      const dirY = (this.isKeyPressed("ArrowDown") ? 1 : 0) - (this.isKeyPressed("ArrowUp") ? 1 : 0);
      
      return { x: dirX, y: dirY };
    }
  
    /**
     * Vérifie si une action spécifique est déclenchée
     * @param {string} action - Nom de l'action
     * @returns {boolean} - True si l'action est déclenchée
     */
    isActionTriggered(action) {
      switch(action) {
        case 'interact':
          return this.isKeyPressed(' ') || this.isKeyPressed('Space');
        case 'move':
          const dir = this.getDirection();
          return dir.x !== 0 || dir.y !== 0;
        default:
          return false;
      }
    }
  
    /**
     * Nettoie les ressources utilisées par le gestionnaire d'entrée
     */
    cleanup() {
      document.removeEventListener('keydown', this.handleKeyDown);
      document.removeEventListener('keyup', this.handleKeyUp);
      this.keys = {};
    }
  }