// src/hooks/usePwaAutoUpdate.js
// MOTEUR DE MISE A JOUR PWA - Anti-Cache et Rechargement Silencieux
// CSCSM Level: Bank Grade

import { useEffect } from 'react';
import { Platform } from 'react-native';

const usePwaAutoUpdate = () => {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    let refreshing = false;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload(true);
        }
      });

      const updateServiceWorker = async () => {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (let registration of registrations) {
            await registration.update();
          }
        } catch (error) {
          console.warn("[PWA] Echec de la verification de mise a jour:", error);
        }
      };

      window.addEventListener('focus', updateServiceWorker);
      
      return () => {
        window.removeEventListener('focus', updateServiceWorker);
      };
    }
  }, []);
};

export default usePwaAutoUpdate;