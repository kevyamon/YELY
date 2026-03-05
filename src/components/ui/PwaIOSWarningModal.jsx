// src/components/ui/PwaIOSWarningModal.jsx
// COMPOSANT PWA - Avertissement pour le maintien en premier plan (iOS Safari)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';

const PwaIOSWarningModal = ({ isDriver = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // On ne vérifie que sur le Web
    if (Platform.OS !== 'web') return;

    // Détection stricte des appareils Apple
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Vérifie si on est déjà en mode "Application installée" (Standalone) ou dans Safari
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    // On affiche l'alerte uniquement sur iOS Web, après 3 secondes pour ne pas agresser au démarrage
    if (isIOS) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible) return null;

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
              ? "Pour que le client puisse suivre votre position, vous devez garder cette application ouverte à l'écran. Si vous verrouillez votre téléphone, le GPS se coupera." 
              : "Pour un fonctionnement optimal de la course, évitez de verrouiller votre téléphone ou de réduire cette application."}
          </Text>

          <TouchableOpacity style={styles.button} onPress={() => setIsVisible(false)}>
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