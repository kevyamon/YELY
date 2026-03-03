// src/components/admin/ValidationModal.jsx
// MODALE DE VALIDATION - Nettoyee et adaptee dynamiquement (Light/Dark)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';

const ValidationModal = ({ visible, transaction, onClose, onApprove, onReject, isProcessing }) => {
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (!transaction) return null;

  const handleClose = () => {
    setRejectMode(false);
    setRejectReason('');
    onClose();
  };

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) return;
    onReject(transaction._id, rejectReason);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <BlurView intensity={80} tint="default" style={StyleSheet.absoluteFill} />
        
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Inspection de Transaction</Text>
            <TouchableOpacity onPress={handleClose} disabled={isProcessing}>
              <Ionicons name="close" size={28} color={THEME.COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Type :</Text> {transaction.planId === 'WEEKLY' ? 'HEBDOMADAIRE (1200F)' : 'MENSUEL (6000F)'}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Tel. Paiement :</Text> {transaction.senderPhone || 'Non specifie'}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Date :</Text> {new Date(transaction.createdAt).toLocaleString('fr-FR')}
            </Text>
          </View>

          <View style={styles.imageContainer}>
            {transaction.proofUrl ? (
              <Image 
                source={{ uri: transaction.proofUrl }} 
                style={styles.proofImage} 
                resizeMode="contain"
              />
            ) : (
              <View style={styles.noImagePlaceholder}>
                <Ionicons name="image-outline" size={48} color={THEME.COLORS.textTertiary} />
                <Text style={styles.noImageText}>Aucune preuve fournie</Text>
              </View>
            )}
          </View>

          {!rejectMode ? (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.rejectButton]} 
                onPress={() => setRejectMode(true)}
                disabled={isProcessing}
              >
                <Ionicons name="close-circle-outline" size={20} color={THEME.COLORS.danger} style={styles.buttonIcon} />
                <Text style={styles.buttonTextDanger}>Rejeter</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.approveButton]} 
                onPress={() => onApprove(transaction._id)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color={THEME.COLORS.textInverse} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color={THEME.COLORS.textInverse} style={styles.buttonIcon} />
                    <Text style={styles.buttonTextInverse}>Valider & Activer</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.rejectSection}>
              <Text style={styles.rejectLabel}>Motif du rejet :</Text>
              <TextInput
                style={styles.rejectInput}
                placeholder="Ex: Image illisible, Montant incorrect..."
                placeholderTextColor={THEME.COLORS.textTertiary}
                value={rejectReason}
                onChangeText={setRejectReason}
                autoFocus
              />
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]} 
                  onPress={() => setRejectMode(false)}
                  disabled={isProcessing}
                >
                  <Text style={styles.buttonTextPrimary}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.confirmRejectButton, !rejectReason.trim() && styles.buttonDisabled]} 
                  onPress={handleRejectSubmit}
                  disabled={isProcessing || !rejectReason.trim()}
                >
                  {isProcessing ? (
                    <ActivityIndicator color={THEME.COLORS.textInverse || "#FFFFFF"} />
                  ) : (
                    <Text style={styles.buttonTextInverseBold}>Confirmer Rejet</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: THEME.COLORS.glassModal, borderRadius: THEME.BORDERS?.radius?.xl || 20, padding: 20, borderWidth: THEME.BORDERS?.width?.thin || 1, borderColor: THEME.COLORS.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { color: THEME.COLORS.primary, fontSize: 20, fontWeight: 'bold' },
  infoSection: { backgroundColor: THEME.COLORS.overlay, padding: 15, borderRadius: THEME.BORDERS?.radius?.md || 8, marginBottom: 15 },
  infoText: { color: THEME.COLORS.textPrimary, fontSize: 14, marginBottom: 4 },
  bold: { fontWeight: 'bold', color: THEME.COLORS.textSecondary },
  imageContainer: { height: 300, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: THEME.BORDERS?.radius?.md || 8, overflow: 'hidden', marginBottom: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.COLORS.border },
  proofImage: { width: '100%', height: '100%' },
  noImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  noImageText: { color: THEME.COLORS.textTertiary, marginTop: 10 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  button: { flex: 1, flexDirection: 'row', height: 50, borderRadius: THEME.BORDERS?.radius?.md || 8, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 },
  approveButton: { backgroundColor: THEME.COLORS.primary },
  rejectButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: THEME.COLORS.danger },
  cancelButton: { backgroundColor: THEME.COLORS.overlay },
  confirmRejectButton: { backgroundColor: THEME.COLORS.danger },
  buttonDisabled: { opacity: 0.5 },
  buttonIcon: { marginRight: 8 },
  buttonTextInverse: { color: THEME.COLORS.textInverse || '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  buttonTextInverseBold: { color: THEME.COLORS.textInverse || '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  buttonTextDanger: { color: THEME.COLORS.danger, fontWeight: 'bold', fontSize: 16 },
  buttonTextPrimary: { color: THEME.COLORS.textPrimary, fontWeight: 'bold', fontSize: 16 },
  rejectSection: { width: '100%' },
  rejectLabel: { color: THEME.COLORS.danger, fontWeight: 'bold', marginBottom: 8 },
  rejectInput: { backgroundColor: THEME.COLORS.overlay, color: THEME.COLORS.textPrimary, borderRadius: THEME.BORDERS?.radius?.md || 8, padding: 15, borderWidth: 1, borderColor: THEME.COLORS.danger, marginBottom: 15 }
});

export default ValidationModal;