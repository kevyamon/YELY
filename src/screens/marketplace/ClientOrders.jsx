import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  DeviceEventEmitter,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGetMyOrdersQuery, useCreateReviewMutation } from '../../store/api/marketplaceApiSlice';
import { showToast } from '../../store/slices/uiSlice';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import MarketplaceDetailsHeader from '../../components/marketplace/MarketplaceDetailsHeader';
import GlassCard from '../../components/ui/GlassCard';
import GlassModal from '../../components/ui/GlassModal';
import GlobalSkeleton, { SkeletonBone } from '../../components/ui/GlobalSkeleton';
import socketService from '../../services/socketService';
import THEME from '../../theme/theme';
import ExploreMarketplaceButton from '../../components/marketplace/ExploreMarketplaceButton';

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

  const [createReview, { isLoading: isCreatingReview }] = useCreateReviewMutation();
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [selectedProductForRating, setSelectedProductForRating] = useState(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const handleOpenRateModal = (productId, productName) => {
    setSelectedProductForRating({ id: productId, name: productName });
    setRatingVal(5);
    setRatingComment('');
    setRateModalVisible(true);
  };

  const handleSubmitRating = async () => {
    if (!ratingComment.trim()) {
      dispatch(showToast({
        type: 'warning',
        title: 'Commentaire requis',
        message: 'Veuillez saisir un commentaire pour votre avis.'
      }));
      return;
    }

    try {
      await createReview({
        product: selectedProductForRating.id,
        rating: ratingVal,
        comment: ratingComment
      }).unwrap();

      setRateModalVisible(false);
      setSelectedProductForRating(null);
      dispatch(showToast({
        type: 'success',
        title: 'Avis enregistré',
        message: 'Merci pour votre retour ! Votre avis a été publié.'
      }));
    } catch (err) {
      dispatch(showToast({
        type: 'error',
        title: 'Erreur',
        message: err.data?.message || "Impossible d'enregistrer l'avis. Avez-vous déjà noté ce produit ?"
      }));
    }
  };
  
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
        activeOpacity={0.7}
        onPress={() => {
          requestAnimationFrame(() => {
            navigation.navigate('OrderTracking', { orderId: item._id });
          });
        }}
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
              {(item.status === 'delivered' ? item.items : item.items.slice(0, 2)).map((prod, idx) => {
                const isDelivered = item.status === 'delivered';
                return (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      • {prod.quantity}x {prod.name}
                    </Text>
                    {isDelivered && (
                      <TouchableOpacity 
                        style={styles.rateProductBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleOpenRateModal(prod.product?._id || prod.product, prod.name);
                        }}
                      >
                        <MaterialCommunityIcons name="star-plus-outline" size={13} color="#000" style={{ marginRight: 2 }} />
                        <Text style={styles.rateProductBtnText}>Noter</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
              {item.status !== 'delivered' && item.items.length > 2 && (
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
          activeOpacity={0.7}
          onPress={() => setActiveTab('active')}
        >
          <Ionicons name="cart-outline" size={18} color={activeTab === 'active' ? '#000000' : '#AAA'} />
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>En cours</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'archived' && styles.tabButtonActive]}
          activeOpacity={0.7}
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
                <ExploreMarketplaceButton style={{ marginTop: 25 }} />
              )}
            </View>
          }
        />
      )}
      {/* MODALE DE NOTATION DU PRODUIT */}
      <GlassModal
        visible={rateModalVisible}
        onClose={() => setRateModalVisible(false)}
        position="center"
        closeOnBackdrop={true}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <MaterialCommunityIcons name="star-plus-outline" size={24} color={THEME.COLORS.primary} />
            <Text style={styles.modalTitle}>Noter le produit</Text>
          </View>

          <Text style={styles.productNameLabel}>{selectedProductForRating?.name}</Text>

          <Text style={styles.label}>Votre note :</Text>
          <View style={styles.ratingSelector}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRatingVal(star)}>
                <MaterialCommunityIcons
                  name={star <= ratingVal ? "star" : "star-outline"}
                  size={36}
                  color="#D4AF37"
                  style={{ marginHorizontal: 4 }}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Votre avis (limité à 5000 caractères) :</Text>
          <TextInput
            style={styles.commentInput}
            multiline
            numberOfLines={6}
            maxLength={5000}
            placeholder="Que pensez-vous de ce produit ?"
            placeholderTextColor={THEME.COLORS.textTertiary}
            value={ratingComment}
            onChangeText={setRatingComment}
          />
          <Text style={styles.charCount}>{ratingComment.length} / 5000</Text>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setRateModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitRating} disabled={isCreatingReview}>
              {isCreatingReview ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.submitBtnText}>Valider</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </GlassModal>
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
  },
  
  // Styles pour les avis sur les commandes
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 3 },
  rateProductBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.COLORS.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  rateProductBtnText: { color: '#000', fontSize: 10, fontWeight: '800' },
  
  // Styles Modal de Notation
  modalContent: { padding: 5 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)', paddingBottom: 15, marginBottom: 15 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  productNameLabel: { fontSize: 14.5, fontWeight: '800', color: THEME.COLORS.primary, marginBottom: 15 },
  label: { fontSize: 12.5, fontWeight: '700', color: THEME.COLORS.textSecondary, marginBottom: 8 },
  ratingSelector: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  commentInput: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, fontSize: 14, color: '#FFF', height: 120, textAlignVertical: 'top' },
  charCount: { alignSelf: 'flex-end', fontSize: 10, color: THEME.COLORS.textTertiary, marginTop: 5, marginBottom: 10 },
  modalActions: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)', paddingTop: 15, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cancelBtnText: { color: THEME.COLORS.textSecondary, fontWeight: '700', fontSize: 13 },
  submitBtn: { backgroundColor: THEME.COLORS.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 18 },
  submitBtnText: { color: '#000', fontWeight: '800', fontSize: 13 }
});

export default ClientOrders;
