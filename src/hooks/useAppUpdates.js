// src/hooks/useAppUpdates.js
// HOOK DE DÉTECTION & GESTION DES MISES À JOUR (PLAY STORE & OTA EXPO)
// STANDARD: Industriel / Bank Grade

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
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
  return Platform.OS === 'android' ? 22 : 1;
};

export const useAppUpdates = () => {
  const [updateState, setUpdateState] = useState({
    visible: false,
    type: 'store', // 'store' ou 'ota'
    isForced: false,
    title: 'Mise à jour disponible',
    message: 'Une nouvelle version de Yély est disponible.',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.yely.app',
    targetVersionCode: null,
  });

  const isChecking = useRef(false);

  // 1. Vérification OTA Expo (Patch JS sans passer par le Store)
  const checkOtaUpdates = async () => {
    if (__DEV__ || Platform.OS === 'web' || !Updates.isEnabled) return false;

    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        setUpdateState({
          visible: true,
          type: 'ota',
          title: 'Mise à jour prête !',
          message: 'Une amélioration a été téléchargée. Redémarrez l\'application pour en profiter immédiatement.',
          isForced: false,
          storeUrl: null,
          targetVersionCode: null,
        });
        return true;
      }
    } catch (error) {
      console.warn('[OTA] Vérification silencieuse:', error.message);
    }
    return false;
  };

  // 2. Vérification des versions Store via Remote Config
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

      if (!response || !response.ok) return;

      const resJson = await response.json();
      const versioning = resJson.data?.versioning || resJson.versioning;
      if (!versioning) return;

      const localVersionCode = getLocalVersionCode();
      const remoteLatestCode = Number(versioning.latestVersionCode) || 0;
      const remoteMinCode = Number(versioning.minVersionCode) || 0;
      const isForced = Boolean(versioning.forceUpdate || localVersionCode < remoteMinCode);

      if (remoteLatestCode > localVersionCode) {
        if (!isForced) {
          const dismissedCode = await AsyncStorage.getItem(DISMISSED_UPDATE_KEY);
          if (dismissedCode && Number(dismissedCode) >= remoteLatestCode) {
            return;
          }
        }

        setUpdateState({
          visible: true,
          type: 'store',
          title: versioning.updateTitle || 'Mise à jour Play Store',
          message: versioning.updateMessage || 'Une nouvelle version de Yély est disponible sur le Google Play Store.',
          isForced,
          storeUrl: versioning.storeUrl || 'https://play.google.com/store/apps/details?id=com.yely.app',
          targetVersionCode: remoteLatestCode,
        });
      } else {
        setUpdateState((prev) => (prev.visible && prev.type === 'store' ? { ...prev, visible: false } : prev));
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
      const otaFound = await checkOtaUpdates();
      if (!otaFound) {
        await checkStoreUpdates();
      }
    } finally {
      isChecking.current = false;
    }
  }, []);

  // 3. Déclenchement au démarrage et au retour d'arrière-plan
  useEffect(() => {
    runCheck();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        runCheck();
      }
    });

    return () => subscription.remove();
  }, [runCheck]);

  // 4. Action de mise à jour (Rechargement instantané pour OTA OU Redirection Store)
  const handleApplyUpdate = async () => {
    if (updateState.type === 'ota') {
      try {
        await Updates.reloadAsync();
      } catch (e) {
        console.warn('[OTA] Erreur rechargement:', e.message);
      }
      return;
    }

    const url = updateState.storeUrl || 'https://play.google.com/store/apps/details?id=com.yely.app';
    try {
      await Linking.openURL(url);
    } catch (e) {
      console.warn('[UPDATES] Erreur ouverture Store:', e.message);
    }
  };

  // 5. Fermeture contrôlée
  const handleDismiss = async () => {
    if (!updateState.isForced) {
      if (updateState.type === 'store' && updateState.targetVersionCode) {
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
