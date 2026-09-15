// src/components/driver/IdentityPromptModal.jsx
// MODALE D'INVITATION A LA VERIFICATION D'IDENTITE CHAUFFEUR
// CSCSM Level: Bank Grade (Modularisé < 325 lignes, Sans Emojis, Zero-Fail)

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';

const IdentityPromptModal = ({
  visible = false,
  onVerifyPress = () => {},
  onDismiss = () => {},
}) => {
  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons
              name="shield-checkmark"
              size={36}
              color={THEME.COLORS.champagneGold}
            />
          </View>

          <Text style={styles.title}>Vérification d'Identité Requise</Text>

          <Text style={styles.description}>
            Pour pouvoir passer en ligne et commencer à recevoir des courses à Maféré, vous devez obligatoirement soumettre vos pièces d'identité et les informations de votre tricycle.
          </Text>

          <View style={styles.infoBadge}>
            <Ionicons name="information-circle-outline" size={18} color={THEME.COLORS.champagneGold} style={styles.badgeIcon} />
            <Text style={styles.badgeText}>
              Validation rapide par l'administration Yély.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onVerifyPress}
            activeOpacity={0.85}
          >
            <Ionicons name="document-text-outline" size={18} color="#121418" style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>Vérifier mon identité</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Plus tard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9999,
  },
  card: {
    backgroundColor: THEME.COLORS.glassSurface || '#1A1D24',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1.5,
    borderColor: THEME.COLORS.champagneGold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.COLORS.champagneGold,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 14,
    color: THEME.COLORS.textSecondary || '#D1D5DB',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 18,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 22,
    width: '100%',
  },
  badgeIcon: {
    marginRight: 8,
  },
  badgeText: {
    flex: 1,
    fontSize: 12,
    color: THEME.COLORS.champagneGold,
    fontWeight: '600',
    lineHeight: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.champagneGold,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    marginBottom: 10,
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#121418',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    color: THEME.COLORS.textTertiary || '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default React.memo(IdentityPromptModal);
