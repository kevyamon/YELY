// src/hooks/usePwaAutoUpdate.js
// MOTEUR DE MISE A JOUR PWA - Anti-Cache et Rechargement Silencieux
// CSCSM Level: Bank Grade

import { useEffect } from 'react';
import { Platform } from 'react-native';

const usePwaAutoUpdate = () => {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      const updateServiceWorker = async () => {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (let registration of registrations) {
            registration.update();
          }
        } catch (error) {
          console.warn("[PWA] Echec de la verification de mise a jour:", error);
        }
      };

      // Exécution retardée de 8 secondes pour garantir un démarrage PWA instantané
      const timer = setTimeout(() => {
        updateServiceWorker();
      }, 8000);

      window.addEventListener('focus', updateServiceWorker);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('focus', updateServiceWorker);
      };
    }
  }, []);
};

export default usePwaAutoUpdate;