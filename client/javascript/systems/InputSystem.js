// src/systems/InputSystem.js

/**
 * Système de gestion des entrées utilisateur
 */
export class InputSystem {
    constructor(eventEmitter) {
      this.events = eventEmitter;
      
      // État des touches
      this.keys = {};
      
      // Actions spéciales
      this.specialActions = {
        toggleLight: ['f', 'F'],
        interact: [' ', 'Space'],
      };
      
      // Lier les méthodes au contexte
      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.handleKeyUp = this.handleKeyUp.bind(this);
      this.update = this.update.bind(this);
      
      // Installer les écouteurs d'événements
      this.setupEventListeners();
    }
    
    /**
     * Configure les écouteurs d'événements pour le clavier
     */
    setupEventListeners() {
      document.addEventListener('keydown', this.handleKeyDown);
      document.addEventListener('keyup', this.handleKeyUp);
    }
    
    /**
     * Gère l'événement de touche enfoncée
     * @param {KeyboardEvent} event - Événement clavier
     */
    handleKeyDown(event) {
      // Stockage de l'état de la touche
      this.keys[event.key] = true;
      
      // Vérifier les actions spéciales
      this.checkSpecialActions(event.key);
    }
    
    /**
     * Gère l'événement de touche relâchée
     * @param {KeyboardEvent} event - Événement clavier
     */
    handleKeyUp(event) {
      this.keys[event.key] = false;
    }
    
    /**
     * Vérifie si une touche enfoncée correspond à une action spéciale
     * @param {string} key - Touche enfoncée
     */
    checkSpecialActions(key) {
      // Activer/désactiver la lampe
      if (this.specialActions.toggleLight.includes(key)) {
        this.events.emit('player:toggleLightRequested');
      }
      
      // Interaction (porte, cachette)
      if (this.specialActions.interact.includes(key)) {
        this.events.emit('player:interactRequested');
        
        // Empêcher les appuis répétés en réinitialisant immédiatement
        this.keys[' '] = false;
        this.keys['Space'] = false;
      }
    }
    
    /**
     * Mise à jour périodique du système d'entrée
     * Appelée chaque frame pour détecter les changements
     */
    update() {
      // Détection des directions de mouvement
      const movement = {
        up: this.keys['w'] || this.keys['ArrowUp'] || false,
        down: this.keys['s'] || this.keys['ArrowDown'] || false,
        left: this.keys['a'] || this.keys['ArrowLeft'] || false,
        right: this.keys['d'] || this.keys['ArrowRight'] || false
      };
      
      // Émettre un événement seulement si un mouvement est détecté
      if (movement.up || movement.down || movement.left || movement.right) {
        this.events.emit('player:movementInput', movement);
      }
    }
    
    /**
     * Récupère l'état actuel des touches
     * @returns {Object} - État des touches
     */
    getKeys() {
      return {...this.keys};
    }
    
    /**
     * Nettoie les écouteurs d'événements lors de la destruction du système
     */
    cleanup() {
      document.removeEventListener('keydown', this.handleKeyDown);
      document.removeEventListener('keyup', this.handleKeyUp);
    }
  }