// src/components/ride/StartRideButton.jsx
// COMPOSANT D'ACTION ISOLE - Demarrage de course avec Traceabilite des erreurs
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { useStartRideMutation } from '../../store/api/ridesApiSlice';
import { selectCurrentRide } from '../../store/slices/rideSlice';
import { showErrorToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const StartRideButton = () => {
  const dispatch = useDispatch();
  const currentRide = useSelector(selectCurrentRide);
  const [startRide, { isLoading }] = useStartRideMutation();

  const handleStartRide = async () => {
    if (!currentRide) return;
    
    try {
      await startRide({ rideId: currentRide._id }).unwrap();
    } catch (err) {
      // TRACEABILITE ABSOLUE : On extrait le message exact du backend
      let errorMessage = 'Impossible de demarrer la course. Verifiez votre connexion.';
      
      if (err?.data?.message) {
        errorMessage = err.data.message; // Ex: "Securite : Vous etes trop loin..."
      } else if (err?.error) {
        errorMessage = err.error; // Erreurs reseau pures (ex: "Network Error")
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