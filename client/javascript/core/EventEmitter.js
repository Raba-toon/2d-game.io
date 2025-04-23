// src/core/EventEmitter.js

/**
 * Système de gestion des événements pour une communication découplée entre modules
 */
export class EventEmitter {
    constructor() {
      this.events = {};
    }
  
    /**
     * S'abonne à un événement
     * @param {string} event - Nom de l'événement
     * @param {Function} callback - Fonction à appeler lors de l'émission
     */
    on(event, callback) {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      this.events[event].push(callback);
      
      // Retourner une fonction pour se désabonner
      return () => {
        this.off(event, callback);
      };
    }
  
    /**
     * Se désabonne d'un événement
     * @param {string} event - Nom de l'événement
     * @param {Function} callback - Fonction à retirer
     */
    off(event, callback) {
      if (!this.events[event]) return;
      
      this.events[event] = this.events[event].filter(cb => cb !== callback);
      
      // Nettoyage si plus d'abonnés
      if (this.events[event].length === 0) {
        delete this.events[event];
      }
    }
  
    /**
     * Déclenche un événement avec des données optionnelles
     * @param {string} event - Nom de l'événement
     * @param {any} data - Données à transmettre aux abonnés
     */
    emit(event, data) {
      if (!this.events[event]) return;
      
      this.events[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erreur lors de l'émission de l'événement ${event}:`, error);
        }
      });
    }
  
    /**
     * S'abonne à un événement et se désabonne après la première émission
     * @param {string} event - Nom de l'événement
     * @param {Function} callback - Fonction à appeler lors de l'émission
     */
    once(event, callback) {
      const onceCallback = (data) => {
        this.off(event, onceCallback);
        callback(data);
      };
      
      this.on(event, onceCallback);
    }
  }