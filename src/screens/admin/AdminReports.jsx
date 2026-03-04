// src/screens/admin/AdminReports.jsx
// DASHBOARD SIGNALEMENTS - Vue modulaire et épurée
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { ConfirmModal } from '../../components/admin/AdminModals';
import ResolveReportModal from '../../components/admin/ResolveReportModal'; // L'import propre du tiroir de résolution
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import GlassCard from '../../components/ui/GlassCard';
import ImagePreviewModal from '../../components/ui/ImagePreviewModal'; // L'import propre du tiroir d'image
import { useDeleteReportMutation, useGetAllReportsQuery, useResolveReportMutation } from '../../store/api/reportsApiSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const AdminReports = ({ navigation }) => {
  const dispatch = useDispatch();
  const { data: reportsResponse, isLoading, isFetching, refetch } = useGetAllReportsQuery();
  const [resolveReport, { isLoading: isResolving }] = useResolveReportMutation();
  const [deleteReport, { isLoading: isDeleting }] = useDeleteReportMutation();

  const flatListRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

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

  const handleDelete = async () => {
    if (!reportToDelete) return;
    try {
      await deleteReport(reportToDelete).unwrap();
      setReportToDelete(null);
      dispatch(showSuccessToast({ title: 'Supprimé', message: 'Signalement effacé définitivement.' }));
    } catch (error) {
      setReportToDelete(null);
      dispatch(showErrorToast({ title: 'Erreur', message: 'Impossible de supprimer ce signalement.' }));
    }
  };

  const openImagePreview = (url) => {
    setPreviewImageUrl(url);
    setIsPreviewVisible(true);
  };

  const renderItem = ({ item }) => {
    const isResolved = item.status === 'RESOLVED';
    
    return (
      <GlassCard style={styles.reportCard}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfoWrapper}>
            <Text style={styles.userName}>{item.user?.name || 'Utilisateur inconnu'}</Text>
            <Text style={styles.userPhone}>{item.user?.phone || 'Pas de numéro'}</Text>
          </View>
          
          <View style={styles.headerRightActions}>
            <View style={[styles.statusBadge, { backgroundColor: isResolved ? THEME.COLORS.success : THEME.COLORS.danger }]}>
              <Text style={styles.statusText}>{isResolved ? 'RÉSOLU' : 'OUVERT'}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.deleteIconBtn} 
              onPress={() => setReportToDelete(item._id)}
              disabled={isDeleting}
            >
              <Ionicons name="trash-outline" size={20} color={THEME.COLORS.textSecondary} />
            </TouchableOpacity>
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
              <TouchableOpacity key={index} onPress={() => openImagePreview(url)}>
                <Image source={{ uri: url }} style={styles.captureImage} />
                <View style={styles.zoomIconOverlay}>
                  <Ionicons name="search" size={12} color="#FFF" />
                </View>
              </TouchableOpacity>
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

      {/* Utilisation des composants modulaires */}
      <ResolveReportModal 
        visible={isModalVisible} 
        report={selectedReport} 
        onClose={() => setIsModalVisible(false)} 
        onResolve={handleResolve}
        isSubmitting={isResolving}
      />

      <ConfirmModal 
        visible={!!reportToDelete}
        title="Supprimer le signalement"
        message="Cette action est irréversible. Les images associées seront également supprimées des serveurs."
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setReportToDelete(null)}
      />

      <ImagePreviewModal 
        visible={isPreviewVisible}
        imageUrl={previewImageUrl}
        onClose={() => setIsPreviewVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Tout ce qui concerne les modales a été supprimé d'ici !
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.COLORS.primary },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: THEME.COLORS.textSecondary, marginTop: 10 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  reportCard: { padding: 15, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userInfoWrapper: { flex: 1 },
  headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deleteIconBtn: { padding: 4 },
  
  userName: { color: THEME.COLORS.textPrimary, fontSize: 16, fontWeight: 'bold' },
  userPhone: { color: THEME.COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  dateText: { color: THEME.COLORS.textTertiary, fontSize: 11, marginTop: 8, marginBottom: 12 },
  
  messageBox: { backgroundColor: THEME.COLORS.overlay, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: THEME.COLORS.border, marginBottom: 12 },
  messageText: { color: THEME.COLORS.textPrimary, fontSize: 14, lineHeight: 20 },
  
  imagesRow: { flexDirection: 'row', marginBottom: 12, flexWrap: 'wrap', gap: 12 },
  captureImage: { width: 70, height: 70, borderRadius: 8, borderWidth: 1, borderColor: THEME.COLORS.border },
  zoomIconOverlay: { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 10 },
  
  resolveButton: { backgroundColor: THEME.COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 8, marginTop: 5 },
  resolveButtonText: { color: THEME.COLORS.background, fontWeight: 'bold', fontSize: 14 },
  
  resolutionBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(46, 204, 113, 0.1)', padding: 10, borderRadius: 8, marginTop: 5, gap: 8 },
  resolutionText: { color: THEME.COLORS.success, fontSize: 13, flex: 1, fontStyle: 'italic' },
  
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: THEME.COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginTop: 15 },
  emptySubText: { color: THEME.COLORS.textSecondary, fontSize: 14, marginTop: 5 }
});

export default AdminReports;