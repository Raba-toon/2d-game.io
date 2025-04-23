// src/main.js
import { Game } from '/core/Game.js';

/**
 * Point d'entrée principal de l'application
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log("Initialisation du jeu...");
  
  try {
    // Créer et initialiser le jeu
    const game = new Game();
    await game.init();
    
    // Exposition globale pour le débogage (à retirer en production)
    if (process.env.NODE_ENV === 'development') {
      window.game = game;
    }
    
    console.log("Jeu initialisé avec succès");
  } catch (error) {
    console.error("Erreur lors de l'initialisation du jeu:", error);
  }
});

/**
 * Gestion des erreurs non capturées
 */
window.addEventListener('error', (event) => {
  console.error('Erreur non capturée:', event.error);
});

/**
 * Gestion des rejets de promesses non capturés
 */
window.addEventListener('unhandledrejection', (event) => {
  console.error('Promesse rejetée non gérée:', event.reason);
});