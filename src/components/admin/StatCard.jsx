// src/components/admin/StatCard.jsx
// COMPOSANT PARTAGE - Carte KPI KPI Liquid Glassmorphism
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import THEME from '../../theme/theme';

const StatCard = ({ title, value, icon, iconColor = THEME.COLORS.champagneGold, style }) => {
  return (
    <View style={[styles.glassContainer, style]}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.glassContent}>
        <Ionicons name={icon} size={24} color={iconColor} />
        <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text style={styles.statLabel} numberOfLines={2}>
          {title}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  glassContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 4,
  },
  glassContent: {
    paddingVertical: 15,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.COLORS.textPrimary,
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: THEME.COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default StatCard;