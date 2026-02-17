import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useFinalizeRideMutation } from '../../store/api/ridesApiSlice';
import { clearCurrentRide, selectCurrentRide, updateRideStatus } from '../../store/slices/rideSlice';
import { showErrorToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';
import GlassModal from '../ui/GlassModal';
import GoldButton from '../ui/GoldButton';

const RiderWaitModal = () => {
  const dispatch = useDispatch();
  const currentRide = useSelector(selectCurrentRide);
  const [finalizeRide] = useFinalizeRideMutation();
  const [isLoading, setIsLoading] = useState(false);

  if (!currentRide || currentRide.status === 'accepted' || currentRide.status === 'ongoing' || currentRide.status === 'completed') {
    return null;
  }

  const handleDecision = async (decision) => {
    setIsLoading(true);
    try {
      const res = await finalizeRide({ rideId: currentRide.rideId, decision }).unwrap();
      
      if (decision === 'REJECTED') {
        dispatch(updateRideStatus({ status: 'searching' }));
      }
      
    } catch (error) {
      dispatch(showErrorToast({ 
        title: 'Erreur', 
        message: error?.data?.message || 'Erreur lors de la communication avec le serveur.' 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSearch = () => {
    dispatch(clearCurrentRide());
  };

  const renderContent = () => {
    if (currentRide.status === 'searching') {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} style={styles.loader} />
          <Text style={styles.title}>Recherche de chauffeurs...</Text>
          <Text style={styles.subtitle}>Nous interrogeons les véhicules à proximité.</Text>
          
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSearch}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (currentRide.status === 'negotiating' && !currentRide.proposedPrice) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} style={styles.loader} />
          <Text style={styles.title}>Chauffeur trouvé !</Text>
          <Text style={styles.subtitle}>{currentRide.driverName} analyse votre demande et prépare son tarif.</Text>
        </View>
      );
    }

    if (currentRide.status === 'negotiating' && currentRide.proposedPrice) {
      return (
        <View style={styles.centerContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="pricetag" size={40} color={THEME.COLORS.champagneGold} />
          </View>
          <Text style={styles.title}>Proposition reçue</Text>
          <Text style={styles.subtitle}>{currentRide.driverName} est prêt à effectuer la course pour :</Text>
          
          <Text style={styles.priceText}>{currentRide.proposedPrice} FCFA</Text>

          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.rejectButton} 
              onPress={() => handleDecision('REJECTED')}
              disabled={isLoading}
            >
              <Text style={styles.rejectText}>Refuser</Text>
            </TouchableOpacity>
            
            <GoldButton
              title={isLoading ? "Attente..." : "Accepter"}
              onPress={() => handleDecision('ACCEPTED')}
              style={styles.acceptButton}
              disabled={isLoading}
            />
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <GlassModal visible={true} dismissable={false}>
      {renderContent()}
    </GlassModal>
  );
};

const styles = StyleSheet.create({
  centerContent: {
    alignItems: 'center',
    paddingVertical: THEME.SPACING.md,
  },
  loader: {
    marginBottom: THEME.SPACING.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.COLORS.glassLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.SPACING.lg,
    borderWidth: 1,
    borderColor: THEME.COLORS.glassBorder,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.COLORS.textPrimary,
    marginBottom: THEME.SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: THEME.COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: THEME.SPACING.xl,
    paddingHorizontal: THEME.SPACING.md,
  },
  priceText: {
    fontSize: 32,
    fontWeight: '900',
    color: THEME.COLORS.champagneGold,
    marginBottom: THEME.SPACING.xl,
    letterSpacing: 1,
  },
  cancelButton: {
    paddingVertical: THEME.SPACING.md,
    paddingHorizontal: THEME.SPACING.xl,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: THEME.COLORS.error,
    marginTop: THEME.SPACING.md,
  },
  cancelText: {
    color: THEME.COLORS.error,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: THEME.SPACING.md,
    width: '100%',
  },
  rejectButton: {
    flex: 1,
    paddingVertical: THEME.SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: THEME.COLORS.glassBorder,
  },
  rejectText: {
    color: THEME.COLORS.textSecondary,
    fontWeight: 'bold',
  },
  acceptButton: {
    flex: 1,
    marginTop: 0,
  }
});

export default RiderWaitModal;