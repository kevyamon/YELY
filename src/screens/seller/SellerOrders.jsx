// src/screens/seller/SellerOrders.jsx
import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl
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
import THEME from '../../theme/theme';

const STATUS_CONFIG = {
  'pending': { label: 'Nouvelle', color: '#f39c12', action: 'Confirmer', next: 'confirmed' },
  'confirmed': { label: 'En préparation', color: '#27ae60', action: 'Prêt pour livraison', next: 'searching' },
  'searching': { label: 'Recherche livreur', color: '#3498db', action: null },
  'picked_up': { label: 'En route', color: '#9b59b6', action: null },
  'delivered': { label: 'Livrée', color: '#2ecc71', action: null },
  'cancelled': { label: 'Annulée', color: '#e74c3c', action: null },
  'rejected': { label: 'Refusée', color: '#e67e22', action: null }
};

const SellerOrders = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { data: ordersData, isLoading, refetch } = useGetSellerOrdersQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();
  const orders = ordersData?.data || [];

  // TEMPS RÉEL: Nouvelles commandes
  useEffect(() => {
    socketService.on('new_order', (order) => {
      refetch();
    });
    socketService.on('order_updated', (order) => {
      refetch();
    });
    return () => {
      socketService.off('new_order');
      socketService.off('order_updated');
    };
  }, []);

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
          <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
          <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>

        <Text style={styles.customerName}>{item.customer?.name || 'Client'}</Text>
        <Text style={styles.address} numberOfLines={1}>📍 {item.shippingAddress.address}</Text>

        <View style={styles.divider} />
        
        {item.items.map((prod, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemQty}>{prod.quantity}x</Text>
            <Text style={styles.itemName}>{prod.name}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.totalPrice}>{item.totalPrice.toLocaleString()} F</Text>
          
          <View style={styles.actions}>
            {config.action && (
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: config.color }]}
                onPress={() => handleUpdate(item._id, config.next)}
                disabled={isUpdating}
              >
                <Text style={styles.actionBtnText}>{config.action}</Text>
              </TouchableOpacity>
            )}
            {item.status === 'pending' && (
              <TouchableOpacity 
                style={styles.rejectBtn}
                onPress={() => handleUpdate(item._id, 'rejected')}
              >
                <Ionicons name="close" size={20} color="#e74c3c" />
              </TouchableOpacity>
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
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Commandes Reçues</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={THEME.COLORS.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={60} color="#333" />
            <Text style={styles.emptyText}>Aucune commande pour le moment</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  listContent: { padding: 20 },
  orderCard: { padding: 20, marginBottom: 20 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  orderDate: { color: '#666', fontSize: 12 },
  customerName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  address: { color: '#AAA', fontSize: 13, marginTop: 5 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 15 },
  itemRow: { flexDirection: 'row', marginBottom: 5 },
  itemQty: { color: THEME.COLORS.primary, fontWeight: 'bold', width: 30 },
  itemName: { color: '#CCC' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  totalPrice: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  actionBtnText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  rejectBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#e74c3c', justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: '#666', marginTop: 15 }
});

export default SellerOrders;
