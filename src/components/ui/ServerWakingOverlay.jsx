// src/components/ui/ServerWakingOverlay.jsx
// OVERLAY DE RÉVEIL BACKEND - Design Premium Glassmorphism (Cold Start UX)
// CSCSM Level: Bank Grade

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { selectIsServerWaking } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';
import GlassCard from './GlassCard';
import { Ionicons } from '@expo/vector-icons';

const ServerWakingOverlay = () => {
  const isServerWaking = useSelector(selectIsServerWaking);

  if (!isServerWaking) return null;

  return (
    <View style={styles.overlay}>
      <GlassCard style={styles.glassContainer}>
        <View style={styles.iconWrapper}>
          <Ionicons name="key-outline" size={32} color={THEME.COLORS.champagneGold || '#D4AF37'} />
          <View style={styles.loaderRing}>
            <ActivityIndicator size="large" color={THEME.COLORS.champagneGold || '#D4AF37'} />
          </View>
        </View>
        
        <Text style={styles.title}>Démarrage en cours</Text>
        <Text style={styles.subtitle}>
          Yely réveille ses moteurs... Cela peut prendre jusqu'à 1 minute lors du premier lancement.
        </Text>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 15, 0.85)',
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassContainer: {
    width: '85%',
    paddingVertical: 40,
    paddingHorizontal: 25,
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  loaderRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scale: 1.45 }],
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13.5,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  }
});

export default ServerWakingOverlay;
