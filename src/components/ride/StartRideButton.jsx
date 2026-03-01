// src/components/ride/StartRideButton.jsx
// COMPOSANT D'ACTION ISOLE - Demarrage de course avec Traceabilite des erreurs Zod
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { useStartRideMutation } from '../../store/api/ridesApiSlice';
import { selectCurrentRide, updateRideStatus } from '../../store/slices/rideSlice';
import { showErrorToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const StartRideButton = () => {
  const dispatch = useDispatch();
  const currentRide = useSelector(selectCurrentRide);
  const [startRide, { isLoading }] = useStartRideMutation();

  const handleStartRide = async () => {
    if (!currentRide) {
      dispatch(showErrorToast({
        title: 'Action impossible',
        message: 'Aucune course active detectee dans le contexte.'
      }));
      return;
    }

    // 1. EXTRACTION MULTI-NIVEAUX DE L'ID (Deep Pluck)
    // Anticipation des normalisations de Redux Toolkit, API et WebSockets
    const targetRideId = currentRide._id || currentRide.id || currentRide.rideId || (currentRide.ride && currentRide.ride._id);

    // 2. PRE-VALIDATION FRONTEND STRICTE & AUDIT
    if (!targetRideId) {
      // Log d'audit strict pour le debogage de la structure Redux
      console.error('[StartRideButton] Echec critique : Identifiant de course introuvable. Structure actuelle du state :', JSON.stringify(currentRide, null, 2));
      
      dispatch(showErrorToast({
        title: 'Erreur d\'integrite',
        message: 'L\'identifiant unique de la course est introuvable ou corrompu.'
      }));
      return;
    }

    try {
      // 3. ENVOI DU PAYLOAD SECURISE
      await startRide({ rideId: targetRideId }).unwrap();

      // 4. PIVOT DE L'ETAT LOCAL (Correction du desequilibre de flux)
      // On force la bascule dans Redux immediatement apres le succes de l'API
      // Cela declenche la disparition du bouton, le recalcul de la carte et le radar de destination.
      dispatch(updateRideStatus({
        status: 'in_progress',
        startedAt: Date.now()
      }));

    } catch (err) {
      // 5. TRACEABILITE CHIRURGICALE DES ERREURS BACKEND (ZOD)
      let errorMessage = 'Impossible de demarrer la course. Verifiez votre connexion.';

      if (err?.data?.errors && Array.isArray(err.data.errors) && err.data.errors.length > 0) {
        // Priorite absolue au message strict renvoye par le validateur Zod
        errorMessage = err.data.errors[0].message;
      } else if (err?.data?.message) {
        // Fallback sur le message global du backend
        errorMessage = err.data.message;
      } else if (err?.error) {
        // Fallback sur l'erreur reseau pure
        errorMessage = err.error;
      } else if (err?.status === 404) {
        errorMessage = 'Le serveur ne trouve pas la route. Avez-vous redemarre le backend ?';
      }

      dispatch(showErrorToast({
        title: 'Echec du demarrage',
        message: errorMessage
      }));
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, isLoading && styles.buttonDisabled]}
      onPress={handleStartRide}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      <Ionicons 
        name="play" 
        size={24} 
        color={THEME.COLORS.background} 
        style={styles.icon} 
      />
      <Text style={styles.text}>
        {isLoading ? "DEMARRAGE EN COURS..." : "CLIENT A BORD - DEMARRER"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.success,
    width: '100%',
    paddingVertical: 18,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: THEME.COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  text: {
    color: THEME.COLORS.background,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
  icon: {
    marginRight: 8,
  }
});

export default StartRideButton;