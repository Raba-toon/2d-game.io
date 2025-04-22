// /src/utils/StorageUtils.js

export const StorageUtils = {
    /**
     * Clé pour les informations du joueur dans localStorage
     */
    PLAYER_INFO_KEY: 'playerInfo',
    
    /**
     * Sauvegarde les informations du joueur dans localStorage
     * @param {Object} playerInfo - Informations du joueur {id, username}
     */
    savePlayerInfo(playerInfo) {
      try {
        localStorage.setItem(this.PLAYER_INFO_KEY, JSON.stringify(playerInfo));
        return true;
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des informations du joueur:', error);
        return false;
      }
    },
    
    /**
     * Récupère les informations du joueur depuis localStorage
     * @returns {Object|null} - Informations du joueur ou null
     */
    getPlayerInfo() {
      try {
        const data = localStorage.getItem(this.PLAYER_INFO_KEY);
        if (!data) return null;
        
        return JSON.parse(data);
      } catch (error) {
        console.error('Erreur lors de la lecture des informations du joueur:', error);
        return null;
      }
    },
    
    /**
     * Efface les informations du joueur de localStorage
     */
    clearPlayerInfo() {
      try {
        localStorage.removeItem(this.PLAYER_INFO_KEY);
        return true;
      } catch (error) {
        console.error('Erreur lors de la suppression des informations du joueur:', error);
        return false;
      }
    },
    
    /**
     * Sauvegarde les paramètres du jeu dans localStorage
     * @param {Object} settings - Paramètres du jeu
     */
    saveGameSettings(settings) {
      try {
        localStorage.setItem('gameSettings', JSON.stringify(settings));
        return true;
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des paramètres du jeu:', error);
        return false;
      }
    },
    
    /**
     * Récupère les paramètres du jeu depuis localStorage
     * @returns {Object|null} - Paramètres du jeu ou null
     */
    getGameSettings() {
      try {
        const data = localStorage.getItem('gameSettings');
        if (!data) return null;
        
        return JSON.parse(data);
      } catch (error) {
        console.error('Erreur lors de la lecture des paramètres du jeu:', error);
        return null;
      }
    },
    
    /**
     * Sauvegarde la progression du jeu dans localStorage
     * @param {Object} progress - Progression du jeu
     */
    saveGameProgress(progress) {
      try {
        localStorage.setItem('gameProgress', JSON.stringify(progress));
        return true;
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de la progression du jeu:', error);
        return false;
      }
    },
    
    /**
     * Récupère la progression du jeu depuis localStorage
     * @returns {Object|null} - Progression du jeu ou null
     */
    getGameProgress() {
      try {
        const data = localStorage.getItem('gameProgress');
        if (!data) return null;
        
        return JSON.parse(data);
      } catch (error) {
        console.error('Erreur lors de la lecture de la progression du jeu:', error);
        return null;
      }
    },
    
    /**
     * Efface toutes les données de jeu de localStorage
     */
    clearAllGameData() {
      try {
        localStorage.removeItem(this.PLAYER_INFO_KEY);
        localStorage.removeItem('gameSettings');
        localStorage.removeItem('gameProgress');
        return true;
      } catch (error) {
        console.error('Erreur lors de la suppression des données du jeu:', error);
        return false;
      }
    }
  };