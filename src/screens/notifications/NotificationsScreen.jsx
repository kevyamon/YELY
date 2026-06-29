// src/screens/notifications/NotificationsScreen.jsx
// CENTRE DE NOTIFICATIONS - Alertes systemes et retours signalements
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { ConfirmModal } from '../../components/admin/AdminModals';
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import ReportResolutionModal from '../../components/notifications/ReportResolutionModal';
import GlassCard from '../../components/ui/GlassCard';
import GlobalSkeleton from '../../components/ui/GlobalSkeleton';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { useDeleteNotificationMutation, useGetNotificationsQuery, useMarkAsReadMutation } from '../../store/api/notificationsApiSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const NOTIF_ICONS = {
  SUBSCRIPTION: { icon: 'card', color: THEME.COLORS.primary },
  RIDE: { icon: 'car', color: THEME.COLORS.info },
  SYSTEM: { icon: 'notifications', color: THEME.COLORS.textSecondary },
  PAYMENT: { icon: 'cash', color: THEME.COLORS.success },
  NEW_ORDER: { icon: 'cart', color: THEME.COLORS.primary },
  ORDER_UPDATE: { icon: 'receipt', color: THEME.COLORS.info },
};

const NotificationDetailModal = ({ visible, item, onClose, onAction }) => {
  if (!item) return null;
  const config = NOTIF_ICONS[item.type] || NOTIF_ICONS.SYSTEM;
  const hasAction =
    (item.metadata && item.metadata.reportId) ||
    (item.metadata && (item.type === 'NEW_ORDER' || item.type === 'ORDER_UPDATE')) ||
    (item.metadata && item.metadata.updateUrl);

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={[styles.modalIconWrap, { backgroundColor: config.color + '20' }]}>
            <Ionicons name={config.icon} size={28} color={config.color} />
          </View>
          <Text style={styles.modalTitle}>{item.title}</Text>
          <Text style={styles.modalTime}>
            {new Date(item.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          <Text style={styles.modalMessage}>{item.message}</Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.modalCloseBtnText}>Fermer</Text>
            </TouchableOpacity>
            {hasAction && (
              <TouchableOpacity style={styles.modalActionBtn} onPress={onAction} activeOpacity={0.8}>
                <Text style={styles.modalActionBtnText}>Consulter</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const NotificationsScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const flatListRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const { data, isLoading, refetch, isFetching } = useGetNotificationsQuery({ page: 1 });
  const [markRead] = useMarkAsReadMutation();
  const [deleteNotif, { isLoading: isDeleting }] = useDeleteNotificationMutation();

  const [notifToDelete, setInterceptionId] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);

  const [selectedNotif, setSelectedNotif] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  const notifications = data?.data?.notifications || [];

  useEffect(() => {
    if (route.params?.reportId) {
      setSelectedReportId(route.params.reportId);
      setIsReportModalVisible(true);
      
      if (route.params?.notificationId) {
        markRead(route.params.notificationId);
      }
      
      navigation.setParams({ reportId: undefined, notificationId: undefined });
    }
  }, [route.params?.reportId, route.params?.notificationId, markRead, navigation]);

  const handleScroll = (event) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const halfScreenHeight = layoutMeasurement.height / 2;
    setShowScrollTop(contentOffset.y > halfScreenHeight);
  };

  const scrollToTop = () => {
    if (notifications && notifications.length > 0) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const handleRead = async (item) => {
    if (!item.isRead) {
      await markRead(item._id);
    }
    setSelectedNotif(item);
    setIsDetailModalVisible(true);
  };

  const handleRedirect = (item) => {
    if (item.metadata && item.metadata.reportId) {
      setSelectedReportId(item.metadata.reportId);
      setIsReportModalVisible(true);
    } else if (item.metadata && (item.type === 'NEW_ORDER' || item.type === 'ORDER_UPDATE')) {
      const orderId = item.metadata.orderId;
      if (orderId) {
        if (item.type === 'NEW_ORDER') {
          navigation.navigate('SellerOrders', { orderId });
        } else {
          navigation.navigate('OrderTracking', { orderId });
        }
      }
    } else if (item.metadata && item.metadata.updateUrl) {
      let finalUrl = item.metadata.updateUrl.trim();
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = `https://${finalUrl}`;
      }
      Linking.canOpenURL(finalUrl).then(supported => {
        if (supported) {
          Linking.openURL(finalUrl);
        }
      }).catch(err => console.warn('[NOTIFS] Erreur redirection mise a jour:', err));
    }
  };

  const handleActionClick = () => {
    setIsDetailModalVisible(false);
    if (selectedNotif) {
      handleRedirect(selectedNotif);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!notifToDelete) return;
    try {
      await deleteNotif(notifToDelete).unwrap();
      dispatch(showSuccessToast({ title: 'Supprimee', message: 'Notification effacee.' }));
    } catch (error) {
      dispatch(showErrorToast({ title: 'Erreur', message: 'Impossible de supprimer.' }));
    } finally {
      setInterceptionId(null);
    }
  };

  const renderItem = ({ item }) => {
    const config = NOTIF_ICONS[item.type] || NOTIF_ICONS.SYSTEM;
    
    return (
      <TouchableOpacity onPress={() => handleRead(item)} activeOpacity={0.8}>
        <GlassCard style={[styles.card, !item.isRead && styles.unreadCard]}>
          <View style={[styles.iconBox, { backgroundColor: config.color + '20' }]}>
            <Ionicons name={config.icon} size={24} color={config.color} />
          </View>
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
            
            <View style={styles.footerRow}>
              <Text style={styles.time}>{new Date(item.createdAt).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
              
              <TouchableOpacity 
                onPress={() => setInterceptionId(item._id)} 
                style={styles.deleteBtn}
                disabled={isDeleting}
              >
                <Ionicons name="trash-outline" size={18} color={THEME.COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
          <Text style={styles.headerTitle}>Notifications</Text>
        </TouchableOpacity>
        
        {notifications.length > 0 && (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => markRead('all')} style={styles.actionTextBtn}>
              <Text style={styles.markAll}>Tout lire</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setInterceptionId('all')} style={styles.clearAllButton}>
              <Ionicons name="trash-outline" size={22} color={THEME.COLORS.danger} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={notifications}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, notifications.length === 0 && { flex: 1 }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onRefresh={refetch}
        refreshing={isFetching}
        ListEmptyComponent={isLoading ? (
          <View style={styles.centerSkeleton}>
            <GlobalSkeleton visible={true} fullScreen={false} />
          </View>
        ) : (
          <View style={styles.emptyCenter}>
            <Ionicons name="notifications-off-outline" size={64} color={THEME.COLORS.textTertiary} />
            <Text style={styles.emptyText}>Aucune notification pour le moment.</Text>
            <Text style={styles.pullHint}>Tirez pour rafraîchir</Text>
          </View>
        )}
      />
      <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} />

      <ConfirmModal 
        visible={!!notifToDelete}
        title={notifToDelete === 'all' ? "Vider les notifications" : "Supprimer la notification"}
        message={notifToDelete === 'all' ? "Etes-vous sur de vouloir supprimer TOUTES vos notifications ?" : "Voulez-vous vraiment supprimer cette notification ?"}
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setInterceptionId(null)}
      />

      <ReportResolutionModal 
        visible={isReportModalVisible}
        onClose={() => setIsReportModalVisible(false)}
        reportId={selectedReportId}
      />

      <NotificationDetailModal
        visible={isDetailModalVisible}
        item={selectedNotif}
        onClose={() => setIsDetailModalVisible(false)}
        onAction={handleActionClick}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: THEME.COLORS.primary, fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  actionTextBtn: { paddingVertical: 5 },
  markAll: { color: THEME.COLORS.textSecondary, fontSize: 14 },
  clearAllButton: { padding: 8, backgroundColor: 'rgba(255, 59, 48, 0.1)', borderRadius: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { flexDirection: 'row', padding: 15, marginBottom: 12, alignItems: 'center' },
  unreadCard: { borderColor: THEME.COLORS.primary, borderWidth: 1 },
  iconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  content: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { color: THEME.COLORS.textPrimary, fontSize: 16, fontWeight: 'bold', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.COLORS.primary },
  message: { color: THEME.COLORS.textSecondary, fontSize: 14, lineHeight: 20 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  time: { color: THEME.COLORS.textTertiary, fontSize: 11 },
  deleteBtn: { padding: 4 },
  emptyText: { color: THEME.COLORS.textSecondary, marginTop: 20, fontSize: 16 },
  pullHint: { color: THEME.COLORS.textTertiary, fontSize: 12, marginTop: 10, fontStyle: 'italic' },
  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  centerSkeleton: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

  // Styles de la modale de détails
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: THEME.COLORS.background,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: THEME.COLORS.border || 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: THEME.COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalTime: {
    color: THEME.COLORS.textTertiary,
    fontSize: 12,
    marginBottom: 16,
  },
  modalMessage: {
    color: THEME.COLORS.textSecondary,
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalCloseBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  modalCloseBtnText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: THEME.COLORS.champagneGold || '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionBtnText: {
    color: '#121418',
    fontSize: 14,
    fontWeight: '800',
  }
});

export default NotificationsScreen;