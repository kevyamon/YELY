import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useLockRideMutation, useSubmitPriceMutation } from '../../store/api/ridesApiSlice';
import { clearIncomingRide, selectIncomingRide } from '../../store/slices/rideSlice';
import { showErrorToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';
import GlassModal from '../ui/GlassModal';
import GoldButton from '../ui/GoldButton';

const DriverRequestModal = () => {
  const dispatch = useDispatch();
  const incomingRide = useSelector(selectIncomingRide);
  
  const [lockRide] = useLockRideMutation();
  const [submitPrice] = useSubmitPriceMutation();
  
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!incomingRide) return null;

  const handleIgnore = () => {
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

    setIsLoading(true);
    try {
      await lockRide({ rideId: incomingRide.rideId }).unwrap();
      await submitPrice({ rideId: incomingRide.rideId, amount: selectedAmount }).unwrap();
    } catch (error) {
      dispatch(showErrorToast({ 
        title: 'Erreur', 
        message: error?.data?.message || 'Impossible de confirmer la course.' 
      }));
      dispatch(clearIncomingRide());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassModal visible={!!incomingRide} onDismiss={handleIgnore}>
      <View style={styles.header}>
        <Text style={styles.title}>Nouvelle Course</Text>
        <Text style={styles.distance}>{incomingRide.distance} km</Text>
      </View>

      <View style={styles.addressContainer}>
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={20} color={THEME.COLORS.champagneGold} />
          <Text style={styles.addressText} numberOfLines={2}>{incomingRide.origin}</Text>
        </View>
        <View style={styles.addressDivider} />
        <View style={styles.addressRow}>
          <Ionicons name="flag-outline" size={20} color={THEME.COLORS.error} />
          <Text style={styles.addressText} numberOfLines={2}>{incomingRide.destination}</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>Choisissez votre proposition :</Text>
      
      <View style={styles.optionsContainer}>
        {incomingRide.priceOptions?.map((option, index) => {
          const isSelected = selectedAmount === option.amount;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.optionCard, isSelected && styles.optionCardSelected]}
              onPress={() => setSelectedAmount(option.amount)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionLabel, isSelected && styles.textSelected]}>
                {option.label}
              </Text>
              <Text style={[styles.optionAmount, isSelected && styles.textSelected]}>
                {option.amount} FCFA
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.ignoreButton} 
          onPress={handleIgnore}
          disabled={isLoading}
        >
          <Text style={styles.ignoreText}>Ignorer</Text>
        </TouchableOpacity>
        
        <GoldButton
          title={isLoading ? "Envoi..." : "Proposer"}
          onPress={handleAcceptAndPropose}
          style={styles.acceptButton}
          disabled={isLoading || !selectedAmount}
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
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.COLORS.textPrimary,
  },
  distance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.COLORS.champagneGold,
    backgroundColor: THEME.COLORS.glassLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addressContainer: {
    backgroundColor: THEME.COLORS.glassLight,
    borderRadius: 12,
    padding: THEME.SPACING.md,
    marginBottom: THEME.SPACING.lg,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addressDivider: {
    width: 2,
    height: 15,
    backgroundColor: THEME.COLORS.glassBorder,
    marginLeft: 9,
    marginVertical: 4,
  },
  addressText: {
    flex: 1,
    color: THEME.COLORS.textSecondary,
    fontSize: 14,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.COLORS.textPrimary,
    marginBottom: THEME.SPACING.md,
    fontWeight: '600',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: THEME.SPACING.xl,
  },
  optionCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: THEME.COLORS.glassBorder,
    borderRadius: 12,
    padding: THEME.SPACING.sm,
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassLight,
  },
  optionCardSelected: {
    borderColor: THEME.COLORS.champagneGold,
    backgroundColor: THEME.COLORS.champagneGold,
  },
  optionLabel: {
    fontSize: 12,
    color: THEME.COLORS.textTertiary,
    marginBottom: 4,
  },
  optionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.COLORS.textPrimary,
  },
  textSelected: {
    color: THEME.COLORS.deepAsphalt,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: THEME.SPACING.md,
    alignItems: 'center',
  },
  ignoreButton: {
    flex: 1,
    paddingVertical: THEME.SPACING.md,
    alignItems: 'center',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: THEME.COLORS.glassBorder,
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