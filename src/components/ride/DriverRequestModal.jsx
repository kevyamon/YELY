// src/components/ride/DriverRequestModal.jsx
// MODAL CHAUFFEUR - Glow Up UI, Sequencage, Affichage Passagers & Hyper-Responsive (S8/SE)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useLockRideMutation, useSubmitPriceMutation } from '../../store/api/ridesApiSlice';
import { clearIncomingRide, selectIncomingRide } from '../../store/slices/rideSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';
import GlassModal from '../ui/GlassModal';
import GoldButton from '../ui/GoldButton';

const DriverRequestModal = () => {
  const dispatch = useDispatch();
  const incomingRide = useSelector(selectIncomingRide);
  
  const [lockRide] = useLockRideMutation();
  const [submitPrice] = useSubmitPriceMutation();
  
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [loadingStep, setLoadingStep] = useState(null);

  // Intelligence Adaptative pour les petits ecrans (ex: Galaxy S8, iPhone SE)
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenHeight < 700;
  const isNarrowScreen = screenWidth < 360;

  if (!incomingRide) return null;

  const handleIgnore = () => {
    if (loadingStep) return;
    dispatch(clearIncomingRide());
  };

  const handleAcceptAndPropose = async () => {
    if (!selectedAmount) {
      dispatch(showErrorToast({ 
        title: 'Selection requise', 
        message: 'Veuillez choisir un tarif a proposer.' 
      }));
      return;
    }

    try {
      setLoadingStep('locking');
      await lockRide({ rideId: incomingRide.rideId }).unwrap();
      
      setLoadingStep('submitting');
      await submitPrice({ rideId: incomingRide.rideId, amount: selectedAmount }).unwrap();
      
      dispatch(showSuccessToast({ 
        title: 'Offre envoyee', 
        message: 'En attente de la reponse du client.' 
      }));
      
      dispatch(clearIncomingRide()); 

    } catch (error) {
      dispatch(showErrorToast({ 
        title: 'Course indisponible', 
        message: error?.data?.message || 'Un autre chauffeur a ete plus rapide ou le client a annule.' 
      }));
      dispatch(clearIncomingRide());
    } finally {
      setLoadingStep(null);
    }
  };

  const priceOptions = incomingRide.priceOptions || [];
  
  const passengersCount = incomingRide.passengersCount || incomingRide.passengers || incomingRide.seats || incomingRide.passengerCount || 1;
  const isGroupRide = passengersCount > 1;

  const getLocalLabel = (backendLabel) => {
    switch (backendLabel?.toUpperCase()) {
      case 'ECO': return 'Tarif Normal';
      case 'STANDARD': return 'Depart Rapide';
      case 'PREMIUM': return 'Prix Majore';
      default: return 'Tarif Propose';
    }
  };

  return (
    <GlassModal 
      visible={!!incomingRide} 
      onClose={handleIgnore} 
      closeOnBackdrop={!loadingStep}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.header, isSmallScreen && { marginBottom: THEME.SPACING.sm }]}>
          <View style={styles.headerTitles}>
            <Text style={[styles.title, isSmallScreen && { fontSize: 18 }]}>Nouvelle Demande</Text>
          </View>
          <Text style={[styles.distance, isSmallScreen && { fontSize: 14, paddingHorizontal: 10, paddingVertical: 4 }]}>
            {incomingRide.distance} km
          </Text>
        </View>

        <View style={[
          styles.passengerAlertContainer, 
          isGroupRide ? styles.passengerAlertGroup : styles.passengerAlertSingle,
          isSmallScreen && { padding: THEME.SPACING.sm, marginBottom: THEME.SPACING.md }
        ]}>
          <Ionicons 
            name={isGroupRide ? 'people' : 'person'} 
            size={isSmallScreen ? 24 : 32} 
            color={isGroupRide ? THEME.COLORS.danger : THEME.COLORS.textPrimary} 
          />
          <View style={styles.passengerAlertTextContainer}>
            <Text style={[
              styles.passengerAlertTitle,
              isSmallScreen && { fontSize: 12 },
              isGroupRide && { color: THEME.COLORS.danger }
            ]}>
              {isGroupRide ? 'ATTENTION : GROUPE' : 'COURSE INDIVIDUELLE'}
            </Text>
            <Text style={[
              styles.passengerAlertSubtitle,
              isSmallScreen && { fontSize: 14 },
              isGroupRide && { color: THEME.COLORS.danger }
            ]}>
              {passengersCount} Place{passengersCount > 1 ? 's' : ''} demandee{passengersCount > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={[styles.routeTimelineContainer, isSmallScreen && { padding: THEME.SPACING.sm, marginBottom: THEME.SPACING.md }]}>
          <View style={styles.timelineIndicators}>
            <View style={styles.dotStart} />
            <View style={styles.lineDashed} />
            <Ionicons name="location-sharp" size={isSmallScreen ? 18 : 20} color={THEME.COLORS.danger} style={styles.iconEnd} />
          </View>
          
          <View style={styles.addressTextContainer}>
            <View style={styles.addressBlock}>
              <Text style={styles.addressLabel}>Prise en charge</Text>
              <Text style={[styles.addressValue, isSmallScreen && { fontSize: 14 }]} numberOfLines={2}>
                {incomingRide.origin?.address || 'Position inconnue'}
              </Text>
            </View>
            
            <View style={[styles.addressBlock, styles.destinationBlock, isSmallScreen && { marginTop: 10 }]}>
              <Text style={styles.addressLabel}>Destination finale</Text>
              <Text style={[styles.addressValue, isSmallScreen && { fontSize: 14 }]} numberOfLines={2}>
                {incomingRide.destination?.address || 'Destination inconnue'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.subtitle, isSmallScreen && { marginBottom: THEME.SPACING.sm }]}>Selectionnez votre tarif :</Text>
        
        <View style={[styles.optionsContainer, isSmallScreen && { marginBottom: THEME.SPACING.md, gap: 6 }]}>
          {priceOptions.length > 0 ? (
            priceOptions.map((option, index) => {
              const isSelected = selectedAmount === option.amount;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionCard, 
                    isSelected && styles.optionCardSelected,
                    isSmallScreen && { paddingVertical: THEME.SPACING.sm }
                  ]}
                  onPress={() => setSelectedAmount(option.amount)}
                  activeOpacity={0.7}
                  disabled={!!loadingStep}
                >
                  <Text style={[
                    styles.optionLabel, 
                    isSelected && styles.textSelected,
                    (isSmallScreen || isNarrowScreen) && { fontSize: 9 }
                  ]}>
                    {getLocalLabel(option.label)}
                  </Text>
                  <Text style={[
                    styles.optionAmount, 
                    isSelected && styles.textSelected,
                    isSmallScreen ? { fontSize: 14 } : (isNarrowScreen ? { fontSize: 15 } : { fontSize: 17 })
                  ]}>
                    {option.amount} F
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.noPriceText}>Calcul du prix en cours ou indisponible.</Text>
          )}
        </View>

        <View style={[styles.actionsContainer, isSmallScreen && { gap: 8 }]}>
          <TouchableOpacity 
            style={[styles.ignoreButton, isSmallScreen && { paddingVertical: 12 }]} 
            onPress={handleIgnore}
            disabled={!!loadingStep}
          >
            <Text style={[styles.ignoreText, isSmallScreen && { fontSize: 14 }]}>Ignorer</Text>
          </TouchableOpacity>
          
          <GoldButton
            title={
              loadingStep === 'locking' ? "Reservation..." : 
              loadingStep === 'submitting' ? "Envoi..." : 
              "Proposer ce prix"
            }
            onPress={handleAcceptAndPropose}
            style={styles.acceptButton}
            disabled={!!loadingStep || !selectedAmount}
          />
        </View>
      </ScrollView>
    </GlassModal>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.SPACING.md,
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  distance: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.COLORS.champagneGold,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 10,
  },
  passengerAlertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.SPACING.md,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: THEME.SPACING.lg,
  },
  passengerAlertSingle: {
    backgroundColor: THEME.COLORS.glassSurface,
    borderColor: THEME.COLORS.border,
  },
  passengerAlertGroup: {
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    borderColor: THEME.COLORS.danger,
  },
  passengerAlertTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  passengerAlertTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  passengerAlertSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.COLORS.textSecondary,
    marginTop: 2,
  },
  routeTimelineContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    padding: THEME.SPACING.md,
    marginBottom: THEME.SPACING.xl,
  },
  timelineIndicators: {
    alignItems: 'center',
    marginRight: 16,
    paddingTop: 4,
  },
  dotStart: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: THEME.COLORS.champagneGold,
    borderWidth: 3,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  lineDashed: {
    width: 2,
    flex: 1,
    backgroundColor: THEME.COLORS.glassBorder,
    marginVertical: 4,
    borderStyle: 'dashed',
  },
  iconEnd: {
    marginLeft: -1, 
    marginBottom: -4,
  },
  addressTextContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  addressBlock: {
    minHeight: 40,
  },
  destinationBlock: {
    marginTop: 16,
  },
  addressLabel: {
    fontSize: 11,
    color: THEME.COLORS.textTertiary,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  addressValue: {
    color: THEME.COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 13,
    color: THEME.COLORS.textSecondary,
    marginBottom: THEME.SPACING.md,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: THEME.SPACING.xl,
  },
  optionCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: THEME.COLORS.glassBorder,
    borderRadius: 12,
    paddingVertical: THEME.SPACING.md,
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassLight,
  },
  optionCardSelected: {
    borderColor: THEME.COLORS.champagneGold,
    backgroundColor: THEME.COLORS.champagneGold,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  optionLabel: {
    fontSize: 11,
    color: THEME.COLORS.textTertiary,
    marginBottom: 6,
    fontWeight: '800',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  optionAmount: {
    fontSize: 17,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
  },
  textSelected: {
    color: '#121418', 
  },
  noPriceText: {
    color: THEME.COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    width: '100%',
    padding: 10,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: THEME.SPACING.md,
    alignItems: 'center',
  },
  ignoreButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    backgroundColor: THEME.COLORS.glassSurface,
  },
  ignoreText: {
    color: THEME.COLORS.textSecondary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  acceptButton: {
    flex: 2,
    marginTop: 0,
  },
});

export default DriverRequestModal;