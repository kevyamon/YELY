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
  const [loadingStep, setLoadingStep] = useState(null); // null | 'locking' | 'submitting'

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

  return (
    <GlassModal visible={!!incomingRide} onDismiss={handleIgnore} dismissable={!loadingStep}>
      
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Nouvelle Demande</Text>
          <View style={[styles.badge, { backgroundColor: forfaitColor + '20' }]}>
             <Ionicons 
               name={incomingRide.forfait?.toUpperCase() === 'VIP' ? 'star' : 'car'} 
               size={10} 
               color={forfaitColor} 
             />
             <Text style={[styles.badgeText, { color: forfaitColor }]}>
               Yély {getForfaitLabel(incomingRide.forfait)}
             </Text>
          </View>
        </View>
        <Text style={styles.distance}>{incomingRide.distance} km</Text>
      </View>

      <View style={styles.addressContainer}>
        <View style={styles.addressRow}>
          <View style={styles.dotStart} />
          {/* 🛡️ CORRECTION CRITIQUE : on accède à .address car l'objet vient du GeoJSON */}
          <Text style={styles.addressText} numberOfLines={2}>
            {incomingRide.origin?.address || 'Point de départ inconnu'}
          </Text>
        </View>
        <View style={styles.addressDivider} />
        <View style={styles.addressRow}>
          <View style={styles.dotEnd} />
          {/* 🛡️ CORRECTION CRITIQUE : accès .address */}
          <Text style={styles.addressText} numberOfLines={2}>
            {incomingRide.destination?.address || 'Destination inconnue'}
          </Text>
        </View>
      </View>

      <Text style={styles.subtitle}>Votre proposition de prix :</Text>
      
      <View style={styles.optionsContainer}>
        {incomingRide.priceOptions?.map((option, index) => {
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
        })}
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
            loadingStep === 'locking' ? "Verrouillage..." : 
            loadingStep === 'submitting' ? "Envoi du prix..." : 
            "Proposer"
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
    fontSize: 10,
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
  addressContainer: {
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    padding: THEME.SPACING.md,
    marginBottom: THEME.SPACING.xl,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dotStart: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: THEME.COLORS.champagneGold,
  },
  dotEnd: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: THEME.COLORS.error,
  },
  addressDivider: {
    width: 2,
    height: 20,
    backgroundColor: THEME.COLORS.glassBorder,
    marginLeft: 5,
    marginVertical: 4,
  },
  addressText: {
    flex: 1,
    color: THEME.COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    color: THEME.COLORS.textSecondary,
    marginBottom: THEME.SPACING.md,
    fontWeight: '600',
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
    borderRadius: 16,
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
    marginBottom: 4,
    fontWeight: '600',
  },
  optionAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
  },
  textSelected: {
    color: '#121418', 
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
  },
  acceptButton: {
    flex: 2,
    marginTop: 0,
  },
});

export default DriverRequestModal;