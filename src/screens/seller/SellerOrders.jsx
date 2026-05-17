// src/screens/seller/SellerOrders.jsx
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
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  useGetSellerOrdersQuery, 
  useUpdateOrderStatusMutation 
} from '../../store/api/marketplaceApiSlice';
import socketService from '../../services/socketService';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import GlassCard from '../../components/ui/GlassCard';
import GlobalSkeleton, { SkeletonBone } from '../../components/ui/GlobalSkeleton';
import THEME from '../../theme/theme';
import GoldButton from '../../components/ui/GoldButton';

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
  const insets = useSafeAreaInsets();
  const { data: ordersData, isLoading, refetch, isFetching, error } = useGetSellerOrdersQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();
  const orders = ordersData?.data || [];

  const [showScrollTop, setShowScrollTop] = useState(false);
  const listRef = useRef(null);

  const handleScroll = (event) => {
    setShowScrollTop(event.nativeEvent.contentOffset.y > 150);
  };

  const scrollToTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
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

  const handleUpdate = async (id, status) => {
    try {
      await updateStatus({ id, status }).unwrap();
    } catch (error) {
      console.error(error);
    }
  };

  const renderOrderItem = ({ item }) => {
    const config = STATUS_CONFIG[item.status];
    
    return (
      <GlassCard style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: config.color }]} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label.toUpperCase()}</Text>
          </View>
          <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
        </View>

        <View style={styles.customerBox}>
          <View style={styles.customerAvatar}>
            <Text style={styles.avatarText}>{(item.customer?.name || 'C').charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.customerName}>{item.customer?.name || 'Client Inconnu'}</Text>
            <Text style={styles.address} numberOfLines={1}>📍 {item.shippingAddress.address}</Text>
          </View>
        </View>

        <View style={styles.itemsList}>
          {item.items.map((prod, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyText}>{prod.quantity}</Text>
              </View>
              <Text style={styles.itemName}>{prod.name}</Text>
              <Text style={styles.itemPrice}>{(prod.price * prod.quantity).toLocaleString()} FCFA</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.totalLabel}>Total à percevoir</Text>
            <Text style={styles.totalPrice}>{item.totalPrice.toLocaleString()} FCFA</Text>
          </View>
          
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
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Commandes Reçues</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        ref={listRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        data={orders}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: THEME.COLORS.glassSurface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.COLORS.border },
  title: { fontSize: 22, fontWeight: '800', color: THEME.COLORS.textPrimary, letterSpacing: 0.5 },
  listContent: { padding: 20, paddingBottom: 100 },
  orderCard: { padding: 20, marginBottom: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.1)' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  orderDate: { color: THEME.COLORS.textTertiary, fontSize: 11, fontWeight: '600' },
  
  customerBox: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  customerAvatar: { width: 45, height: 45, borderRadius: 15, backgroundColor: THEME.COLORS.primary + '15', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.COLORS.primary + '20' },
  avatarText: { color: THEME.COLORS.primary, fontWeight: '800', fontSize: 18 },
  customerName: { color: THEME.COLORS.textPrimary, fontSize: 18, fontWeight: '700' },
  address: { color: THEME.COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  
  itemsList: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 15, padding: 15, marginBottom: 20 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  qtyBadge: { backgroundColor: THEME.COLORS.primary + '30', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 12 },
  qtyText: { color: THEME.COLORS.primary, fontWeight: '800', fontSize: 12 },
  itemName: { color: THEME.COLORS.textPrimary, flex: 1, fontSize: 14, fontWeight: '500' },
  itemPrice: { color: THEME.COLORS.textTertiary, fontSize: 13 },
  
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  totalLabel: { color: THEME.COLORS.textTertiary, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  totalPrice: { color: THEME.COLORS.primary, fontSize: 20, fontWeight: '900' },
  
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
