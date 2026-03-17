// src/components/ui/SessionRecoveryOverlay.jsx
// OVERLAY DE REPRISE DE SESSION - Bloque les requêtes sur token expiré (Anti-Crash)
// CSCSM Level: Bank Grade

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { selectIsRefreshing } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';

const SessionRecoveryOverlay = () => {
  const isRefreshing = useSelector(selectIsRefreshing);

  if (!isRefreshing) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.box}>
        <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
        <Text style={styles.text}>Reprise de la session...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  box: {
    backgroundColor: THEME.COLORS.background,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  text: {
    marginTop: 15,
    color: THEME.COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  }
});

export default SessionRecoveryOverlay;