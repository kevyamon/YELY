// src/components/ui/GpsPermissionModal.web.jsx
// COMPOSANT PWA - Modale de relance (Harcèlement doux) pour le GPS
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';

const GpsPermissionModal = ({ isPermissionDenied, onRetry }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let interval;
    if (isPermissionDenied) {
      // Affichage immédiat au refus
      setIsVisible(true);
      
      // Boucle infinie : la modale revient toutes les 20 secondes si elle est fermée
      interval = setInterval(() => {
        setIsVisible(true);
      }, 20000);
    } else {
      setIsVisible(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPermissionDenied]);

  if (!isVisible) return null;

  return (
    <Modal transparent visible={isVisible} animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="location" size={32} color={THEME.COLORS.danger} />
          </View>
          
          <Text style={styles.title}>GPS Requis</Text>
          
          <Text style={styles.description}>
            L'expérience Yély dépend de votre position géographique pour calculer les prix et trouver le chauffeur le plus proche. 
            {"\n\n"}
            <Text style={{fontWeight: 'bold', color: THEME.COLORS.champagneGold}}>
              Si vous avez bloqué l'accès, touchez l'icône "Aa" ou "Cadenas" dans la barre d'adresse de votre navigateur pour l'autoriser, puis réessayez.
            </Text>
          </Text>

          <TouchableOpacity style={styles.button} onPress={() => {
            setIsVisible(false);
            onRetry();
          }}>
            <Text style={styles.buttonText}>Activer le GPS</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => setIsVisible(false)}>
            <Text style={styles.secondaryButtonText}>Plus tard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.COLORS.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.SPACING.xl,
    zIndex: 10000, // Au-dessus de tout
  },
  card: {
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: THEME.BORDERS.radius.xl,
    padding: THEME.SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.glassBorder,
    width: '100%',
    maxWidth: 340,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.SPACING.md,
    borderWidth: 1,
    borderColor: THEME.COLORS.danger,
  },
  title: {
    color: THEME.COLORS.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: THEME.SPACING.md,
  },
  description: {
    color: THEME.COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: THEME.SPACING.xl,
  },
  button: {
    backgroundColor: THEME.COLORS.champagneGold,
    paddingVertical: THEME.SPACING.md,
    paddingHorizontal: THEME.SPACING.xl,
    borderRadius: THEME.BORDERS.radius.full,
    width: '100%',
    alignItems: 'center',
    marginBottom: THEME.SPACING.sm,
  },
  buttonText: {
    color: THEME.COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: THEME.SPACING.sm,
    paddingHorizontal: THEME.SPACING.xl,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  }
});

export default GpsPermissionModal;