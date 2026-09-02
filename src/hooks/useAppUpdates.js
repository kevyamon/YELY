// src/hooks/useAppUpdates.js
// HOOK DE DETECTION & GESTION DES MISES A JOUR ET DU MODE MAINTENANCE
// STANDARD: Industriel / Bank Grade / NASA Resilience (Sans Emojis)

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import ENV from '../config/env';
import socketService from '../services/socketService';

const DISMISSED_UPDATE_KEY = 'yely_dismissed_store_update_code';

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
    type: 'store',
    isForced: false,
    title: 'Mise a jour disponible',
    message: 'Une nouvelle version de Yely est disponible.',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.yely.app',
    targetVersionCode: null,
  });

  const [maintenanceState, setMaintenanceState] = useState({
    isMaintenance: false,
    message: '',
    allowedRoles: ['superadmin', 'admin'],
    updateAvailable: false,
    storeUrl: 'https://play.google.com/store/apps/details?id=com.yely.app'
  });

  const isChecking = useRef(false);

  // 1. Verification OTA Expo
  const checkOtaUpdates = async () => {
    if (__DEV__ || Platform.OS === 'web' || !Updates.isEnabled) return false;

    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        setUpdateState({
          visible: true,
          type: 'ota',
          title: 'Mise a jour prete',
          message: 'Une amelioration a ete telechargee. Redemarrez l\'application pour en profiter immediatement.',
          isForced: false,
          storeUrl: null,
          targetVersionCode: null,
        });
        return true;
      }
    } catch (error) {
      console.warn('[OTA] Verification silencieuse:', error.message);
    }
    return false;
  };

  // 2. Verification Remote Config (Play Store & Mode Maintenance)
  const checkRemoteConfig = async () => {
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
      const payload = resJson.data || resJson;
      const maintenance = payload.maintenance;
      const versioning = payload.versioning;

      const localVersionCode = getLocalVersionCode();
      const remoteLatestCode = Number(versioning?.latestVersionCode) || 0;
      const remoteMinCode = Number(versioning?.minVersionCode) || 0;
      const hasNewVersion = remoteLatestCode > localVersionCode;
      const storeUrl = versioning?.storeUrl || 'https://play.google.com/store/apps/details?id=com.yely.app';

      // Mise a jour de l'etat de maintenance
      if (maintenance) {
        setMaintenanceState({
          isMaintenance: Boolean(maintenance.isMaintenanceMode),
          message: maintenance.message || '',
          allowedRoles: maintenance.allowedRoles || ['superadmin', 'admin'],
          updateAvailable: hasNewVersion,
          storeUrl
        });
      }

      // Mise a jour de l'etat de mise a jour Play Store
      if (versioning && Platform.OS !== 'web') {
        const isForced = Boolean(versioning.forceUpdate || localVersionCode < remoteMinCode);

        if (hasNewVersion) {
          if (!isForced) {
            const dismissedCode = await AsyncStorage.getItem(DISMISSED_UPDATE_KEY);
            if (dismissedCode && Number(dismissedCode) >= remoteLatestCode) {
              return;
            }
          }

          setUpdateState({
            visible: !maintenance?.isMaintenanceMode,
            type: 'store',
            title: versioning.updateTitle || 'Mise a jour Play Store',
            message: versioning.updateMessage || 'Une nouvelle version de Yely est disponible.',
            isForced,
            storeUrl,
            targetVersionCode: remoteLatestCode,
          });
        } else {
          setUpdateState((prev) => (prev.visible && prev.type === 'store' ? { ...prev, visible: false } : prev));
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.warn('[CONFIG] Verification ignoree:', e.message);
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
        await checkRemoteConfig();
      }
    } finally {
      isChecking.current = false;
    }
  }, []);

  // 3. Ecoute des Sockets en direct pour basculement instantane
  useEffect(() => {
    const handleMaintenanceSocket = (data) => {
      setMaintenanceState((prev) => ({
        ...prev,
        isMaintenance: Boolean(data.isMaintenanceMode),
        message: data.maintenanceMessage || prev.message
      }));
    };

    socketService.on('SYSTEM_MAINTENANCE_TOGGLED', handleMaintenanceSocket);

    return () => {
      socketService.off('SYSTEM_MAINTENANCE_TOGGLED', handleMaintenanceSocket);
    };
  }, []);

  // 4. Declenchement au demarrage et au reveil d'arriere-plan
  useEffect(() => {
    runCheck();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        runCheck();
      }
    });

    return () => subscription.remove();
  }, [runCheck]);

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

  const handleDismiss = async () => {
    if (!updateState.isForced) {
      if (updateState.type === 'store' && updateState.targetVersionCode) {
        try {
          await AsyncStorage.setItem(DISMISSED_UPDATE_KEY, String(updateState.targetVersionCode));
        } catch (e) {
          console.warn('[UPDATES] Echec sauvegarde dismiss:', e.message);
        }
      }
      setUpdateState((prev) => ({ ...prev, visible: false }));
    }
  };

  return {
    updateState,
    maintenanceState,
    handleApplyUpdate,
    handleDismiss,
    checkStoreUpdates: runCheck,
  };
};

export default useAppUpdates;
