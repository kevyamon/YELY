// src/screens/seller/SellerOrders.jsx
// MODULE VENDEUR - Commandes Reçues Refondues (Visuel Premium, Archivage & Pas d'Émojis)
// CSCSM Level: Bank Grade

import React, { useEffect, useState, useRef } from 'react';
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Image,
  useColorScheme
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  useGetSellerOrdersQuery, 
  useUpdateOrderStatusMutation 
} from '../../store/api/marketplaceApiSlice';
import { showToast } from '../../store/slices/uiSlice';
import socketService from '../../services/socketService';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import GlassCard from '../../components/ui/GlassCard';
import GlobalSkeleton, { SkeletonBone } from '../../components/ui/GlobalSkeleton';
import THEME from '../../theme/theme';
import GoldButton from '../../components/ui/GoldButton';
import MarketplaceDetailsHeader from '../../components/marketplace/MarketplaceDetailsHeader';

const STATUS_CONFIG = {
  'pending': { label: 'Nouvelle', color: THEME.COLORS.warning, action: 'Confirmer', next: 'confirmed' },
  'confirmed': { label: 'En préparation', color: THEME.COLORS.success, action: 'Prêt pour livraison', next: 'searching' },
  'searching': { label: 'Recherche livreur', color: THEME.COLORS.info, action: null },
  'searching_delivery_retry': { label: 'Relance recherche...', color: THEME.COLORS.info, action: 'Relancer la recherche', next: 'confirmed' },
  'picked_up': { label: 'En route', color: THEME.COLORS.primary, action: null },
  'delivered': { label: 'Livrée', color: THEME.COLORS.success, action: null },
  'cancelled': { label: 'Annulée', color: THEME.COLORS.danger, action: null },
  'cancelled_no_driver': { label: 'Annulée (Pas de livreur)', color: THEME.COLORS.danger, action: 'Relancer la recherche', next: 'confirmed' },
  'rejected': { label: 'Refusée', color: THEME.COLORS.warning, action: null }
};

