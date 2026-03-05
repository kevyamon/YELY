// src/hooks/usePushNotifications.web.js
// GESTION FCM WEB - Intercepteur pour protéger le natif
// CSCSM Level: Bank Grade

import { useEffect } from 'react';

/**
 * En environnement Web, l'API expo-notifications nécessite un Service Worker (VAPID) complexe.
 * Pour ne pas faire crasher la PWA ni déranger l'application native, ce fichier .web.js
 * est automatiquement sélectionné par Expo lors du build web. Il agit comme un silencieux.
 */
const usePushNotifications = () => {
  useEffect(() => {
    console.info('[PUSH SYSTEM] Environnement Web détecté : Notifications natives désactivées pour garantir la stabilité.');
    // Plus tard, nous pourrons implémenter la logique Web Push (Firebase JS SDK) ici, 
    // sans jamais toucher à la logique iOS/Android.
  }, []);
};

export default usePushNotifications;