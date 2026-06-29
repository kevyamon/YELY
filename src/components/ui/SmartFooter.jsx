// src/components/ui/SmartFooter.jsx
// FOOTER INTELLIGENT - Bouton de commande réactif et cycle chauffeur sécurisé
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';
import PassengerCountModal from '../ride/PassengerCountModal';
import VehicleCarousel from '../ride/VehicleCarousel';

const SmartFooter = ({
  destination,
  isEstimating,
  onConfirmRide,
  onSelectVehicle,
  isUserInZone = true,
  displayVehicles = [],
  selectedVehicle = null,
  estimateError = null,
  isAvailable = false,
  isToggling = false,
  onToggleAvailability = () => {},
  isBlocked = false,
  isBlockedByVerification = false,
  promoMode = null,
}) => {
  const insets = useSafeAreaInsets();
  const user = useSelector(selectCurrentUser);
  const isRider = user?.role === 'rider' || user?.role === 'passenger' || user?.role === 'seller';

  const [isPassengerModalVisible, setIsPassengerModalVisible] = useState(false);

  // Initialisation par défaut sur le forfait "echo" (Standard retiré)
  useEffect(() => {
    if (isRider && onSelectVehicle) {
      onSelectVehicle({ type: 'echo', id: '1', name: 'Partagé' });
    }
  }, [isRider, onSelectVehicle]);

  const paddingBottom = Math.max(insets.bottom + 20, THEME.SPACING.xl);
  const isButtonDisabled = isEstimating || !isUserInZone;

  let buttonText = 'Commander un Yely';
  if (!isUserInZone) {
    buttonText = 'Zone non couverte';
  }

  const handleInitialConfirm = () => {
    if (isButtonDisabled) return;
    if (selectedVehicle?.type?.toLowerCase() === 'vip') {
      onConfirmRide(1);
    } else {
      setIsPassengerModalVisible(true);
    }
  };

  const handleFinalConfirm = (passengersCount) => {
    setIsPassengerModalVisible(false);
    onConfirmRide(passengersCount);
  };

  // Rendu de la boîte de description explicative pour le forfait sélectionné
  const renderVehicleDescription = () => {
    if (!selectedVehicle || !destination) return null;
    const isEcho = selectedVehicle.type?.toLowerCase() === 'echo';

    return (
      <View style={styles.descriptionBox}>
        <View style={[styles.descriptionIconWrap, isEcho ? styles.descIconEcho : styles.descIconVip]}>
          <Ionicons 
            name={isEcho ? "people-outline" : "star-outline"} 
            size={16} 
            color={isEcho ? (THEME.COLORS.success || '#4CD964') : (THEME.COLORS.champagneGold || '#D4AF37')} 
          />
        </View>
        <Text style={styles.descriptionText}>
          {isEcho 
            ? "Forfait Partagé : Voyagez en covoiturage avec d'autres passagers pour un tarif économique."
            : "Forfait Privé : Voyagez seul à bord du taxi pour un confort et une intimité maximum."}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom }]}>
      {isRider ? (
        <>
          {destination ? (
            <View style={styles.estimationWrapper}>
              <VehicleCarousel 
                vehicles={displayVehicles}
                selectedVehicle={selectedVehicle}
                onSelect={onSelectVehicle}
                isLoading={isEstimating}
                error={!isUserInZone ? { message: "Vous êtes en dehors de la zone de couverture Yély (Maféré)." } : estimateError}
              />
              
              {/* Explication du forfait */}
              {!isEstimating && !estimateError && renderVehicleDescription()}

              <TouchableOpacity 
                style={[styles.confirmButton, isButtonDisabled && styles.confirmButtonDisabled]}
                disabled={isButtonDisabled}
                onPress={handleInitialConfirm}
                activeOpacity={0.9}
              >
                <View style={styles.buttonContent}>
                  {!isUserInZone && (
                    <Ionicons 
                      name="warning-outline" 
                      size={20} 
                      color={THEME.COLORS.danger} 
                      style={styles.buttonIcon} 
                    />
                  )}
                  <Text style={[
                    styles.confirmButtonText, 
                    isButtonDisabled && styles.confirmButtonTextDisabled,
                    !isUserInZone && { color: THEME.COLORS.danger } 
                  ]}>
                    {buttonText}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyBox}>
              {!isUserInZone ? (
                <>
                  <Ionicons name="warning-outline" size={24} color={THEME.COLORS.danger} style={{ marginBottom: 4 }} />
                  <Text style={[styles.emptyText, { color: THEME.COLORS.danger, fontWeight: 'bold' }]}>
                    Vous êtes en dehors de la zone Yely (Maféré).
                  </Text>
                </>
              ) : (
                <Text style={styles.emptyText}>Sélectionnez une destination</Text>
              )}
            </View>
          )}

          <PassengerCountModal 
            visible={isPassengerModalVisible}
            onClose={() => setIsPassengerModalVisible(false)}
            onConfirm={handleFinalConfirm}
          />
        </>
      ) : (
        /* UI CHAUFFEUR */
        <View style={{ width: '100%' }}>
          {isAvailable ? (
            <>
              <View style={styles.statsContainer}>
                <StatBox icon="car-sport" value={user?.totalRides || 0} label="Courses" />
                <StatBox icon="star" value={user?.rating?.toFixed(1) || "5.0"} label="Note" />
                <StatBox icon="wallet" value={`${user?.totalEarnings || 0} FCFA`} label="Gains" isGold />
              </View>
              <TouchableOpacity 
                style={styles.offlineTextButton} 
                onPress={onToggleAvailability}
                disabled={isToggling}
                activeOpacity={0.7}
              >
                <Ionicons name="power-outline" size={14} color={THEME.COLORS.danger} style={{ marginRight: 6 }} />
                <Text style={styles.offlineTextButtonText}>Passer hors ligne</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.offlineWrapper}>

              {isBlocked ? (
                /* CHAUFFEUR BLOQUÉ (Vérification ou Abonnement) */
                <>
                  <Text style={styles.offlineStatusText}>
                    {isBlockedByVerification 
                      ? "Vérification requise pour pouvoir conduire" 
                      : "Abonnement requis pour pouvoir conduire"}
                  </Text>
                  
                  <TouchableOpacity 
                    style={[styles.onlinePrimaryButton, styles.buttonBlocked]} 
                    onPress={onToggleAvailability}
                    disabled={isToggling}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name={isBlockedByVerification ? "alert-circle-outline" : "card-outline"} 
                      size={18} 
                      color="#FFFFFF" 
                      style={{ marginRight: 8 }} 
                    />
                    <Text style={[styles.onlinePrimaryButtonText, { color: '#FFFFFF' }]}>
                      {isBlockedByVerification ? "VÉRIFICATION REQUISE" : "ACTIVER L'ABONNEMENT"}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                /* CHAUFFEUR DEBOUT (Prêt à se connecter) */
                <>
                  <TouchableOpacity 
                    style={styles.onlinePrimaryButton} 
                    onPress={onToggleAvailability}
                    disabled={isToggling}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="wifi-outline" size={18} color="#121418" style={{ marginRight: 8 }} />
                    <Text style={styles.onlinePrimaryButtonText}>PASSER EN LIGNE</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
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
  estimationWrapper: { width: '100%', alignItems: 'center' },
  emptyBox: { width: '100%', height: 90, backgroundColor: THEME.COLORS.glassLight, borderRadius: 16, borderWidth: 1, borderColor: THEME.COLORS.glassBorder, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  emptyText: { color: THEME.COLORS.textTertiary, fontStyle: 'italic', fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
  confirmButton: { backgroundColor: THEME.COLORS.champagneGold, paddingVertical: 16, width: '100%', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: THEME.COLORS.champagneGold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6 },
  confirmButtonDisabled: { backgroundColor: THEME.COLORS.glassSurface, borderColor: THEME.COLORS.border, borderWidth: 1, shadowOpacity: 0, elevation: 0 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonIcon: { marginRight: 8 },
  confirmButtonText: { color: '#121418', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  confirmButtonTextDisabled: { color: THEME.COLORS.textTertiary },
  
  // Explication de forfait passager
  descriptionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    marginBottom: 8,
    width: '100%',
    gap: 10
  },
  descriptionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  descIconEcho: {
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
  },
  descIconVip: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  descriptionText: {
    flex: 1,
    color: THEME.COLORS.textSecondary || '#A0AEC0',
    fontSize: 13,
    lineHeight: 18,
  },

  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  statBox: { flex: 1, borderRadius: 12, paddingVertical: 15, alignItems: 'center', backgroundColor: THEME.COLORS.glassSurface, borderColor: THEME.COLORS.border, borderWidth: 1 },
  statValue: { color: THEME.COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginVertical: 4 },
  statLabel: { color: THEME.COLORS.textTertiary, fontSize: 10, textTransform: 'uppercase' },
  offlineTextButton: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', paddingVertical: 10, marginTop: 12 },
  offlineTextButtonText: { color: THEME.COLORS.danger, fontSize: 13, fontWeight: 'bold' },
  offlineWrapper: { alignItems: 'center', width: '100%', paddingVertical: 5 },
  offlineStatusText: { color: THEME.COLORS.textTertiary, fontSize: 13, fontStyle: 'italic', marginBottom: 12 },
  onlinePrimaryButton: { backgroundColor: THEME.COLORS.champagneGold, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, width: '100%', borderRadius: 14, shadowColor: THEME.COLORS.champagneGold, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  onlinePrimaryButtonText: { color: '#121418', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  
  // Styles pour les boutons bloqués
  buttonBlocked: {
    backgroundColor: THEME.COLORS.danger || '#E74C3C',
    shadowColor: THEME.COLORS.danger || '#E74C3C',
  },

  // Badge Promo
  promoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10
  },
  promoBadgeText: {
    color: THEME.COLORS.champagneGold || '#D4AF37',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3
  }
});

export default SmartFooter;