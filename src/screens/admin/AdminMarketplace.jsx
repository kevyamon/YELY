// src/screens/admin/AdminMarketplace.jsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { showToast, showErrorToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';
import {
  useGetMarketplaceStatsQuery,
  useGetMarketplaceOrdersQuery,
  useOverrideMarketplaceOrderMutation,
  useGetMarketplaceLedgersQuery,
  useForceClearLedgerMutation
} from '../../store/api/adminApiSlice';

const GlassCard = ({ children, style }) => (
  <View style={[styles.glassContainer, style]}>
    <BlurView intensity={45} tint="default" style={StyleSheet.absoluteFill} />
    <View style={styles.glassContent}>{children}</View>
  </View>
);

const AdminMarketplace = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const isSuperAdmin = user?.role === 'superadmin';

  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'ledgers', 'stats'
  const [showScrollTop, setShowScrollTop] = useState(false);

  // States de recherche et pagination
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersStatusFilter, setOrdersStatusFilter] = useState('');
  const [ordersPage, setOrdersPage] = useState(1);

  const [ledgersSearch, setLedgersSearch] = useState('');
  const [ledgersStatusFilter, setLedgersStatusFilter] = useState('');
  const [ledgersPage, setLedgersPage] = useState(1);

  // Modals et Mutation
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [overrideModalVisible, setOverrideModalVisible] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState('');
  const [overrideDriverId, setOverrideDriverId] = useState('');
  const [cancelAssociatedRide, setCancelAssociatedRide] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const [selectedLedger, setSelectedLedger] = useState(null);
  const [clearLedgerModalVisible, setClearLedgerModalVisible] = useState(false);
  const [clearReason, setClearReason] = useState('');

  // Refs de listes pour ScrollToTop
  const ordersListRef = useRef(null);
  const ledgersListRef = useRef(null);
  const statsScrollRef = useRef(null);

  // API Hooks
  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
    isFetching: statsFetching
  } = useGetMarketplaceStatsQuery(undefined, { pollingInterval: 12000 });

  const {
    data: ordersData,
    isLoading: ordersLoading,
    refetch: refetchOrders,
    isFetching: ordersFetching
  } = useGetMarketplaceOrdersQuery({
    page: ordersPage,
    status: ordersStatusFilter,
    search: ordersSearch
  }, { pollingInterval: 8000 });

  const {
    data: ledgersData,
    isLoading: ledgersLoading,
    refetch: refetchLedgers,
    isFetching: ledgersFetching
  } = useGetMarketplaceLedgersQuery({
    page: ledgersPage,
    status: ledgersStatusFilter,
    search: ledgersSearch
  }, { pollingInterval: 8000 });

  const [overrideOrder, { isLoading: isOverriding }] = useOverrideMarketplaceOrderMutation();
  const [forceClearLedger, { isLoading: isClearingLedger }] = useForceClearLedgerMutation();

  const stats = statsData?.data || { totalSales: 0, pendingOrdersCount: 0, activeDeliveriesCount: 0, totalLedgerDebt: 0 };
  const orders = ordersData?.data?.orders || [];
  const ledgers = ledgersData?.data?.ledgers || [];

  const handleScroll = (event) => {
    setShowScrollTop(event.nativeEvent.contentOffset.y > 100);
  };

  const scrollToTop = () => {
    if (activeTab === 'orders') {
      ordersListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } else if (activeTab === 'ledgers') {
      ledgersListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } else {
      statsScrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  // Soumission de l'override de commande
  const handleApplyOverride = async () => {
    if (!selectedOrder) return;
    try {
      await overrideOrder({
        orderId: selectedOrder._id,
        status: overrideStatus || undefined,
        driverId: overrideDriverId !== undefined ? overrideDriverId : undefined,
        cancelRide: cancelAssociatedRide,
        reason: overrideReason || 'Intervention administrative'
      }).unwrap();

      dispatch(showToast({
        type: 'success',
        title: 'Override Réussi 🎯',
        message: `La commande #${selectedOrder._id.toString().slice(-6)} a été mise à jour.`
      }));

      setOverrideModalVisible(false);
      setSelectedOrder(null);
      setOverrideStatus('');
      setOverrideDriverId('');
      setCancelAssociatedRide(false);
      setOverrideReason('');
    } catch (err) {
      dispatch(showErrorToast({
        message: err?.data?.message || 'Erreur lors de la mise à jour de la commande.'
      }));
    }
  };

  // Soumission de la réconciliation forcée
  const handleApplyForceClear = async () => {
    if (!selectedLedger) return;
    try {
      await forceClearLedger({
        ledgerId: selectedLedger._id,
        reason: clearReason || 'Réconciliation unilatérale SuperAdmin'
      }).unwrap();

      dispatch(showToast({
        type: 'success',
        title: 'Reconciliation Validée 💰',
        message: `L'ardoise de ${selectedLedger.amount} FCFA a été soldée de force.`
      }));

      setClearLedgerModalVisible(false);
      setSelectedLedger(null);
      setClearReason('');
    } catch (err) {
      dispatch(showErrorToast({
        message: err?.data?.message || "Erreur lors de la réconciliation de l'ardoise."
      }));
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'delivered': return THEME.COLORS.success;
      case 'cancelled':
      case 'cancelled_no_driver': return THEME.COLORS.danger;
      case 'picked_up': return THEME.COLORS.primary;
      case 'searching':
      case 'searching_delivery_retry': return THEME.COLORS.info;
      case 'pending': return THEME.COLORS.warning;
      default: return THEME.COLORS.textSecondary;
    }
  };

  const getOrderStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'En Attente';
      case 'confirmed': return 'Confirmé';
      case 'searching': return 'Recherche Livreur';
      case 'searching_delivery_retry': return 'Relance en cours';
      case 'picked_up': return 'En Livraison';
      case 'delivered': return 'Livré';
      case 'cancelled': return 'Annulé';
      case 'cancelled_no_driver': return 'Pas de livreur';
      default: return status?.toUpperCase() || 'INCONNU';
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Gouvernance Marketplace</Text>
          <Text style={styles.headerSubtitle}>Surveillance et résolution de conflits Yély</Text>
        </View>
      </View>

      {/* TABS CONTROLLER */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => { setActiveTab('orders'); setOrdersPage(1); }}
        >
          <Ionicons name="basket-outline" size={18} color={activeTab === 'orders' ? THEME.COLORS.primary : THEME.COLORS.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>Commandes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'ledgers' && styles.activeTab]}
          onPress={() => { setActiveTab('ledgers'); setLedgersPage(1); }}
        >
          <Ionicons name="cash-outline" size={18} color={activeTab === 'ledgers' ? THEME.COLORS.primary : THEME.COLORS.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'ledgers' && styles.activeTabText]}>Ardoises Cash</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Ionicons name="pie-chart-outline" size={18} color={activeTab === 'stats' ? THEME.COLORS.primary : THEME.COLORS.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>Indicateurs</Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: COMMANDES */}
      {activeTab === 'orders' && (
        <View style={styles.tabContent}>
          {/* SEARCH BAR & STATUS FILTERS */}
          <View style={styles.filterSection}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color={THEME.COLORS.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher client, vendeur, ID..."
                placeholderTextColor={THEME.COLORS.textSecondary}
                value={ordersSearch}
                onChangeText={(txt) => { setOrdersSearch(txt); setOrdersPage(1); }}
              />
              {ordersSearch.length > 0 && (
                <TouchableOpacity onPress={() => setOrdersSearch('')}>
                  <Ionicons name="close-circle" size={18} color={THEME.COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusFiltersScroll}>
              <TouchableOpacity
                style={[styles.filterBadge, ordersStatusFilter === '' && styles.activeFilterBadge]}
                onPress={() => { setOrdersStatusFilter(''); setOrdersPage(1); }}
              >
                <Text style={[styles.filterBadgeText, ordersStatusFilter === '' && styles.activeFilterBadgeText]}>Tout</Text>
              </TouchableOpacity>
              {['pending', 'searching', 'searching_delivery_retry', 'picked_up', 'delivered', 'cancelled', 'cancelled_no_driver'].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.filterBadge, ordersStatusFilter === st && styles.activeFilterBadge]}
                  onPress={() => { setOrdersStatusFilter(st); setOrdersPage(1); }}
                >
                  <Text style={[styles.filterBadgeText, ordersStatusFilter === st && styles.activeFilterBadgeText]}>{getOrderStatusLabel(st)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* LIST */}
          <FlatList
            ref={ordersListRef}
            data={orders}
            keyExtractor={(item) => item._id.toString()}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl refreshing={ordersLoading || ordersFetching} onRefresh={refetchOrders} tintColor={THEME.COLORS.primary} />
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.orderCard}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedOrder(item);
                  setOverrideStatus(item.status);
                  setOverrideDriverId(item.driver?._id || '');
                  setOverrideModalVisible(true);
                }}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.orderId}>#{item._id.toString().slice(-6).toUpperCase()}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getOrderStatusColor(item.status) + '15' }]}>
                    <Text style={[styles.statusText, { color: getOrderStatusColor(item.status) }]}>
                      {getOrderStatusLabel(item.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.actorsContainer}>
                  <View style={styles.actorRow}>
                    <Ionicons name="person-outline" size={14} color={THEME.COLORS.textSecondary} />
                    <Text style={styles.actorLabel}>Acheteur :</Text>
                    <Text style={styles.actorValue} numberOfLines={1}>{item.customer?.name || 'Inconnu'}</Text>
                  </View>
                  <View style={styles.actorRow}>
                    <Ionicons name="storefront-outline" size={14} color={THEME.COLORS.textSecondary} />
                    <Text style={styles.actorLabel}>Vendeur :</Text>
                    <Text style={styles.actorValue} numberOfLines={1}>{item.seller?.name || 'Boutique Yély'}</Text>
                  </View>
                  <View style={styles.actorRow}>
                    <Ionicons name="bicycle-outline" size={14} color={THEME.COLORS.textSecondary} />
                    <Text style={styles.actorLabel}>Livreur :</Text>
                    <Text style={styles.actorValue} numberOfLines={1}>{item.driver?.name || 'Aucun assigné'}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>
                  <Text style={styles.priceText}>{item.itemsPrice + (item.deliveryPrice || 0)} FCFA</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              !ordersLoading && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="basket-outline" size={60} color={THEME.COLORS.textSecondary} />
                  <Text style={styles.emptyText}>Aucune commande trouvée.</Text>
                </View>
              )
            }
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}

      {/* TAB 2: ARDOISES CASH */}
      {activeTab === 'ledgers' && (
        <View style={styles.tabContent}>
          {/* SEARCH BAR & FILTERS */}
          <View style={styles.filterSection}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color={THEME.COLORS.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher livreur ou vendeur..."
                placeholderTextColor={THEME.COLORS.textSecondary}
                value={ledgersSearch}
                onChangeText={(txt) => { setLedgersSearch(txt); setLedgersPage(1); }}
              />
              {ledgersSearch.length > 0 && (
                <TouchableOpacity onPress={() => setLedgersSearch('')}>
                  <Ionicons name="close-circle" size={18} color={THEME.COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.simpleFilterContainer}>
              <TouchableOpacity
                style={[styles.filterBadge, ledgersStatusFilter === '' && styles.activeFilterBadge]}
                onPress={() => { setLedgersStatusFilter(''); setLedgersPage(1); }}
              >
                <Text style={[styles.filterBadgeText, ledgersStatusFilter === '' && styles.activeFilterBadgeText]}>Toutes les dettes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterBadge, ledgersStatusFilter === 'pending' && styles.activeFilterBadge]}
                onPress={() => { setLedgersStatusFilter('pending'); setLedgersPage(1); }}
              >
                <Text style={[styles.filterBadgeText, ledgersStatusFilter === 'pending' && styles.activeFilterBadgeText]}>Dettes Actives</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterBadge, ledgersStatusFilter === 'cleared' && styles.activeFilterBadge]}
                onPress={() => { setLedgersStatusFilter('cleared'); setLedgersPage(1); }}
              >
                <Text style={[styles.filterBadgeText, ledgersStatusFilter === 'cleared' && styles.activeFilterBadgeText]}>Soldées</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* LIST */}
          <FlatList
            ref={ledgersListRef}
            data={ledgers}
            keyExtractor={(item) => item._id.toString()}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl refreshing={ledgersLoading || ledgersFetching} onRefresh={refetchLedgers} tintColor={THEME.COLORS.primary} />
            }
            renderItem={({ item }) => (
              <View style={styles.ledgerCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.ledgerDebtInfo}>
                    <Text style={styles.ledgerLivreurTitle}>Livreur débiteur</Text>
                    <Text style={styles.ledgerLivreur}>{item.driver?.name || 'Inconnu'}</Text>
                    <Text style={styles.ledgerLivreurPhone}>{item.driver?.phone || ''}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: item.status === 'cleared' ? THEME.COLORS.success + '15' : THEME.COLORS.danger + '15' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'cleared' ? THEME.COLORS.success : THEME.COLORS.danger }]}>
                      {item.status === 'cleared' ? 'SOLDÉ' : 'À PAYER'}
                    </Text>
                  </View>
                </View>

                <View style={styles.actorsContainer}>
                  <View style={styles.actorRow}>
                    <Ionicons name="storefront-outline" size={14} color={THEME.COLORS.textSecondary} />
                    <Text style={styles.actorLabel}>Créancier Vendeur :</Text>
                    <Text style={styles.actorValue} numberOfLines={1}>{item.seller?.name || 'Boutique'}</Text>
                  </View>
                  <View style={styles.actorRow}>
                    <Ionicons name="newspaper-outline" size={14} color={THEME.COLORS.textSecondary} />
                    <Text style={styles.actorLabel}>Commande Réf :</Text>
                    <Text style={styles.actorValue}>#{item.order?._id?.toString().slice(-6).toUpperCase() || 'N/A'}</Text>
                  </View>
                  {item.clearedAt && (
                    <View style={styles.actorRow}>
                      <Ionicons name="checkmark-done-circle-outline" size={14} color={THEME.COLORS.success} />
                      <Text style={styles.actorLabel}>Soldée le :</Text>
                      <Text style={[styles.actorValue, { color: THEME.COLORS.success }]}>{new Date(item.clearedAt).toLocaleString('fr-FR')}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.ledgerFooter}>
                  <Text style={styles.ledgerAmount}>{item.amount} FCFA</Text>
                  {item.status === 'pending' && isSuperAdmin && (
                    <TouchableOpacity
                      style={styles.forceClearButton}
                      onPress={() => {
                        setSelectedLedger(item);
                        setClearLedgerModalVisible(true);
                      }}
                    >
                      <Ionicons name="shield-checkmark" size={16} color={THEME.COLORS.pureWhite} />
                      <Text style={styles.forceClearButtonText}>Solder Forcé</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
            ListEmptyComponent={
              !ledgersLoading && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="cash-outline" size={60} color={THEME.COLORS.textSecondary} />
                  <Text style={styles.emptyText}>Aucune ardoise cash à réconcilier.</Text>
                </View>
              )
            }
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}

      {/* TAB 3: STATS/INDICATEURS */}
      {activeTab === 'stats' && (
        <ScrollView
          ref={statsScrollRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.statsScrollContent}
          refreshControl={
            <RefreshControl refreshing={statsLoading || statsFetching} onRefresh={refetchStats} tintColor={THEME.COLORS.primary} />
          }
        >
          <Text style={styles.sectionTitle}>Performance Financière</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statWrapper}>
              <GlassCard>
                <Ionicons name="cash-outline" size={28} color={THEME.COLORS.success} />
                <Text style={styles.statLabel}>Chiffre d'Affaires</Text>
                <Text style={styles.statValue}>{stats.totalSales} FCFA</Text>
                <Text style={styles.statSubText}>Cumul des commandes</Text>
              </GlassCard>
            </View>

            <View style={styles.statWrapper}>
              <GlassCard>
                <Ionicons name="wallet-outline" size={28} color={THEME.COLORS.danger} />
                <Text style={styles.statLabel}>Encours Cash Livreur</Text>
                <Text style={styles.statValue}>{stats.totalLedgerDebt} FCFA</Text>
                <Text style={styles.statSubText}>Dettes en attente</Text>
              </GlassCard>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Flux opérationnel</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statWrapper}>
              <GlassCard>
                <Ionicons name="time-outline" size={28} color={THEME.COLORS.warning} />
                <Text style={styles.statLabel}>Commandes en Attente</Text>
                <Text style={[styles.statValue, { color: THEME.COLORS.warning }]}>{stats.pendingOrdersCount}</Text>
                <Text style={styles.statSubText}>Non validées vendeurs</Text>
              </GlassCard>
            </View>

            <View style={styles.statWrapper}>
              <GlassCard>
                <Ionicons name="bicycle-outline" size={28} color={THEME.COLORS.primary} />
                <Text style={styles.statLabel}>Dispatches Actifs</Text>
                <Text style={[styles.statValue, { color: THEME.COLORS.primary }]}>{stats.activeDeliveriesCount}</Text>
                <Text style={styles.statSubText}>En cours de livraison</Text>
              </GlassCard>
            </View>
          </View>
        </ScrollView>
      )}

      {/* MODAL 1: OVERRIDE DE COMMANDE */}
      <Modal visible={overrideModalVisible} animationType="slide" transparent={true} onRequestClose={() => setOverrideModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={90} style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Override de Commande</Text>
              <TouchableOpacity onPress={() => setOverrideModalVisible(false)}>
                <Ionicons name="close" size={24} color={THEME.COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalDetailText}>
                  Commande ID : <Text style={{ fontWeight: 'bold' }}>{selectedOrder._id}</Text>
                </Text>
                <Text style={styles.modalDetailText}>
                  Acheteur : <Text style={{ fontWeight: 'bold' }}>{selectedOrder.customer?.name}</Text>
                </Text>

                {/* FORCER LE STATUT */}
                <Text style={styles.modalSectionTitle}>Forcer le Statut</Text>
                <View style={styles.statusOptions}>
                  {['pending', 'confirmed', 'searching', 'searching_delivery_retry', 'picked_up', 'delivered', 'cancelled', 'cancelled_no_driver'].map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.statusOption, overrideStatus === st && styles.activeStatusOption]}
                      onPress={() => setOverrideStatus(st)}
                    >
                      <Text style={[styles.statusOptionText, overrideStatus === st && styles.activeStatusOptionText]}>
                        {getOrderStatusLabel(st)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* RÉATTRIBUTION LIVREUR */}
                <Text style={styles.modalSectionTitle}>Réattribution Livreur ID (Optionnel)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="ID en base de données du livreur (vide pour dissocier)"
                  placeholderTextColor={THEME.COLORS.textSecondary}
                  value={overrideDriverId}
                  onChangeText={setOverrideDriverId}
                />

                {/* ANNULER LA COURSE ASSOCIÉE */}
                {selectedOrder.deliveryRideId && (
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    activeOpacity={0.8}
                    onPress={() => setCancelAssociatedRide(!cancelAssociatedRide)}
                  >
                    <Ionicons
                      name={cancelAssociatedRide ? 'checkbox-outline' : 'square-outline'}
                      size={24}
                      color={THEME.COLORS.primary}
                    />
                    <Text style={styles.checkboxLabel}>Annuler la recherche de course associée (Ride ID : {selectedOrder.deliveryRideId})</Text>
                  </TouchableOpacity>
                )}

                {/* MOTIF DE L'OVERRIDE */}
                <Text style={styles.modalSectionTitle}>Motif de l'override (Écrit dans le journal d'audit)</Text>
                <TextInput
                  style={[styles.modalInput, { height: 60, textAlignVertical: 'top' }]}
                  placeholder="Motif justifiant l'override administratif obligatoire..."
                  placeholderTextColor={THEME.COLORS.textSecondary}
                  value={overrideReason}
                  onChangeText={setOverrideReason}
                  multiline={true}
                />

                <TouchableOpacity
                  style={[styles.submitButton, isOverriding && styles.disabledButton]}
                  onPress={handleApplyOverride}
                  disabled={isOverriding}
                >
                  {isOverriding ? (
                    <ActivityIndicator size="small" color={THEME.COLORS.pureWhite} />
                  ) : (
                    <>
                      <Ionicons name="shield-half-outline" size={20} color={THEME.COLORS.pureWhite} />
                      <Text style={styles.submitButtonText}>Appliquer l'intervention</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL 2: RECONCILIATION FORCEE LEDGER (SUPERADMIN EXCLUSIF) */}
      <ConfirmModal
        visible={clearLedgerModalVisible}
        onClose={() => setClearLedgerModalVisible(false)}
        onConfirm={handleApplyForceClear}
        title="Override Financier Absolu"
        message={selectedLedger ? `ATTENTION ! Vous allez forcer unilatéralement la réconciliation de la dette de ${selectedLedger.amount} FCFA due par le livreur ${selectedLedger.driver?.name} au vendeur ${selectedLedger.seller?.name}. Le livreur verra sa dette globale instantanément déduite. Continuer ?` : ''}
        confirmText="Oui, Solder la Dette"
        isDestructive={true}
      />

      {/* SCROLL TO TOP */}
      <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15, padding: 5 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: THEME.COLORS.primary },
  headerSubtitle: { fontSize: 13, color: THEME.COLORS.textSecondary, marginTop: 2 },

  tabsContainer: { flexDirection: 'row', backgroundColor: THEME.COLORS.overlay, borderBottomWidth: 1, borderBottomColor: THEME.COLORS.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: THEME.COLORS.primary },
  tabText: { color: THEME.COLORS.textSecondary, fontSize: 13, fontWeight: '600', marginLeft: 6 },
  activeTabText: { color: THEME.COLORS.primary },

  tabContent: { flex: 1 },
  filterSection: { padding: 15, backgroundColor: THEME.COLORS.overlay, borderBottomWidth: 1, borderBottomColor: THEME.COLORS.border },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: THEME.COLORS.border },
  searchInput: { flex: 1, color: THEME.COLORS.textPrimary, fontSize: 14, marginLeft: 8, padding: 0 },
  statusFiltersScroll: { marginTop: 10, paddingBottom: 5 },
  simpleFilterContainer: { flexDirection: 'row', marginTop: 10 },
  filterBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8 },
  activeFilterBadge: { backgroundColor: THEME.COLORS.primary + '20', borderWidth: 1, borderColor: THEME.COLORS.primary },
  filterBadgeText: { color: THEME.COLORS.textSecondary, fontSize: 12, fontWeight: '500' },
  activeFilterBadgeText: { color: THEME.COLORS.primary, fontWeight: 'bold' },

  listContent: { padding: 15, paddingBottom: 100 },
  orderCard: { backgroundColor: THEME.COLORS.overlay, borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: THEME.COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: THEME.COLORS.border },
  orderId: { fontSize: 15, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: 'bold' },

  actorsContainer: { marginBottom: 12 },
  actorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  actorLabel: { color: THEME.COLORS.textSecondary, fontSize: 12, marginLeft: 6, width: 100 },
  actorValue: { color: THEME.COLORS.textPrimary, fontSize: 13, fontWeight: '500', flex: 1 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: THEME.COLORS.border, paddingTop: 10 },
  dateText: { color: THEME.COLORS.textSecondary, fontSize: 12 },
  priceText: { color: THEME.COLORS.primary, fontSize: 16, fontWeight: 'bold' },

  ledgerCard: { backgroundColor: THEME.COLORS.overlay, borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: THEME.COLORS.border },
  ledgerDebtInfo: { flex: 1 },
  ledgerLivreurTitle: { fontSize: 11, color: THEME.COLORS.textSecondary, textTransform: 'uppercase' },
  ledgerLivreur: { fontSize: 15, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  ledgerLivreurPhone: { fontSize: 12, color: THEME.COLORS.textSecondary },

  ledgerFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: THEME.COLORS.border, paddingTop: 10, marginTop: 5 },
  ledgerAmount: { color: THEME.COLORS.danger, fontSize: 18, fontWeight: 'bold' },
  forceClearButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.COLORS.success, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  forceClearButtonText: { color: THEME.COLORS.pureWhite, fontSize: 12, fontWeight: 'bold', marginLeft: 5 },

  statsScrollContent: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: THEME.COLORS.textPrimary, marginTop: 15, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  statWrapper: { width: '48%', marginBottom: 15 },
  glassContainer: { overflow: 'hidden', borderRadius: 16, borderWidth: 1, borderColor: THEME.COLORS.border, backgroundColor: THEME.COLORS.overlay },
  glassContent: { padding: 15, alignItems: 'center' },
  statLabel: { color: THEME.COLORS.textSecondary, fontSize: 12, marginTop: 8, textAlign: 'center' },
  statValue: { color: THEME.COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginTop: 4, textAlign: 'center' },
  statSubText: { color: THEME.COLORS.textSecondary, fontSize: 10, marginTop: 2, textAlign: 'center' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: THEME.COLORS.textSecondary, fontSize: 15, marginTop: 12 },

  // MODALS
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: THEME.COLORS.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingVertical: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.COLORS.primary },
  modalBody: { marginBottom: 20 },
  modalDetailText: { fontSize: 14, color: THEME.COLORS.textPrimary, marginBottom: 8 },
  modalSectionTitle: { fontSize: 14, fontWeight: 'bold', color: THEME.COLORS.textPrimary, marginTop: 15, marginBottom: 8 },
  statusOptions: { flexDirection: 'row', flexWrap: 'wrap' },
  statusOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  activeStatusOption: { backgroundColor: THEME.COLORS.primary + '20', borderColor: THEME.COLORS.primary },
  statusOptionText: { fontSize: 12, color: THEME.COLORS.textSecondary },
  activeStatusOptionText: { color: THEME.COLORS.primary, fontWeight: 'bold' },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: THEME.COLORS.textPrimary, fontSize: 13, borderWidth: 1, borderColor: THEME.COLORS.border, marginBottom: 15 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  checkboxLabel: { color: THEME.COLORS.textSecondary, fontSize: 12, marginLeft: 10, flex: 1 },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.COLORS.primary, paddingVertical: 12, borderRadius: 10, marginTop: 15 },
  submitButtonText: { color: THEME.COLORS.pureWhite, fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  disabledButton: { opacity: 0.6 }
});

export default AdminMarketplace;
