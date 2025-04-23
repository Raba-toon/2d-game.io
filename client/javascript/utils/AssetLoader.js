// src/utils/AssetLoader.js

/**
 * Classe responsable du chargement et de la gestion des ressources (images, sons, etc.)
 */
export class AssetLoader {
    constructor(eventEmitter) {
      this.events = eventEmitter;
      
      // Collections pour stocker les ressources
      this.images = {};
      this.sounds = {};
      this.isLoaded = false;
      
      // Liste des ressources à charger
      this.imagesToLoad = {
        // Sprites joueur
        playerSprite: '/client/images/players/baby-crawl-white.png',
        
        // Autres ressources que vous pourriez avoir
        // Vous pouvez les ajouter ici selon vos besoins
      };
      
      this.soundsToLoad = {
        // Sons que vous pourriez avoir
        // Exemple: doorOpen: '/client/sounds/door-open.mp3'
      };
    }
    
    /**
     * Charge toutes les ressources
     * @returns {Promise<void>} - Résout quand toutes les ressources sont chargées
     */
    async loadAll() {
      try {
        // Charger les images et les sons en parallèle
        const [loadedImages, loadedSounds] = await Promise.all([
          this.loadSprites(),
          this.loadSounds()
        ]);
        
        this.isLoaded = true;
        
        // Émettre un événement pour indiquer que tout est chargé
        if (this.events) {
          this.events.emit('assets:loaded', {
            images: loadedImages,
            sounds: loadedSounds
          });
        }
        
        console.log('Toutes les ressources ont été chargées');
      } catch (error) {
        console.error('Erreur lors du chargement des ressources:', error);
        
        // Émettre un événement d'erreur
        if (this.events) {
          this.events.emit('assets:error', error);
        }
        
        throw error;
      }
    }
    
    /**
     * Charge les sprites du jeu
     * @returns {Promise<Object>} - Collection d'images chargées
     */
    async loadSprites() {
      const imagePromises = Object.entries(this.imagesToLoad).map(([key, path]) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          
          img.onload = () => {
            this.images[key] = img;
            resolve({ key, img });
          };
          
          img.onerror = () => {
            reject(new Error(`Impossible de charger l'image: ${path}`));
          };
          
          img.src = path;
        });
      });
      
      // Attendre que toutes les images soient chargées
      await Promise.all(imagePromises);
      
      // Émettre un événement pour indiquer que les sprites sont chargés
      if (this.events) {
        this.events.emit('assets:spritesLoaded', this.images);
      }
      
      return this.images;
    }
    
    /**
     * Charge les sons du jeu
     * @returns {Promise<Object>} - Collection de sons chargés
     */
    async loadSounds() {
      // Si vous n'avez pas de sons à charger, retourner un objet vide
      if (Object.keys(this.soundsToLoad).length === 0) {
        return this.sounds;
      }
      
      const soundPromises = Object.entries(this.soundsToLoad).map(([key, path]) => {
        return new Promise((resolve, reject) => {
          const audio = new Audio();
          
          audio.oncanplaythrough = () => {
            this.sounds[key] = audio;
            resolve({ key, audio });
          };
          
          audio.onerror = () => {
            reject(new Error(`Impossible de charger le son: ${path}`));
          };
          
          audio.src = path;
          // Prédéclencher le chargement
          audio.load();
        });
      });
      
      // Attendre que tous les sons soient chargés
      await Promise.all(soundPromises);
      
      // Émettre un événement pour indiquer que les sons sont chargés
      if (this.events) {
        this.events.emit('assets:soundsLoaded', this.sounds);
      }
      
      return this.sounds;
    }
    
    /**
     * Récupère une image chargée
     * @param {string} key - Clé de l'image
     * @returns {HTMLImageElement|null} - Image ou null si non trouvée
     */
    getImage(key) {
      if (!this.images[key]) {
        console.warn(`Image non trouvée: ${key}`);
        return null;
      }
      return this.images[key];
    }
    
    /**
     * Récupère un son chargé
     * @param {string} key - Clé du son
     * @returns {HTMLAudioElement|null} - Son ou null si non trouvé
     */
    getSound(key) {
      if (!this.sounds[key]) {
        console.warn(`Son non trouvé: ${key}`);
        return null;
      }
      return this.sounds[key];
    }
    
    /**
     * Joue un son
     * @param {string} key - Clé du son à jouer
     * @param {number} volume - Volume (0.0 à 1.0)
     * @param {boolean} loop - Si le son doit se répéter
     */
    playSound(key, volume = 1.0, loop = false) {
      const sound = this.getSound(key);
      if (!sound) return;
      
      // Cloner le son pour permettre plusieurs lectures simultanées
      const soundInstance = sound.cloneNode();
      soundInstance.volume = volume;
      soundInstance.loop = loop;
      soundInstance.play().catch(e => console.warn('Impossible de jouer le son:', e));
      
      return soundInstance;
    }
    
    /**
     * Arrête un son
     * @param {HTMLAudioElement} soundInstance - Instance du son à arrêter
     */
    stopSound(soundInstance) {
      if (soundInstance) {
        soundInstance.pause();
        soundInstance.currentTime = 0;
      }
    }
  }