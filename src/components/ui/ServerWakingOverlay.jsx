// src/components/ui/ServerWakingOverlay.jsx
// BANNIÈRE DE RÉVEIL BACKEND - Non bloquante et Discrète (Cold Start UX)
// STANDARD: Industriel / Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';

import { selectIsServerWaking } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const ServerWakingOverlay = () => {
  const isServerWaking = useSelector(selectIsServerWaking);

  if (!isServerWaking) return null;

  return (
    <View style={styles.bannerWrapper} pointerEvents="none">
      <View style={styles.bannerCard}>
        <ActivityIndicator size="small" color="#FAC800" style={styles.spinner} />
        <Ionicons name="cloud-download-outline" size={16} color="#FAC800" style={styles.icon} />
        <Text style={styles.bannerText}>
          Initialisation Yély... (Connexion serveur)
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerWrapper: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    zIndex: 99999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 18, 22, 0.92)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(250, 200, 0, 0.3)',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  spinner: {
    marginRight: 8,
  },
  icon: {
    marginRight: 8,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ServerWakingOverlay;
