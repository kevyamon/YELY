// src/components/ui/GlobalErrorFallback.jsx
// COMPOSANT CRASH REPORT & TÉLÉMÉTRIE AUTOMATISÉE VIA BREVO
// STANDARD: Industriel / Bank Grade / Self-Reporting

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ENV from '../../config/env';
import THEME from '../../theme/theme';

const THROTTLE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes anti-spam

const GlobalErrorFallback = ({ error, resetError, componentStack }) => {
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [sendError, setSendError] = useState(false);

  const dispatchCrashReport = async (isManual = false) => {
    try {
      if (!isManual) {
        const lastSentStr = await AsyncStorage.getItem('@yely_last_crash_sent_time');
        const now = Date.now();
        if (lastSentStr && now - parseInt(lastSentStr, 10) < THROTTLE_INTERVAL_MS) {
          // Anti-spam actif, on évite d'épuiser les quotas
          setIsSent(true);
          return;
        }
      }

      setIsSending(true);
      setSendError(false);

      // Récupération de l'utilisateur stocké en local
      let userContext = {};
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          userContext = {
            id: parsed._id || parsed.id || 'N/A',
            name: parsed.name || 'Visiteur',
            phone: parsed.phone || 'Non renseigné',
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
          appVersion: '1.6.0',
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
      } else {
        setSendError(true);
      }
    } catch (err) {
      setSendError(true);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    dispatchCrashReport(false);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* ICON BADGE */}
        <View style={styles.iconContainer}>
          <Ionicons name="shield-half" size={44} color={THEME.COLORS.champagneGold} />
        </View>

        {/* TITLES */}
        <Text style={styles.title}>Oups ! Erreur inattendue</Text>
        <Text style={styles.subtitle}>
          L'application a rencontré un problème technique imprévu.
        </Text>

        {/* STATUS BOX */}
        <View style={styles.statusBox}>
          <Ionicons
            name={isSent ? 'checkmark-circle' : isSending ? 'sync' : 'mail-outline'}
            size={18}
            color={isSent ? THEME.COLORS.success : THEME.COLORS.champagneGold}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.statusText}>
            {isSent
              ? 'Rapport technique transmis par e-mail à l\'équipe.'
              : isSending
              ? 'Transmission du diagnostic technique en cours...'
              : 'Diagnostic prêt à être transmis.'}
          </Text>
        </View>

        {/* REPORT BUTTON */}
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
                {isSent ? 'Rapport envoyé avec succès' : 'Signaler le problème par e-mail'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* RESTART BUTTON */}
        <TouchableOpacity
          style={styles.restartButton}
          onPress={resetError}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={18} color={THEME.COLORS.champagneGold} style={{ marginRight: 8 }} />
          <Text style={styles.restartButtonText}>Redémarrer Yély</Text>
        </TouchableOpacity>

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
    fontSize: 20,
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
    marginBottom: 20,
    width: '100%',
  },
  statusText: {
    fontSize: 12,
    color: '#E0E0E0',
    fontWeight: '600',
    flex: 1,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  reportButtonSent: {
    backgroundColor: '#27AE60',
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  restartButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default GlobalErrorFallback;
