// src/screens/SplashScreen.jsx
// SPLASH SCREEN UNIVERSEL - Routeur de Démarrage (Délégation Stricte Native / Web)
// CSCSM Level: Bank Grade (Modularisé < 325 lignes, Sans Emojis)

import React from 'react';
import { Platform } from 'react-native';
import SplashScreenNative from './SplashScreen.native';
import SplashScreenWeb from './SplashScreen.web';

const SplashScreen = (props) => {
  if (Platform.OS === 'web') {
    return <SplashScreenWeb {...props} />;
  }
  return <SplashScreenNative {...props} />;
};

export default React.memo(SplashScreen);