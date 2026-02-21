// src/components/ride/RiderWaitModal.jsx
// MODALE PASSAGER - Bouton Annuler haute visibilité avec confirmation de sécurité

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useCancelRideMutation, useFinalizeRideMutation } from '../../store/api/ridesApiSlice';
import { clearCurrentRide, selectCurrentRide, updateRideStatus } from '../../store/slices/rideSlice';
import { showErrorToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';
import GlassModal from '../ui/GlassModal';
import GoldButton from '../ui/GoldButton';

const RiderWaitModal = () => {
  const dispatch = useDispatch();
  const currentRide = useSelector(selectCurrentRide);
  
  const [finalizeRide] = useFinalizeRideMutation();
  const [cancelRideApi] = useCancelRideMutation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  // 🚀 NOUVEAU : État pour gérer l'étape de confirmation
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  if (!currentRide || currentRide.status === 'accepted' || currentRide.status === 'ongoing' || currentRide.status === 'completed') {
    return null;
  }

  const handleDecision = async (decision) => {
    setIsLoading(true);
    try {
      await finalizeRide({ rideId: currentRide.rideId, decision }).unwrap();
      if (decision === 'REJECTED') {
        dispatch(updateRideStatus({ status: 'searching' }));
      }
    } catch (error) {
      dispatch(showErrorToast({ 
        title: 'Erreur', 
        message: error?.data?.message || 'Erreur lors de la communication.' 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // L'action finale d'annulation (quand on a dit "Oui")
  const handleFinalCancel = async () => {
    setIsCancelling(true);
    try {
      await cancelRideApi({ 
        rideId: currentRide.rideId, 
        reason: "Annulé par le passager" 
      }).unwrap();
    } catch (error) {
      console.log("Erreur annulation (peut-être déjà annulée par timeout) :", error);
    } finally {
      setIsCancelling(false);
      setShowCancelConfirmation(false); // Reset de l'état
      dispatch(clearCurrentRide());
    }
  };

  // 🚀 NOUVEAU : Gère l'affichage de la zone de confirmation
  const renderCancelSection = () => {
    if (showCancelConfirmation) {
      // ÉTAPE 2 : La demande de confirmation
      return (
        <View style={styles.confirmationContainer}>
          <Text style={styles.confirmationTitle}>Voulez-vous vraiment annuler ?</Text>
          <Text style={styles.confirmationSubtitle}>Votre demande sera retirée des chauffeurs.</Text>
          
          <View style={styles.confirmationButtonsRow}>
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => setShowCancelConfirmation(false)} // Retour en arrière
              disabled={isCancelling}
            >
              <Text style={styles.secondaryButtonText}>Non, attendre</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.solidCancelButton} 
              onPress={handleFinalCancel} // Annulation réelle
              disabled={isCancelling}
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.solidCancelButtonText}>Oui, annuler</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // ÉTAPE 1 : Le gros bouton rouge très visible
    return (
      <TouchableOpacity 
        style={styles.bigCancelButton} 
        onPress={() => setShowCancelConfirmation(true)}
      >
        <Ionicons name="close-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={styles.bigCancelButtonText}>Annuler la recherche</Text>
      </TouchableOpacity>
    );
  };


  const renderContent = () => {
    if (currentRide.status === 'searching') {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} style={styles.loader} />
          <Text style={styles.title}>Recherche de chauffeurs...</Text>
          <Text style={styles.subtitle}>Nous interrogeons les véhicules à proximité.</Text>
          
          {/* Remplacement de l'ancien bouton par la nouvelle section dynamique */}
          {renderCancelSection()}
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
  },

  // --- NOUVEAUX STYLES POUR L'ANNULATION ---
  
  // Le gros bouton rouge initial
  bigCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.danger, // Rouge uni
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: THEME.SPACING.md,
    shadowColor: THEME.COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  bigCancelButtonText: {
    color: '#FFF', // Texte blanc sur fond rouge
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Le conteneur de confirmation
  confirmationContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.05)', // Fond rouge très léger
    padding: THEME.SPACING.md,
    borderRadius: 16,
    marginTop: THEME.SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.2)',
  },
  confirmationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.COLORS.danger,
    marginBottom: 4,
  },
  confirmationSubtitle: {
    fontSize: 12,
    color: THEME.COLORS.textSecondary,
    marginBottom: THEME.SPACING.md,
  },
  confirmationButtonsRow: {
    flexDirection: 'row',
    gap: THEME.SPACING.md,
    width: '100%',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    backgroundColor: THEME.COLORS.glassSurface,
  },
  secondaryButtonText: {
    color: THEME.COLORS.textPrimary,
    fontWeight: '600',
  },
  solidCancelButton: {
    flex: 1,
    backgroundColor: THEME.COLORS.danger,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
  },
  solidCancelButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default RiderWaitModal;