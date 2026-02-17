// src/components/ride/SearchingRadar.jsx
// COMPOSANT UI - Écran d'attente avec animation Radar
// Design : Glassmorphism + Animation CSS/Reanimated

import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';

import THEME from '../../theme/theme';
import GlassCard from '../ui/GlassCard';
import GoldButton from '../ui/GoldButton';

const SearchingRadar = ({ onCancel, rideDetails }) => {
  // Animation de pulsation (Cercles concentriques)
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 1500 }),
        withTiming(1, { duration: 0 }) // Reset instantané
      ),
      -1, // Infini
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1500 }),
        withTiming(0.5, { duration: 0 })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* CERCLES D'ANIMATION (RADAR) */}
      <View style={styles.radarContainer}>
        <Animated.View style={[styles.pulseCircle, pulseStyle]} />
        <View style={styles.centerIcon}>
          <Ionicons name="car" size={32} color={THEME.COLORS.background} />
        </View>
      </View>

      {/* CARTE D'INFO */}
      <GlassCard style={styles.card}>
        <Text style={styles.title}>Recherche de chauffeur...</Text>
        <Text style={styles.subtitle}>
          Nous contactons les chauffeurs autour de vous.
          {"\n"}Prix estimé : <Text style={styles.price}>{rideDetails?.estimatedPrice || '---'} FCFA</Text>
        </Text>

        <View style={styles.divider} />

        <GoldButton 
          title="ANNULER LA RECHERCHE" 
          onPress={onCancel}
          variant="outline" // Style moins agressif pour l'annulation
          icon="close-circle"
        />
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 40,
    zIndex: 20,
  },
  radarContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  pulseCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: THEME.COLORS.champagneGold,
  },
  centerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.COLORS.champagneGold,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: THEME.COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  card: {
    width: '90%',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    color: THEME.COLORS.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: THEME.COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  price: {
    color: THEME.COLORS.champagneGold,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: THEME.COLORS.border,
    marginBottom: 20,
  },
});

export default SearchingRadar;