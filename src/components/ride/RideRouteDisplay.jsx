// src/components/ride/RideRouteDisplay.jsx
// COMPOSANT UI - Affichage modulaire de l'itineraire
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import THEME from '../../theme/theme';

const RideRouteDisplay = ({ originAddress, destinationAddress, showDestination = false, variant = 'rider' }) => {
  if (variant === 'driver') {
    return (
      <View style={styles.routeContainer}>
        <View style={styles.routeRow}>
          <Ionicons
            name="navigate-circle"
            size={24}
            color={showDestination ? THEME.COLORS.success : THEME.COLORS.danger}
          />
          <Text style={styles.routeTextDriver} numberOfLines={2}>
            {showDestination ? destinationAddress : originAddress}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.routeContainer}>
      <View style={styles.routeRow}>
        <View style={styles.iconContainer}>
          <Ionicons name="location" size={18} color={THEME.COLORS.info} />
        </View>
        <Text style={styles.routeText} numberOfLines={1}>
          {originAddress || 'Point de depart'}
        </Text>
      </View>
      
      <View style={styles.routeDots} />
      
      <View style={styles.routeRow}>
        <View style={styles.iconContainer}>
          <Ionicons name="flag" size={18} color={THEME.COLORS.danger} />
        </View>
        <Text style={styles.routeText} numberOfLines={1}>
          {destinationAddress || 'Destination'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  routeContainer: {
    backgroundColor: THEME.COLORS.glassLight,
    paddingHorizontal: THEME.SPACING.md,
    paddingVertical: THEME.SPACING.sm,
    borderRadius: 16,
    marginBottom: THEME.SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeText: {
    marginLeft: 12,
    color: THEME.COLORS.textPrimary,
    fontSize: 14,
    flex: 1,
    fontWeight: '600',
  },
  routeTextDriver: {
    marginLeft: 12,
    color: THEME.COLORS.textPrimary,
    fontSize: 16,
    flex: 1,
    fontWeight: '700',
  },
  routeDots: {
    height: 16,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    borderColor: THEME.COLORS.textTertiary,
    marginLeft: 11, // Centre par rapport a l'icone de 24px de large
    marginVertical: 4,
  },
});

export default RideRouteDisplay;