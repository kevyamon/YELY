import React, { useState, useRef } from 'react';
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  StatusBar,
  ScrollView,
  useColorScheme
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  useGetSellerOrdersQuery, 
  useUpdateOrderStatusMutation,
  useGetLedgerStatsQuery 
} from '../../store/api/marketplaceApiSlice';
import { showSuccessToast, showErrorToast } from '../../store/slices/uiSlice';
import ConfirmModal from '../../components/ui/ConfirmModal';
import THEME from '../../theme/theme';

const SellerDashboard = ({ navigation }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('pending');

  const [showScrollTop, setShowScrollTop] = useState(false);
  const listRef = useRef(null);

  const handleScroll = (event) => {
    setShowScrollTop(event.nativeEvent.contentOffset.y > 150);
  };

  const scrollToTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };
  const { data: ordersData, isLoading, refetch } = useGetSellerOrdersQuery();
  const { data: ledgerData } = useGetLedgerStatsQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();
  const [confirmData, setConfirmData] = React.useState({ visible: false, orderId: null, nextStatus: '', msg: '' });

  const orders = ordersData?.data || [];
  const filteredOrders = orders.filter(o => o.status === activeTab);

  const handleUpdateStatus = async (orderId, currentStatus) => {
    let nextStatus = '';
    let confirmMsg = '';

    if (currentStatus === 'pending') {
      nextStatus = 'confirmed';
      confirmMsg = 'Voulez-vous confirmer cette commande et commencer la préparation ?';
    } else if (currentStatus === 'confirmed') {
      nextStatus = 'picked_up';
      confirmMsg = 'Le colis a-t-il été remis au livreur ?';
    } else if (currentStatus === 'picked_up') {
      nextStatus = 'delivered';
      confirmMsg = 'Confirmez-vous que la commande a été livrée et payée ?';
    }

    if (!nextStatus) return;

    setConfirmData({
      visible: true,
      orderId,
      nextStatus,
      msg: confirmMsg
    });
  };

  const confirmStatusUpdate = async () => {
    try {
      await updateStatus({ id: confirmData.orderId, status: confirmData.nextStatus }).unwrap();
      showSuccessToast({ title: 'Succès', message: `Commande mise à jour.` });
      setConfirmData({ ...confirmData, visible: false });
      refetch();
    } catch (error) {
      showErrorToast({ message: error.data?.message || 'Action impossible' });
      setConfirmData({ ...confirmData, visible: false });
    }
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>#{item._id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.orderTime}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        <Text style={styles.orderTotal}>{item.totalPrice} FCFA</Text>
      </View>
      
      <View style={styles.itemsList}>
        {item.items.map((it, idx) => (
          <Text key={idx} style={styles.itemText}>{it.quantity}x {it.product?.name || it.name}</Text>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.customerBox}>
          <MaterialCommunityIcons name="account-outline" size={14} color={THEME.COLORS.textTertiary} />
          <Text style={styles.customerName}>{item.customer?.name || 'Client Yely'}</Text>
        </View>

        {item.status !== 'delivered' && item.status !== 'cancelled' && (
          <TouchableOpacity 
            style={[styles.statusBtn, { backgroundColor: item.status === 'pending' ? THEME.COLORS.primary : THEME.COLORS.success }]} 
            onPress={() => handleUpdateStatus(item._id, item.status)}
            disabled={isUpdating}
          >
            <Text style={styles.statusBtnText}>
              {item.status === 'pending' ? 'PRÉPARER' : 
               item.status === 'confirmed' ? 'REMIS AU LIVREUR' : 
               item.status === 'picked_up' ? 'MARQUER LIVRÉ' : 'OK'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: THEME.COLORS.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      
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
          ref={listRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
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

      <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} />

      <ConfirmModal 
        visible={confirmData.visible}
        onClose={() => setConfirmData({ ...confirmData, visible: false })}
        onConfirm={confirmStatusUpdate}
        isLoading={isUpdating}
        title="Mise à jour statut"
        message={confirmData.msg}
      />
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
  orderTime: {
    fontSize: 10,
    color: THEME.COLORS.textTertiary,
    marginTop: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.COLORS.border,
    paddingTop: THEME.SPACING.md,
  },
  customerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerName: {
    fontSize: THEME.FONTS.sizes.caption,
    color: THEME.COLORS.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  statusBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    ...THEME.SHADOWS.soft,
  },
  statusBtnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
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
