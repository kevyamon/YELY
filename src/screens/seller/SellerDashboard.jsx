import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  StatusBar,
  ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  useGetSellerOrdersQuery, 
  useUpdateOrderStatusMutation,
  useGetLedgerStatsQuery 
} from '../../store/api/marketplaceApiSlice';
import THEME from '../../theme/theme';

const SellerDashboard = ({ navigation }) => {
  const insets = useSafeAreaInsets();
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
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: THEME.COLORS.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={[styles.header, { paddingTop: insets.top + THEME.SPACING.md }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('Menu')} style={styles.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={THEME.COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <TouchableOpacity 
          style={styles.manageProductsBtn} 
          onPress={() => navigation.navigate('ManageProducts')}
        >
          <MaterialCommunityIcons name="package-variant-closed" size={24} color={THEME.COLORS.primary} />
          <Text style={styles.manageBtnText}>Produits</Text>
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

      {/* Tabs / Filter Navigation */}
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {[
            { id: 'pending', label: 'Nouvelles', icon: 'bell-outline' },
            { id: 'confirmed', label: 'En prépa', icon: 'stove' },
            { id: 'picked_up', label: 'En route', icon: 'moped' },
            { id: 'delivered', label: 'Livrées', icon: 'check-all' }
          ].map(tab => {
            const count = orders.filter(o => o.status === tab.id).length;
            const isActive = activeTab === tab.id;

            return (
              <TouchableOpacity 
                key={tab.id} 
                style={[styles.tabPill, isActive && styles.activeTabPill]}
                onPress={() => setActiveTab(tab.id)}
              >
                <MaterialCommunityIcons 
                  name={tab.icon} 
                  size={16} 
                  color={isActive ? THEME.COLORS.deepAsphalt : THEME.COLORS.textTertiary} 
                />
                <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.badge, isActive && styles.activeBadge]}>
                    <Text style={[styles.badgeText, isActive && styles.activeBadgeText]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.xl,
    paddingBottom: THEME.SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuBtn: {
    marginRight: THEME.SPACING.md,
  },
  title: {
    fontSize: THEME.FONTS.sizes.h2,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
  },
  manageProductsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.BORDERS.radius.pill,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  manageBtnText: {
    color: THEME.COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
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
  tabsContainer: {
    marginVertical: THEME.SPACING.lg,
  },
  tabsScroll: {
    paddingHorizontal: THEME.SPACING.xl,
    gap: THEME.SPACING.sm,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  activeTabPill: {
    backgroundColor: THEME.COLORS.primary,
    borderColor: THEME.COLORS.primary,
    ...THEME.SHADOWS.gold,
  },
  tabLabel: {
    fontSize: 13,
    color: THEME.COLORS.textTertiary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  activeTabLabel: {
    color: THEME.COLORS.deepAsphalt,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 4,
  },
  activeBadge: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  badgeText: {
    fontSize: 10,
    color: THEME.COLORS.textSecondary,
    fontWeight: 'bold',
  },
  activeBadgeText: {
    color: THEME.COLORS.deepAsphalt,
  },
  listContent: {
    paddingHorizontal: THEME.SPACING.xl,
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
