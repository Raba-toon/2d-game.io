// /src/services/GameStateService.js

export class GameStateService {
    constructor(dependencies) {
      this.uiManager = dependencies.uiManager;
      this.entityManager = dependencies.entityManager;
      
      this.connectedPlayers = {};
      this.gameState = {
        inProgress: false,
        objectives: [],
        ennemyCount: 0
      };
    }
  
    /**
     * Met à jour la liste des joueurs connectés
     * @param {Object} players - Liste des joueurs {id: username}
     */
    updatePlayersList(players) {
      this.connectedPlayers = players;
      
      // Mettre à jour l'interface
      this.uiManager.updatePlayersList(players);
    }
  
    /**
     * Démarre une nouvelle partie
     * @param {Object} gameConfig - Configuration de la partie
     */
    startGame(gameConfig) {
      this.gameState.inProgress = true;
      this.gameState.objectives = gameConfig.objectives || [];
      this.gameState.ennemyCount = gameConfig.ennemi_count || 0;
      
      // Informer l'interface
      this.uiManager.updateGameState(this.gameState);
    }
  
    /**
     * Termine la partie en cours
     * @param {Object} result - Résultat de la partie
     */
    endGame(result) {
      this.gameState.inProgress = false;
      
      // Informer l'interface
      this.uiManager.showGameResult(result);
    }
  
    /**
     * Vérifie si une partie est en cours
     * @returns {boolean} - True si une partie est en cours
     */
    isGameInProgress() {
      return this.gameState.inProgress;
    }
  
    /**
     * Obtient la liste des joueurs connectés
     * @returns {Object} - Liste des joueurs {id: username}
     */
    getConnectedPlayers() {
      return { ...this.connectedPlayers };
    }
  
    /**
     * Obtient l'état actuel du jeu
     * @returns {Object} - État du jeu
     */
    getGameState() {
      return { ...this.gameState };
    }
    
    /**
     * Vérifie si le joueur est dans une cachette
     * @param {string} playerId - ID du joueur
     * @returns {boolean} - True si le joueur est caché
     */
    isPlayerHidden(playerId) {
      const player = this.entityManager.getLocalPlayer();
      if (player && player.id === playerId) {
        return player.isHidden;
      }
      
      const otherPlayer = this.entityManager.getOtherPlayers()[playerId];
      return otherPlayer ? otherPlayer.isHidden : false;
    }
    
    /**
     * Vérifie si le joueur est porté par un chasseur
     * @param {string} playerId - ID du joueur
     * @returns {boolean} - True si le joueur est porté
     */
    isPlayerCarried(playerId) {
      const player = this.entityManager.getLocalPlayer();
      if (player && player.id === playerId) {
        return player.isCarried;
      }
      
      const otherPlayer = this.entityManager.getOtherPlayers()[playerId];
      return otherPlayer ? otherPlayer.isCarried : false;
    }
  }