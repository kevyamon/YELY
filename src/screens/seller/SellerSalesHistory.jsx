// src/screens/seller/SellerSalesHistory.jsx
// HISTORIQUE DES VENTES LIVRÉES — Bulletin de caisse en lecture seule (Archivage 30 jours)
// CSCSM Level: Bank Grade (Strictement <= 325 lignes, Typographie Française Intégrale)

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetSellerOrdersQuery } from '../../store/api/marketplaceApiSlice';
import THEME from '../../theme/theme';

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'Date inconnue';
  const d = new Date(dateStr);
  return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
};

const SaleCard = ({ order, isExpanded, onToggle, isDark }) => {
  const cardBg = isDark ? THEME.COLORS.glassSurface : '#FFFFFF';
  const cardBorder = isDark ? THEME.COLORS.border : 'rgba(0, 0, 0, 0.08)';
  const totalItemsCount = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
  const itemsSubtotal = order.itemsPrice || (order.items || []).reduce((acc, it) => acc + (it.price * it.quantity), 0);

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.8} style={styles.cardHeader}>
        <View style={styles.cardHeaderTop}>
          <View style={styles.orderRefBadge}>
            <Text style={styles.orderRefText}>#{String(order._id).slice(-6).toUpperCase()}</Text>
          </View>
          <View style={styles.deliveredBadge}>
            <Ionicons name="checkmark-done-circle" size={14} color="#10B981" />
            <Text style={styles.deliveredBadgeText}>Livré</Text>
          </View>
        </View>

        <View style={styles.cardHeaderMain}>
          <View style={styles.cardHeaderLeft}>
            <Text style={[styles.customerName, { color: isDark ? THEME.COLORS.textPrimary : '#121418' }]} numberOfLines={1}>
              {order.customer?.name || 'Client Yély'}
            </Text>
            <Text style={[styles.deliveryDate, { color: isDark ? THEME.COLORS.textSecondary : '#64748B' }]}>
              {formatDateTime(order.deliveredAt || order.createdAt)}
            </Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <Text style={[styles.totalAmount, { color: THEME.COLORS.primary }]}>
              {itemsSubtotal.toLocaleString('fr-FR')} F
            </Text>
            <Text style={[styles.itemsCountText, { color: isDark ? THEME.COLORS.textTertiary : '#94A3B8' }]}>
              {totalItemsCount} article{totalItemsCount > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.expandRow}>
          <Text style={[styles.expandText, { color: THEME.COLORS.primary }]}>
            {isExpanded ? 'Masquer le détail du bulletin' : 'Voir le détail du bulletin'}
          </Text>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={THEME.COLORS.primary} />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={[styles.expandedContent, { borderTopColor: cardBorder }]}>
          <Text style={[styles.sectionHeading, { color: isDark ? THEME.COLORS.textSecondary : '#64748B' }]}>
            ARTICLES VENDUS
          </Text>
          {(order.items || []).map((item, idx) => (
            <View key={item._id || idx} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: isDark ? THEME.COLORS.textPrimary : '#121418' }]}>
                  {item.name || item.product?.name || 'Article'}
                </Text>
                <Text style={[styles.itemSubtext, { color: isDark ? THEME.COLORS.textTertiary : '#94A3B8' }]}>
                  {item.quantity} × {item.price?.toLocaleString('fr-FR')} FCFA
                </Text>
              </View>
              <Text style={[styles.itemTotal, { color: isDark ? THEME.COLORS.textPrimary : '#121418' }]}>
                {((item.price || 0) * (item.quantity || 1)).toLocaleString('fr-FR')} FCFA
              </Text>
            </View>
          ))}

          <View style={[styles.divider, { backgroundColor: cardBorder }]} />

          <View style={styles.detailMetaRow}>
            <Text style={[styles.metaLabel, { color: isDark ? THEME.COLORS.textSecondary : '#64748B' }]}>Livreur partenaire :</Text>
            <Text style={[styles.metaValue, { color: isDark ? THEME.COLORS.textPrimary : '#121418' }]}>
              {order.driver?.name || 'Livreur Yély'}
            </Text>
          </View>

          {order.shippingAddress?.address ? (
            <View style={styles.detailMetaRow}>
              <Text style={[styles.metaLabel, { color: isDark ? THEME.COLORS.textSecondary : '#64748B' }]}>Lieu de livraison :</Text>
              <Text style={[styles.metaValue, { color: isDark ? THEME.COLORS.textPrimary : '#121418' }]} numberOfLines={2}>
                {order.shippingAddress.address}
              </Text>
            </View>
          ) : null}

          <View style={styles.detailMetaRow}>
            <Text style={[styles.metaLabel, { color: isDark ? THEME.COLORS.textSecondary : '#64748B' }]}>Mode de règlement :</Text>
            <Text style={[styles.metaValue, { color: isDark ? THEME.COLORS.textPrimary : '#121418' }]}>
              {order.paymentMethod === 'Cash' ? 'Espèces à la livraison' : order.paymentMethod || 'Espèces'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const SellerSalesHistory = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});

  const { data: ordersData, isLoading, isFetching, refetch } = useGetSellerOrdersQuery();

  const deliveredOrders = useMemo(() => {
    const rawList = Array.isArray(ordersData?.data) ? ordersData.data : Array.isArray(ordersData) ? ordersData : [];
    return rawList
      .filter((o) => o && o.status === 'delivered')
      .sort((a, b) => new Date(b.deliveredAt || b.createdAt) - new Date(a.deliveredAt || a.createdAt));
  }, [ordersData]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return deliveredOrders;
    const q = searchQuery.toLowerCase().trim();
    return deliveredOrders.filter((o) => {
      const refMatch = String(o._id).toLowerCase().includes(q);
      const custMatch = String(o.customer?.name || '').toLowerCase().includes(q);
      const itemMatch = (o.items || []).some((it) => String(it.name || it.product?.name || '').toLowerCase().includes(q));
      return refMatch || custMatch || itemMatch;
    });
  }, [deliveredOrders, searchQuery]);

  const totalSalesRevenue = useMemo(() => {
    return deliveredOrders.reduce((sum, o) => {
      const itemsSubtotal = o.itemsPrice || (o.items || []).reduce((acc, it) => acc + (it.price * it.quantity), 0);
      return sum + itemsSubtotal;
    }, 0);
  }, [deliveredOrders]);

  const toggleExpand = (id) => {
    setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const headerPaddingTop = Math.max(insets.top, StatusBar.currentHeight || 24) + 8;

  return (
    <View style={[styles.container, { backgroundColor: THEME.COLORS.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent={true} />

      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Historique des Ventes</Text>
          <Text style={styles.headerSubtitle}>Commandes livrées avec succès</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={THEME.COLORS.primary} />}
        ListHeaderComponent={
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryTopRow}>
                <View>
                  <Text style={styles.summaryLabel}>TOTAL ENCAISSÉ</Text>
                  <Text style={styles.summaryAmount}>{totalSalesRevenue.toLocaleString('fr-FR')} FCFA</Text>
                </View>
                <View style={styles.summaryBadge}>
                  <MaterialCommunityIcons name="shopping" size={20} color="#000000" />
                  <Text style={styles.summaryBadgeText}>{deliveredOrders.length} vente{deliveredOrders.length > 1 ? 's' : ''}</Text>
                </View>
              </View>
              <View style={styles.ttlNotice}>
                <Ionicons name="information-circle-outline" size={15} color={THEME.COLORS.textSecondary} />
                <Text style={styles.ttlNoticeText}>
                  Archivage automatique : les bulletins sont conservés pendant 30 jours.
                </Text>
              </View>
            </View>

            <View style={[styles.searchBox, { backgroundColor: isDark ? THEME.COLORS.glassSurface : '#FFFFFF', borderColor: isDark ? THEME.COLORS.border : 'rgba(0,0,0,0.08)' }]}>
              <Ionicons name="search" size={18} color={THEME.COLORS.textSecondary} />
              <TextInput
                placeholder="Rechercher par référence, client, article..."
                placeholderTextColor={THEME.COLORS.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { color: THEME.COLORS.textPrimary }]}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={THEME.COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={THEME.COLORS.primary} />
              <Text style={styles.loadingText}>Chargement des bulletins de vente...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <MaterialCommunityIcons name="receipt" size={44} color={THEME.COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'Aucune vente correspondante' : 'Aucune vente livrée pour le moment'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Essayez de modifier vos termes de recherche.'
                  : 'Dès qu’un livreur remet une commande à votre client, son bulletin apparaîtra automatiquement ici.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <SaleCard
            order={item}
            isExpanded={Boolean(expandedOrders[item._id])}
            onToggle={() => toggleExpand(item._id)}
            isDark={isDark}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.06)', alignItems: 'center', justifyContent: 'center' },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: THEME.COLORS.textPrimary },
  headerSubtitle: { fontSize: 12, color: THEME.COLORS.textSecondary, marginTop: 2 },
  listContent: { paddingHorizontal: 16, paddingTop: 8 },
  summaryCard: { backgroundColor: 'rgba(212, 175, 55, 0.12)', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)', borderRadius: 20, padding: 18, marginBottom: 16 },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 11, fontWeight: '800', color: THEME.COLORS.textSecondary, letterSpacing: 0.5 },
  summaryAmount: { fontSize: 24, fontWeight: '900', color: THEME.COLORS.primary, marginTop: 4 },
  summaryBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, gap: 6 },
  summaryBadgeText: { fontSize: 12, fontWeight: '800', color: '#000000' },
  ttlNotice: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(212, 175, 55, 0.15)', gap: 6 },
  ttlNoticeText: { fontSize: 11.5, color: THEME.COLORS.textSecondary, flex: 1, lineHeight: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 46, borderRadius: 14, borderWidth: 1, marginBottom: 16, gap: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  card: { borderRadius: 18, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  cardHeader: { padding: 16 },
  cardHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderRefBadge: { backgroundColor: 'rgba(255, 255, 255, 0.06)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  orderRefText: { fontSize: 11, fontWeight: '800', color: THEME.COLORS.textSecondary },
  deliveredBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 },
  deliveredBadgeText: { fontSize: 11, fontWeight: '800', color: '#10B981' },
  cardHeaderMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHeaderLeft: { flex: 1, marginRight: 10 },
  customerName: { fontSize: 16, fontWeight: '800' },
  deliveryDate: { fontSize: 12, marginTop: 3 },
  cardHeaderRight: { alignItems: 'flex-end' },
  totalAmount: { fontSize: 17, fontWeight: '900' },
  itemsCountText: { fontSize: 11, marginTop: 3 },
  expandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)', gap: 4 },
  expandText: { fontSize: 12, fontWeight: '700' },
  expandedContent: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12, borderTopWidth: 1 },
  sectionHeading: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  itemInfo: { flex: 1, marginRight: 10 },
  itemName: { fontSize: 13.5, fontWeight: '700' },
  itemSubtext: { fontSize: 11.5, marginTop: 2 },
  itemTotal: { fontSize: 13, fontWeight: '800' },
  divider: { height: 1, marginVertical: 12 },
  detailMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 3 },
  metaLabel: { fontSize: 12, flex: 1 },
  metaValue: { fontSize: 12, fontWeight: '700', flex: 1.5, textAlign: 'right' },
  loadingContainer: { paddingVertical: 50, alignItems: 'center' },
  loadingText: { color: THEME.COLORS.textSecondary, marginTop: 12, fontSize: 13 },
  emptyContainer: { paddingVertical: 60, paddingHorizontal: 20, alignItems: 'center' },
  emptyIconBg: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(212, 175, 55, 0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: THEME.COLORS.textPrimary, textAlign: 'center', marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: THEME.COLORS.textSecondary, textAlign: 'center', lineHeight: 19 }
});

export default SellerSalesHistory;
