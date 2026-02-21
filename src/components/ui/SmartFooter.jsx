// src/components/ui/SmartFooter.jsx
// FOOTER INTELLIGENT - Bouton de commande réactif au KML Maféré

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';
import VehicleCarousel from '../ride/VehicleCarousel';
import AvailabilityCard from './AvailabilityCard';

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
  isToggling,
  isUserInZone = true // 🚀 REÇOIT L'ÉTAT DU KML
}) => {
  const insets = useSafeAreaInsets();
  const user = useSelector(selectCurrentUser);
  const isRider = user?.role === 'rider';

  const paddingBottom = Math.max(insets.bottom + 20, THEME.SPACING.xl);

  // 🚀 LOGIQUE MÉTIER : Gestion de l'état du bouton
  const isButtonDisabled = !selectedVehicle || isEstimating || !isUserInZone;
  
  let buttonText = 'Sélectionnez un véhicule';
  if (!isUserInZone) {
    buttonText = '📍 Zone non couverte'; // Si tu es à Abobo
  } else if (selectedVehicle) {
    buttonText = `Commander Yély ${selectedVehicle.name}`; // Si tu es à Maféré
  }

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
                 style={[styles.confirmButton, isButtonDisabled && styles.confirmButtonDisabled]}
                 disabled={isButtonDisabled}
                 onPress={onConfirmRide}
                 activeOpacity={0.9}
               >
                 <Text style={[
                   styles.confirmButtonText, 
                   isButtonDisabled && styles.confirmButtonTextDisabled,
                   !isUserInZone && { color: THEME.COLORS.danger } // Met le texte en rouge si hors zone
                 ]}>
                   {buttonText}
                 </Text>
               </TouchableOpacity>
             </View>
          ) : (
             <View style={styles.emptyBox}>
               {/* 🚀 EXPLICATION HORS ZONE SI PAS DE DESTINATION */}
               {!isUserInZone ? (
                 <>
                   <Ionicons name="warning-outline" size={24} color={THEME.COLORS.danger} style={{ marginBottom: 4 }} />
                   <Text style={[styles.emptyText, { color: THEME.COLORS.danger, fontWeight: 'bold' }]}>
                     Vous êtes en dehors de la zone Yély (Maféré).
                   </Text>
                 </>
               ) : (
                 <Text style={styles.emptyText}>Sélectionnez une destination</Text>
               )}
             </View>
          )}
        </>
      ) : (
        <>
          <AvailabilityCard 
            isAvailable={isAvailable} 
            onToggle={onToggle} 
            isLoading={isToggling} 
          />
          <View style={styles.statsContainer}>
            <StatBox icon="car-sport" value={user?.totalRides || 0} label="Courses" />
            <StatBox icon="star" value={user?.rating?.toFixed(1) || "5.0"} label="Note" />
            <StatBox icon="wallet" value={`${user?.totalEarnings || 0} F`} label="Gains" isGold />
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
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: THEME.COLORS.background, paddingHorizontal: THEME.SPACING.lg, paddingTop: THEME.SPACING.xl, borderTopLeftRadius: 36, borderTopRightRadius: 36, zIndex: 10, borderWidth: 2.5, borderBottomWidth: 0, borderColor: THEME.COLORS.champagneGold, shadowColor: THEME.COLORS.champagneGold, shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 15 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: THEME.COLORS.textSecondary, fontSize: 11, fontWeight: 'bold', letterSpacing: 2 },
  estimationWrapper: { width: '100%', alignItems: 'center' },
  emptyBox: { width: '100%', height: 90, backgroundColor: THEME.COLORS.glassLight, borderRadius: 16, borderWidth: 1, borderColor: THEME.COLORS.glassBorder, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  emptyText: { color: THEME.COLORS.textTertiary, fontStyle: 'italic', fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
  confirmButton: { backgroundColor: THEME.COLORS.champagneGold, paddingVertical: 16, width: '100%', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 15, shadowColor: THEME.COLORS.champagneGold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6 },
  confirmButtonDisabled: { backgroundColor: THEME.COLORS.glassSurface, borderColor: THEME.COLORS.border, borderWidth: 1, shadowOpacity: 0, elevation: 0 },
  confirmButtonText: { color: '#121418', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  confirmButtonTextDisabled: { color: THEME.COLORS.textTertiary },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  statBox: { flex: 1, borderRadius: 12, paddingVertical: 15, alignItems: 'center', backgroundColor: THEME.COLORS.glassSurface, borderColor: THEME.COLORS.border, borderWidth: 1 },
  statValue: { color: THEME.COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginVertical: 4 },
  statLabel: { color: THEME.COLORS.textTertiary, fontSize: 10, textTransform: 'uppercase' }
});

export default SmartFooter;