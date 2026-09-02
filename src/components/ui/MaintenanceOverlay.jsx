// src/components/ui/MaintenanceOverlay.jsx
// BOUCLIER DE MAINTENANCE D'URGENCE - Non-contournable & Redirection Store
// STANDARD: Clean Architecture / Bank Grade / NASA Resilience (Sans Emojis)

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import THEME from '../../theme/theme';
import GoldButton from './GoldButton';

const MaintenanceOverlay = ({
  visible,
  message,
  updateAvailable = false,
  storeUrl = 'https://play.google.com/store/apps/details?id=com.yely.app',
  onCheckStatus,
  onLogout
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!visible) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onCheckStatus) await onCheckStatus();
    } catch (e) {
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenStore = async () => {
    if (Platform.OS === 'web') {
      window.location.reload();
      return;
    }
    try {
      await Linking.openURL(storeUrl);
    } catch (e) {
      console.warn('[Maintenance] Impossible d\'ouvrir le store:', e.message);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={styles.card}>
          <View style={styles.iconWrapper}>
            <Ionicons
              name={updateAvailable ? 'arrow-up-circle-outline' : 'construct-outline'}
              size={54}
              color={THEME.COLORS.champagneGold}
            />
          </View>

          <Text style={styles.title}>
            {updateAvailable ? 'Correctif Disponible sur le Store' : 'Maintenance Technique'}
          </Text>

          <Text style={styles.subtitle}>
            {updateAvailable
              ? 'Une version corrigee de Yely est disponible. Veuillez mettre a jour l\'application pour reprendre vos activites.'
              : message || 'Nos equipes effectuent une maintenance d\'optimisation. Le service reprendra dans quelques instants.'}
          </Text>

          <View style={styles.statusBox}>
            <Ionicons name="shield-checkmark" size={18} color={THEME.COLORS.champagneGold} />
            <Text style={styles.statusText}>
              Protection active : vos donnees et soldes sont 100% securises.
            </Text>
          </View>

          <View style={styles.actions}>
            {updateAvailable ? (
              <GoldButton
                title={Platform.OS === 'web' ? 'Recharger la nouvelle version' : 'Mettre a jour sur Play Store'}
                onPress={handleOpenStore}
                style={styles.primaryBtn}
              />
            ) : null}

            <TouchableOpacity
              style={[styles.refreshBtn, updateAvailable && styles.secondaryBtn]}
              onPress={handleRefresh}
              disabled={isRefreshing}
              activeOpacity={0.8}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color={THEME.COLORS.champagneGold} />
              ) : (
                <>
                  <Ionicons name="sync-outline" size={18} color={THEME.COLORS.champagneGold} style={{ marginRight: 8 }} />
                  <Text style={styles.refreshText}>Verifier la disponibilite</Text>
                </>
              )}
            </TouchableOpacity>

            {onLogout ? (
              <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.7}>
                <Text style={styles.logoutText}>Se deconnecter</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 99999
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(18, 20, 24, 0.95)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    padding: 28,
    alignItems: 'center',
    ...THEME.SHADOWS.lg
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)'
  },
  title: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.3
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 22
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 24,
    gap: 10
  },
  statusText: {
    flex: 1,
    fontSize: 12,
    color: THEME.COLORS.textSecondary,
    lineHeight: 16
  },
  actions: {
    width: '100%',
    gap: 12
  },
  primaryBtn: {
    width: '100%'
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)'
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.COLORS.champagneGold
  },
  logoutBtn: {
    alignItems: 'center',
    paddingVertical: 8
  },
  logoutText: {
    color: THEME.COLORS.textTertiary,
    fontSize: 13
  }
});

export default MaintenanceOverlay;
