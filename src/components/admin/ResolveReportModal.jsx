// src/components/admin/ResolveReportModal.jsx
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';

const ResolveReportModal = ({ visible, report, onClose, onResolve, isSubmitting }) => {
  const [note, setNote] = useState('');

  if (!visible || !report) return null;

  const handleConfirm = () => {
    if (!note.trim()) return;
    onResolve(report._id, note);
    setNote(''); // On vide le champ après l'envoi
  };

  const handleClose = () => {
    setNote(''); // On vide le champ si l'admin annule
    onClose();
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <BlurView intensity={80} tint="default" style={StyleSheet.absoluteFill} />
        <ScrollView contentContainerStyle={styles.scrollCenter} keyboardShouldPersistTaps="handled">
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Clôturer le signalement</Text>
              <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
                <Ionicons name="close" size={24} color={THEME.COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>Plaintif: {report.user?.name || 'Inconnu'}</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Note de résolution (Obligatoire) :</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Utilisateur remboursé, bug corrigé..."
                placeholderTextColor={THEME.COLORS.textTertiary}
                multiline
                numberOfLines={4}
                value={note}
                onChangeText={setNote}
                autoFocus
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={handleClose} disabled={isSubmitting}>
                <Text style={styles.modalBtnTextCancel}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnConfirm, !note.trim() && { opacity: 0.5 }]} onPress={handleConfirm} disabled={isSubmitting || !note.trim()}>
                {isSubmitting ? <ActivityIndicator color={THEME.COLORS.background} /> : <Text style={styles.modalBtnTextConfirm}>Résoudre</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  scrollCenter: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: THEME.COLORS.glassSurface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: THEME.COLORS.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { color: THEME.COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' },
  modalSub: { color: THEME.COLORS.textSecondary, fontSize: 14, marginBottom: 20 },
  inputContainer: { marginBottom: 20 },
  inputLabel: { color: THEME.COLORS.primary, fontSize: 12, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
  textInput: { backgroundColor: THEME.COLORS.overlay, color: THEME.COLORS.textPrimary, borderRadius: 10, padding: 15, borderWidth: 1, borderColor: THEME.COLORS.border, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  modalBtn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modalBtnCancel: { backgroundColor: THEME.COLORS.overlay, borderWidth: 1, borderColor: THEME.COLORS.border },
  modalBtnConfirm: { backgroundColor: THEME.COLORS.primary },
  modalBtnTextCancel: { color: THEME.COLORS.textPrimary, fontWeight: 'bold' },
  modalBtnTextConfirm: { color: THEME.COLORS.background, fontWeight: 'bold' }
});

export default ResolveReportModal;