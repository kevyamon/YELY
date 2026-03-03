// src/components/admin/AdminModals.jsx
// MODALES ADMIN CENTRALISEES - Nettoyage et Modularite
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';

export const ConfirmModal = ({ visible, title, message, onConfirm, onCancel, isDestructive }) => {
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={80} tint="default" style={StyleSheet.absoluteFill} />
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Ionicons name="warning-outline" size={28} color={isDestructive ? THEME.COLORS.danger : THEME.COLORS.primary} />
            <Text style={styles.title}>{title}</Text>
          </View>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmButton, { backgroundColor: isDestructive ? THEME.COLORS.danger : THEME.COLORS.primary }]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: THEME.COLORS.glassModal, borderRadius: THEME.BORDERS.radius.xl, padding: 25, borderWidth: THEME.BORDERS.width.thin, borderColor: THEME.COLORS.border },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  title: { color: THEME.COLORS.textPrimary, fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
  message: { color: THEME.COLORS.textSecondary, fontSize: 16, lineHeight: 24, marginBottom: 25 },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelButton: { flex: 1, backgroundColor: THEME.COLORS.overlay, padding: 15, borderRadius: THEME.BORDERS.radius.md, alignItems: 'center', marginRight: 10 },
  cancelText: { color: THEME.COLORS.textPrimary, fontWeight: 'bold', fontSize: 16 },
  confirmButton: { flex: 1, padding: 15, borderRadius: THEME.BORDERS.radius.md, alignItems: 'center' },
  confirmText: { color: THEME.COLORS.textInverse, fontWeight: 'bold', fontSize: 16 }
});