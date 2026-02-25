// src/components/ride/DriverRequestModal.jsx
// MODAL CHAUFFEUR - Glow Up UI, Séquençage & Prévention de Crash

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
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

  if (!incomingRide) return null;

  const handleIgnore = () => {
    if (loadingStep) return;
    dispatch(clearIncomingRide());
  };

  const handleAcceptAndPropose = async () => {
    if (!selectedAmount) {
      dispatch(showErrorToast({ 
        title: 'Sélection requise', 
        message: 'Veuillez choisir un tarif à proposer.' 
      }));
      return;
    }

    try {
      setLoadingStep('locking');
      await lockRide({ rideId: incomingRide.rideId }).unwrap();
      
      setLoadingStep('submitting');
      await submitPrice({ rideId: incomingRide.rideId, amount: selectedAmount }).unwrap();
      
      dispatch(showSuccessToast({ 
        title: 'Offre envoyée !', 
        message: 'En attente de la réponse du client.' 
      }));
      
      dispatch(clearIncomingRide()); 

    } catch (error) {
      dispatch(showErrorToast({ 
        title: 'Course indisponible', 
        message: error?.data?.message || 'Un autre chauffeur a été plus rapide ou le client a annulé.' 
      }));
      dispatch(clearIncomingRide());
    } finally {
      setLoadingStep(null);
    }
  };

  const getForfaitLabel = (forfait) => {
    switch(forfait?.toUpperCase()) {
      case 'VIP': return 'Premium';
      case 'ECHO': return 'Echo';
      default: return 'Standard';
    }
  };

  const getForfaitColor = (forfait) => {
    switch(forfait?.toUpperCase()) {
      case 'VIP': return THEME.COLORS.champagneGold;
      case 'ECHO': return THEME.COLORS.success;
      default: return THEME.COLORS.textSecondary;
    }
  };

  const forfaitColor = getForfaitColor(incomingRide.forfait);
  const priceOptions = incomingRide.priceOptions || [];

  return (
    <GlassModal visible={!!incomingRide} onDismiss={handleIgnore} dismissable={!loadingStep}>
      
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Nouvelle Demande</Text>
          <View style={[styles.badge, { backgroundColor: forfaitColor + '20' }]}>
             <Ionicons 
               name={incomingRide.forfait?.toUpperCase() === 'VIP' ? 'star' : 'car'} 
               size={12} 
               color={forfaitColor} 
             />
             <Text style={[styles.badgeText, { color: forfaitColor }]}>
               Yély {getForfaitLabel(incomingRide.forfait)}
             </Text>
          </View>
        </View>
        <Text style={styles.distance}>{incomingRide.distance} km</Text>
      </View>

      {/* UI TRAJET AMÉLIORÉE - Design Timeline Uber-like */}
      <View style={styles.routeTimelineContainer}>
        <View style={styles.timelineIndicators}>
          <View style={styles.dotStart} />
          <View style={styles.lineDashed} />
          <Ionicons name="location-sharp" size={20} color={THEME.COLORS.danger} style={styles.iconEnd} />
        </View>
        
        <View style={styles.addressTextContainer}>
          <View style={styles.addressBlock}>
            <Text style={styles.addressLabel}>Lieu de prise en charge</Text>
            <Text style={styles.addressValue} numberOfLines={2}>
              {incomingRide.origin?.address || 'Position inconnue'}
            </Text>
          </View>
          
          <View style={[styles.addressBlock, styles.destinationBlock]}>
            <Text style={styles.addressLabel}>Destination finale</Text>
            <Text style={styles.addressValue} numberOfLines={2}>
              {incomingRide.destination?.address || 'Destination inconnue'}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.subtitle}>Sélectionnez votre tarif :</Text>
      
      <View style={styles.optionsContainer}>
        {priceOptions.length > 0 ? (
          priceOptions.map((option, index) => {
            const isSelected = selectedAmount === option.amount;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => setSelectedAmount(option.amount)}
                activeOpacity={0.7}
                disabled={!!loadingStep}
              >
                <Text style={[styles.optionLabel, isSelected && styles.textSelected]}>
                  {option.label}
                </Text>
                <Text style={[styles.optionAmount, isSelected && styles.textSelected]}>
                  {option.amount} F
                </Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.noPriceText}>Calcul du prix en cours ou indisponible.</Text>
        )}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.ignoreButton} 
          onPress={handleIgnore}
          disabled={!!loadingStep}
        >
          <Text style={styles.ignoreText}>Ignorer</Text>
        </TouchableOpacity>
        
        <GoldButton
          title={
            loadingStep === 'locking' ? "Réservation..." : 
            loadingStep === 'submitting' ? "Envoi..." : 
            "Proposer ce prix"
          }
          onPress={handleAcceptAndPropose}
          style={styles.acceptButton}
          disabled={!!loadingStep || !selectedAmount}
        />
      </View>
    </GlassModal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SPACING.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    fontSize: 12,
    color: THEME.COLORS.textTertiary,
    marginBottom: 6,
    fontWeight: '700',
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