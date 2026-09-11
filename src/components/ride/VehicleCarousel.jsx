// src/components/ride/VehicleCarousel.jsx
// CARROUSEL DES FORFAITS COMPACT - Affichage des 2 forfaits cote a cote avec support de la modale info
// CSCSM Level: Bank Grade (Strictement modulaire < 325 lignes, Zero Emojis)

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import THEME from '../../theme/theme';
import VehicleCard from './VehicleCard';

const VehicleCarousel = ({
  vehicles = [],
  selectedVehicle,
  onSelect,
  onInfoPress,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
        <Text style={styles.loadingText}>Analyse du trajet en cours...</Text>
      </View>
    );
  }

  if (error) {
    const getErrorMessage = (err) => {
      if (!err) return 'Veuillez reessayer.';
      if (typeof err === 'string') return err;
      if (err.data?.message) return err.data.message;
      if (err.message) return err.message;
      if (err.error) return err.error;
      return 'Veuillez reessayer.';
    };

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Impossible d'analyser le trajet.</Text>
        <Text style={[styles.errorSubtext, { textAlign: 'center', paddingHorizontal: 15 }]} numberOfLines={2}>
          {getErrorMessage(error)}
        </Text>
      </View>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return null;
  }

  // Filtrage de securite : on n'affiche que Echo et VIP pour correspondre aux 2 forfaits officiels
  const activeVehicles = vehicles.filter(
    (v) => v.type?.toLowerCase() === 'echo' || v.type?.toLowerCase() === 'vip'
  );

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {activeVehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.type || vehicle.id}
            vehicle={vehicle}
            isSelected={selectedVehicle?.type === vehicle.type}
            onPress={onSelect}
            onInfoPress={onInfoPress}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 88,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
  },
  centerContainer: {
    height: 88,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.COLORS.glassBorder,
    alignSelf: 'center',
  },
  loadingText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 12,
    marginTop: 10,
  },
  errorText: {
    color: THEME.COLORS.danger,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  errorSubtext: {
    color: THEME.COLORS.textTertiary,
    fontSize: 12,
  },
});

export default VehicleCarousel;