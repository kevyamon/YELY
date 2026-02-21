// src/components/ui/SmartFooter.jsx
// FOOTER INTELLIGENT - Tracé de courbe complet (Full Contour)

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';
import VehicleCarousel from '../ride/VehicleCarousel';

const SmartFooter = ({
  destination,
  displayVehicles,
  selectedVehicle,
  onSelectVehicle,
  isEstimating,
  estimationData,
  estimateError,
  onConfirmRide,
  isAvailable,
  onToggle,
  isToggling
}) => {
  const insets = useSafeAreaInsets();
  const user = useSelector(selectCurrentUser);
  const isRider = user?.role === 'rider';

  const paddingBottom = Math.max(insets.bottom + 20, THEME.SPACING.xl);

  return (
    <View style={[styles.container, { paddingBottom }]}>
      {isRider ? (
        <>
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
                 {/* CORRECTION : On affiche uniquement le nom, sans le prix */}
                 <Text style={[styles.confirmButtonText, !selectedVehicle && styles.confirmButtonTextDisabled]}>
                   {selectedVehicle 
                      ? `Commander Yély ${selectedVehicle.name}`
                      : 'Sélectionnez un véhicule'}
                 </Text>
               </TouchableOpacity>
             </View>
          ) : (
             <View style={styles.emptyBox}>
               <Text style={styles.emptyText}>Sélectionnez une destination</Text>
             </View>
          )}
        </>
      ) : (
        <>
          <View style={[styles.availabilityCard, isAvailable && styles.availabilityCardOnline]}>
            <View style={styles.availabilityRow}>
              <View style={styles.statusInfo}>
                <View style={styles.statusHeader}>
                  <Ionicons 
                    name={isAvailable ? "radio-button-on" : "radio-button-off"} 
                    size={18} 
                    color={isAvailable ? THEME.COLORS.success : THEME.COLORS.textTertiary} 
                  />
                  <Text style={[styles.statusTitle, isAvailable && { color: THEME.COLORS.success }]}>
                    {isAvailable ? 'EN SERVICE' : 'HORS LIGNE'}
                  </Text>
                </View>
                <Text style={styles.statusSubtitle}>
                  {isAvailable ? 'En attente de courses...' : 'Passez en ligne pour travailler'}
                </Text>
              </View>

              <Switch
                value={isAvailable}
                onValueChange={onToggle}
                disabled={isToggling}
                trackColor={{ false: 'rgba(128,128,128,0.3)', true: 'rgba(46, 204, 113, 0.3)' }}
                thumbColor={isAvailable ? THEME.COLORS.success : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={styles.statsContainer}>
            <StatBox icon="car-sport" value="0" label="Courses" />
            <StatBox icon="time" value="0h" label="Heures" />
            <StatBox icon="wallet" value="0 F" label="Gains" isGold />
          </View>
        </>
      )}
    </View>
  );
};

const StatBox = ({ icon, value, label, isGold }) => (
  <View style={styles.statBox}>
    <Ionicons name={icon} size={22} color={isGold ? THEME.COLORS.champagneGold : THEME.COLORS.textSecondary} />
    <Text style={[styles.statValue, isGold && { color: THEME.COLORS.champagneGold }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: THEME.COLORS.background,
    paddingHorizontal: THEME.SPACING.lg,
    paddingTop: THEME.SPACING.xl,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    zIndex: 10,

    // CORRECTION : Contour complet !
    borderWidth: 2.5,
    borderBottomWidth: 0, // On cache juste la ligne collée au bas de l'écran
    borderColor: THEME.COLORS.champagneGold,
    
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 15,
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
  },
  availabilityCard: {
    backgroundColor: THEME.COLORS.glassSurface,
    borderColor: THEME.COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  availabilityCardOnline: {
    backgroundColor: 'rgba(46, 204, 113, 0.08)',
    borderColor: 'rgba(46, 204, 113, 0.3)',
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  statusTitle: {
    color: THEME.COLORS.textPrimary,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  statusSubtitle: {
    color: THEME.COLORS.textSecondary,
    fontSize: 11,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    borderColor: THEME.COLORS.border,
    borderWidth: 1,
  },
  statValue: {
    color: THEME.COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    color: THEME.COLORS.textTertiary,
    fontSize: 10,
    textTransform: 'uppercase',
  }
});

export default SmartFooter;