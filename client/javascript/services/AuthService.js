// /src/services/AuthService.js
import { StorageUtils } from '../utils/StorageUtils.js';

export class AuthService {
  constructor() {
    this.playerInfo = {
      id: null,
      username: null
    };
    
    // Initialiser avec les données existantes dans le localStorage
    this.loadSavedPlayerInfo();
  }

  /**
   * Charge les informations sauvegardées du joueur depuis le localStorage
   */
  loadSavedPlayerInfo() {
    const savedInfo = StorageUtils.getPlayerInfo();
    if (savedInfo) {
      this.playerInfo = savedInfo;
    }
  }

  /**
   * Définit les informations du joueur
   * @param {string} id - Identifiant du joueur
   * @param {string} username - Nom d'utilisateur
   */
  setPlayerInfo(id, username) {
    this.playerInfo.id = id;
    this.playerInfo.username = username;
    
    // Sauvegarder dans le localStorage
    StorageUtils.savePlayerInfo(this.playerInfo);
  }

  /**
   * Efface les informations du joueur (déconnexion)
   */
  clearPlayerInfo() {
    this.playerInfo.id = null;
    this.playerInfo.username = null;
    
    // Supprimer du localStorage
    StorageUtils.clearPlayerInfo();
  }

  /**
   * Vérifie si l'utilisateur est connecté
   * @returns {boolean} - True si connecté
   */
  isLoggedIn() {
    return !!this.playerInfo.id;
  }

  /**
   * Obtient l'identifiant du joueur
   * @returns {string|null} - Identifiant ou null
   */
  getPlayerId() {
    return this.playerInfo.id;
  }

  /**
   * Obtient le nom d'utilisateur
   * @returns {string|null} - Nom d'utilisateur ou null
   */
  getUsername() {
    return this.playerInfo.username;
  }

  /**
   * Obtient les informations du joueur
   * @returns {Object} - Informations du joueur {id, username}
   */
  getPlayerInfo() {
    return { ...this.playerInfo };
  }

  /**
   * Obtient les informations sauvegardées du joueur
   * @returns {Object|null} - Informations sauvegardées ou null
   */
  getSavedPlayerInfo() {
    return StorageUtils.getPlayerInfo();
  }
}