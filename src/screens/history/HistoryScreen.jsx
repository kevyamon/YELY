import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { ConfirmModal } from '../../components/admin/AdminModals';
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import GlassCard from '../../components/ui/GlassCard';
import GlassModal from '../../components/ui/GlassModal';
import GoldButton from '../../components/ui/GoldButton';
import GlobalSkeleton, { SkeletonBone } from '../../components/ui/GlobalSkeleton';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { useGetRideHistoryQuery, useHideFromHistoryMutation } from '../../store/api/ridesApiSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const STATUS_CONFIG = {
  completed: { color: THEME.COLORS.success, icon: 'checkmark-circle', label: 'Terminée' },
  cancelled: { color: THEME.COLORS.danger, icon: 'close-circle', label: 'Annulée' },
  in_progress: { color: THEME.COLORS.warning, icon: 'time', label: 'En cours' },
  accepted: { color: THEME.COLORS.info, icon: 'car', label: 'En approche' }
};

const HistoryScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const isDriver = user?.role === 'driver';
  
  const flatListRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [page, setPage] = useState(1);
  
  const { data, isLoading, isFetching, refetch } = useGetRideHistoryQuery({ page, limit: 15 });
  const [hideRide, { isLoading: isHiding }] = useHideFromHistoryMutation();

  const [selectedRide, setSelectedRide] = useState(null);
  const [rideToDelete, setRideToDelete] = useState(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  const rides = data?.data?.rides || data?.rides || [];

  const handleScroll = (event) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const halfScreenHeight = layoutMeasurement.height / 2;
    setShowScrollTop(contentOffset.y > halfScreenHeight);
  };

  const scrollToTop = () => {
    if (rides && rides.length > 0) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' });
  };

  const handleHideConfirm = async () => {
    if (!rideToDelete) return;
    try {
      await hideRide(rideToDelete).unwrap();
      dispatch(showSuccessToast({ title: 'Supprimée', message: 'La course a été retirée de votre historique.' }));
    } catch (e) {
      dispatch(showErrorToast({ title: 'Erreur', message: 'Impossible de masquer cette course.' }));
    } finally {
      setRideToDelete(null);
    }
  };

  const handleClearAllConfirm = async () => {
    try {
      await hideRide('all').unwrap();
      dispatch(showSuccessToast({ title: 'Historique vidé', message: 'Toutes vos courses ont été retirées.' }));
    } catch (e) {
      dispatch(showErrorToast({ title: 'Erreur', message: 'Impossible de vider l\'historique.' }));
    } finally {
      setShowClearAllModal(false);
    }
  };

  const renderRideItem = ({ item }) => {
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.cancelled;
    
    return (
      <TouchableOpacity activeOpacity={0.88} onPress={() => setSelectedRide(item)}>
        <GlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            <View style={styles.statusBadge}>
              <Ionicons name={config.icon} size={14} color={config.color} style={{ marginRight: 4 }} />
              <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
            </View>
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.routeTimeline}>
              <View style={[styles.dot, { backgroundColor: THEME.COLORS.primary }]} />
              <View style={styles.line} />
              <View style={[styles.dot, { backgroundColor: THEME.COLORS.textPrimary }]} />
            </View>
            <View style={styles.routeTexts}>
              <Text style={styles.addressText} numberOfLines={1}>{item.origin?.address || 'Adresse de départ inconnue'}</Text>
              <Text style={[styles.addressText, styles.addressBottom]} numberOfLines={1}>{item.destination?.address || 'Adresse d\'arrivée inconnue'}</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.userInfo}>
              <Ionicons name="person-circle-outline" size={20} color={THEME.COLORS.textSecondary} />
              <Text style={styles.userText}>
                {isDriver 
                  ? (item.rider?.name || 'Passager Inconnu') 
                  : (item.driver?.name || 'Chauffeur Inconnu')}
              </Text>
            </View>
            
            <View style={styles.rightFooter}>
              {item.price ? (
                <Text style={styles.priceText}>{item.price.toLocaleString('fr-FR')} FCFA</Text>
              ) : (
                <Text style={styles.priceText}>---</Text>
              )}
              
              <TouchableOpacity 
                style={styles.deleteBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  setRideToDelete(item._id);
                }}
                disabled={isHiding}
              >
                <Ionicons name="trash-outline" size={20} color={THEME.COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
          <Text style={styles.headerTitle}>Historique des courses</Text>
        </TouchableOpacity>
        
        {rides && rides.length > 0 && (
          <TouchableOpacity 
            onPress={() => setShowClearAllModal(true)} 
            disabled={isHiding} 
            style={styles.clearAllButton}
          >
            <Ionicons name="trash-bin-outline" size={22} color={THEME.COLORS.danger} />
          </TouchableOpacity>
        )}
      </View>

      <GlobalSkeleton visible={isLoading} style={{ flex: 1 }}>
        {isLoading ? (
          <View style={styles.listContainer}>
            {[1, 2, 3, 4].map((key) => (
              <GlassCard key={key} style={styles.card}>
                <View style={styles.cardHeader}>
                  <SkeletonBone width={80} height={14} />
                  <SkeletonBone width={80} height={24} borderRadius={12} />
                </View>
                <View style={styles.routeContainer}>
                  <View style={styles.routeTimeline}>
                    <View style={[styles.dot, { backgroundColor: THEME.COLORS.border, opacity: 0.3 }]} />
                    <View style={styles.line} />
                    <View style={[styles.dot, { backgroundColor: THEME.COLORS.border, opacity: 0.3 }]} />
                  </View>
                  <View style={styles.routeTexts}>
                    <SkeletonBone width="80%" height={16} />
                    <SkeletonBone width="60%" height={16} style={styles.addressBottom} />
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <View style={styles.userInfo}>
                    <SkeletonBone width={20} height={20} borderRadius={10} />
                    <SkeletonBone width={100} height={14} style={{ marginLeft: 8 }} />
                  </View>
                  <SkeletonBone width={70} height={20} />
                </View>
              </GlassCard>
            ))}
          </View>
        ) : rides.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="map-outline" size={60} color={THEME.COLORS.textTertiary} />
            <Text style={styles.emptyText}>Vous n'avez effectué aucune course.</Text>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={rides}
              keyExtractor={(item) => item._id}
              renderItem={renderRideItem}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onRefresh={refetch}
              refreshing={isFetching}
            />
            <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} />
          </>
        )}
      </GlobalSkeleton>

      <GlassModal
        visible={!!selectedRide}
        onClose={() => setSelectedRide(null)}
        title="Détails de la course"
        icon="receipt-outline"
      >
        {selectedRide && (() => {
          const config = STATUS_CONFIG[selectedRide.status] || STATUS_CONFIG.cancelled;
          return (
            <View style={styles.detailContainer}>
              <View style={styles.detailHeaderRow}>
                <Text style={styles.detailDateText}>{formatDate(selectedRide.createdAt)}</Text>
                <View style={styles.statusBadge}>
                  <Ionicons name={config.icon} size={14} color={config.color} style={{ marginRight: 4 }} />
                  <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                </View>
              </View>

              <View style={styles.detailRouteBox}>
                <View style={styles.routeTimeline}>
                  <View style={[styles.dot, { backgroundColor: THEME.COLORS.primary }]} />
                  <View style={[styles.line, { height: 35 }]} />
                  <View style={[styles.dot, { backgroundColor: THEME.COLORS.textPrimary }]} />
                </View>
                <View style={styles.routeTexts}>
                  <View>
                    <Text style={styles.detailLabel}>Départ</Text>
                    <Text style={styles.addressText}>{selectedRide.origin?.address || 'Adresse de départ inconnue'}</Text>
                  </View>
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.detailLabel}>Arrivée</Text>
                    <Text style={styles.addressText}>{selectedRide.destination?.address || 'Adresse d\'arrivée inconnue'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailInfoRow}>
                <Ionicons name="person-circle-outline" size={24} color={THEME.COLORS.champagneGold} />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.detailLabel}>{isDriver ? 'Passager' : 'Chauffeur'}</Text>
                  <Text style={styles.detailValueText}>
                    {isDriver 
                      ? (selectedRide.rider?.name || 'Passager Inconnu') 
                      : (selectedRide.driver?.name || 'Chauffeur Inconnu')}
                  </Text>
                </View>
              </View>

              <View style={styles.detailPriceCard}>
                <Text style={styles.detailLabel}>Montant de la course</Text>
                <Text style={styles.detailPriceVal}>
                  {selectedRide.price ? `${selectedRide.price.toLocaleString('fr-FR')} FCFA` : 'Non spécifié'}
                </Text>
                <Text style={styles.detailSubText}>
                  Mode de règlement : {selectedRide.paymentMethod || 'Espèces'}
                </Text>
              </View>

              <GoldButton 
                title="Fermer" 
                onPress={() => setSelectedRide(null)} 
                style={{ marginTop: 16 }}
              />
            </View>
          );
        })()}
      </GlassModal>

      <ConfirmModal 
        visible={!!rideToDelete}
        title="Masquer la course"
        message="Voulez-vous retirer cette course de votre historique ? Cette action n'impactera pas l'autre partie."
        isDestructive={true}
        onConfirm={handleHideConfirm}
        onCancel={() => setRideToDelete(null)}
      />

      <ConfirmModal 
        visible={showClearAllModal}
        title="Vider l'historique"
        message="Voulez-vous vraiment masquer toutes vos courses terminées et annulées ? Cette action est irréversible."
        isDestructive={true}
        onConfirm={handleClearAllConfirm}
        onCancel={() => setShowClearAllModal(false)}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 10 },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: THEME.COLORS.primary, fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  clearAllButton: { padding: 8, backgroundColor: THEME.COLORS.danger + '15', borderRadius: 8 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 50, paddingTop: 10 },
  emptyText: { color: THEME.COLORS.textSecondary, fontSize: 16, marginTop: 15 },
  card: { padding: 15, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  dateText: { color: THEME.COLORS.textSecondary, fontSize: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.COLORS.overlay, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  routeContainer: { flexDirection: 'row', marginBottom: 15 },
  routeTimeline: { width: 20, alignItems: 'center', marginRight: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, zIndex: 2 },
  line: { width: 2, height: 25, backgroundColor: THEME.COLORS.border, marginVertical: 2 },
  routeTexts: { flex: 1, justifyContent: 'space-between' },
  addressText: { color: THEME.COLORS.textPrimary, fontSize: 14 },
  addressBottom: { marginTop: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: THEME.COLORS.border },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  userText: { color: THEME.COLORS.textSecondary, fontSize: 14, marginLeft: 5 },
  rightFooter: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  priceText: { color: THEME.COLORS.primary, fontSize: 16, fontWeight: 'bold' },
  deleteBtn: { padding: 5, backgroundColor: THEME.COLORS.danger + '15', borderRadius: 8 },
  detailContainer: { gap: 14 },
  detailHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailDateText: { color: THEME.COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  detailRouteBox: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, flexDirection: 'row', borderWidth: 1, borderColor: THEME.COLORS.border },
  detailLabel: { color: THEME.COLORS.textSecondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  detailValueText: { color: THEME.COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  detailInfoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: THEME.COLORS.border },
  detailPriceCard: { backgroundColor: 'rgba(212, 175, 55, 0.08)', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: THEME.COLORS.champagneGold + '40' },
  detailPriceVal: { color: THEME.COLORS.champagneGold, fontSize: 22, fontWeight: '800', marginVertical: 4 },
  detailSubText: { color: THEME.COLORS.textSecondary, fontSize: 12, fontWeight: '500' }
});

export default HistoryScreen;