// /src/managers/MapManager.js
import { GAME_SETTINGS } from '../config/settings.js';
import { Door } from '../entities/Door.js';
import { HidingSpot } from '../entities/Hide.js';

export class MapManager {
  constructor(entityManager) {
    this.mapData = null;
    this.gridData = null;
    this.mapLoaded = false;
    this.entityManager = entityManager;
  }

  /**
   * Charge les données de la carte depuis un fichier JSON
   * @param {string} mapFile - Chemin vers le fichier JSON de la carte (optionnel)
   * @returns {Promise} Promise résolue lorsque la carte est chargée
   */
  loadMap(mapFile = GAME_SETTINGS.defaultMapFile) {
    return fetch(mapFile)
      .then(response => response.json())
      .then(grid => {
        this.mapData = grid;
        this.gridData = grid;
        this.mapLoaded = true;
        
        // Analyser la carte pour découvrir les entités
        this.parseMapEntities();
        
        return this.mapData;
      })
      .catch(error => {
        console.error("Erreur lors du chargement de la carte:", error);
        this.mapLoaded = false;
      });
  }
  
  /**
   * Analyse la carte pour trouver et créer les entités (portes, cachettes, etc.)
   */
  parseMapEntities() {
    if (!this.mapData) return;
    
    // Parcourir toutes les cases de la carte
    for (let y = 0; y < this.mapData.length; y++) {
      for (let x = 0; x < this.mapData[y].length; x++) {
        // Si c'est une porte (valeur 2 dans la carte)
        if (this.mapData[y][x] === 2) {
          const door = new Door(x, y, false);
          this.entityManager.addDoor(door);
        }
        
        // Ajouter d'autres types d'entités selon le besoin
        // Par exemple, les cachettes, objets, etc.
      }
    }
  }
  
  /**
   * Met à jour l'état d'une case de la carte
   * @param {number} x - Coordonnée X
   * @param {number} y - Coordonnée Y
   * @param {number} value - Nouvelle valeur
   */
  updateTile(x, y, value) {
    if (this.mapData && this.mapData[y] && this.mapData[y][x] !== undefined) {
      this.mapData[y][x] = value;
    }
  }
  
  /**
   * Vérifie si la carte est chargée
   * @returns {boolean} Vrai si la carte est chargée
   */
  isMapLoaded() {
    return this.mapLoaded;
  }
  
  /**
   * Obtient les données de la carte
   * @returns {Array|null} Données de la carte ou null si non chargée
   */
  getMapData() {
    return this.mapData;
  }
  
  /**
   * Obtient les données de la grille
   * @returns {Array|null} Données de la grille ou null si non chargée
   */
  getGridData() {
    return this.gridData;
  }
}