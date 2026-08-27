// src/hooks/useAppUpdates.js
// HOOK DE DÉTECTION & FORÇAGE DES MISES À JOUR PLAY STORE (REMOTE CONFIG)
// STANDARD: Industriel / Bank Grade

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import ENV from '../config/env';

const DISMISSED_UPDATE_KEY = 'yely_dismissed_store_update_code';

/**
 * Récupère le versionCode binaire réel installé sur l'appareil
 */
const getLocalVersionCode = () => {
  if (Constants.nativeBuildVersion) {
    const parsed = parseInt(Constants.nativeBuildVersion, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if (Constants.expoConfig?.android?.versionCode) {
    return Number(Constants.expoConfig.android.versionCode);
  }
  return Platform.OS === 'android' ? 21 : 1;
};

export const useAppUpdates = () => {
  const [updateState, setUpdateState] = useState({
    visible: false,
    type: 'store',
    isForced: false,
    title: 'Mise à jour disponible',
    message: 'Une nouvelle version de Yély est disponible sur le Play Store.',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.yely.app',
    targetVersionCode: null,
  });

  const isChecking = useRef(false);

  // 1. Vérification des versions distantes via l'endpoint Remote Config
  const checkStoreUpdates = async () => {
    if (Platform.OS === 'web') return;

    const apiUrl = ENV.API_URL || process.env.EXPO_PUBLIC_API_URL;
    if (!apiUrl) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
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

      const localVersionCode = getLocalVersionCode();
      const remoteLatestCode = Number(versioning.latestVersionCode) || 0;
      const remoteMinCode = Number(versioning.minVersionCode) || 0;
      const isForced = Boolean(versioning.forceUpdate || localVersionCode < remoteMinCode);

      // Si le Store a une version plus récente que le téléphone
      if (remoteLatestCode > localVersionCode) {
        // Si la mise à jour n'est PAS obligatoire, vérifier si l'utilisateur a cliqué "Plus tard"
        if (!isForced) {
          const dismissedCode = await AsyncStorage.getItem(DISMISSED_UPDATE_KEY);
          if (dismissedCode && Number(dismissedCode) >= remoteLatestCode) {
            return; // L'utilisateur a déjà ignoré cette version
          }
        }

        setUpdateState({
          visible: true,
          type: 'store',
          title: versioning.updateTitle || 'Mise à jour disponible',
          message: versioning.updateMessage || 'Une nouvelle version de Yély est disponible sur le Play Store avec des améliorations importantes.',
          isForced,
          storeUrl: versioning.storeUrl || 'https://play.google.com/store/apps/details?id=com.yely.app',
          targetVersionCode: remoteLatestCode,
        });
      } else {
        // Le téléphone est à jour : masquer la modale si elle était ouverte
        setUpdateState((prev) => (prev.visible ? { ...prev, visible: false } : prev));
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
  }, []);

  // 2. Déclenchement automatique au démarrage et à chaque reprise d'activité (Foreground)
  useEffect(() => {
    runCheck();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        runCheck();
      }
    });

    return () => subscription.remove();
  }, [runCheck]);

  // 3. Redirection automatique vers la fiche Google Play Store
  const handleApplyUpdate = async () => {
    const url = updateState.storeUrl || 'https://play.google.com/store/apps/details?id=com.yely.app';
    try {
      await Linking.openURL(url);
    } catch (e) {
      console.warn('[UPDATES] Erreur ouverture Store:', e.message);
    }
  };

  // 4. Fermeture contrôlée avec mémorisation permanente dans AsyncStorage
  const handleDismiss = async () => {
    if (!updateState.isForced) {
      if (updateState.targetVersionCode) {
        try {
          await AsyncStorage.setItem(DISMISSED_UPDATE_KEY, String(updateState.targetVersionCode));
        } catch (e) {
          console.warn('[UPDATES] Échec sauvegarde du dismiss:', e.message);
        }
      }
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
