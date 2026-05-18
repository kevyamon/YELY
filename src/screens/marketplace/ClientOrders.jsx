import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  DeviceEventEmitter
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGetMyOrdersQuery } from '../../store/api/marketplaceApiSlice';
import { showToast } from '../../store/slices/uiSlice';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import MarketplaceDetailsHeader from '../../components/marketplace/MarketplaceDetailsHeader';
import GlassCard from '../../components/ui/GlassCard';
import GlobalSkeleton, { SkeletonBone } from '../../components/ui/GlobalSkeleton';
import socketService from '../../services/socketService';
import THEME from '../../theme/theme';

const STATUS_MAP = {
  'pending': { label: 'En attente', color: THEME.COLORS.warning, icon: 'clock-outline' },
  'confirmed': { label: 'Confirmée', color: THEME.COLORS.success, icon: 'check-circle-outline' },
  'searching': { label: 'Recherche livreur', color: THEME.COLORS.info, icon: 'magnify' },
  'searching_delivery_retry': { label: 'Recherche élargie (Livreur)...', color: THEME.COLORS.info, icon: 'magnify' },
  'picked_up': { label: 'En livraison', color: THEME.COLORS.primary, icon: 'bike' },
  'delivered': { label: 'Livrée', color: THEME.COLORS.success, icon: 'flag-checkered' },
  'cancelled': { label: 'Annulée', color: THEME.COLORS.danger, icon: 'close-circle-outline' },
  'cancelled_no_driver': { label: 'Annulée (Pas de livreur disponible)', color: THEME.COLORS.danger, icon: 'close-circle-outline' },
  'rejected': { label: 'Refusée', color: THEME.COLORS.warning, icon: 'alert-circle-outline' }
};

