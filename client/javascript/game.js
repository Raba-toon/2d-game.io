fetch('/client/json/matrice1.json')
  .then(res => res.json())
  .then(grille => {
    // Créer dynamiquement le conteneur de la grille
    const grilleDiv = document.createElement('div');
    grilleDiv.classList.add('grille');

    // Générer les cases à partir de la matrice
    grille.forEach((ligne, y) => {
      ligne.forEach((valeur, x) => {
        const caseDiv = document.createElement('div');
        caseDiv.classList.add('case');
        caseDiv.classList.add(valeur === 1 ? 'mur' : 'sol');
        grilleDiv.appendChild(caseDiv);
      });
    });

    // Ajouter la grille dans le <body>
    document.body.appendChild(grilleDiv);
  })
  .catch(err => console.error("Erreur chargement grille :", err));
