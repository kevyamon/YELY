// src/components/notifications/ReportResolutionModal.jsx
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGetMyReportsQuery } from '../../store/api/reportsApiSlice';
import THEME from '../../theme/theme';

const ReportResolutionModal = ({ visible, onClose, reportId }) => {
  // On ne charge les données que si la modale est ouverte et qu'on a un ID
  const { data: reportsResponse, isLoading } = useGetMyReportsQuery(undefined, {
    skip: !visible || !reportId,
  });

  // On cherche le signalement spécifique dans la liste
  const reports = reportsResponse?.data || [];
  const report = reports.find((r) => r._id === reportId);

  if (!visible) return null;

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <BlurView intensity={80} tint="default" style={StyleSheet.absoluteFill} />
        
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="shield-checkmark" size={24} color={THEME.COLORS.success} />
              <Text style={styles.title}>Signalement Résolu</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color={THEME.COLORS.textTertiary} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color={THEME.COLORS.primary} />
              <Text style={styles.loaderText}>Récupération des détails...</Text>
            </View>
          ) : !report ? (
            <View style={styles.loaderBox}>
              <Ionicons name="alert-circle-outline" size={40} color={THEME.COLORS.warning} />
              <Text style={styles.loaderText}>Ce signalement est introuvable ou a été supprimé.</Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollArea}>
              <View style={styles.section}>
                <Text style={styles.label}>Votre problème initial :</Text>
                <View style={styles.originalMessageBox}>
                  <Text style={styles.originalMessageText}>{report.message}</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Réponse de l'Administration :</Text>
                <View style={styles.adminNoteBox}>
                  <Ionicons name="chatbubbles-outline" size={20} color={THEME.COLORS.success} style={{ marginRight: 8, marginTop: 2 }} />
                  <Text style={styles.adminNoteText}>{report.adminNote || "Aucune note laissée."}</Text>
                </View>
              </View>
            </ScrollView>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { width: '90%', maxHeight: '80%', backgroundColor: THEME.COLORS.glassSurface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: THEME.COLORS.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: THEME.COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' },
  loaderBox: { padding: 30, alignItems: 'center', justifyContent: 'center' },
  loaderText: { color: THEME.COLORS.textSecondary, marginTop: 10, textAlign: 'center' },
  scrollArea: { marginBottom: 15 },
  section: { marginBottom: 20 },
  label: { color: THEME.COLORS.textSecondary, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', fontWeight: 'bold' },
  originalMessageBox: { backgroundColor: THEME.COLORS.overlay, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: THEME.COLORS.border },
  originalMessageText: { color: THEME.COLORS.textSecondary, fontSize: 14, fontStyle: 'italic' },
  adminNoteBox: { flexDirection: 'row', backgroundColor: 'rgba(46, 204, 113, 0.1)', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: THEME.COLORS.success },
  adminNoteText: { color: THEME.COLORS.success, fontSize: 15, flex: 1, fontWeight: '500' },
  closeBtn: { backgroundColor: THEME.COLORS.primary, paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  closeBtnText: { color: THEME.COLORS.background, fontSize: 16, fontWeight: 'bold' }
});

export default ReportResolutionModal;