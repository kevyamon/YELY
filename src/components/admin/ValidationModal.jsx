// src/components/admin/ValidationModal.jsx
// MODALE DE VALIDATION - Inspection visuelle des preuves de paiement
// UI: Liquid Glassmorphism
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
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Inspection de Transaction</Text>
            <TouchableOpacity onPress={handleClose} disabled={isProcessing}>
              <Ionicons name="close" size={28} color={THEME.COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Type :</Text> {transaction.type === 'WEEKLY' ? 'HEBDOMADAIRE (1200F)' : 'MENSUEL (6000F)'}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Tel. Paiement :</Text> {transaction.senderPhone || 'Non specifie'}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Date :</Text> {new Date(transaction.createdAt).toLocaleString('fr-FR')}
            </Text>
          </View>

          <View style={styles.imageContainer}>
            {transaction.proofImageUrl ? (
              <Image 
                source={{ uri: transaction.proofImageUrl }} 
                style={styles.proofImage} 
                resizeMode="contain"
              />
            ) : (
              <View style={styles.noImagePlaceholder}>
                <Ionicons name="image-outline" size={48} color="rgba(255,255,255,0.3)" />
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
                <Ionicons name="close-circle-outline" size={20} color="#FFF" style={styles.buttonIcon} />
                <Text style={styles.buttonTextWhite}>Rejeter</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.approveButton]} 
                onPress={() => onApprove(transaction._id)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#121212" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#121212" style={styles.buttonIcon} />
                    <Text style={styles.buttonTextDark}>Valider & Activer</Text>
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
                placeholderTextColor="rgba(255,255,255,0.3)"
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
                  <Text style={styles.buttonTextWhite}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.confirmRejectButton, !rejectReason.trim() && styles.buttonDisabled]} 
                  onPress={handleRejectSubmit}
                  disabled={isProcessing || !rejectReason.trim()}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.buttonTextWhite}>Confirmer Rejet</Text>
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
  modalContent: { width: '100%', backgroundColor: 'rgba(30, 30, 30, 0.85)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { color: THEME.COLORS.champagneGold, fontSize: 20, fontWeight: 'bold' },
  infoSection: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 15, borderRadius: 12, marginBottom: 15 },
  infoText: { color: THEME.COLORS.textPrimary, fontSize: 14, marginBottom: 4 },
  bold: { fontWeight: 'bold', color: THEME.COLORS.textSecondary },
  imageContainer: { height: 300, backgroundColor: '#000', borderRadius: 12, overflow: 'hidden', marginBottom: 20, justifyContent: 'center', alignItems: 'center' },
  proofImage: { width: '100%', height: '100%' },
  noImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  noImageText: { color: 'rgba(255,255,255,0.5)', marginTop: 10 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  button: { flex: 1, flexDirection: 'row', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 },
  approveButton: { backgroundColor: THEME.COLORS.champagneGold },
  rejectButton: { backgroundColor: 'rgba(255, 59, 48, 0.2)', borderWidth: 1, borderColor: '#FF3B30' },
  cancelButton: { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  confirmRejectButton: { backgroundColor: '#FF3B30' },
  buttonDisabled: { opacity: 0.5 },
  buttonIcon: { marginRight: 8 },
  buttonTextDark: { color: '#121212', fontWeight: 'bold', fontSize: 16 },
  buttonTextWhite: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  rejectSection: { width: '100%' },
  rejectLabel: { color: '#FF3B30', fontWeight: 'bold', marginBottom: 8 },
  rejectInput: { backgroundColor: 'rgba(0,0,0,0.5)', color: '#FFF', borderRadius: 10, padding: 15, borderWidth: 1, borderColor: 'rgba(255,59,48,0.5)', marginBottom: 15 }
});

export default ValidationModal;