// src/components/ride/VehicleCarousel.jsx
// CARROUSEL DES FORFAITS - Affiche la liste des options et gère la sélection

import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import THEME from '../../theme/theme';
import VehicleCard from './VehicleCard';

const VehicleCarousel = ({ vehicles = [], selectedVehicle, onSelect, isLoading, error }) => {
  
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
        <Text style={styles.loadingText}>Analyse du trajet en cours...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Impossible d'analyser le trajet.</Text>
        <Text style={styles.errorSubtext}>Veuillez réessayer.</Text>
      </View>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={132} // Largeur carte (120) + marge (12)
      >
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.type || vehicle.id}
            vehicle={vehicle}
            isSelected={selectedVehicle?.type === vehicle.type}
            onPress={onSelect}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 150, // Hauteur fixe pour éviter les sauts de layout
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: THEME.LAYOUT.spacing.lg,
    paddingVertical: 5, // Laisse la place pour l'ombre de sélection
  },
  centerContainer: {
    height: 140,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.COLORS.glassBorder,
    marginHorizontal: THEME.LAYOUT.spacing.lg,
    alignSelf: 'center', // Fixe la largeur sur l'écran
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
  }
});

export default VehicleCarousel;