// src/components/admin/StatCard.jsx
// COMPOSANT PARTAGE - Carte KPI Liquid Glassmorphism Adaptif
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import THEME from '../../theme/theme';

const StatCard = ({ title, value, icon, iconColor = THEME.COLORS.primary, style }) => {
  return (
    <View style={[styles.glassContainer, style]}>
      <BlurView intensity={60} tint="default" style={StyleSheet.absoluteFill} />
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
    borderRadius: THEME.BORDERS.radius.xl,
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.border,
    backgroundColor: THEME.COLORS.overlay,
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