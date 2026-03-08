// src/config/env.js
// VALIDATION STRICTE DE L'ENVIRONNEMENT FRONTEND (Fail-Fast)
// STANDARD: Industriel

// En React Native avec Expo, toutes les variables publiques DOIVENT commencer par EXPO_PUBLIC_
const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL,
  SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || 'development',
};

if (!ENV.API_URL) {
  console.error("[FATAL ERROR] EXPO_PUBLIC_API_URL est manquant ! L'application ne peut pas communiquer avec le serveur.");
}

export default ENV;