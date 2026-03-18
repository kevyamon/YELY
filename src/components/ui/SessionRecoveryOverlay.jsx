// src/components/ui/SessionRecoveryOverlay.jsx
// OVERLAY DE REPRISE DE SESSION - Design Premium Glassmorphism
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { selectIsRefreshing } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';
import GlassCard from './GlassCard';

const SessionRecoveryOverlay = () => {
  const isRefreshing = useSelector(selectIsRefreshing);

  if (!isRefreshing) return null;

  return (
    <View style={styles.overlay}>
      <GlassCard style={styles.glassContainer}>
        <View style={styles.iconWrapper}>
          <Ionicons name="shield-checkmark" size={32} color={THEME.COLORS.champagneGold} />
          <View style={styles.loaderRing}>
            <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
          </View>
        </View>
        
        <Text style={styles.title}>Securisation en cours</Text>
        <Text style={styles.subtitle}>Renouvellement de votre session...</Text>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 15, 0.7)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassContainer: {
    width: '80%',
    paddingVertical: 35,
    paddingHorizontal: 25,
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  loaderRing: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scale: 1.4 }],
  },
  title: {
    color: THEME.COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: THEME.COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  }
});

export default SessionRecoveryOverlay;