// src/components/ride/PassengerCountModal.jsx
// MODALE ERGONOMIQUE - Selection du nombre de passagers (Cross-Platform Web/Mobile)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';

const PassengerCountModal = ({ visible, onClose, onConfirm }) => {
  const [count, setCount] = useState(2);

  // Reinitialiser le compteur a chaque ouverture
  useEffect(() => {
    if (visible) setCount(2);
  }, [visible]);

  const increment = () => {
    if (count < 4) setCount(count + 1);
  };

  const decrement = () => {
    if (count > 2) setCount(count - 1);
  };

  if (!visible && Platform.OS === 'web') return null; // Fallback strict pour le Web

  return (
    <Modal 
      visible={visible} 
      transparent={true} 
      animationType={Platform.OS === 'web' ? 'none' : 'slide'} // Le slide bug souvent sur Web
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.modalCard}>
          <View style={styles.dragIndicator} />
          
          <Text style={styles.modalTitle}>Vous voyagez seul ?</Text>
          
          <TouchableOpacity 
            style={styles.aloneButton} 
            activeOpacity={0.8}
            onPress={() => onConfirm(1)}
          >
            <Ionicons name="person" size={20} color={THEME.COLORS.background} style={styles.buttonIcon} />
            <Text style={styles.aloneButtonText}>Oui, je suis seul</Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Non, nous sommes :</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.counterContainer}>
            <TouchableOpacity 
              style={[styles.counterButton, count <= 2 && styles.counterButtonDisabled]} 
              onPress={decrement}
              disabled={count <= 2}
            >
              <Ionicons name="remove" size={28} color={count <= 2 ? THEME.COLORS.border : THEME.COLORS.textPrimary} />
            </TouchableOpacity>

            <View style={styles.countDisplay}>
              <Text style={styles.countText}>{count}</Text>
              <Ionicons name="people" size={24} color={THEME.COLORS.textSecondary} />
            </View>

            <TouchableOpacity 
              style={[styles.counterButton, count >= 4 && styles.counterButtonDisabled]} 
              onPress={increment}
              disabled={count >= 4}
            >
              <Ionicons name="add" size={28} color={count >= 4 ? THEME.COLORS.border : THEME.COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.groupButton} 
            activeOpacity={0.8}
            onPress={() => onConfirm(count)}
          >
            <Text style={styles.groupButtonText}>Confirmer pour {count} personnes</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    // Correction Web : S'assurer que le fond couvre tout l'ecran
    ...(Platform.OS === 'web' && {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
    }),
  },
  dismissArea: {
    flex: 1,
    width: '100%',
  },
  modalCard: {
    width: '100%',
    backgroundColor: THEME.COLORS.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: THEME.SPACING.xl,
    paddingBottom: Math.max(THEME.SPACING.xxl, 40),
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    // Max width pour le web pour ne pas avoir une modale etiree
    ...(Platform.OS === 'web' && {
      maxWidth: 500,
      alignSelf: 'center',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    }),
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: THEME.COLORS.border,
    borderRadius: 3,
    marginTop: THEME.SPACING.md,
    marginBottom: THEME.SPACING.lg,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
    marginBottom: THEME.SPACING.xl,
  },
  aloneButton: {
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.champagneGold,
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  aloneButtonText: {
    color: '#121418',
    fontWeight: '900',
    fontSize: 18,
  },
  buttonIcon: {
    marginRight: 10,
    color: '#121418',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: THEME.SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.COLORS.border,
  },
  dividerText: {
    marginHorizontal: 15,
    color: THEME.COLORS.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.SPACING.xl,
  },
  counterButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.COLORS.glassSurface,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonDisabled: {
    opacity: 0.5,
    backgroundColor: THEME.COLORS.background,
  },
  countDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
  },
  countText: {
    fontSize: 40,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
    marginRight: 8,
  },
  groupButton: {
    backgroundColor: THEME.COLORS.glassSurface,
    borderWidth: 2,
    borderColor: THEME.COLORS.textPrimary,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupButtonText: {
    color: THEME.COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default PassengerCountModal;