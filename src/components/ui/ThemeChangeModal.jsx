// src/components/ui/ThemeChangeModal.jsx
// MODALE BLOQUANTE - Forcage du redemarrage lors du changement de theme systeme

import * as Updates from 'expo-updates';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';

const ThemeChangeModal = () => {
  const handleRestart = async () => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      if (__DEV__) {
        console.warn("Rechargement manuel requis en developpement.");
      }
    }
  };

  return (
    <View style={styles.themeModalContainer}>
      <View style={styles.themeModalContent}>
        <Text style={styles.themeModalTitle}>Nouveau theme detecte</Text>
        <Text style={styles.themeModalText}>
          L'apparence de votre systeme a change. Veuillez redemarrer Yely pour appliquer les nouvelles couleurs.
        </Text>
        <TouchableOpacity style={styles.themeModalButton} onPress={handleRestart}>
          <Text style={styles.themeModalButtonText}>Redemarrer Yely</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  themeModalContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.COLORS.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: THEME.SPACING.xl,
  },
  themeModalContent: {
    backgroundColor: THEME.COLORS.glassSurface,
    padding: THEME.SPACING.xxl,
    borderRadius: THEME.BORDERS.radius.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.border,
    ...THEME.SHADOWS.strong,
  },
  themeModalTitle: {
    fontSize: THEME.FONTS.sizes.h3,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
    marginBottom: THEME.SPACING.md,
    textAlign: 'center',
  },
  themeModalText: {
    fontSize: THEME.FONTS.sizes.body,
    color: THEME.COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: THEME.SPACING.xxl,
    lineHeight: 22,
  },
  themeModalButton: {
    backgroundColor: THEME.COLORS.primary,
    paddingVertical: THEME.SPACING.md,
    paddingHorizontal: THEME.SPACING.xxl,
    borderRadius: THEME.BORDERS.radius.pill,
    width: '100%',
    alignItems: 'center',
    ...THEME.SHADOWS.goldSoft,
  },
  themeModalButtonText: {
    color: THEME.COLORS.textInverse,
    fontWeight: THEME.FONTS.weights.bold,
    fontSize: THEME.FONTS.sizes.body,
  }
});

export default ThemeChangeModal;