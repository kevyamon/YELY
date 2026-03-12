// src/screens/admin/AdminReports.jsx
// DASHBOARD SIGNALEMENTS - Vue modulaire et épurée (Images corrigees HTTPS strict + URI Encoding)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { ConfirmModal } from '../../components/admin/AdminModals';
import ResolveReportModal from '../../components/admin/ResolveReportModal';
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import GlassCard from '../../components/ui/GlassCard';
import GlobalSkeleton, { SkeletonBone } from '../../components/ui/GlobalSkeleton';
import ImagePreviewModal from '../../components/ui/ImagePreviewModal';

import { useDeleteAdminReportMutation, useGetAllReportsQuery, useResolveReportMutation } from '../../store/api/reportsApiSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const AdminReports = ({ navigation }) => {
  const dispatch = useDispatch();
  const { data: reportsResponse, isLoading, isFetching, refetch } = useGetAllReportsQuery();
  const [resolveReport, { isLoading: isResolving }] = useResolveReportMutation();
  
  const [deleteAdminReport, { isLoading: isDeleting }] = useDeleteAdminReportMutation();

  const flatListRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  const reports = reportsResponse?.data || reportsResponse || [];

  const handleScroll = (event) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const halfScreenHeight = layoutMeasurement.height / 2;
    setShowScrollTop(contentOffset.y > halfScreenHeight);
  };

  const scrollToTop = () => {
    if (reports && reports.length > 0) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
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
      dispatch(showSuccessToast({ title: 'Succes', message: 'Signalement resolu avec succes.' }));
    } catch (error) {
      dispatch(showErrorToast({ title: 'Erreur', message: 'Impossible de clore ce signalement.' }));
    }
  };

  const handleDelete = async () => {
    if (!reportToDelete) return;
    try {
      await deleteAdminReport(reportToDelete).unwrap();
      setReportToDelete(null);
      dispatch(showSuccessToast({ title: 'Supprime', message: 'Signalement efface definitivement.' }));
    } catch (error) {
      setReportToDelete(null);
      dispatch(showErrorToast({ title: 'Erreur', message: 'Impossible de supprimer ce signalement.' }));
    }
  };

  const openImagePreview = (url) => {
    const secureUrl = url ? encodeURI(url.replace('http://', 'https://')) : null;
    setPreviewImageUrl(secureUrl);
    setIsPreviewVisible(true);
  };

  const renderItem = ({ item }) => {
    const isResolved = item.status === 'RESOLVED';
    
    return (
      <GlassCard style={styles.reportCard}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfoWrapper}>
            <Text style={styles.userName}>{item.user?.name || 'Utilisateur inconnu'}</Text>
            <Text style={styles.userPhone}>{item.user?.phone || 'Pas de numero'}</Text>
          </View>
          
          <View style={styles.headerRightActions}>
            <View style={[styles.statusBadge, { backgroundColor: isResolved ? THEME.COLORS.success : THEME.COLORS.danger }]}>
              <Text style={styles.statusText}>{isResolved ? 'RESOLU' : 'OUVERT'}</Text>
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
          {new Date(item.createdAt).toLocaleDateString('fr-FR')} a {new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute:'2-digit' })}
        </Text>

        <View style={styles.messageBox}>
          <Text style={styles.messageText}>{item.message}</Text>
        </View>

        {item.captures && item.captures.length > 0 && (
          <View style={styles.imagesRow}>
            {item.captures.map((url, index) => {
              const secureUrl = encodeURI(url.replace('http://', 'https://'));
              return (
                <TouchableOpacity key={index} onPress={() => openImagePreview(secureUrl)} style={styles.imageContainer}>
                  <Image 
                    source={{ uri: secureUrl }} 
                    style={styles.captureImage} 
                    resizeMode="cover"
                  />
                  <View style={styles.zoomIconOverlay}>
                    <Ionicons name="search" size={12} color="#FFF" />
                  </View>
                </TouchableOpacity>
              );
            })}
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
            <Text style={styles.resolveButtonText}>Marquer comme resolu</Text>
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

      <GlobalSkeleton visible={isLoading} style={{ flex: 1 }}>
        {isLoading ? (
          <View style={styles.listContent}>
            {[1, 2, 3].map((key) => (
              <GlassCard key={key} style={styles.reportCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.userInfoWrapper}>
                    <SkeletonBone width={130} height={18} style={{ marginBottom: 6 }} />
                    <SkeletonBone width={90} height={14} />
                  </View>
                  <SkeletonBone width={70} height={22} borderRadius={8} />
                </View>
                <SkeletonBone width={120} height={12} style={{ marginTop: 8, marginBottom: 12 }} />
                <View style={styles.messageBox}>
                  <SkeletonBone width="100%" height={14} style={{ marginBottom: 6 }} />
                  <SkeletonBone width="80%" height={14} />
                </View>
                <View style={styles.imagesRow}>
                  <SkeletonBone width={70} height={70} borderRadius={8} />
                  <SkeletonBone width={70} height={70} borderRadius={8} />
                </View>
                <SkeletonBone width="100%" height={45} borderRadius={8} style={{ marginTop: 5 }} />
              </GlassCard>
            ))}
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
            <ScrollToTopButton onPress={scrollToTop} visible={showScrollTop} />
          </>
        )}
      </GlobalSkeleton>

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
        message="Cette action est irreversible. Les images associees seront egalement supprimees des serveurs."
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
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.COLORS.primary },
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
  
  imagesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  imageContainer: { width: 70, height: 70, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: THEME.COLORS.border, position: 'relative' },
  captureImage: { width: '100%', height: '100%', backgroundColor: THEME.COLORS.overlay },
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