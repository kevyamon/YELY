// src/navigation/navigationRef.js
// CONTROLEUR DE NAVIGATION GLOBAL - Routage hors contexte React
// CSCSM Level: Bank Grade

import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export const navigate = (name, params) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
};