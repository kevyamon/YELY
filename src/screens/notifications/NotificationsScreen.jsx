// src/screens/notifications/NotificationsScreen.jsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { ConfirmModal } from '../../components/admin/AdminModals';
import ReportResolutionModal from '../../components/notifications/ReportResolutionModal'; // AJOUT SENIOR: Import de ta nouvelle modale modulaire
import GlassCard from '../../components/ui/GlassCard';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { useDeleteNotificationMutation, useGetNotificationsQuery, useMarkAsReadMutation } from '../../store/api/notificationsApiSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const NOTIF_ICONS = {
  SUBSCRIPTION: { icon: 'card', color: THEME.COLORS.primary },
  RIDE: { icon: 'car', color: THEME.COLORS.info },
  SYSTEM: { icon: 'notifications', color: THEME.COLORS.textSecondary },
  PAYMENT: { icon: 'cash', color: THEME.COLORS.success },
};

const NotificationsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { data, isLoading, refetch, isFetching } = useGetNotificationsQuery({ page: 1 });
  const [markRead] = useMarkAsReadMutation();
  const [deleteNotif, { isLoading: isDeleting }] = useDeleteNotificationMutation();

  const [notifToDelete, setNotifToDelete] = useState(null);
  
  // AJOUT SENIOR: États pour gérer la modale de signalement
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);

  const notifications = data?.data?.notifications || [];

  // AJOUT SENIOR: La fonction handleRead devient plus intelligente
  const handleRead = async (item) => {
    // 1. On marque comme lu si ce n'est pas fait
    if (!item.isRead) {
      await markRead(item._id);
    }
    
    // 2. Si la notification contient un reportId, on ouvre la modale !
    if (item.metadata && item.metadata.reportId) {
      setSelectedReportId(item.metadata.reportId);
      setIsReportModalVisible(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!notifToDelete) return;
    try {
      await deleteNotif(notifToDelete).unwrap();
      dispatch(showSuccessToast({ title: 'Supprimée', message: 'Notification effacée.' }));
    } catch (error) {
      dispatch(showErrorToast({ title: 'Erreur', message: 'Impossible de supprimer.' }));
    } finally {
      setNotifToDelete(null);
    }
  };

  const renderItem = ({ item }) => {
    const config = NOTIF_ICONS[item.type] || NOTIF_ICONS.SYSTEM;
    
    return (
      // CORRECTION: On passe "item" entier à handleRead au lieu de juste "item._id"
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
                onPress={() => setNotifToDelete(item._id)} 
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
            <TouchableOpacity onPress={() => setNotifToDelete('all')} style={styles.actionTextBtn}>
              <Text style={styles.deleteAll}>Vider</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={THEME.COLORS.primary} size="large" /></View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={64} color={THEME.COLORS.textTertiary} />
          <Text style={styles.emptyText}>Aucune notification pour le moment.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={isFetching}
        />
      )}

      <ConfirmModal 
        visible={!!notifToDelete}
        title={notifToDelete === 'all' ? "Vider les notifications" : "Supprimer la notification"}
        message={notifToDelete === 'all' ? "Êtes-vous sûr de vouloir supprimer TOUTES vos notifications ?" : "Voulez-vous vraiment supprimer cette notification ?"}
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setNotifToDelete(null)}
      />

      {/* AJOUT SENIOR : Intégration de la modale indépendante */}
      <ReportResolutionModal 
        visible={isReportModalVisible}
        onClose={() => setIsReportModalVisible(false)}
        reportId={selectedReportId}
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
  deleteAll: { color: THEME.COLORS.danger, fontSize: 14, fontWeight: 'bold' },
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
  emptyText: { color: THEME.COLORS.textSecondary, marginTop: 20, fontSize: 16 }
});

export default NotificationsScreen;