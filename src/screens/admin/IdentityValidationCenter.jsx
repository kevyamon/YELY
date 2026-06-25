// src/screens/admin/IdentityValidationCenter.jsx
// CENTRE DE VALIDATION DES IDENTITÉS CHAUFFEURS - Cockpit d'Administration
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image, Modal, TextInput, ActivityIndicator, Dimensions } from 'react-native';
import { useDispatch } from 'react-redux';
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import GlobalSkeleton, { SkeletonBone } from '../../components/ui/GlobalSkeleton';
import { useGetPendingDriversQuery, useVerifyDriverMutation } from '../../store/api/adminApiSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GlassCard = ({ children, style, onPress }) => {
  const CardComponent = onPress ? TouchableOpacity : View;
  return (
    <CardComponent style={[styles.glassContainer, style]} onPress={onPress} activeOpacity={0.7}>
      <BlurView intensity={60} tint="default" style={StyleSheet.absoluteFill} />
      <View style={styles.glassContent}>
        {children}
      </View>
    </CardComponent>
  );
};

const IdentityValidationCenter = ({ navigation }) => {
  const dispatch = useDispatch();
  const [page, setPage] = useState(1);
  const flatListRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // RTK Query
  const { data: response, isLoading, isFetching, refetch, error } = useGetPendingDriversQuery({ page }, {
    pollingInterval: 5000,
    refetchOnMountOrArgChange: true,
  });

  const [verifyDriver, { isLoading: isProcessing }] = useVerifyDriverMutation();

  // State local pour les modals d'inspection et de rejet
  const [activeDriver, setActiveDriver] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const drivers = response?.data?.drivers || response?.drivers || [];

  const handleApprove = async (driverId) => {
    try {
      await verifyDriver({ id: driverId, decision: 'approved' }).unwrap();
      dispatch(showSuccessToast({
        title: "Chauffeur Approuvé",
        message: "L'identité et le tricycle du chauffeur ont été validés."
      }));
      setActiveDriver(null);
    } catch (e) {
      dispatch(showErrorToast({
        title: "Erreur",
        message: e?.data?.message || "Impossible de valider ce chauffeur."
      }));
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      dispatch(showErrorToast({
        title: "Motif requis",
        message: "Veuillez spécifier le motif du rejet."
      }));
      return;
    }

    try {
      await verifyDriver({
        id: activeDriver._id,
        decision: 'rejected',
        reason: rejectionReason
      }).unwrap();

      dispatch(showSuccessToast({
        title: "Dossier Rejeté",
        message: "Le chauffeur a été notifié du rejet."
      }));

      setIsRejectModalVisible(false);
      setRejectionReason('');
      setActiveDriver(null);
    } catch (e) {
      dispatch(showErrorToast({
        title: "Erreur",
        message: e?.data?.message || "Impossible de rejeter ce dossier."
      }));
    }
  };

  const handleScroll = (event) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    setShowScrollTop(contentOffset.y > layoutMeasurement.height / 2);
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const renderItem = ({ item }) => {
    return (
      <GlassCard style={styles.driverCard}>
        <View style={styles.cardHeader}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>
              {item.vehicle?.type === 'apsonic' ? 'APSONIC (6 PLACES)' : 'TVS (4 PLACES)'}
            </Text>
          </View>
          <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardInfo}>
            <Text style={styles.driverNameText}>{item.name}</Text>
            <Text style={styles.phoneText}>Tél: {item.phone}</Text>
            <Text style={styles.emailText}>Email: {item.email || 'Non renseigné'}</Text>
            <Text style={styles.vehicleText}>Véhicule: {item.vehicle?.model || 'Non défini'} - {item.vehicle?.plate || 'Non immatriculé'}</Text>
          </View>
        </View>

        <Text style={styles.docSectionTitle}>Pièces d'identité fournies :</Text>
        <View style={styles.docRow}>
          {item.documents?.idCardFront ? (
            <TouchableOpacity 
              style={styles.imageThumbContainer}
              onPress={() => setSelectedImage(item.documents.idCardFront)}
            >
              <Image source={{ uri: item.documents.idCardFront }} style={styles.imageThumb} />
              <View style={styles.zoomOverlay}>
                <Ionicons name="expand" size={16} color="#FFF" />
                <Text style={styles.zoomText}>Recto</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[styles.imageThumbContainer, styles.imagePlaceholder]}>
              <Ionicons name="warning-outline" size={24} color={THEME.COLORS.textTertiary} />
              <Text style={styles.placeholderText}>Recto manquant</Text>
            </View>
          )}

          {item.documents?.idCardBack ? (
            <TouchableOpacity 
              style={styles.imageThumbContainer}
              onPress={() => setSelectedImage(item.documents.idCardBack)}
            >
              <Image source={{ uri: item.documents.idCardBack }} style={styles.imageThumb} />
              <View style={styles.zoomOverlay}>
                <Ionicons name="expand" size={16} color="#FFF" />
                <Text style={styles.zoomText}>Verso</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[styles.imageThumbContainer, styles.imagePlaceholder]}>
              <Ionicons name="warning-outline" size={24} color={THEME.COLORS.textTertiary} />
              <Text style={styles.placeholderText}>Verso manquant</Text>
            </View>
          )}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectBtn]}
            onPress={() => {
              setActiveDriver(item);
              setIsRejectModalVisible(true);
            }}
            disabled={isProcessing}
          >
            <Ionicons name="close-circle-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnText}>Rejeter</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.approveBtn]}
            onPress={() => handleApprove(item._id)}
            disabled={isProcessing}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#121418" style={{ marginRight: 6 }} />
            <Text style={[styles.actionBtnText, { color: '#121418' }]}>Approuver</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vérifications ID</Text>
      </View>

      <View style={styles.listContainer}>
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={24} color={THEME.COLORS.background} style={styles.errorIcon} />
            <View style={styles.errorTextContainer}>
              <Text style={styles.errorTitle}>Erreur Réseau</Text>
              <Text style={styles.errorDetail}>Impossible de synchroniser avec le serveur.</Text>
            </View>
          </View>
        )}

        <GlobalSkeleton visible={isLoading && !isFetching} style={{ flex: 1 }}>
          {isLoading && !isFetching ? (
            <View style={styles.listContent}>
              {[1, 2].map((key) => (
                <GlassCard key={key} style={styles.driverCard}>
                  <View style={styles.cardHeader}>
                    <SkeletonBone width={140} height={24} borderRadius={8} />
                    <SkeletonBone width={80} height={14} />
                  </View>
                  <View style={{ padding: 15 }}>
                    <SkeletonBone width={180} height={20} style={{ marginBottom: 8 }} />
                    <SkeletonBone width={120} height={14} style={{ marginBottom: 6 }} />
                    <SkeletonBone width={150} height={14} />
                  </View>
                  <View style={styles.docRow}>
                    <SkeletonBone width="48%" height={100} borderRadius={12} />
                    <SkeletonBone width="48%" height={100} borderRadius={12} />
                  </View>
                </GlassCard>
              ))}
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={drivers}
              keyExtractor={(item) => item._id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onRefresh={refetch}
              refreshing={isFetching && drivers.length === 0}
              ListEmptyComponent={
                !error && (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="shield-checkmark" size={64} color={THEME.COLORS.textTertiary} />
                    <Text style={styles.emptyText}>Aucun dossier en attente.</Text>
                    <Text style={styles.emptySubtext}>Tous les chauffeurs sont vérifiés.</Text>
                  </View>
                )
              }
            />
          )}
        </GlobalSkeleton>
      </View>

      <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} />

      {/* MODAL IMAGE ZOOM EN GRAND FORMAT */}
      <Modal visible={!!selectedImage} transparent={true} onRequestClose={() => setSelectedImage(null)}>
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity style={styles.imageViewerCloseBtn} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close" size={32} color="#FFF" />
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.fullSizeImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* MODAL DE REJET AVEC MOTIF */}
      <Modal visible={isRejectModalVisible} transparent={true} animationType="fade" onRequestClose={() => setIsRejectModalVisible(false)}>
        <View style={styles.rejectModalBackdrop}>
          <GlassCard style={styles.rejectModalCard}>
            <View style={styles.rejectModalHeader}>
              <Ionicons name="alert-circle" size={24} color={THEME.COLORS.danger} style={{ marginRight: 10 }} />
              <Text style={styles.rejectModalTitle}>Rejeter le dossier</Text>
            </View>

            <Text style={styles.rejectModalLabel}>Veuillez spécifier le motif du rejet :</Text>
            <TextInput
              style={styles.rejectInput}
              placeholder="Ex: Photo verso illisible, Document expiré..."
              placeholderTextColor={THEME.COLORS.textTertiary}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
            />

            <View style={styles.rejectModalActions}>
              <TouchableOpacity 
                style={styles.rejectCancelBtn} 
                onPress={() => {
                  setIsRejectModalVisible(false);
                  setRejectionReason('');
                }}
              >
                <Text style={styles.rejectCancelText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.rejectConfirmBtn} 
                onPress={handleReject}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.rejectConfirmText}>Confirmer Rejet</Text>
                )}
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.COLORS.primary },
  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 80 },
  errorBanner: { flexDirection: 'row', backgroundColor: THEME.COLORS.danger, padding: 15, marginHorizontal: 20, borderRadius: 8, marginBottom: 20, alignItems: 'center' },
  errorIcon: { marginRight: 15 },
  errorTextContainer: { flex: 1 },
  errorTitle: { color: THEME.COLORS.background, fontWeight: 'bold', fontSize: 16 },
  errorDetail: { color: THEME.COLORS.background, fontSize: 13, marginTop: 4 },
  
  glassContainer: { overflow: 'hidden', borderRadius: 16, borderWidth: 1, borderColor: THEME.COLORS.border, backgroundColor: THEME.COLORS.overlay, marginBottom: 20 },
  glassContent: { padding: 16 },
  driverCard: { padding: 0 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typeBadge: { backgroundColor: 'transparent', borderWidth: 1, borderColor: THEME.COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { color: THEME.COLORS.primary, fontSize: 9, fontWeight: 'bold', letterSpacing: 0.8 },
  dateText: { color: THEME.COLORS.textSecondary, fontSize: 12 },
  
  cardBody: { flexDirection: 'row', marginBottom: 15 },
  cardInfo: { flex: 1 },
  driverNameText: { color: THEME.COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' },
  phoneText: { color: THEME.COLORS.primary, fontSize: 13, marginTop: 4, fontWeight: '600' },
  emailText: { color: THEME.COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  vehicleText: { color: THEME.COLORS.textTertiary, fontSize: 12, marginTop: 4 },
  
  docSectionTitle: { color: THEME.COLORS.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  docRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 15 },
  imageThumbContainer: { flex: 1, height: 110, borderRadius: 12, borderWidth: 1, borderColor: THEME.COLORS.border, overflow: 'hidden', position: 'relative' },
  imageThumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  zoomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 26, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  zoomText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderStyle: 'dashed' },
  placeholderText: { color: THEME.COLORS.textTertiary, fontSize: 10, marginTop: 4 },
  
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 5 },
  actionButton: { flex: 1, height: 44, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { backgroundColor: THEME.COLORS.danger },
  approveBtn: { backgroundColor: THEME.COLORS.primary },
  actionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: THEME.COLORS.textPrimary, fontSize: 18, fontWeight: '600', marginTop: 15 },
  emptySubtext: { color: THEME.COLORS.textSecondary, fontSize: 14, marginTop: 5 },

  // Viewer full size modal
  imageViewerContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  imageViewerCloseBtn: { position: 'absolute', top: 50, right: 20, zIndex: 100 },
  fullSizeImage: { width: SCREEN_WIDTH - 20, height: SCREEN_HEIGHT - 120 },

  // Reject dialog Modal
  rejectModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  rejectModalCard: { width: '100%', maxWidth: SCREEN_WIDTH - 40, padding: 20, borderRadius: 20 },
  rejectModalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  rejectModalTitle: { color: THEME.COLORS.danger, fontSize: 18, fontWeight: 'bold' },
  rejectModalLabel: { color: THEME.COLORS.textSecondary, fontSize: 13, marginBottom: 10 },
  rejectInput: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: THEME.COLORS.border, borderRadius: 10, padding: 12, color: THEME.COLORS.textPrimary, textAlignVertical: 'top', height: 100, marginBottom: 20 },
  rejectModalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  rejectCancelBtn: { flex: 1, height: 44, borderRadius: 22, borderWidth: 1, borderColor: THEME.COLORS.border, alignItems: 'center', justifyContent: 'center' },
  rejectCancelText: { color: THEME.COLORS.textPrimary, fontWeight: 'bold' },
  rejectConfirmBtn: { flex: 1, height: 44, borderRadius: 22, backgroundColor: THEME.COLORS.danger, alignItems: 'center', justifyContent: 'center' },
  rejectConfirmText: { color: '#FFF', fontWeight: 'bold' },
});

export default IdentityValidationCenter;
