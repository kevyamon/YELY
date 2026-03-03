// src/components/admin/ScrollToTopButton.jsx
// COMPOSANT PARTAGE - Bouton de remontee rapide
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import THEME from '../../theme/theme';

const ScrollToTopButton = ({ onPress, visible }) => {
  if (!visible) return null;

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      <BlurView intensity={80} tint="default" style={StyleSheet.absoluteFill} />
      <Ionicons name="chevron-up" size={28} color={THEME.COLORS.primary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.border,
    backgroundColor: THEME.COLORS.overlay,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  }
});

export default ScrollToTopButton;