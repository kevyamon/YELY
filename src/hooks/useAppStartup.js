// src/hooks/useAppStartup.js
// HOOK DE DÉMARRAGE — Architecture stable (Zéro boucle infinie)
// CSCSM Level: Bank Grade

import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ENV from '../config/env';
import socketService from '../services/socketService';
import { apiSlice } from '../store/slices/apiSlice';
import {
    forceSilentRefresh,
    selectIsAuthenticated,
    selectToken,
    updatePromoMode
} from '../store/slices/authSlice';
import {
    setAppUpdate,
    showErrorToast,
    showSuccessToast
} from '../store/slices/uiSlice';
import store from '../store/store';

const isVersionOutdated = (current, latest) => {
  if (!current || !latest) return false;
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);
  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const c = currentParts[i] || 0;
    const l = latestParts[i] || 0;
    if (l > c) return true;
    if (c > l) return false;
  }
  return false;
};

const useAppStartup = () => {
  const dispatch = useDispatch();
  const currentAppVersion = Constants.expoConfig?.version || '1.2.0';

  // Lecture RÉACTIVE pour déclencher l'effet socket (string/bool = stable, pas d'objet)
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const token = useSelector(selectToken);

  const appState = useRef(AppState.currentState);
  const hasCheckedSystem = useRef(false);
  const wasOffline = useRef(false);

  // ─── Fonction stable : lit le store au moment de l'appel, pas via selector ───
  const checkSystemStatus = useRef(async () => {
    try {
      const apiUrl = ENV.API_URL || process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/health/config`);
      if (response.ok) {
        const payload = await response.json();
        const data = payload.data || payload;
        // Lecture ponctuelle du store — ne crée pas de dépendance réactive
        const isSuperAdmin = store.getState().auth.user?.role === 'superadmin';

        dispatch(setAppUpdate({
          isAvailable: isSuperAdmin ? false : isVersionOutdated(currentAppVersion, data.latestVersion),
          latestVersion: data.latestVersion || currentAppVersion,
          mandatoryUpdate: data.mandatoryUpdate,
          updateUrl: data.updateUrl || 'https://download-yely.onrender.com',
          isOta: data.isOta
        }));

        if (Object.prototype.hasOwnProperty.call(data, 'isGlobalFreeAccess')) {
          dispatch(updatePromoMode({
            isGlobalFreeAccess: data.isGlobalFreeAccess,
            promoMessage: data.promoMessage
          }));
        }
      }
    } catch (error) {
      console.warn("[APP_INIT] Vérification configuration échouée:", error);
    }
  }).current;

  // ─── Effet 1 : Vérification système unique au démarrage ───────────────────
  useEffect(() => {
    if (!hasCheckedSystem.current) {
      hasCheckedSystem.current = true;
      checkSystemStatus();
    }
  }, []); // Intentionnellement vide — une seule exécution

  // ─── Effet 2 : Connexion socket — ne dépend que de primitives stables ─────
  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect(token);
    } else if (!isAuthenticated) {
      socketService.disconnect();
    }
  }, [isAuthenticated, token]); // bool + string = jamais d'objet = pas de boucle

  // ─── Effet 3 : Retour en foreground ───────────────────────────────────────
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        dispatch(forceSilentRefresh()).then(() => {
          const currentToken = store.getState().auth.token;
          if (currentToken) {
            dispatch(apiSlice.util.invalidateTags([
              'User', 'Subscription', 'SystemConfig', 'MapSettings', 'Stats', 'Ride'
            ]));
          }
        });
        checkSystemStatus();
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, []); // Vide : le listener est créé une seule fois

  // ─── Effet 4 : Surveillance réseau — sans dépendance sur l'état toast ─────
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected && !wasOffline.current) {
        wasOffline.current = true;
        dispatch(showErrorToast({
          title: "PAS DE CONNEXION",
          message: "Veuillez activer vos données mobiles ou le Wi-Fi."
        }));
      } else if (state.isConnected && wasOffline.current) {
        wasOffline.current = false;
        dispatch(showSuccessToast({
          title: "Connexion rétablie",
          message: "Vous êtes de nouveau en ligne."
        }));
        checkSystemStatus();
      }
    });
    return () => unsubscribe();
  }, []); // Vide : wasOffline est une ref, pas un state
};

export default useAppStartup;