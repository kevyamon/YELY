// src/hooks/usePwaAutoUpdate.js
// MOTEUR SERVICE WORKER & MISE À JOUR PWA SILENCIEUSE - Offline Shell & Bank Grade
// STANDARD: Industriel / Bank Grade

import { useEffect } from 'react';
import { Platform } from 'react-native';

const usePwaAutoUpdate = () => {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      const handleRegistration = (registration) => {
        if (!registration) return;

        // Auto-activation immédiate et silencieuse si un worker est en attente
        if (registration.waiting) {
          try {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          } catch (e) {}
          return;
        }

        // Écouter l'arrivée d'une nouvelle version de Service Worker
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              try {
                installingWorker.postMessage({ type: 'SKIP_WAITING' });
              } catch (e) {}
            }
          };
        };
      };

      const initServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/'
          });
          handleRegistration(registration);

          // Vérification silencieuse périodique
          await registration.update().catch(() => {});
        } catch (error) {
          console.warn('[PWA] Enregistrement Service Worker silencieux:', error);
        }
      };

      if (document.readyState === 'complete') {
        initServiceWorker();
      } else {
        window.addEventListener('load', initServiceWorker);
      }

      // Re-vérification au focus de la fenêtre
      const onFocus = async () => {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            handleRegistration(reg);
            await reg.update().catch(() => {});
          }
        } catch (e) {}
      };

      window.addEventListener('focus', onFocus);

      return () => {
        window.removeEventListener('load', initServiceWorker);
        window.removeEventListener('focus', onFocus);
      };
    }
  }, []);
};

export default usePwaAutoUpdate;