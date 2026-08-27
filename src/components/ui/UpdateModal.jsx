// src/components/ui/UpdateModal.jsx
// MODALE PLAY STORE - Détection & Forçage des Mises à Jour Distantes
// STANDARD: Industriel / Bank Grade

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../theme/theme';

/**
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {string} [props.title]
 * @param {string} [props.message]
 * @param {boolean} [props.isForced]
 * @param {() => void} props.onUpdate
 * @param {() => void} [props.onDismiss]
 */
export default function UpdateModal({
  visible,
  title,
  message,
  isForced,
  onUpdate,
  onDismiss,
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!visible) return null;

  const cardBg = isDark ? '#0A0A0A' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const subTextColor = isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(26, 26, 26, 0.75)';
  const dismissBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  const dismissBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)';
  const dismissTextColor = isDark ? 'rgba(255, 255, 255, 0.85)' : '#1A1A1A';
  const iconBorderColor = isDark ? '#0A0A0A' : '#FFFFFF';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={isForced ? () => {} : onDismiss}
    >
      <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)' }]}>
        <BlurView intensity={isDark ? 90 : 60} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />

        <View style={[styles.alertCard, { backgroundColor: cardBg, borderColor: isDark ? 'rgba(212, 175, 55, 0.35)' : 'rgba(212, 175, 55, 0.45)' }]}>
          {/* Badge Icône Haute Définition */}
          <View style={[styles.iconContainer, { borderColor: iconBorderColor }]}>
            <Ionicons name="cloud-download-outline" size={38} color="#000000" />
          </View>

          {/* Titre & Message explicatif */}
          <Text style={[styles.title, { color: textColor }]}>{title || 'Mise à jour disponible'}</Text>
          <Text style={[styles.message, { color: subTextColor }]}>
            {message || 'Une nouvelle version de Yély est disponible sur le Play Store avec des améliorations importantes.'}
          </Text>

          {/* Boutons d'action */}
          <View style={styles.buttonRow}>
            {!isForced && onDismiss && (
              <TouchableOpacity
                style={[styles.dismissBtn, { backgroundColor: dismissBg, borderColor: dismissBorder }]}
                onPress={onDismiss}
                activeOpacity={0.7}
              >
                <Text style={[styles.dismissText, { color: dismissTextColor }]}>Plus tard</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.updateBtn, isForced && styles.updateBtnFull]}
              onPress={onUpdate}
              activeOpacity={0.85}
            >
              <Text style={styles.updateText}>Mettre à jour</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerNote}>Équipe Technique Yély</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    elevation: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME.COLORS.champagneGold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: -48,
    borderWidth: 4,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  dismissBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  dismissText: {
    fontWeight: '700',
    fontSize: 14,
  },
  updateBtn: {
    flex: 1.3,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.champagneGold,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  updateBtnFull: {
    flex: 1,
  },
  updateText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 15,
  },
  footerNote: {
    marginTop: 18,
    fontSize: 11,
    color: THEME.COLORS.champagneGold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    opacity: 0.85,
  },
});
