// src/screens/seller/SellerDashboard.jsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { 
  useGetSellerOrdersQuery, 
  useUpdateOrderStatusMutation,
  useGetLedgerStatsQuery 
} from '../../store/api/marketplaceApiSlice';
import THEME from '../../theme/theme';

const SellerDashboard = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const { data: ordersData, isLoading, refetch } = useGetSellerOrdersQuery();
  const { data: ledgerData } = useGetLedgerStatsQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  const orders = ordersData?.data || [];
  const filteredOrders = orders.filter(o => o.status === activeTab);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateStatus({ id: orderId, status: newStatus }).unwrap();
      Alert.alert('Succès', 'Statut mis à jour');
      refetch();
    } catch (error) {
      Alert.alert('Erreur', error.data?.message || 'Action impossible');
    }
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{item._id.slice(-6).toUpperCase()}</Text>
        <Text style={styles.orderTotal}>{item.totalPrice} FCFA</Text>
      </View>
      
      <View style={styles.itemsList}>
        {item.items.map((it, idx) => (
          <Text key={idx} style={styles.itemText}>{it.quantity}x {it.product?.name}</Text>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.customerName}>{item.rider?.name || 'Client Yely'}</Text>
        {item.status === 'pending' && (
          <TouchableOpacity 
            style={styles.confirmBtn} 
            onPress={() => handleUpdateStatus(item._id, 'confirmed')}
            disabled={isUpdating}
          >
            <Text style={styles.confirmBtnText}>Confirmer</Text>
          </TouchableOpacity>
        )}
        {item.status === 'confirmed' && (
          <View style={styles.waitBadge}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={THEME.COLORS.warning} />
            <Text style={styles.waitText}>Attente Livreur</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard Vendeur</Text>
        <TouchableOpacity style={styles.statsBtn}>
          <MaterialCommunityIcons name="chart-bar" size={24} color={THEME.COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Ledger */}
      <View style={styles.ledgerCard}>
        <View style={styles.ledgerInfo}>
          <Text style={styles.ledgerLabel}>Cash à récupérer</Text>
          <Text style={styles.ledgerValue}>{ledgerData?.data?.totalPending || 0} FCFA</Text>
        </View>
        <TouchableOpacity style={styles.ledgerBtn} onPress={() => navigation.navigate('LedgerHistory')}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={THEME.COLORS.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['pending', 'confirmed', 'picked_up', 'delivered'].map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'pending' ? 'Nouvelles' : tab === 'confirmed' ? 'En prépa' : tab === 'picked_up' ? 'En route' : 'Livrées'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={64} color={THEME.COLORS.textTertiary} />
              <Text style={styles.emptyText}>Aucune commande ici</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.xl,
    paddingVertical: THEME.SPACING.lg,
  },
  title: {
    fontSize: THEME.FONTS.sizes.h2,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
  },
  ledgerCard: {
    marginHorizontal: THEME.SPACING.xl,
    backgroundColor: THEME.COLORS.primary,
    borderRadius: THEME.BORDERS.radius.lg,
    padding: THEME.SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...THEME.SHADOWS.gold,
  },
  ledgerLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: THEME.FONTS.sizes.micro,
    textTransform: 'uppercase',
  },
  ledgerValue: {
    color: '#FFFFFF',
    fontSize: THEME.FONTS.sizes.h3,
    fontWeight: THEME.FONTS.weights.bold,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: THEME.SPACING.xl,
    marginVertical: THEME.SPACING.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: THEME.COLORS.primary,
  },
  tabText: {
    fontSize: 11,
    color: THEME.COLORS.textTertiary,
    fontWeight: THEME.FONTS.weights.bold,
  },
  activeTabText: {
    color: THEME.COLORS.primary,
  },
  listContent: {
    paddingHorizontal: THEME.SPACING.xl,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: THEME.BORDERS.radius.lg,
    padding: THEME.SPACING.lg,
    marginBottom: THEME.SPACING.md,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.SPACING.sm,
  },
  orderId: {
    fontSize: THEME.FONTS.sizes.body,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
  },
  orderTotal: {
    fontSize: THEME.FONTS.sizes.body,
    color: THEME.COLORS.primary,
    fontWeight: THEME.FONTS.weights.bold,
  },
  itemsList: {
    marginBottom: THEME.SPACING.md,
  },
  itemText: {
    fontSize: THEME.FONTS.sizes.bodySmall,
    color: THEME.COLORS.textSecondary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.COLORS.border,
    paddingTop: THEME.SPACING.sm,
  },
  customerName: {
    fontSize: THEME.FONTS.sizes.caption,
    color: THEME.COLORS.textTertiary,
  },
  confirmBtn: {
    backgroundColor: THEME.COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  waitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  waitText: {
    fontSize: 10,
    color: THEME.COLORS.warning,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: THEME.SPACING.md,
    color: THEME.COLORS.textTertiary,
  }
});

export default SellerDashboard;