const SellerOrders = ({ navigation }) => {
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { data: ordersData, isLoading, refetch, isFetching, error } = useGetSellerOrdersQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();
  const orders = ordersData?.data || [];

  const [archivedOrderIds, setArchivedOrderIds] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'archived'

  const [showScrollTop, setShowScrollTop] = useState(false);
  const listRef = useRef(null);

  const handleScroll = (event) => {
    setShowScrollTop(event.nativeEvent.contentOffset.y > 150);
  };

  const scrollToTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // Chargement des commandes archivées persistées localement
  useEffect(() => {
    const loadArchivedOrders = async () => {
      try {
        const value = await AsyncStorage.getItem('yely_archived_seller_orders');
        if (value) {
          setArchivedOrderIds(JSON.parse(value));
        }
      } catch (err) {
        console.warn('[SELLER ORDERS] Failed to load archived orders:', err);
      }
    };
    loadArchivedOrders();
  }, []);

  const handleArchiveOrder = async (orderId) => {
    try {
      const updated = [...archivedOrderIds, orderId];
      setArchivedOrderIds(updated);
      await AsyncStorage.setItem('yely_archived_seller_orders', JSON.stringify(updated));
      dispatch(showToast({
        type: 'success',
        title: 'Commande archivée',
        message: 'La commande a été déplacée vers les archives.'
      }));
    } catch (err) {
      console.warn('[SELLER ORDERS] Failed to archive order:', err);
    }
  };

  const handleUnarchiveOrder = async (orderId) => {
    try {
      const updated = archivedOrderIds.filter(id => id !== orderId);
      setArchivedOrderIds(updated);
      await AsyncStorage.setItem('yely_archived_seller_orders', JSON.stringify(updated));
      dispatch(showToast({
        type: 'success',
        title: 'Commande restaurée',
        message: 'La commande est de retour dans vos commandes actives.'
      }));
    } catch (err) {
      console.warn('[SELLER ORDERS] Failed to unarchive order:', err);
    }
  };

  useEffect(() => {
    if (ordersData) console.log("[DEBUG SELLER ORDERS] Data:", ordersData);
    if (error) console.error("[DEBUG SELLER ORDERS] Error:", error);
  }, [ordersData, error]);

  useEffect(() => {
    refetch();
  }, []);

  // TEMPS RÉEL: On utilise le socket service existant
  useEffect(() => {
    const handleNewOrder = () => refetch();
    const handleOrderUpdate = () => refetch();

    socketService.on('new_order', handleNewOrder);
    socketService.on('order_updated', handleOrderUpdate);

    return () => {
      socketService.off('new_order', handleNewOrder);
      socketService.off('order_updated', handleOrderUpdate);
    };
  }, [refetch]);

  const handleUpdate = async (id, status) => {
    try {
      await updateStatus({ id, status }).unwrap();
      dispatch(showToast({
        type: 'success',
        title: 'Statut mis à jour',
        message: 'La commande a été mise à jour avec succès.'
      }));
    } catch (error) {
      console.error(error);
      dispatch(showToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de changer le statut de la commande.'
      }));
    }
  };

  const filteredOrders = orders.filter(item => {
    const isArchived = archivedOrderIds.includes(item._id);
    return activeTab === 'archived' ? isArchived : !isArchived;
  });

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.skeletonCard}>
          <SkeletonBone width="40%" height={20} borderRadius={10} />
          <SkeletonBone width="100%" height={100} borderRadius={15} style={{ marginTop: 15 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }}>
            <SkeletonBone width="30%" height={40} borderRadius={20} />
            <SkeletonBone width="30%" height={40} borderRadius={20} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderOrderItem = ({ item }) => {
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    
    return (
      <GlassCard style={styles.orderCard}>
        {/* En-tête de Carte : Statut & Date & Archivage */}
        <View style={styles.orderHeader}>
          <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: config.color }]} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label.toUpperCase()}</Text>
          </View>
          <View style={styles.dateContainer}>
            <Text style={styles.orderDate}>
              {new Date(item.createdAt).toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: 'short', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            <TouchableOpacity 
              onPress={() => activeTab === 'active' ? handleArchiveOrder(item._id) : handleUnarchiveOrder(item._id)} 
              style={styles.archiveBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name={activeTab === 'active' ? "archive-outline" : "arrow-undo-outline"} 
                size={18} 
                color={activeTab === 'active' ? THEME.COLORS.textTertiary : THEME.COLORS.primary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Client & Adresse (Aucun émoji textuel !) */}
        <View style={styles.customerBox}>
          <View style={styles.customerAvatar}>
            <Text style={styles.avatarText}>{(item.customer?.name || 'C').charAt(0)}</Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{item.customer?.name || 'Client Inconnu'}</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location-sharp" size={14} color={THEME.COLORS.primary} style={styles.addressIcon} />
              <Text style={styles.address} numberOfLines={1}>{item.shippingAddress?.address}</Text>
            </View>
          </View>
        </View>

        {/* Fiches Produits Visuelles */}
        <View style={styles.itemsList}>
          {item.items.map((prod, idx) => {
            const productImages = prod.product?.images || [];
            const hasImage = productImages.length > 0;
            return (
              <View key={idx} style={styles.itemRow}>
                {hasImage ? (
                  <Image source={{ uri: productImages[0] }} style={styles.productThumbnail} />
                ) : (
                  <View style={styles.thumbnailPlaceholder}>
                    <MaterialCommunityIcons name="image-outline" size={20} color={THEME.COLORS.textTertiary} />
                  </View>
                )}
                <View style={styles.productDetails}>
                  <Text style={styles.itemName} numberOfLines={1}>{prod.name}</Text>
                  <Text style={styles.itemUnitPrice}>{prod.price.toLocaleString()} FCFA / u</Text>
                </View>
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyText}>x{prod.quantity}</Text>
                </View>
                <Text style={styles.itemTotalPrice}>{(prod.price * prod.quantity).toLocaleString()} FCFA</Text>
              </View>
            );
          })}
        </View>

        {/* Répartition Financière Complète */}
        <View style={styles.financialSection}>
          <View style={styles.financialRow}>
            <Text style={styles.financialLabel}>Sous-total articles</Text>
            <Text style={styles.financialValue}>{(item.itemsPrice || (item.totalPrice - item.deliveryPrice)).toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={styles.financialLabel}>Frais de livraison (Livreur)</Text>
            <Text style={styles.financialValue}>+ {(item.deliveryPrice || 0).toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.financialDivider} />
          <View style={styles.financialRowTotal}>
            <Text style={styles.financialLabelTotal}>Total à percevoir</Text>
            <Text style={styles.financialValueTotal}>{item.totalPrice.toLocaleString()} FCFA</Text>
          </View>
        </View>

        {/* Actions (Boutons Confirmer / Refuser) */}
        <View style={styles.footer}>
          <View style={styles.actions}>
            {item.status === 'pending' && (
              <TouchableOpacity 
                style={styles.rejectBtn}
                onPress={() => handleUpdate(item._id, 'rejected')}
                disabled={isUpdating}
              >
                <Ionicons name="close" size={24} color={THEME.COLORS.danger} />
              </TouchableOpacity>
            )}
            
            {config.action && (
              <GoldButton 
                title={config.action}
                onPress={() => handleUpdate(item._id, config.next)}
                loading={isUpdating}
                fullWidth={false}
                size="small"
                style={{ paddingHorizontal: 20 }}
              />
            )}
          </View>
        </View>
      </GlassCard>
    );
  };

  return (
    <ScreenWrapper style={styles.container}>
      <MarketplaceDetailsHeader title="Commandes Reçues" showCart={false} isOverlay={false} />

      {/* SÉLECTEUR D'ONGLETS PREMIUM */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'active' && styles.tabButtonActive]}
          onPress={() => setActiveTab('active')}
        >
          <Ionicons name="cart-outline" size={18} color={activeTab === 'active' ? '#000000' : (isDark ? '#AAA' : '#666')} />
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive, !isDark && activeTab !== 'active' && { color: '#555' }]}>En cours</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'archived' && styles.tabButtonActive]}
          onPress={() => setActiveTab('archived')}
        >
          <Ionicons name="archive-outline" size={18} color={activeTab === 'archived' ? '#000000' : (isDark ? '#AAA' : '#666')} />
          <Text style={[styles.tabText, activeTab === 'archived' && styles.tabTextActive, !isDark && activeTab !== 'archived' && { color: '#555' }]}>Archivées</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={isFetching} 
            onRefresh={refetch} 
            tintColor={THEME.COLORS.primary} 
            colors={[THEME.COLORS.primary]}
          />
        }
        ListEmptyComponent={isLoading ? renderSkeleton() : (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={80} color="rgba(212, 175, 55, 0.1)" />
            <Text style={styles.emptyText}>Aucune commande pour le moment</Text>
            <TouchableOpacity onPress={refetch} style={styles.refreshBtn}>
              <Text style={styles.refreshText}>Actualiser</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  listContent: { padding: 20, paddingBottom: 100 },
  orderCard: { padding: 20, marginBottom: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.1)' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  dateContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderDate: { color: THEME.COLORS.textTertiary, fontSize: 11, fontWeight: '600' },
  archiveBtn: { padding: 4 },
  
  customerBox: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  customerAvatar: { width: 45, height: 45, borderRadius: 15, backgroundColor: THEME.COLORS.primary + '15', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.COLORS.primary + '20' },
  avatarText: { color: THEME.COLORS.primary, fontWeight: '800', fontSize: 18 },
  customerInfo: { flex: 1 },
  customerName: { color: THEME.COLORS.textPrimary, fontSize: 18, fontWeight: '700' },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  addressIcon: { marginRight: 2 },
  address: { color: THEME.COLORS.textSecondary, fontSize: 13, flex: 1 },
  
  // Onglets Premium
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 15,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.08)'
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    height: 42,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8
  },
  tabButtonActive: {
    backgroundColor: THEME.COLORS.primary,
    ...THEME.SHADOWS.gold
  },
  tabText: {
    color: '#AAA',
    fontSize: 13,
    fontWeight: '700'
  },
  tabTextActive: {
    color: '#000000',
    fontWeight: '800'
  },
  
  // Grille d'articles premium et visuels
  itemsList: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 15, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  productThumbnail: { width: 48, height: 48, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.15)' },
  thumbnailPlaceholder: { width: 48, height: 48, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', justifyContent: 'center', alignItems: 'center' },
  productDetails: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  itemName: { color: THEME.COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  itemUnitPrice: { fontSize: 12, color: THEME.COLORS.textTertiary, marginTop: 2 },
  qtyBadge: { backgroundColor: THEME.COLORS.primary + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 12, minWidth: 32, alignItems: 'center' },
  qtyText: { color: THEME.COLORS.primary, fontWeight: '800', fontSize: 12 },
  itemTotalPrice: { color: THEME.COLORS.textSecondary, fontSize: 14, fontWeight: '700', minWidth: 80, textAlign: 'right' },
  
  // Répartition financière
  financialSection: { backgroundColor: 'rgba(255,255,255,0.015)', borderRadius: 15, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  financialRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  financialLabel: { color: THEME.COLORS.textSecondary, fontSize: 13 },
  financialValue: { color: THEME.COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  financialDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 10 },
  financialRowTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  financialLabelTotal: { color: THEME.COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  financialValueTotal: { color: THEME.COLORS.primary, fontSize: 20, fontWeight: '900' },
  
  footer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  rejectBtn: { width: 45, height: 45, borderRadius: 15, backgroundColor: THEME.COLORS.danger + '10', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.COLORS.danger + '20' },
  
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { color: THEME.COLORS.textSecondary, marginTop: 15, fontSize: 16, textAlign: 'center' },
  refreshBtn: { marginTop: 20, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 20, backgroundColor: THEME.COLORS.primary + '15', borderWidth: 1, borderColor: THEME.COLORS.primary },
  refreshText: { color: THEME.COLORS.primary, fontWeight: 'bold' },

  skeletonContainer: { padding: 20 },
  skeletonCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }
});

export default SellerOrders;
