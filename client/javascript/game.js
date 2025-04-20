fetch('../json/matrice1.json')  // depuis /client/javascript vers /client/json
  .then(response => response.json())
  .then(grille => {
    console.log("Grille chargée :", grille);
    // Tu peux maintenant l'utiliser pour afficher ou construire ta map
  })
  .catch(err => console.error("Erreur lors du chargement :", err));