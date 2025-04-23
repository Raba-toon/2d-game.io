// src/utils/MapLoader.js
import { TILE_TYPES } from '/Constants.js';
import { Door } from '/entities/Door.js';
import { HidingSpot } from '/entities/HidingSpot.js';

/**
 * Classe responsable du chargement et du traitement des cartes
 */
export class MapLoader {
  constructor(eventEmitter) {
    this.events = eventEmitter;
    this.cachedMaps = {}; // Cache pour éviter de recharger les mêmes cartes
  }
  
  /**
   * Charge une carte depuis un URL
   * @param {string} url - URL du fichier JSON de la carte
   * @returns {Promise<Object>} - Données de la carte traitées
   */
  async loadMap(url) {
    try {
      // Vérifier si la carte est déjà en cache
      if (this.cachedMaps[url]) {
        return this.cachedMaps[url];
      }
      
      // Charger la carte depuis l'URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Impossible de charger la carte (${response.status} ${response.statusText})`);
      }
      
      // Parser la grille de la carte
      const grid = await response.json();
      
      // Traiter et stocker les données de la carte
      const mapData = this.processMapData(grid);
      
      // Mettre en cache pour les futurs chargements
      this.cachedMaps[url] = mapData;
      
      // Émettre un événement pour signaler que la carte est chargée
      if (this.events) {
        this.events.emit('map:loaded', mapData);
      }
      
      return mapData;
    } catch (error) {
      console.error('Erreur lors du chargement de la carte:', error);
      throw error;
    }
  }
  
  /**
   * Traite les données brutes de la carte pour extraire les entités
   * @param {Array} grid - Grille brute de la carte
   * @returns {Object} - Données traitées avec grille et entités
   */
  processMapData(grid) {
    const doors = {};
    const hidingSpots = {};
    const objectives = {};
    
    // Faire une copie profonde de la grille
    const gridCopy = JSON.parse(JSON.stringify(grid));
    
    // Parcourir la grille pour identifier les entités
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const tileType = grid[y][x];
        
        // Identifier et traiter les portes
        if (tileType === TILE_TYPES.DOOR) {
          const doorKey = `${x},${y}`;
          doors[doorKey] = new Door(x, y, false);
        }
        
        // Identifier et traiter les cachettes
        else if (tileType === TILE_TYPES.HIDING_SPOT) {
          const spotKey = `${x},${y}`;
          hidingSpots[spotKey] = new HidingSpot(x, y);
          
          // Rendre la tuile "marchable" dans la grille de collision
          gridCopy[y][x] = TILE_TYPES.EMPTY;
        }
        
        // Identifier et traiter les objectifs
        else if (tileType === TILE_TYPES.OBJECTIVE) {
          const objectiveKey = `${x},${y}`;
          objectives[objectiveKey] = {
            x: x,
            y: y,
            completed: false
          };
          
          // Rendre la tuile "marchable" dans la grille de collision
          gridCopy[y][x] = TILE_TYPES.EMPTY;
        }
      }
    }
    
    return {
      grid: gridCopy,
      originalGrid: grid,
      doors: doors,
      hidingSpots: hidingSpots,
      objectives: objectives,
      width: grid[0].length,
      height: grid.length
    };
  }
  
  /**
   * Convertit les données de la carte en format exportable
   * @param {Object} mapData - Données de la carte
   * @returns {Object} - Format exportable
   */
  serializeMapData(mapData) {
    return {
      grid: mapData.originalGrid,
      doors: Object.fromEntries(
        Object.entries(mapData.doors).map(([key, door]) => [key, door.toJSON()])
      ),
      hidingSpots: Object.fromEntries(
        Object.entries(mapData.hidingSpots).map(([key, spot]) => [key, spot.toJSON()])
      ),
      objectives: mapData.objectives
    };
  }
  
  /**
   * Charge une carte à partir de données sérialisées
   * @param {Object} serializedData - Données sérialisées de la carte
   * @returns {Object} - Données de la carte traitées
   */
  loadFromSerialized(serializedData) {
    const mapData = this.processMapData(serializedData.grid);
    
    // Restaurer l'état des portes
    if (serializedData.doors) {
      for (const [key, doorData] of Object.entries(serializedData.doors)) {
        if (mapData.doors[key]) {
          mapData.doors[key].isOpen = doorData.isOpen;
        }
      }
    }
    
    // Restaurer l'état des cachettes
    if (serializedData.hidingSpots) {
      for (const [key, spotData] of Object.entries(serializedData.hidingSpots)) {
        if (mapData.hidingSpots[key]) {
          mapData.hidingSpots[key].isOccupied = spotData.isOccupied;
          mapData.hidingSpots[key].occupiedBy = spotData.occupiedBy;
        }
      }
    }
    
    // Restaurer l'état des objectifs
    if (serializedData.objectives) {
      mapData.objectives = serializedData.objectives;
    }
    
    return mapData;
  }
}