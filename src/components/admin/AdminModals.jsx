// src/components/admin/AdminModals.jsx
// MODALES ADMIN CENTRALISEES - UI Glassmorphism Adaptive
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

export const UserInfoModal = ({ visible, user, onClose }) => {
  if (!user) return null;

  const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || 'N/A'}</Text>
    </View>
  );

  const roleTranslation = { rider: 'Passager', driver: 'Chauffeur', admin: 'Administrateur', superadmin: 'Direction' };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={80} tint="default" style={StyleSheet.absoluteFill} />
        <View style={styles.modalContent}>
          <View style={styles.headerBetween}>
            <Text style={styles.title}>Détails Utilisateur</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={28} color={THEME.COLORS.textPrimary} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color={THEME.COLORS.textTertiary} />
            </View>
            <DetailRow label="Nom Complet" value={user.name} />
            <DetailRow label="Email" value={user.email} />
            <DetailRow label="Téléphone" value={user.phone} />
            <DetailRow label="Rôle" value={roleTranslation[user.role] || user.role} />
            <DetailRow label="Statut" value={user.isBanned ? 'Banni' : 'Actif'} />
            <DetailRow label="Inscription" value={new Date(user.createdAt).toLocaleDateString('fr-FR')} />
            <DetailRow label="Courses Totales" value={user.totalRides?.toString()} />
            <DetailRow label="Note" value={user.rating ? `${user.rating} ⭐` : 'Aucune'} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxHeight: '85%', backgroundColor: THEME.COLORS.glassModal, borderRadius: THEME.BORDERS.radius.xl, padding: 20, borderWidth: THEME.BORDERS.width.thin, borderColor: THEME.COLORS.border },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  headerBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: THEME.COLORS.textPrimary, fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
  message: { color: THEME.COLORS.textSecondary, fontSize: 16, lineHeight: 24, marginBottom: 25 },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelButton: { flex: 1, backgroundColor: THEME.COLORS.overlay, padding: 15, borderRadius: THEME.BORDERS.radius.md, alignItems: 'center', marginRight: 10 },
  cancelText: { color: THEME.COLORS.textPrimary, fontWeight: 'bold', fontSize: 16 },
  confirmButton: { flex: 1, padding: 15, borderRadius: THEME.BORDERS.radius.md, alignItems: 'center' },
  confirmText: { color: THEME.COLORS.textInverse, fontWeight: 'bold', fontSize: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: THEME.COLORS.border },
  detailLabel: { color: THEME.COLORS.textSecondary, fontSize: 14, flex: 1 },
  detailValue: { color: THEME.COLORS.textPrimary, fontSize: 14, fontWeight: '600', flex: 2, textAlign: 'right' },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: THEME.COLORS.overlay, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }
});