// src/core/Game.js
import { GameState } from '/core/GameState.js';
import { EventEmitter } from '/core/EventEmitter.js';
import { RenderSystem } from '/systems/RenderSystem.js';
import { InputSystem } from '/systems/InputSystem.js';
import { NetworkSystem } from '/systems/NetworkSystem.js';
import { CollisionSystem } from '/systems/CollisionSystem.js';
import { UIManager } from '/ui/UIManager.js';
import { AssetLoader } from '/utils/AssetLoader.js';
import { MapLoader } from '/utils/MapLoader.js';
import { TILE_SIZE, LIGHT_RADIUS } from '../utils/Constants.js';

/**
 * Classe principale du jeu qui coordonne tous les systèmes
 */
export class Game {
  constructor() {
    // Systèmes principaux
    this.events = new EventEmitter();
    this.state = new GameState(this.events);
    this.assets = new AssetLoader();
    this.maps = new MapLoader();
    
    // Systèmes spécifiques
    this.renderer = new RenderSystem(this.state);
    this.input = new InputSystem(this.events);
    this.network = new NetworkSystem(this.state, this.events);
    this.collision = new CollisionSystem(this.state);
    this.ui = new UIManager(this.state, this.events);
    
    // État du jeu
    this.lastTimestamp = 0;
    this.isRunning = false;
    
    // Lier les méthodes au contexte de l'instance
    this.update = this.update.bind(this);
    this.setupEventListeners();
  }
  
  /**
   * Initialise le jeu
   */
  async init() {
    try {
      // Charger les assets nécessaires
      await this.assets.loadSprites();
      
      // Initialiser les canaux de rendu
      this.renderer.initCanvases();
      
      // Connecter au serveur
      await this.network.connect();
      
      // Configurer l'interface utilisateur
      this.ui.init();
      
      // Vérifier si l'utilisateur est déjà connecté
      if (this.network.hasStoredCredentials()) {
        this.network.attemptReconnect();
      } else {
        this.ui.showLoginScreen();
      }
      
      // Démarrer la boucle de jeu
      this.start();
      
      console.log('Jeu initialisé avec succès');
      return true;
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du jeu:', error);
      this.ui.showError('Impossible d\'initialiser le jeu');
      return false;
    }
  }
  
  /**
   * Configure les écouteurs d'événements
   */
  setupEventListeners() {
    // Événements réseau
    this.events.on('network:connected', () => {
      console.log('Connecté au serveur');
    });
    
    this.events.on('network:disconnected', () => {
      this.ui.showMessage('Déconnecté du serveur');
    });
    
    // Événements de l'état du jeu
    this.events.on('game:mapLoaded', (mapData) => {
      this.collision.updateCollisionGrid(mapData);
    });
    
    this.events.on('player:login', (playerInfo) => {
      this.ui.hideLoginScreen();
      this.maps.loadMap('/client/json/matrice1.json')
        .then(mapData => {
          this.state.setMapData(mapData);
          this.events.emit('game:mapLoaded', mapData);
        });
    });
    
    // Événements UI
    this.events.on('ui:login', (username) => {
      this.network.login(username);
    });
    
    this.events.on('ui:logout', () => {
      this.network.logout();
      this.ui.showLoginScreen();
    });
    
    // Événements d'interaction
    this.events.on('player:toggleDoor', (doorKey) => {
      this.network.toggleDoor(doorKey);
    });
    
    this.events.on('player:toggleHiding', () => {
      this.network.toggleHiding();
    });
    
    this.events.on('player:toggleLight', () => {
      this.state.togglePlayerLight();
      this.network.toggleLight();
    });
    
    // Écouter le redimensionnement de la fenêtre
    window.addEventListener('resize', () => this.renderer.resizeCanvases());
  }
  
  /**
   * Démarre la boucle de jeu
   */
  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTimestamp = performance.now();
      requestAnimationFrame(this.update);
    }
  }
  
  /**
   * Arrête la boucle de jeu
   */
  stop() {
    this.isRunning = false;
  }
  
  /**
   * Boucle principale du jeu
   * @param {number} timestamp - Horodatage actuel
   */
  update(timestamp) {
    // Calculer le delta-time en secondes
    const deltaTime = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    
    // Mettre à jour les entrées utilisateur
    this.input.update();
    
    // Mettre à jour l'état du joueur local
    if (this.state.isPlayerLoggedIn()) {
      // Déplacer le joueur en fonction des entrées
      this.state.updateLocalPlayer(this.input.getKeys(), deltaTime);
      
      // Détecter les collisions
      this.collision.checkCollisions(deltaTime);
      
      // Envoyer la position au serveur si nécessaire
      this.network.sendPlayerPosition();
    }
    
    // Mettre à jour les animations des autres joueurs
    this.state.updateRemotePlayers(deltaTime);
    
    // Dessiner la scène
    this.renderer.render();
    
    // Continuer la boucle si le jeu est en cours d'exécution
    if (this.isRunning) {
      requestAnimationFrame(this.update);
    }
  }
}