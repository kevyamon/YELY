// src/screens/admin/SubscriptionManagement.jsx
// GESTION DES ABONNEMENTS - Cockpit Administrateur & Audit Ledger
// CSCSM Level: Bank Grade

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
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { showErrorToast } from '../../store/slices/uiSlice';

import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import GlobalSkeleton, { SkeletonBone } from '../../components/ui/GlobalSkeleton';
import {
  useGetSubscriptionHistoryQuery,
  useGetSubscriptionsQuery,
  useToggleSubscriptionBanMutation,
} from '../../store/api/adminApiSlice';
import THEME from '../../theme/theme';

const GlassCard = ({ children, style }) => (
  <View style={[styles.glassContainer, style]}>
    <BlurView intensity={60} tint="default" style={StyleSheet.absoluteFill} />
    <View style={styles.glassContent}>
      {children}
    </View>
  </View>
);

const HistoryModal = ({ visible, user, transactions, isLoading, onClose }) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'APPROVED':
        return { bg: 'rgba(39, 174, 96, 0.1)', text: THEME.COLORS.success, label: 'Approuvé' };
      case 'REJECTED':
        return { bg: 'rgba(192, 57, 43, 0.1)', text: THEME.COLORS.danger, label: 'Rejeté' };
      default:
        return { bg: 'rgba(243, 156, 18, 0.1)', text: THEME.COLORS.warning, label: 'En attente' };
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Historique : {user?.name}</Text>
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
              <Text style={styles.emptyText}>Aucune transaction enregistrée pour cet utilisateur.</Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => {
                const statusStyle = getStatusStyle(item.status);
                return (
                  <View style={styles.historyItem}>
                    <View style={styles.historyRow}>
                      <Text style={styles.historyPlan}>{item.planId === 'WEEKLY' ? 'HEBDOMADAIRE' : 'MENSUEL'}</Text>
                      <Text style={styles.historyAmount}>{item.amount} FCFA</Text>
                    </View>
                    <View style={styles.historyRow}>
                      <Text style={styles.historyDate}>
                        Soumis le : {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
                      </View>
                    </View>
                    {item.assignedTo && (
                      <Text style={styles.historyAdmin}>Traité par : {item.assignedTo.name}</Text>
                    )}
                    {item.rejectionReason && (
                      <Text style={styles.historyReason}>Motif rejet : {item.rejectionReason}</Text>
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
  const [selectedRole, setSelectedRole] = useState('all'); // all, driver, seller
  const [selectedStatus, setSelectedStatus] = useState('all'); // all, active, expired, banned
  const dispatch = useDispatch();

  // PROTECTION DDOS / RATE LIMIT CLIENT : Debounce de 500ms
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchQuery]);

  // Requête principale de récupération des abonnements
  const {
    data: subResponse,
    isLoading,
    refetch,
    error,
  } = useGetSubscriptionsQuery({
    page: 1,
    search: debouncedSearch,
    role: selectedRole === 'all' ? undefined : selectedRole,
    status: selectedStatus === 'all' ? undefined : selectedStatus,
  });

  const [toggleSubscriptionBan, { isLoading: isTogglingBan }] = useToggleSubscriptionBanMutation();

  // États pour les modales
  const [historyUser, setHistoryUser] = useState(null);
  const [banUser, setBanUser] = useState(null);
  const [banReason, setBanReason] = useState('Non-paiement / Expiration de l\'abonnement');

  // Hook d'historique placé au sommet (Règles des Hooks respectées)
  const { data: historyData, isLoading: isLoadingHistory } = useGetSubscriptionHistoryQuery(
    historyUser?._id,
    { skip: !historyUser }
  );

  const flatListRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { height: screenHeight } = useWindowDimensions();

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    setShowScrollTop(scrollPosition > screenHeight / 2);
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const users = subResponse?.data?.users || subResponse?.users || [];

  const handleToggleBanSubmit = async () => {
    if (!banUser) return;
    try {
      await toggleSubscriptionBan({
        userId: banUser._id,
        reason: banUser.isBanned ? 'Réactivation du compte' : banReason,
      }).unwrap();
      setBanUser(null);
      setBanReason('Non-paiement / Expiration de l\'abonnement');
    } catch (e) {
      dispatch(showErrorToast({ message: e?.data?.message || 'Erreur lors de la mise à jour du statut.' }));
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
        return {
          label: `Actif • ${days}j restant(s)`,
          color: THEME.COLORS.success,
          bg: 'rgba(39, 174, 96, 0.1)',
        };
      }
    }
    return { label: 'Abonnement Expiré', color: THEME.COLORS.warning, bg: 'rgba(243, 156, 18, 0.1)' };
  };

  const renderUserItem = ({ item }) => {
    const badge = getSubscriptionBadge(item);
    return (
      <GlassCard style={styles.userCard}>
        <View style={styles.userInfoRow}>
          <View style={styles.userInfoLeft}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.name}
            </Text>
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
                Expire le : {new Date(item.subscription.expiresAt).toLocaleDateString('fr-FR')} à{' '}
                {new Date(item.subscription.expiresAt).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            )}
          </View>

          <View style={styles.actionsColumn}>
            <TouchableOpacity
              style={[styles.actionButton, styles.historyBtn]}
              onPress={() => setHistoryUser(item)}
            >
              <Ionicons name="receipt-outline" size={20} color={THEME.COLORS.pureWhite} />
              <Text style={styles.btnText}>Audit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, item.isBanned ? styles.activateBtn : styles.suspendBtn]}
              onPress={() => setBanUser(item)}
            >
              <Ionicons
                name={item.isBanned ? 'shield-checkmark-outline' : 'ban-outline'}
                size={20}
                color={THEME.COLORS.pureWhite}
              />
              <Text style={styles.btnText}>{item.isBanned ? 'Activer' : 'Bloquer'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestion Abonnements</Text>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={THEME.COLORS.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Nom, email ou téléphone..."
          placeholderTextColor={THEME.COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      {/* Filtres de rôle */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Rôle :</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {[
            { id: 'all', label: 'Tous' },
            { id: 'driver', label: 'Chauffeurs' },
            { id: 'seller', label: 'Vendeurs' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterTab, selectedRole === tab.id && styles.filterTabActive]}
              onPress={() => setSelectedRole(tab.id)}
            >
              <Text style={[styles.filterTabText, selectedRole === tab.id && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Filtres de statut */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Statut :</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {[
            { id: 'all', label: 'Tous' },
            { id: 'active', label: 'Actifs' },
            { id: 'expired', label: 'Expirés' },
            { id: 'banned', label: 'Suspendus' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterTab, selectedStatus === tab.id && styles.filterTabActive]}
              onPress={() => setSelectedStatus(tab.id)}
            >
              <Text style={[styles.filterTabText, selectedStatus === tab.id && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={24} color={THEME.COLORS.pureWhite} style={styles.errorIcon} />
          <View style={styles.errorTextContainer}>
            <Text style={styles.errorTitle}>Erreur réseau</Text>
            <Text style={styles.errorDetail}>Impossible de récupérer la liste des abonnements.</Text>
          </View>
        </View>
      )}

      {/* Liste des abonnements */}
      <GlobalSkeleton visible={isLoading} style={{ flex: 1 }}>
        {isLoading ? (
          <View style={styles.listContent}>
            {[1, 2, 3, 4].map((key) => (
              <GlassCard key={key} style={styles.userCard}>
                <View style={styles.userInfoRow}>
                  <View style={{ flex: 1 }}>
                    <SkeletonBone width={160} height={18} style={{ marginBottom: 6 }} />
                    <SkeletonBone width={110} height={14} style={{ marginBottom: 10 }} />
                    <View style={{ flexDirection: 'row' }}>
                      <SkeletonBone width={80} height={20} borderRadius={6} />
                      <SkeletonBone width={100} height={20} borderRadius={6} style={{ marginLeft: 8 }} />
                    </View>
                  </View>
                  <View style={{ width: 100, height: 70, justifyContent: 'space-between' }}>
                    <SkeletonBone width={100} height={32} borderRadius={8} />
                    <SkeletonBone width={100} height={32} borderRadius={8} />
                  </View>
                </View>
              </GlassCard>
            ))}
          </View>
        ) : (
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
                <Text style={styles.emptyText}>Aucun chauffeur ou vendeur trouvé.</Text>
              </View>
            }
          />
        )}
      </GlobalSkeleton>

      <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} />

      {/* Modale d'Historique */}
      <HistoryModal
        visible={!!historyUser}
        user={historyUser}
        transactions={historyData?.data || historyData || []}
        isLoading={isLoadingHistory}
        onClose={() => setHistoryUser(null)}
      />

      {/* Modale de suspension/bannissement */}
      <Modal
        visible={!!banUser}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBanUser(null)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {banUser?.isBanned ? 'Réactivation du compte' : 'Suspendre le compte'}
              </Text>
              <TouchableOpacity onPress={() => setBanUser(null)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={THEME.COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.banDescription}>
              {banUser?.isBanned
                ? `Voulez-vous réactiver le compte de ${banUser?.name} ? Il pourra soumettre des preuves de paiement ou reprendre ses activités.`
                : `Voulez-vous suspendre l'accès de ${banUser?.name} ? Il sera déconnecté et ne pourra plus faire de courses ni gérer sa boutique.`}
            </Text>

            {!banUser?.isBanned && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Motif de suspension :</Text>
                <TextInput
                  style={styles.banInput}
                  value={banReason}
                  onChangeText={setBanReason}
                  placeholder="Ex: Abonnement expiré non réglé..."
                  placeholderTextColor={THEME.COLORS.textTertiary}
                />
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setBanUser(null)}
                disabled={isTogglingBan}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  banUser?.isBanned ? styles.confirmActiveBtn : styles.confirmSuspendBtn,
                ]}
                onPress={handleToggleBanSubmit}
                disabled={isTogglingBan}
              >
                {isTogglingBan ? (
                  <ActivityIndicator size="small" color={THEME.COLORS.pureWhite} />
                ) : (
                  <Text style={styles.confirmBtnText}>
                    {banUser?.isBanned ? 'Réactiver' : 'Suspendre'}
                  </Text>
                )}
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: THEME.COLORS.primary },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.overlay,
    marginHorizontal: 20,
    borderRadius: THEME.BORDERS.radius.md,
    paddingHorizontal: 15,
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.border,
    marginBottom: 12,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: THEME.COLORS.textPrimary, paddingVertical: 12, fontSize: 16 },

  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterLabel: {
    color: THEME.COLORS.textSecondary,
    fontSize: 14,
    marginRight: 10,
    fontWeight: 'bold',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: THEME.BORDERS.radius.pill,
    backgroundColor: THEME.COLORS.overlay,
    marginRight: 8,
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.border,
  },
  filterTabActive: {
    backgroundColor: THEME.COLORS.primary,
    borderColor: THEME.COLORS.primary,
  },
  filterTabText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 12,
  },
  filterTabTextActive: {
    color: THEME.COLORS.textInverse,
    fontWeight: 'bold',
  },

  listContent: { paddingHorizontal: 20, paddingBottom: 80 },
  glassContainer: {
    overflow: 'hidden',
    borderRadius: THEME.BORDERS.radius.lg,
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.border,
    backgroundColor: THEME.COLORS.overlay,
    marginBottom: 12,
  },
  glassContent: { padding: 16 },
  userCard: {},

  userInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userInfoLeft: { flex: 1, paddingRight: 15 },
  userName: { color: THEME.COLORS.textPrimary, fontSize: 16, fontWeight: 'bold' },
  userPhone: { color: THEME.COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  badgeRow: { flexDirection: 'row', marginTop: 8, alignItems: 'center' },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleText: { color: THEME.COLORS.primary, fontSize: 9, fontWeight: 'bold' },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: { fontSize: 9, fontWeight: 'bold' },
  expiryText: { color: THEME.COLORS.textTertiary, fontSize: 11, marginTop: 8 },

  actionsColumn: { width: 100, justifyContent: 'space-between', height: 74 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnText: { color: THEME.COLORS.pureWhite, fontSize: 11, fontWeight: 'bold', marginLeft: 4 },
  historyBtn: { backgroundColor: THEME.COLORS.info },
  suspendBtn: { backgroundColor: THEME.COLORS.danger },
  activateBtn: { backgroundColor: THEME.COLORS.success },

  errorBanner: {
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.danger,
    padding: 15,
    marginHorizontal: 20,
    borderRadius: THEME.BORDERS.radius.md,
    marginBottom: 15,
    alignItems: 'center',
  },
  errorIcon: { marginRight: 15 },
  errorTextContainer: { flex: 1 },
  errorTitle: { color: THEME.COLORS.pureWhite, fontWeight: 'bold', fontSize: 15 },
  errorDetail: { color: THEME.COLORS.pureWhite, fontSize: 12, marginTop: 2 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: {
    color: THEME.COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
    paddingHorizontal: 40,
  },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: THEME.COLORS.glassModal,
    borderRadius: THEME.BORDERS.radius.xl,
    borderWidth: THEME.BORDERS.width.normal,
    borderColor: THEME.COLORS.border,
    padding: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  closeButton: { padding: 4 },

  loaderContainer: { alignItems: 'center', paddingVertical: 40 },
  loaderText: { color: THEME.COLORS.textSecondary, marginTop: 10 },
  modalList: { paddingBottom: 20 },

  historyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.border,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyPlan: { color: THEME.COLORS.textPrimary, fontSize: 12, fontWeight: 'bold' },
  historyAmount: { color: THEME.COLORS.primary, fontSize: 13, fontWeight: 'bold' },
  historyDate: { color: THEME.COLORS.textSecondary, fontSize: 11 },
  historyAdmin: { color: THEME.COLORS.textTertiary, fontSize: 10, marginTop: 4 },
  historyReason: { color: THEME.COLORS.danger, fontSize: 11, marginTop: 4, fontStyle: 'italic' },

  banDescription: {
    color: THEME.COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  inputContainer: { marginBottom: 20 },
  inputLabel: {
    color: THEME.COLORS.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  banInput: {
    height: 48,
    backgroundColor: THEME.COLORS.overlay,
    borderRadius: 8,
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.border,
    paddingHorizontal: 12,
    color: THEME.COLORS.textPrimary,
    fontSize: 14,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: THEME.COLORS.border,
    marginRight: 10,
  },
  cancelBtnText: { color: THEME.COLORS.textPrimary, fontWeight: 'bold' },
  confirmSuspendBtn: { backgroundColor: THEME.COLORS.danger },
  confirmActiveBtn: { backgroundColor: THEME.COLORS.success },
  confirmBtnText: { color: THEME.COLORS.pureWhite, fontWeight: 'bold' },
});

export default SubscriptionManagement;
