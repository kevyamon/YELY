// src/hooks/usePwaAutoUpdate.js
// MOTEUR SERVICE WORKER & MISE À JOUR PWA SILENCIEUX - Offline Shell & Bank Grade
// STANDARD: Industriel / Bank Grade

import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import { setAppUpdate } from '../store/slices/uiSlice';

const usePwaAutoUpdate = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      const handleRegistration = (registration) => {
        if (!registration) return;

        // Si un worker est déjà en attente (téléchargement déjà terminé)
        if (registration.waiting) {
          dispatch(
            setAppUpdate({
              isAvailable: true,
              latestVersion: 'PWA Web',
              mandatoryUpdate: false,
              isOta: true,
              isPwaReady: true
            })
          );
          return;
        }

        // Écouter l'arrivée d'une nouvelle version de Service Worker
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              dispatch(
                setAppUpdate({
                  isAvailable: true,
                  latestVersion: 'PWA Web',
                  mandatoryUpdate: false,
                  isOta: true,
                  isPwaReady: true
                })
              );
            }
          };
        };
      };

      const initServiceWorker = async () => {
        try {
          // Enregistrement automatique du Service Worker unifié
          const registration = await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/'
          });
          handleRegistration(registration);

          // Vérification silencieuse périodique
          await registration.update().catch(() => {});
        } catch (error) {
          console.warn('[PWA] Échec enregistrement / vérification Service Worker:', error);
        }
      };

      // Démarrage de l'enregistrement dès le chargement de la page
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
  }, [dispatch]);
};

export default usePwaAutoUpdate;