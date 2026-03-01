// src/components/ride/RideRouteDisplay.jsx
// COMPOSANT UI - Affichage modulaire de l'itineraire
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import THEME from '../../theme/theme';

const RideRouteDisplay = ({ originAddress, destinationAddress, isOngoing = false, variant = 'rider' }) => {
  if (variant === 'driver') {
    return (
      <View style={styles.routeContainer}>
        <View style={styles.routeRow}>
          <Ionicons
            name="navigate-circle"
            size={20}
            color={isOngoing ? THEME.COLORS.success : THEME.COLORS.danger}
          />
          <Text style={styles.routeText} numberOfLines={2}>
            {isOngoing ? destinationAddress : originAddress}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.routeContainer}>
      <View style={styles.routeRow}>
        <Ionicons name="location" size={16} color={THEME.COLORS.info} />
        <Text style={styles.routeText} numberOfLines={1}>
          {originAddress || 'Point de depart'}
        </Text>
      </View>
      <View style={styles.routeDots} />
      <View style={styles.routeRow}>
        <Ionicons name="flag" size={16} color={THEME.COLORS.danger} />
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
    padding: THEME.SPACING.md,
    borderRadius: 16,
    marginBottom: THEME.SPACING.md,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    marginLeft: 8,
    color: THEME.COLORS.textSecondary,
    fontSize: 13,
    flex: 1,
    fontWeight: '700',
  },
  routeDots: {
    height: 12,
    borderLeftWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: THEME.COLORS.textTertiary,
    marginLeft: 7,
    marginVertical: 2,
  },
});

export default RideRouteDisplay;