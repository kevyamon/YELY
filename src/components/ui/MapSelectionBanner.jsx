// src/components/ui/MapSelectionBanner.jsx
// BANNIÈRE DE GUIDAGE SÉLECTION CARTE EN 2 TEMPS
// CSCSM Level: Bank Grade (Strictement modulaire < 120 lignes, Sans Emojis)

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import THEME from '../../theme/theme';

const MapSelectionBanner = ({ step = 'SELECTING_ORIGIN', onCancel }) => {
  const insets = useSafeAreaInsets();
  const isOrigin = step === 'SELECTING_ORIGIN';

  const stepTitle = isOrigin ? 'Étape 1/2 — Lieu de départ' : 'Étape 2/2 — Destination';
  const instruction = isOrigin
    ? 'Maintenez votre doigt 2 secondes sur la carte pour définir votre point de départ.'
    : 'Parfait ! Maintenez maintenant 2 secondes sur la carte pour définir votre destination.';

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      leaving={FadeOutUp.duration(200)}
      style={[styles.container, { top: insets.top + 12 }]}
    >
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.badgeRow}>
            <View style={[styles.stepDot, isOrigin ? styles.stepDotOrigin : styles.stepDotDest]} />
            <Text style={styles.stepTitle}>{stepTitle}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onCancel}
            style={styles.cancelBtn}
          >
            <Ionicons name="close" size={16} color={THEME.COLORS.danger} />
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bodyRow}>
          <Ionicons
            name={isOrigin ? 'radio-button-on' : 'location'}
            size={18}
            color={isOrigin ? THEME.COLORS.champagneGold : THEME.COLORS.danger}
            style={styles.bodyIcon}
          />
          <Text style={styles.instructionText}>{instruction}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: THEME.SPACING.md,
    right: THEME.SPACING.md,
    zIndex: 9999,
    elevation: 20,
  },
  card: {
    backgroundColor: THEME.COLORS.background,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: THEME.COLORS.champagneGold,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  stepDotOrigin: {
    backgroundColor: THEME.COLORS.champagneGold,
  },
  stepDotDest: {
    backgroundColor: THEME.COLORS.danger,
  },
  stepTitle: {
    color: THEME.COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.COLORS.danger,
  },
  cancelText: {
    color: THEME.COLORS.danger,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 3,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
  },
  bodyIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  instructionText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    flexShrink: 1,
  },
});

export default React.memo(MapSelectionBanner);
