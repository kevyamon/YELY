// src/components/ride/RiderBottomPanel.jsx
// COMPOSANT PASSAGER - Panneau des forfaits fixe avec Design "Arc" (Encastré)

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import THEME from '../../theme/theme';
import VehicleCarousel from './VehicleCarousel';

const RiderBottomPanel = ({
  destination,
  displayVehicles,
  selectedVehicle,
  onSelectVehicle,
  isEstimating,
  estimationData,
  estimateError,
  onConfirmRide,
  // Propriété spéciale pour injecter la barre de recherche sur la version Web
  topContent = null 
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.bottomPanel, 
      { paddingBottom: Math.max(insets.bottom + 20, THEME.SPACING.xl) }
    ]}>
      
      {/* INJECTION WEB (Barre de recherche ou Bouton annuler web) */}
      {topContent && (
        <View style={styles.topContentWrapper}>
          {topContent}
        </View>
      )}

      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>NOS OFFRES</Text>
      </View>
      
      {destination ? (
         <View style={styles.estimationWrapper}>
           <VehicleCarousel 
             vehicles={displayVehicles}
             selectedVehicle={selectedVehicle}
             onSelect={onSelectVehicle}
             isLoading={isEstimating && !estimationData}
             error={estimateError}
           />
           
           <TouchableOpacity 
             style={[styles.confirmButton, !selectedVehicle && styles.confirmButtonDisabled]}
             disabled={!selectedVehicle || isEstimating}
             onPress={onConfirmRide}
             activeOpacity={0.9}
           >
             <Text style={[styles.confirmButtonText, !selectedVehicle && styles.confirmButtonTextDisabled]}>
               {selectedVehicle 
                  ? `Commander Yély ${selectedVehicle.name} • ${selectedVehicle.estimatedPrice} F`
                  : 'Sélectionnez un véhicule'}
             </Text>
           </TouchableOpacity>
         </View>
      ) : (
         <View style={styles.emptyBox}>
           <Text style={styles.emptyText}>Sélectionnez une destination</Text>
         </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  bottomPanel: {
    // FIXATION PARFAITE EN BAS
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: THEME.COLORS.background,
    paddingHorizontal: THEME.SPACING.lg,
    paddingTop: THEME.SPACING.xl,
    
    // DESIGN ORGANIQUE : Arc du bas
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  topContentWrapper: {
    marginBottom: 15,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: THEME.COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  estimationWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  emptyBox: {
    width: '100%',
    height: 90,
    backgroundColor: THEME.COLORS.glassLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyText: {
    color: THEME.COLORS.textTertiary,
    fontStyle: 'italic',
    fontSize: 13,
  },
  confirmButton: {
    backgroundColor: THEME.COLORS.champagneGold,
    paddingVertical: 16,
    width: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  confirmButtonDisabled: {
    backgroundColor: THEME.COLORS.glassSurface,
    borderColor: THEME.COLORS.border,
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonText: {
    color: '#121418',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  confirmButtonTextDisabled: {
    color: THEME.COLORS.textTertiary,
  }
});

export default RiderBottomPanel;