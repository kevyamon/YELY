// src/navigation/navigationRef.js
// CONTROLEUR DE NAVIGATION GLOBAL - Routage persévérant hors contexte React
// CSCSM Level: Bank Grade

import { CommonActions, createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export const navigate = (name, params) => {
  let attempts = 0;
  const maxAttempts = 15; // Autorise jusqu'à 4.5 secondes de délai (le temps que Redux restaure la session au démarrage)
  
  const tryNavigate = () => {
    if (navigationRef.isReady()) {
      try {
        // Tente de forcer la redirection. 
        // Si la route cible n'existe pas encore (ex: l'utilisateur n'est pas encore connecté dans le store), ça génère une erreur silencieuse.
        navigationRef.dispatch(CommonActions.navigate({ name, params }));
        if (__DEV__) console.log(`[ROUTAGE] Redirection réussie vers ${name}`);
        return; // Succès absolu, on brise la boucle.
      } catch (error) {
        // Échec silencieux, l'écran n'est pas encore monté, on passe à la tentative suivante
      }
    }
    
    attempts++;
    if (attempts < maxAttempts) {
      setTimeout(tryNavigate, 300); // Réessaie dans 300ms
    } else {
      if (__DEV__) console.warn(`[ROUTAGE] Abandon de la redirection vers ${name} après ${maxAttempts} tentatives (Timeout).`);
    }
  };

  tryNavigate();
};