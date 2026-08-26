// src/hooks/useAppUpdates.js
// HOOK DE DÉTECTION & FORÇAGE DES MISES À JOUR PLAY STORE (REMOTE CONFIG)
// STANDARD: Industriel / Bank Grade

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import ENV from '../config/env';

/**
 * @typedef {Object} UpdateState
 * @property {boolean} visible
 * @property {'store' | 'ota'} type
 * @property {string} [title]
 * @property {string} [message]
 * @property {boolean} [isForced]
 * @property {string} [storeUrl]
 */

export const useAppUpdates = () => {
  const [updateState, setUpdateState] = useState({
    visible: false,
    type: 'store',
    isForced: false,
    title: 'Mise à jour disponible',
    message: 'Une nouvelle version de Yély est disponible sur le Play Store.',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.yely.app',
  });

  const isChecking = useRef(false);

  // 1. Récupération du versionCode binaire installé sur le téléphone (ou buildNumber)
  const localVersionCode =
    Constants.expoConfig?.android?.versionCode ||
    (Platform.OS === 'android' ? 19 : 1);

  // 2. Vérification des versions distantes via l'endpoint Remote Config
  const checkStoreUpdates = async () => {
    // Si nous sommes sur le Web, on laisse le gestionnaire PWA opérer
    if (Platform.OS === 'web') return;

    const apiUrl = ENV.API_URL || process.env.EXPO_PUBLIC_API_URL;
    if (!apiUrl) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      // On teste d'abord la route dédiée /config, avec repli automatique sur /health/config
      let response = await fetch(`${apiUrl}/config`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      }).catch(() => null);

      if (!response || !response.ok) {
        response = await fetch(`${apiUrl}/health/config`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        }).catch(() => null);
      }

      clearTimeout(timeoutId);

      if (!response || !response.ok) {
        return;
      }

      const resJson = await response.json();
      const versioning = resJson.data?.versioning || resJson.versioning;
      if (!versioning) return;

      const remoteLatestCode = Number(versioning.latestVersionCode) || 0;
      const remoteMinCode = Number(versioning.minVersionCode) || 0;
      const isForced = Boolean(versioning.forceUpdate || localVersionCode < remoteMinCode);

      // Si le Store a une version plus récente que le téléphone
      if (remoteLatestCode > localVersionCode) {
        setUpdateState({
          visible: true,
          type: 'store',
          title: versioning.updateTitle || 'Mise à jour disponible',
          message: versioning.updateMessage || 'Une nouvelle version de Yély est disponible sur le Play Store avec des améliorations importantes.',
          isForced,
          storeUrl: versioning.storeUrl || 'https://play.google.com/store/apps/details?id=com.yely.app',
        });
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.warn('[UPDATES] Vérification Store ignorée:', e.message);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const runCheck = useCallback(async () => {
    if (isChecking.current) return;
    isChecking.current = true;
    try {
      await checkStoreUpdates();
    } finally {
      isChecking.current = false;
    }
  }, [localVersionCode]);

  // 3. Déclenchement automatique au démarrage et à chaque reprise d'activité (Foreground)
  useEffect(() => {
    runCheck();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        runCheck();
      }
    });

    return () => subscription.remove();
  }, [runCheck]);

  // 4. Redirection automatique vers la fiche Google Play Store
  const handleApplyUpdate = async () => {
    const url = updateState.storeUrl || 'https://play.google.com/store/apps/details?id=com.yely.app';
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch (e) {
      console.warn('[UPDATES] Erreur ouverture Store:', e.message);
    }
  };

  // 5. Fermeture contrôlée (impossible si la mise à jour est obligatoire/forcée)
  const handleDismiss = () => {
    if (!updateState.isForced) {
      setUpdateState((prev) => ({ ...prev, visible: false }));
    }
  };

  return {
    updateState,
    handleApplyUpdate,
    handleDismiss,
    checkStoreUpdates: runCheck,
  };
};

export default useAppUpdates;
