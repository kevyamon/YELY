// src/components/ui/PwaIOSWarningModal.jsx
// COMPOSANT PWA - Avertissement pour le maintien en premier plan (iOS Safari)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';

const PwaIOSWarningModal = ({ isDriver = false, forceShow = false, onClose = null }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Si on force l'affichage depuis un parent (ex: LoginPage), on affiche direct
    if (forceShow) {
      setIsVisible(true);
      return;
    }

    // Comportement automatique original (Web uniquement)
    if (Platform.OS !== 'web') return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOS) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  if (!isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  return (
    <Modal transparent visible={isVisible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="warning" size={32} color={THEME.COLORS.champagneGold} />
          </View>
          
          <Text style={styles.title}>Attention (Apple iOS)</Text>
          
          <Text style={styles.description}>
            {isDriver 
              ? "L'application chauffeur necessite Android pour le suivi GPS en arriere-plan. Sur iOS, le GPS se coupe des que l'ecran est verrouille, ce qui empeche le client de vous suivre." 
              : "Pour un fonctionnement optimal de la course, evitez de verrouiller votre telephone ou de reduire cette application."}
          </Text>

          <TouchableOpacity style={styles.button} onPress={handleClose}>
            <Text style={styles.buttonText}>J'ai compris</Text>
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
    zIndex: 9999,
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
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.SPACING.md,
    borderWidth: 1,
    borderColor: THEME.COLORS.champagneGold,
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
  },
  buttonText: {
    color: THEME.COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PwaIOSWarningModal;