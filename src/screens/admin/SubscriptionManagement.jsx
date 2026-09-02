// src/screens/admin/SubscriptionManagement.jsx
// GESTION DES ABONNEMENTS - Cockpit Administrateur & Releve des Paiements
// STANDARD: Clean Architecture / Bank Grade (Modularise < 325 lignes, Sans Emojis)

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { useDispatch } from 'react-redux';
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import GlobalSkeleton, { SkeletonBone } from '../../components/ui/GlobalSkeleton';
import {
  useGetSubscriptionHistoryQuery,
  useGetSubscriptionsQuery,
  useToggleSubscriptionBanMutation
} from '../../store/api/adminApiSlice';
import { showErrorToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const GlassCard = ({ children, style }) => (
  <View style={[styles.glassContainer, style]}>
    <BlurView intensity={60} tint="default" style={StyleSheet.absoluteFill} />
    <View style={styles.glassContent}>{children}</View>
  </View>
);

const HistoryModal = ({ visible, user, transactions, isLoading, onClose }) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'APPROVED':
        return { bg: 'rgba(39, 174, 96, 0.1)', text: THEME.COLORS.success, label: 'Valide' };
      case 'FAILED':
      case 'REJECTED':
      case 'CANCELLED':
        return { bg: 'rgba(192, 57, 43, 0.1)', text: THEME.COLORS.danger, label: 'Echoue / Rejete' };
      default:
        return { bg: 'rgba(243, 156, 18, 0.1)', text: THEME.COLORS.warning, label: 'En cours' };
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Releve : {user?.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={THEME.COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={THEME.COLORS.primary} />
              <Text style={styles.loaderText}>Chargement de l'audit...</Text>
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={THEME.COLORS.textTertiary} />
              <Text style={styles.emptyText}>Aucune transaction enregistree pour cet utilisateur.</Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => {
                const statusStyle = getStatusStyle(item.status);
                const op = item.operator || item.gateway || 'GENIUSPAY';
                return (
                  <View style={styles.historyItem}>
                    <View style={styles.historyRow}>
                      <Text style={styles.historyPlan}>PASSE MENSUEL ({op})</Text>
                      <Text style={styles.historyAmount}>{item.amount} FCFA</Text>
                    </View>
                    <View style={styles.historyRow}>
                      <Text style={styles.historyDate}>
                        Date : {new Date(item.createdAt).toLocaleDateString('fr-FR')} {new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
                      </View>
                    </View>
                    {item.paymentReference && (
                      <Text style={styles.historyAdmin}>Ref : {item.paymentReference}</Text>
                    )}
                  </View>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const SubscriptionManagement = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const dispatch = useDispatch();

  useEffect(() => {
    const timerId = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timerId);
  }, [searchQuery]);

  const { data: subResponse, isLoading, refetch, error } = useGetSubscriptionsQuery({
    page: 1,
    search: debouncedSearch,
    role: selectedRole === 'all' ? undefined : selectedRole,
    status: selectedStatus === 'all' ? undefined : selectedStatus,
  });

  const [toggleSubscriptionBan, { isLoading: isTogglingBan }] = useToggleSubscriptionBanMutation();
  const [historyUser, setHistoryUser] = useState(null);
  const [banUser, setBanUser] = useState(null);
  const [banReason, setBanReason] = useState('Non-paiement / Expiration');

  const { data: historyData, isLoading: isLoadingHistory } = useGetSubscriptionHistoryQuery(
    historyUser?._id,
    { skip: !historyUser }
  );

  const flatListRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { height: screenHeight } = useWindowDimensions();

  const handleScroll = (event) => {
    setShowScrollTop(event.nativeEvent.contentOffset.y > screenHeight / 2);
  };

  const users = subResponse?.data?.users || subResponse?.users || [];

  const handleToggleBanSubmit = async () => {
    if (!banUser) return;
    try {
      await toggleSubscriptionBan({
        userId: banUser._id,
        reason: banUser.isBanned ? 'Reactivation du compte' : banReason,
      }).unwrap();
      setBanUser(null);
      setBanReason('Non-paiement / Expiration');
    } catch (e) {
      dispatch(showErrorToast({ message: e?.data?.message || 'Erreur mise a jour statut.' }));
    }
  };

  const getSubscriptionBadge = (user) => {
    if (user.isBanned) {
      return { label: 'Compte Suspendu', color: THEME.COLORS.danger, bg: 'rgba(192, 57, 43, 0.1)' };
    }
    if (user.subscription?.isActive && user.subscription?.expiresAt) {
      const now = new Date();
      const expiry = new Date(user.subscription.expiresAt);
      if (expiry > now) {
        const days = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        return { label: `Actif (${days}j restant)`, color: THEME.COLORS.success, bg: 'rgba(39, 174, 96, 0.1)' };
      }
    }
    return { label: 'Expire', color: THEME.COLORS.warning, bg: 'rgba(243, 156, 18, 0.1)' };
  };

  const renderUserItem = ({ item }) => {
    const badge = getSubscriptionBadge(item);
    return (
      <GlassCard style={styles.userCard}>
        <View style={styles.userInfoRow}>
          <View style={styles.userInfoLeft}>
            <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.userPhone}>{item.phone}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{item.role === 'driver' ? 'CHAUFFEUR' : 'VENDEUR'}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: badge.bg, marginLeft: 8 }]}>
                <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
              </View>
            </View>
            {item.subscription?.expiresAt && !item.isBanned && (
              <Text style={styles.expiryText}>
                Expire le : {new Date(item.subscription.expiresAt).toLocaleDateString('fr-FR')}
              </Text>
            )}
          </View>

          <View style={styles.actionsColumn}>
            <TouchableOpacity style={[styles.actionButton, styles.historyBtn]} onPress={() => setHistoryUser(item)}>
              <Ionicons name="receipt-outline" size={18} color={THEME.COLORS.pureWhite} />
              <Text style={styles.btnText}>Releve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, item.isBanned ? styles.activateBtn : styles.suspendBtn]}
              onPress={() => setBanUser(item)}
            >
              <Ionicons name={item.isBanned ? 'shield-checkmark-outline' : 'ban-outline'} size={18} color={THEME.COLORS.pureWhite} />
              <Text style={styles.btnText}>{item.isBanned ? 'Debloquer' : 'Bloquer'}</Text>
            </TouchableOpacity>
          </View>
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
        <Text style={styles.headerTitle}>Registre des Abonnements</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={THEME.COLORS.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Nom, email ou telephone..."
          placeholderTextColor={THEME.COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {[{ id: 'all', label: 'Tous' }, { id: 'driver', label: 'Chauffeurs' }, { id: 'seller', label: 'Vendeurs' }].map((tab) => (
            <TouchableOpacity key={tab.id} style={[styles.filterTab, selectedRole === tab.id && styles.filterTabActive]} onPress={() => setSelectedRole(tab.id)}>
              <Text style={[styles.filterTabText, selectedRole === tab.id && styles.filterTabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
          {[{ id: 'active', label: 'Actifs' }, { id: 'expired', label: 'Expires' }, { id: 'banned', label: 'Bloques' }].map((tab) => (
            <TouchableOpacity key={tab.id} style={[styles.filterTab, selectedStatus === tab.id && styles.filterTabActive]} onPress={() => setSelectedStatus(tab.id)}>
              <Text style={[styles.filterTabText, selectedStatus === tab.id && styles.filterTabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <GlobalSkeleton visible={isLoading} style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={THEME.COLORS.textTertiary} />
              <Text style={styles.emptyText}>Aucun utilisateur trouve.</Text>
            </View>
          }
        />
      </GlobalSkeleton>

      <ScrollToTopButton visible={showScrollTop} onPress={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })} />

      <HistoryModal visible={!!historyUser} user={historyUser} transactions={historyData?.data || historyData || []} isLoading={isLoadingHistory} onClose={() => setHistoryUser(null)} />

      <Modal visible={!!banUser} transparent={true} animationType="fade" onRequestClose={() => setBanUser(null)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{banUser?.isBanned ? 'Reactivation' : 'Blocage de securite'}</Text>
              <TouchableOpacity onPress={() => setBanUser(null)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={THEME.COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.banDescription}>
              {banUser?.isBanned ? `Voulez-vous reactiver le compte de ${banUser?.name} ?` : `Voulez-vous suspendre l'acces de ${banUser?.name} ?`}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setBanUser(null)} disabled={isTogglingBan}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, banUser?.isBanned ? styles.confirmActiveBtn : styles.confirmSuspendBtn]} onPress={handleToggleBanSubmit} disabled={isTogglingBan}>
                {isTogglingBan ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.confirmBtnText}>{banUser?.isBanned ? 'Debloquer' : 'Bloquer'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.COLORS.primary },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.COLORS.overlay, marginHorizontal: 20, borderRadius: THEME.BORDERS.radius.md, paddingHorizontal: 15, borderWidth: 1, borderColor: THEME.COLORS.border, marginBottom: 10 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: THEME.COLORS.textPrimary, paddingVertical: 10, fontSize: 15 },
  filterSection: { paddingHorizontal: 20, marginBottom: 10 },
  filterRow: { flexDirection: 'row', alignItems: 'center' },
  filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: THEME.BORDERS.radius.pill, backgroundColor: THEME.COLORS.overlay, marginRight: 8, borderWidth: 1, borderColor: THEME.COLORS.border },
  filterTabActive: { backgroundColor: THEME.COLORS.primary, borderColor: THEME.COLORS.primary },
  filterTabText: { color: THEME.COLORS.textSecondary, fontSize: 12 },
  filterTabTextActive: { color: THEME.COLORS.textInverse, fontWeight: 'bold' },
  listContent: { paddingHorizontal: 20, paddingBottom: 80 },
  glassContainer: { overflow: 'hidden', borderRadius: THEME.BORDERS.radius.lg, borderWidth: 1, borderColor: THEME.COLORS.border, backgroundColor: THEME.COLORS.overlay, marginBottom: 10 },
  glassContent: { padding: 14 },
  userCard: {},
  userInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userInfoLeft: { flex: 1, paddingRight: 10 },
  userName: { color: THEME.COLORS.textPrimary, fontSize: 15, fontWeight: 'bold' },
  userPhone: { color: THEME.COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  badgeRow: { flexDirection: 'row', marginTop: 6, alignItems: 'center' },
  roleBadge: { backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  roleText: { color: THEME.COLORS.primary, fontSize: 9, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 9, fontWeight: 'bold' },
  expiryText: { color: THEME.COLORS.textTertiary, fontSize: 11, marginTop: 6 },
  actionsColumn: { width: 90, justifyContent: 'space-between', height: 68 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 5, borderRadius: 6 },
  btnText: { color: THEME.COLORS.pureWhite, fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  historyBtn: { backgroundColor: THEME.COLORS.info },
  suspendBtn: { backgroundColor: THEME.COLORS.danger },
  activateBtn: { backgroundColor: THEME.COLORS.success },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { color: THEME.COLORS.textSecondary, fontSize: 14, marginTop: 10 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxHeight: '80%', backgroundColor: THEME.COLORS.glassModal, borderRadius: THEME.BORDERS.radius.xl, borderWidth: 1, borderColor: THEME.COLORS.border, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  closeButton: { padding: 4 },
  loaderContainer: { alignItems: 'center', paddingVertical: 40 },
  loaderText: { color: THEME.COLORS.textSecondary, marginTop: 10 },
  modalList: { paddingBottom: 20 },
  historyItem: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: THEME.COLORS.border },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  historyPlan: { color: THEME.COLORS.textPrimary, fontSize: 11, fontWeight: 'bold' },
  historyAmount: { color: THEME.COLORS.primary, fontSize: 12, fontWeight: 'bold' },
  historyDate: { color: THEME.COLORS.textSecondary, fontSize: 10 },
  historyAdmin: { color: THEME.COLORS.textTertiary, fontSize: 10, marginTop: 2 },
  banDescription: { color: THEME.COLORS.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 15 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: { flex: 1, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: THEME.COLORS.border, marginRight: 10 },
  cancelBtnText: { color: THEME.COLORS.textPrimary, fontWeight: 'bold' },
  confirmSuspendBtn: { backgroundColor: THEME.COLORS.danger },
  confirmActiveBtn: { backgroundColor: THEME.COLORS.success },
  confirmBtnText: { color: THEME.COLORS.pureWhite, fontWeight: 'bold' },
});

export default SubscriptionManagement;
