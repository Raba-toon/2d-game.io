// src/utils/Constants.js

/**
 * Constantes globales du jeu
 */

// Taille des tuiles en pixels
export const TILE_SIZE = 60;

// Rayon de lumière (en pixels)
export const LIGHT_RADIUS = 180; // ≈ 3 cases

// Vitesse de déplacement des joueurs
export const PLAYER_SPEED = 120;

// Constantes d'animation du joueur
export const SPRITE_WIDTH = 32;
export const SPRITE_HEIGHT = 32;
export const PLAYER_FRAME_COUNT = 18;
export const PLAYER_FRAME_DURATION = 0.1; // secondes par frame

// Vitesse de déplacement du chasseur
export const HUNTER_SPEED = 130;

// Types de tuiles
export const TILE_TYPES = {
  EMPTY: 0,
  WALL: 1,
  DOOR: 2,
  HIDING_SPOT: 3,
  OBJECTIVE: 4
};

// Événements du jeu
export const EVENTS = {
  // Événements joueur
  PLAYER_LOGIN: 'player:login',
  PLAYER_LOGOUT: 'player:logout',
  PLAYER_MOVE: 'player:moved',
  PLAYER_TOGGLE_LIGHT: 'player:lightToggled',
  PLAYER_TOGGLE_HIDING: 'player:hidingToggled',
  PLAYER_INTERACT: 'player:interactRequested',
  
  // Événements entités
  DOOR_TOGGLED: 'door:toggled',
  
  // Événements UI
  UI_LOGIN: 'ui:login',
  UI_LOGOUT: 'ui:logout',
  
  // Événements réseau
  NETWORK_CONNECTED: 'network:connected',
  NETWORK_DISCONNECTED: 'network:disconnected',
  NETWORK_LOGIN_SUCCESS: 'network:loginSuccess',
  NETWORK_LOGIN_FAILED: 'network:loginFailed',
  
  // Événements jeu
  GAME_MAP_LOADED: 'game:mapLoaded',
  GAME_STATE_UPDATED: 'game:stateUpdated'
};

// Messages réseau
export const NETWORK_MESSAGES = {
  // Types de messages client -> serveur
  LOGIN: 'login',
  RECONNECT: 'reconnect',
  LOGOUT: 'logout',
  POSITION: 'position',
  TOGGLE_DOOR: 'toggleDoor',
  TOGGLE_HIDING: 'toggleHiding',
  TOGGLE_LIGHT: 'toggleLight',
  
  // Types de messages serveur -> client
  LOGIN_RESPONSE: 'login_response',
  RECONNECT_RESPONSE: 'reconnect_response',
  PLAYER_LIST: 'player_list',
  GAME_STATE: 'state'
};