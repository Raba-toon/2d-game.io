// /src/config/settings.js
// Paramètres configurables du jeu

export const GAME_SETTINGS = {
    // Paramètres par défaut
    defaultMapFile: '/client/json/matrice1.json',
    
    // Couleurs des joueurs
    playerColors: {
      local: "blue",
      remote: "red",
      carried: "purple"
    },
    
    // Paramètres WebSocket
    wsProtocol: window.location.protocol === 'https:' ? 'wss:' : 'ws:',
    wsPath: '/ws',
    
    // Paramètres du rendu
    renderSettings: {
      backgroundColor: "#eee",
      wallColor: "#333",
      doorClosedColor: "sienna",
      doorOpenColor: "#555",
      hidingSpotColor: "#66bb66",
      overlayShadowColor: "black"
    }
  };