const ClientOrders = ({ navigation }) => {
  const dispatch = useDispatch();
  const { data: ordersData, isLoading, refetch, isFetching } = useGetMyOrdersQuery();
  const orders = ordersData?.data || [];

  const listRef = useRef(null);
  
  const [archivedOrderIds, setArchivedOrderIds] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'archived'

  useEffect(() => {
    const loadArchivedOrders = async () => {
      try {
        const value = await AsyncStorage.getItem('yely_archived_orders');
        if (value) {
          setArchivedOrderIds(JSON.parse(value));
        }
      } catch (err) {
        console.warn('[ORDERS] Failed to load archived orders:', err);
      }
    };
    loadArchivedOrders();
  }, []);

  const handleArchiveOrder = async (orderId) => {
    try {
      const updated = [...archivedOrderIds, orderId];
      setArchivedOrderIds(updated);
      await AsyncStorage.setItem('yely_archived_orders', JSON.stringify(updated));
      dispatch(showToast({
        type: 'success',
        title: 'Commande archivée',
        message: 'La commande a été déplacée vers les archives.'
      }));
    } catch (err) {
      console.warn('[ORDERS] Failed to archive order:', err);
    }
  };

  const handleUnarchiveOrder = async (orderId) => {
    try {
      const updated = archivedOrderIds.filter(id => id !== orderId);
      setArchivedOrderIds(updated);
      await AsyncStorage.setItem('yely_archived_orders', JSON.stringify(updated));
      dispatch(showToast({
        type: 'success',
        title: 'Commande restaurée',
        message: 'La commande est de retour dans vos commandes actives.'
      }));
    } catch (err) {
      console.warn('[ORDERS] Failed to unarchive order:', err);
    }
  };

  const filteredOrders = orders.filter(item => {
    const isArchived = archivedOrderIds.includes(item._id);
    return activeTab === 'archived' ? isArchived : !isArchived;
  });

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('scroll_to_top_orders', () => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    socketService.on('order_updated', () => {
      refetch();
    });
    return () => socketService.off('order_updated');
  }, []);

  const renderSkeleton = () => (
    <View style={styles.list}>
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.skeletonCard}>
          <SkeletonBone width="40%" height={20} borderRadius={10} />
          <SkeletonBone width="100%" height={80} borderRadius={15} style={{ marginTop: 15 }} />
          <SkeletonBone width="30%" height={20} borderRadius={10} style={{ marginTop: 15, alignSelf: 'flex-end' }} />
        </View>
      ))}
    </View>
  );

  const renderItem = ({ item }) => {
    const status = STATUS_MAP[item.status] || STATUS_MAP.pending;
    
    return (
      <TouchableOpacity 
        onPress={() => navigation.navigate('OrderTracking', { orderId: item._id })}
        activeOpacity={0.9}
      >
        <GlassCard style={styles.orderCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={[styles.statusText, { color: status.color }]} numberOfLines={1} ellipsizeMode="tail">
                {status.label.toUpperCase()}
              </Text>
            </View>
            <View style={styles.dateContainer}>
              <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>
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

          <View style={styles.cardBody}>
            <View style={styles.itemsPreview}>
              {item.items.slice(0, 2).map((prod, idx) => (
                <Text key={idx} style={styles.itemName} numberOfLines={1}>
                  • {prod.quantity}x {prod.name}
                </Text>
              ))}
              {item.items.length > 2 && (
                <Text style={styles.moreItems}>+ {item.items.length - 2} autres articles</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={THEME.COLORS.textTertiary} />
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.totalLabel}>Total payé</Text>
            <Text style={styles.totalAmount}>{item.totalPrice.toLocaleString()} FCFA</Text>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper>
      <MarketplaceDetailsHeader title="Mes commandes" showCart={false} isOverlay={false} />

      {/* TABS SELECTOR */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'active' && styles.tabButtonActive]}
          onPress={() => setActiveTab('active')}
        >
          <Ionicons name="cart-outline" size={18} color={activeTab === 'active' ? '#000000' : '#AAA'} />
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>En cours</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'archived' && styles.tabButtonActive]}
          onPress={() => setActiveTab('archived')}
        >
          <Ionicons name="archive-outline" size={18} color={activeTab === 'archived' ? '#000000' : '#AAA'} />
          <Text style={[styles.tabText, activeTab === 'archived' && styles.tabTextActive]}>Archivées</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? renderSkeleton() : (
        <FlatList
          ref={listRef}
          data={filteredOrders}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={THEME.COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name={activeTab === 'active' ? "cart-off" : "archive-off-outline"} 
                size={80} 
                color={THEME.COLORS.textTertiary} 
              />
              <Text style={styles.emptyText}>
                {activeTab === 'active' 
                  ? "Aucune commande pour le moment" 
                  : "Aucune commande archivée"
                }
              </Text>
              {activeTab === 'active' && (
                <TouchableOpacity 
                  style={styles.shopBtn}
                  onPress={() => navigation.navigate('MarketplaceHub')}
                >
                  <Text style={styles.shopBtnText}>Commencer mes achats</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    paddingTop: 40 
  },
  backBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    backgroundColor: THEME.COLORS.glassSurface, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.border
  },
  title: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: THEME.COLORS.textPrimary, 
    marginLeft: 15,
    letterSpacing: -0.5
  },
  list: { padding: 20 },
  orderCard: { padding: 15, marginBottom: 15 },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 15,
    gap: 10
  },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8,
    flexShrink: 1
  },
  statusDot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    marginRight: 6 
  },
  statusText: { 
    fontSize: 10, 
    fontWeight: '900', 
    letterSpacing: 0.5,
    flexShrink: 1
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0
  },
  orderDate: { 
    fontSize: 12, 
    color: THEME.COLORS.textTertiary 
  },
  archiveBtn: {
    padding: 4
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 10,
    gap: 4
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
  cardBody: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 15
  },
  itemsPreview: { flex: 1 },
  itemName: { 
    fontSize: 14, 
    color: THEME.COLORS.textSecondary, 
    marginBottom: 2 
  },
  moreItems: { 
    fontSize: 12, 
    color: THEME.COLORS.textTertiary, 
    fontStyle: 'italic' 
  },
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.COLORS.border
  },
  totalLabel: { 
    fontSize: 12, 
    color: THEME.COLORS.textTertiary 
  },
  totalAmount: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: THEME.COLORS.primary 
  },
  skeletonCard: { 
    padding: 20, 
    backgroundColor: THEME.COLORS.glassSurface, 
    borderRadius: 20, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: THEME.COLORS.border
  },
  emptyContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 100 
  },
  emptyText: { 
    color: THEME.COLORS.textSecondary, 
    fontSize: 16, 
    marginTop: 20,
    textAlign: 'center'
  },
  shopBtn: {
    marginTop: 30,
    backgroundColor: THEME.COLORS.primary,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    ...THEME.SHADOWS.gold
  },
  shopBtnText: {
    color: THEME.COLORS.textInverse,
    fontWeight: 'bold',
    fontSize: 14
  }
});

export default ClientOrders;
