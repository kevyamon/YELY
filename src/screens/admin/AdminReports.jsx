// src/screens/admin/AdminReports.jsx
// DASHBOARD SIGNALEMENTS - Vue unifiée avec résolution dynamique
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';

import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import GlassCard from '../../components/ui/GlassCard';
import { useGetAllReportsQuery, useResolveReportMutation } from '../../store/api/reportsApiSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

// --- COMPOSANT MODAL DE RÉSOLUTION (Interne) ---
const ResolveModal = ({ visible, report, onClose, onResolve, isSubmitting }) => {
  const [note, setNote] = useState('');

  if (!visible || !report) return null;

  const handleConfirm = () => {
    if (!note.trim()) return;
    onResolve(report._id, note);
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.modalOverlay} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <BlurView intensity={80} tint="default" style={StyleSheet.absoluteFill} />
        
        <ScrollView contentContainerStyle={styles.scrollCenter} keyboardShouldPersistTaps="handled">
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Clôturer le signalement</Text>
              <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
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
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={onClose} disabled={isSubmitting}>
                <Text style={styles.modalBtnTextCancel}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnConfirm, !note.trim() && { opacity: 0.5 }]} 
                onPress={handleConfirm}
                disabled={isSubmitting || !note.trim()}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={THEME.COLORS.background} />
                ) : (
                  <Text style={styles.modalBtnTextConfirm}>Résoudre</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// --- ECRAN PRINCIPAL ---
const AdminReports = ({ navigation }) => {
  const dispatch = useDispatch();
  const { data: reportsResponse, isLoading, isFetching, refetch } = useGetAllReportsQuery();
  const [resolveReport, { isLoading: isResolving }] = useResolveReportMutation();

  const flatListRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const reports = reportsResponse?.data || reportsResponse || [];

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 200);
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const openResolveModal = (report) => {
    setSelectedReport(report);
    setIsModalVisible(true);
  };

  const handleResolve = async (id, note) => {
    try {
      await resolveReport({ id, note }).unwrap();
      setIsModalVisible(false);
      setSelectedReport(null);
      dispatch(showSuccessToast({ title: 'Succès', message: 'Signalement résolu avec succès.' }));
    } catch (error) {
      dispatch(showErrorToast({ title: 'Erreur', message: 'Impossible de clore ce signalement.' }));
    }
  };

  const renderItem = ({ item }) => {
    const isResolved = item.status === 'RESOLVED';
    
    return (
      <GlassCard style={styles.reportCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.userName}>{item.user?.name || 'Utilisateur inconnu'}</Text>
            <Text style={styles.userPhone}>{item.user?.phone || 'Pas de numéro'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isResolved ? THEME.COLORS.success : THEME.COLORS.danger }]}>
            <Text style={styles.statusText}>{isResolved ? 'RÉSOLU' : 'OUVERT'}</Text>
          </View>
        </View>

        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString('fr-FR')} à {new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute:'2-digit' })}
        </Text>

        <View style={styles.messageBox}>
          <Text style={styles.messageText}>{item.message}</Text>
        </View>

        {item.captures && item.captures.length > 0 && (
          <View style={styles.imagesRow}>
            {item.captures.map((url, index) => (
              <Image key={index} source={{ uri: url }} style={styles.captureImage} />
            ))}
          </View>
        )}

        {isResolved ? (
          <View style={styles.resolutionBox}>
            <Ionicons name="checkmark-done-circle" size={16} color={THEME.COLORS.success} />
            <Text style={styles.resolutionText}>Note Admin: {item.adminNote}</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.resolveButton} 
            onPress={() => openResolveModal(item)}
          >
            <Ionicons name="shield-checkmark-outline" size={18} color={THEME.COLORS.background} style={{ marginRight: 8 }} />
            <Text style={styles.resolveButtonText}>Marquer comme résolu</Text>
          </TouchableOpacity>
        )}
      </GlassCard>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Signalements</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME.COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des plaintes...</Text>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={reports}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isFetching}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle-outline" size={60} color={THEME.COLORS.success} />
                <Text style={styles.emptyText}>Aucun signalement en cours.</Text>
                <Text style={styles.emptySubText}>Tout fonctionne parfaitement !</Text>
              </View>
            }
          />
          {showScrollTop && <ScrollToTopButton onPress={scrollToTop} />}
        </>
      )}

      <ResolveModal 
        visible={isModalVisible} 
        report={selectedReport} 
        onClose={() => setIsModalVisible(false)} 
        onResolve={handleResolve}
        isSubmitting={isResolving}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.COLORS.primary },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: THEME.COLORS.textSecondary, marginTop: 10 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  reportCard: { padding: 15, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userName: { color: THEME.COLORS.textPrimary, fontSize: 16, fontWeight: 'bold' },
  userPhone: { color: THEME.COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  dateText: { color: THEME.COLORS.textTertiary, fontSize: 11, marginTop: 8, marginBottom: 12 },
  
  messageBox: { backgroundColor: THEME.COLORS.overlay, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: THEME.COLORS.border, marginBottom: 12 },
  messageText: { color: THEME.COLORS.textPrimary, fontSize: 14, lineHeight: 20 },
  
  imagesRow: { flexDirection: 'row', marginBottom: 12, flexWrap: 'wrap', gap: 8 },
  captureImage: { width: 60, height: 60, borderRadius: 8, borderWidth: 1, borderColor: THEME.COLORS.border },
  
  resolveButton: { backgroundColor: THEME.COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 8, marginTop: 5 },
  resolveButtonText: { color: THEME.COLORS.background, fontWeight: 'bold', fontSize: 14 },
  
  resolutionBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(46, 204, 113, 0.1)', padding: 10, borderRadius: 8, marginTop: 5, gap: 8 },
  resolutionText: { color: THEME.COLORS.success, fontSize: 13, flex: 1, fontStyle: 'italic' },
  
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: THEME.COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginTop: 15 },
  emptySubText: { color: THEME.COLORS.textSecondary, fontSize: 14, marginTop: 5 },

  // --- Modal Styles ---
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

export default AdminReports;