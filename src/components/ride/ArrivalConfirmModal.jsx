// src/components/ride/ArrivalConfirmModal.jsx
// MODALE SEMI-AUTOMATIQUE - Confirmation de fin de course
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';

const ArrivalConfirmModal = ({ visible, onConfirm, onSnooze, isLoading }) => {
  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalIconContainer}>
            <Ionicons name="location" size={40} color={THEME.COLORS.background} />
          </View>

          <Text style={styles.modalTitle}>Etes-vous arrivé ?</Text>
          <Text style={styles.modalSubtitle}>
            Vous semblez etre à destination. Confirmez-vous la fin de la course pour encaisser vos gains ?
          </Text>

          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.confirmButton, isLoading && styles.disabledButton]} 
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={THEME.COLORS.background} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={THEME.COLORS.background} style={styles.buttonIcon} />
                  <Text style={styles.confirmButtonText}>Oui, terminer la course</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.snoozeButton} 
              onPress={onSnooze}
              disabled={isLoading}
            >
              <Ionicons name="time" size={18} color={THEME.COLORS.textSecondary} style={styles.buttonIcon} />
              <Text style={styles.snoozeButtonText}>Non, me rappeler dans 2 min</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    backgroundColor: THEME.COLORS.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: THEME.SPACING.xl,
    paddingBottom: THEME.SPACING.xxl,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  modalIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: THEME.COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.SPACING.lg,
    marginTop: -THEME.SPACING.xxl,
    borderWidth: 4,
    borderColor: THEME.COLORS.background,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: THEME.COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: THEME.SPACING.xl,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.success,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: THEME.COLORS.background,
    fontWeight: '900',
    fontSize: 16,
  },
  snoozeButton: {
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.glassSurface,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  snoozeButtonText: {
    color: THEME.COLORS.textSecondary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  buttonIcon: {
    marginRight: 8,
  }
});

export default ArrivalConfirmModal;