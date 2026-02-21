// src/components/ride/DriverRideOverlay.jsx
// PANNEAU DE COURSE CHAUFFEUR - Gestion des étapes (Démarrer/Terminer) & Sync Stats

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useCompleteRideMutation, useStartRideMutation } from '../../store/api/ridesApiSlice';
import { updateUserInfo } from '../../store/slices/authSlice';
import { clearCurrentRide, selectCurrentRide } from '../../store/slices/rideSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';
import GoldButton from '../ui/GoldButton';

const DriverRideOverlay = () => {
  const dispatch = useDispatch();
  const currentRide = useSelector(selectCurrentRide);
  
  const [startRide] = useStartRideMutation();
  const [completeRide] = useCompleteRideMutation();
  const [isLoading, setIsLoading] = useState(false);

  // On n'affiche rien si pas de course active ou si la course est finie
  if (!currentRide || ['searching', 'completed', 'cancelled'].includes(currentRide.status)) {
    return null;
  }

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await startRide({ rideId: currentRide.rideId }).unwrap();
      dispatch(showSuccessToast({ title: "En route !", message: "La course a commencé." }));
    } catch (error) {
      dispatch(showErrorToast({ title: "Erreur", message: "Impossible de démarrer la course." }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // 🚀 VAGUE 2 : On récupère les nouvelles stats envoyées par le Backend
      const res = await completeRide({ rideId: currentRide.rideId }).unwrap();
      
      // Mise à jour immédiate du Dashboard Chauffeur (Courses + Argent)
      if (res.stats) {
        dispatch(updateUserInfo(res.stats));
      }

      dispatch(showSuccessToast({ 
        title: "Course terminée !", 
        message: `Vous avez gagné ${res.finalPrice} F.` 
      }));
      
      dispatch(clearCurrentRide());
    } catch (error) {
      dispatch(showErrorToast({ title: "Erreur", message: "Impossible de terminer la course." }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Infos Client */}
        <View style={styles.header}>
          <View style={styles.clientInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{currentRide.riderName?.charAt(0) || 'P'}</Text>
            </View>
            <View>
              <Text style={styles.clientName}>{currentRide.riderName || 'Passager'}</Text>
              <Text style={styles.forfaitBadge}>Yély {currentRide.forfait || 'Standard'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.phoneButton}>
            <Ionicons name="call" size={20} color={THEME.COLORS.champagneGold} />
          </TouchableOpacity>
        </View>

        {/* Adresses */}
        <View style={styles.addressBox}>
           <Text style={styles.addressText} numberOfLines={1}>
             <Ionicons name="location" color={THEME.COLORS.champagneGold} /> {currentRide.destination?.address || currentRide.destination}
           </Text>
        </View>

        {/* Boutons d'action selon le statut */}
        {currentRide.status === 'accepted' ? (
          <GoldButton 
            title="DÉMARRER LA COURSE" 
            onPress={handleStart} 
            loading={isLoading}
          />
        ) : (
          <TouchableOpacity 
            style={styles.completeButton} 
            onPress={handleComplete}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.completeButtonText}>TERMINER ET ENCAISSER</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 140, // Juste au-dessus du SmartFooter
    left: THEME.SPACING.md,
    right: THEME.SPACING.md,
    zIndex: 100,
  },
  card: {
    backgroundColor: THEME.COLORS.background,
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: THEME.COLORS.champagneGold,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.COLORS.glassSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  avatarText: {
    color: THEME.COLORS.champagneGold,
    fontWeight: 'bold',
    fontSize: 18,
  },
  clientName: {
    color: THEME.COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  forfaitBadge: {
    color: THEME.COLORS.textTertiary,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  phoneButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressBox: {
    backgroundColor: THEME.COLORS.glassSurface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  addressText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 13,
  },
  completeButton: {
    backgroundColor: THEME.COLORS.success,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 1,
  }
});

export default DriverRideOverlay;