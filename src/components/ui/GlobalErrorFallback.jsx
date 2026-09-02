// src/components/ui/GlobalErrorFallback.jsx
// BOUCLIER DE SECOURS ANTI-CRASH, AUTO-REPARATION OTA, STORE & PWA
// STANDARD: Industriel / Bank Grade / NASA Resilience (Modularise < 325 lignes, Sans Emojis)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Updates from 'expo-updates';
import ENV from '../../config/env';
import THEME from '../../theme/theme';

const THROTTLE_INTERVAL_MS = 5 * 60 * 1000;

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

const GlobalErrorFallback = ({ error, resetError, componentStack }) => {
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [hasOtaPatch, setHasOtaPatch] = useState(false);
  const [hasStoreUpdate, setHasStoreUpdate] = useState(false);
  const [storeUrl, setStoreUrl] = useState('https://play.google.com/store/apps/details?id=com.yely.app');

  const isWeb = Platform.OS === 'web';

  const checkEmergencyPatches = async () => {
    if (isWeb) return;

    if (!__DEV__ && Updates.isEnabled) {
      try {
        const otaUpdate = await Updates.checkForUpdateAsync();
        if (otaUpdate.isAvailable) {
          await Updates.fetchUpdateAsync();
          setHasOtaPatch(true);
        }
      } catch (otaErr) {
        console.warn('[Crash Fallback] Verification OTA:', otaErr.message);
      }
    }

    try {
      const backendUrl = ENV.API_URL || 'https://yely-backend-yzw4.onrender.com/api';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(`${backendUrl}/config`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (response && response.ok) {
        const json = await response.json();
        const versioning = json.data?.versioning || json.versioning;
        if (versioning) {
          if (versioning.storeUrl) setStoreUrl(versioning.storeUrl);
          const remoteCode = Number(versioning.latestVersionCode) || 0;
          const localCode = getLocalVersionCode();
          if (remoteCode > localCode) {
            setHasStoreUpdate(true);
          }
        }
      }
    } catch (e) {}
  };

  const dispatchCrashReport = async (isManual = false) => {
    try {
      if (!isManual) {
        const lastSentStr = await AsyncStorage.getItem('@yely_last_crash_sent_time');
        const now = Date.now();
        if (lastSentStr && now - parseInt(lastSentStr, 10) < THROTTLE_INTERVAL_MS) {
          setIsSent(true);
          return;
        }
      }

      setIsSending(true);

      let userContext = {};
      try {
        const storedUser = await AsyncStorage.getItem('user') || await AsyncStorage.getItem('userInfo');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          userContext = {
            id: parsed._id || parsed.id || 'N/A',
            name: parsed.name || 'Visiteur',
            phone: parsed.phone || 'Non renseigne',
            role: parsed.role || 'visiteur',
          };
        }
      } catch (uErr) {}

      const reportPayload = {
        errorName: error?.name || 'Erreur Inattendue',
        errorMessage: error?.message || 'Erreur sans message explicite',
        errorStack: error?.stack || 'Non disponible',
        componentStack: componentStack || 'Non disponible',
        user: userContext,
        device: {
          os: Platform.OS,
          osVersion: String(Platform.Version || ''),
          appVersion: '1.7.0',
        },
        timestamp: new Date().toISOString(),
      };

      const backendUrl = ENV.API_URL || 'https://yely-backend-yzw4.onrender.com/api';
      const response = await fetch(`${backendUrl}/reports/crash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportPayload),
      });

      if (response.ok) {
        await AsyncStorage.setItem('@yely_last_crash_sent_time', String(Date.now()));
        setIsSent(true);
      }
    } catch (err) {
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    dispatchCrashReport(false);
    checkEmergencyPatches();
  }, []);

  const handleWebReload = async () => {
    try {
      await AsyncStorage.multiRemove(['theme_reload_route', 'theme_reload']);
      if (typeof window !== 'undefined') {
        if ('caches' in window) {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map(key => caches.delete(key)));
        }
        window.location.reload();
      }
    } catch (e) {
      if (typeof window !== 'undefined') window.location.reload();
    }
  };

  const handleApplyOtaPatch = async () => {
    try {
      await AsyncStorage.multiRemove(['theme_reload_route', 'theme_reload']);
      await Updates.reloadAsync();
    } catch (e) {
      if (resetError) resetError();
    }
  };

  const handleOpenStore = async () => {
    try {
      await Linking.openURL(storeUrl);
    } catch (e) {}
  };

  const handleCleanRestart = async () => {
    try {
      await AsyncStorage.multiRemove(['theme_reload_route', 'theme_reload']);
      if (isWeb) {
        handleWebReload();
      } else {
        Updates.reloadAsync().catch(() => resetError && resetError());
      }
    } catch (e) {
      if (resetError) resetError();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.iconContainer}>
          <Ionicons name="shield-half" size={44} color={THEME.COLORS.champagneGold} />
        </View>

        <Text style={styles.title}>Incident Technique Intercepté</Text>
        <Text style={styles.subtitle}>
          Le bouclier de sécurité Yély a bloqué l'anomalie. Aucune donnée n'a été altérée.
        </Text>

        <View style={styles.statusBox}>
          <Ionicons
            name={isSent ? 'checkmark-circle' : isSending ? 'sync' : 'mail-outline'}
            size={18}
            color={isSent ? THEME.COLORS.success : THEME.COLORS.champagneGold}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.statusText}>
            {isSent
              ? 'Rapport technique transmis aux ingénieurs.'
              : isSending
              ? 'Transmission du diagnostic technique en cours...'
              : 'Diagnostic prêt à être transmis.'}
          </Text>
        </View>

        {/* Action PWA Web : Recharge pure & Purge de cache */}
        {isWeb ? (
          <TouchableOpacity style={styles.primaryActionBtn} onPress={handleWebReload} activeOpacity={0.8}>
            <Ionicons name="refresh-circle" size={20} color="#000000" style={{ marginRight: 8 }} />
            <Text style={styles.primaryActionText}>Recharger l'application</Text>
          </TouchableOpacity>
        ) : (
          <>
            {/* Action Mobile 1 : Correctif OTA prêt */}
            {hasOtaPatch ? (
              <TouchableOpacity style={styles.primaryActionBtn} onPress={handleApplyOtaPatch} activeOpacity={0.8}>
                <Ionicons name="sparkles" size={18} color="#000000" style={{ marginRight: 8 }} />
                <Text style={styles.primaryActionText}>Appliquer le correctif & Redémarrer</Text>
              </TouchableOpacity>
            ) : null}

            {/* Action Mobile 2 : Correctif Store détecté */}
            {!hasOtaPatch && hasStoreUpdate ? (
              <TouchableOpacity style={styles.primaryActionBtn} onPress={handleOpenStore} activeOpacity={0.8}>
                <Ionicons name="cloud-download-outline" size={18} color="#000000" style={{ marginRight: 8 }} />
                <Text style={styles.primaryActionText}>Mettre à jour sur Google Play</Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}

        <TouchableOpacity
          style={[styles.reportButton, isSent && styles.reportButtonSent]}
          onPress={() => dispatchCrashReport(true)}
          disabled={isSending}
          activeOpacity={0.8}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <>
              <Ionicons
                name={isSent ? 'checkmark-done' : 'paper-plane-outline'}
                size={16}
                color={isSent ? '#FFFFFF' : '#000000'}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.reportButtonText, isSent && { color: '#FFFFFF' }]}>
                {isSent ? 'Rapport transmis avec succès' : 'Transmettre le rapport technique'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {!isWeb && (
          <TouchableOpacity style={styles.restartButton} onPress={handleCleanRestart} activeOpacity={0.8}>
            <Ionicons name="refresh" size={18} color={THEME.COLORS.champagneGold} style={{ marginRight: 8 }} />
            <Text style={styles.restartButtonText}>Réinitialiser le cache & Redémarrer</Text>
          </TouchableOpacity>
        )}

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#141414',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  title: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
    width: '100%',
  },
  statusText: {
    fontSize: 12,
    color: '#E0E0E0',
    fontWeight: '600',
    flex: 1,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.champagneGold,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    marginBottom: 10,
  },
  reportButtonSent: {
    backgroundColor: '#27AE60',
  },
  reportButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  restartButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default GlobalErrorFallback;
