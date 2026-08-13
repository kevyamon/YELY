// src/hooks/usePwaAutoUpdate.js
// MOTEUR DE MISE À JOUR PWA SILENCIEUX - Téléchargement Arrière-Plan & Modale à la fin
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

        // Si un worker est déjà en attente (téléchargement déjà fini au lancement)
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

        // Écouter l'arrivée d'une nouvelle mise à jour
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            // Déclenchement de la modale UNIQUEMENT lorsque le téléchargement est 100% terminé
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

      const checkForUpdates = async () => {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            handleRegistration(registration);
            await registration.update();
          }
        } catch (error) {
          console.warn('[PWA] Échec de la vérification silencieuse de mise à jour:', error);
        }
      };

      // Démarrage prioritaire de l'UI : Vérification retardée de 10s en arrière-plan
      const timer = setTimeout(() => {
        checkForUpdates();
      }, 10000);

      window.addEventListener('focus', checkForUpdates);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('focus', checkForUpdates);
      };
    }
  }, [dispatch]);
};

export default usePwaAutoUpdate;