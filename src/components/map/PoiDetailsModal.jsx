// src/components/map/PoiDetailsModal.jsx
// MODALE DE DETAILS POI - Bank Grade UI

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import THEME from '../../theme/theme';
import GlassModal from '../ui/GlassModal';
import GoldButton from '../ui/GoldButton';

const PoiDetailsModal = ({ visible, poi, onClose, onSelect }) => {
  if (!poi) return null;

  return (
    <GlassModal
      visible={visible}
      onClose={onClose}
      position="center"
      closeOnBackdrop={true}
    >
      <View style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: poi.iconColor || poi.color || THEME.COLORS.info }]}>
          <Ionicons name={poi.icon || 'location'} size={32} color="#FFFFFF" />
        </View>

        <Text style={styles.title} numberOfLines={3} adjustsFontSizeToFit>
          {poi.name}
        </Text>

        <View style={styles.actionContainer}>
          <GoldButton
            title="Choisir ce lieu"
            icon="navigate"
            onPress={() => onSelect(poi)}
            fullWidth={true}
          />
        </View>
      </View>
    </GlassModal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.SPACING.lg,
    borderWidth: THEME.BORDERS.width.thick,
    borderColor: '#FFFFFF',
    ...THEME.SHADOWS.medium,
  },
  title: {
    color: THEME.COLORS.textPrimary,
    fontSize: THEME.FONTS.sizes.h3,
    fontWeight: THEME.FONTS.weights.bold,
    textAlign: 'center',
    marginBottom: THEME.SPACING.xxl,
    paddingHorizontal: THEME.SPACING.sm,
  },
  actionContainer: {
    width: '100%',
    marginTop: THEME.SPACING.md,
  }
});

export default PoiDetailsModal;