// src/components/ride/PassengerCountModal.jsx
// MODALE ERGONOMIQUE - Selection du nombre de passagers (Cross-Platform Web/Mobile)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';

const PassengerCountModal = ({ visible, onClose, onConfirm }) => {
  const [count, setCount] = useState(1);

  // Reinitialiser le compteur a 1 a chaque ouverture
  useEffect(() => {
    if (visible) setCount(1);
  }, [visible]);

  const increment = () => {
    if (count < 4) setCount(count + 1);
  };

  const decrement = () => {
    if (count > 1) setCount(count - 1);
  };

  if (!visible && Platform.OS === 'web') return null;

  return (
    <Modal 
      visible={visible} 
      transparent={true} 
      animationType={Platform.OS === 'web' ? 'none' : 'slide'}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.modalCard}>
          <View style={styles.dragIndicator} />
          
          <Text style={styles.modalTitle}>Combien de places ?</Text>

          <View style={styles.counterContainer}>
            <TouchableOpacity 
              style={[styles.counterButton, count <= 1 && styles.counterButtonDisabled]} 
              onPress={decrement}
              disabled={count <= 1}
            >
              <Ionicons name="remove" size={28} color={count <= 1 ? THEME.COLORS.border : THEME.COLORS.textPrimary} />
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
            <Text style={styles.groupButtonText}>
              Confirmer pour {count} place{count > 1 ? 's' : ''}
            </Text>
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
    paddingTop: THEME.SPACING.md,
    paddingBottom: Math.max(THEME.SPACING.xxl, 40),
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
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
    marginBottom: THEME.SPACING.xl,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
    marginBottom: THEME.SPACING.xxl,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.SPACING.xxl,
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
  groupButtonText: {
    color: '#121418',
    fontWeight: '900',
    fontSize: 18,
  }
});

export default PassengerCountModal;