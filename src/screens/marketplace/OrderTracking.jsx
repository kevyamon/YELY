// src/screens/marketplace/OrderTracking.jsx
import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetOrderQuery, useCancelOrderMutation } from '../../store/api/marketplaceApiSlice';
import socketService from '../../services/socketService';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import GlassCard from '../../components/ui/GlassCard';
import ConfirmModal from '../../components/ui/ConfirmModal';
import GlobalSkeleton, { SkeletonBone } from '../../components/ui/GlobalSkeleton';
import THEME from '../../theme/theme';

const STATUS_MAP = {
  'pending': { label: 'En attente', icon: 'clock-outline', color: THEME.COLORS.warning, step: 0 },
  'confirmed': { label: 'Confirmée', icon: 'check-circle-outline', color: THEME.COLORS.success, step: 1 },
  'searching': { label: 'Recherche livreur', icon: 'magnify', color: THEME.COLORS.info, step: 2 },
  'picked_up': { label: 'En livraison', icon: 'bike', color: THEME.COLORS.primary, step: 3 },
  'delivered': { label: 'Livrée', icon: 'flag-checkered', color: THEME.COLORS.success, step: 4 },
  'cancelled': { label: 'Annulée', icon: 'close-circle-outline', color: THEME.COLORS.danger, step: -1 },
  'rejected': { label: 'Refusée', icon: 'alert-circle-outline', color: THEME.COLORS.warning, step: -1 }
};

const OrderTracking = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { orderId } = route.params;
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const { data: orderData, isLoading, refetch } = useGetOrderQuery(orderId);
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();
  const order = orderData?.data;

  // TEMPS RÉEL: Ecouter les mises à jour de statut
  useEffect(() => {
    socketService.on('order_updated', (updatedOrder) => {
      if (updatedOrder._id === orderId) {
        refetch();
      }
    });
    return () => socketService.off('order_updated');
  }, [orderId]);

  const handleCancel = async () => {
    try {
      await cancelOrder(orderId).unwrap();
      setShowCancelModal(false);
    } catch (err) {
      setShowCancelModal(false);
    }
  };

  const renderSkeleton = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.skeletonCard}>
        <SkeletonBone width={80} height={80} borderRadius={40} style={{ alignSelf: 'center' }} />
        <SkeletonBone width="60%" height={24} borderRadius={10} style={{ alignSelf: 'center', marginTop: 20 }} />
        <SkeletonBone width="40%" height={16} borderRadius={8} style={{ alignSelf: 'center', marginTop: 10 }} />
      </View>
      <View style={styles.skeletonCard}>
        <SkeletonBone width="30%" height={20} borderRadius={10} style={{ marginBottom: 20 }} />
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <SkeletonBone width={24} height={24} borderRadius={12} />
            <SkeletonBone width="70%" height={16} borderRadius={8} style={{ marginLeft: 15 }} />
          </View>
        ))}
      </View>
    </ScrollView>
  );

  if (isLoading) return (
    <ScreenWrapper style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Suivi de commande</Text>
      </View>
      {renderSkeleton()}
    </ScreenWrapper>
  );

  if (!order) return <View style={styles.center}><Text style={{color: THEME.COLORS.textPrimary}}>Commande introuvable</Text></View>;

  const currentStatus = STATUS_MAP[order.status] || STATUS_MAP['pending'];

  const renderStep = (step, title, isCompleted, isLast = false) => (
    <View style={styles.stepRow}>
      <View style={styles.stepIndicator}>
        <View style={[styles.circle, isCompleted && styles.completedCircle]}>
          {isCompleted && <Ionicons name="checkmark" size={16} color={THEME.COLORS.textInverse} />}
        </View>
        {!isLast && <View style={[styles.line, isCompleted && styles.completedLine]} />}
      </View>
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, isCompleted && styles.completedText]}>{title}</Text>
      </View>
    </View>
  );

  return (
    <ScreenWrapper style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Suivi de commande</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <GlassCard style={styles.statusCard}>
          <View style={[styles.statusIconBg, { backgroundColor: currentStatus.color + '20' }]}>
            <MaterialCommunityIcons name={currentStatus.icon} size={40} color={currentStatus.color} />
          </View>
          <Text style={styles.statusLabel}>{currentStatus.label}</Text>
          <Text style={styles.orderNumber}>Commande #{order._id.slice(-6).toUpperCase()}</Text>
        </GlassCard>

        <GlassCard style={styles.timelineCard}>
          <Text style={styles.sectionTitle}>Progression</Text>
          <View style={styles.timeline}>
            {renderStep(0, "Commande passée", true)}
            {renderStep(1, "Confirmation vendeur", order.confirmedAt)}
            {renderStep(2, "Attribution livreur", order.driver)}
            {renderStep(3, "En cours de livraison", order.pickedUpAt)}
            {renderStep(4, "Livré", order.deliveredAt, true)}
          </View>
        </GlassCard>

        <GlassCard style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Détails</Text>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.quantity}x</Text>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>{(item.price * item.quantity).toLocaleString()} F</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total payé (Cash)</Text>
            <Text style={styles.totalValue}>{order.totalPrice.toLocaleString()} F</Text>
          </View>
        </GlassCard>

        {order.status === 'pending' && (
          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={() => setShowCancelModal(true)}
          >
            <Text style={styles.cancelText}>Annuler la commande</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ConfirmModal 
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        isLoading={isCancelling}
        title="Annuler la commande ?"
        message="Cette action est irréversible. Voulez-vous vraiment annuler ?"
        confirmText="Oui, annuler"
        type="danger"
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: THEME.COLORS.glassSurface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.COLORS.border },
  title: { fontSize: 20, fontWeight: 'bold', color: THEME.COLORS.textPrimary, marginLeft: 15 },
  scrollContent: { padding: 20 },
  statusCard: { padding: 30, alignItems: 'center', marginBottom: 20 },
  statusIconBg: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  statusLabel: { fontSize: 22, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  orderNumber: { fontSize: 14, color: THEME.COLORS.textTertiary, marginTop: 5 },
  timelineCard: { padding: 25, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: THEME.COLORS.primary, marginBottom: 25, letterSpacing: 1, textTransform: 'uppercase' },
  timeline: { paddingLeft: 5 },
  stepRow: { flexDirection: 'row', minHeight: 70 },
  stepIndicator: { alignItems: 'center', marginRight: 20 },
  circle: { 
    width: 26, 
    height: 26, 
    borderRadius: 13, 
    borderWidth: 2, 
    borderColor: THEME.COLORS.border, 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  completedCircle: { 
    borderColor: THEME.COLORS.primary, 
    backgroundColor: THEME.COLORS.primary,
    shadowColor: THEME.COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5
  },
  line: { width: 2, flex: 1, backgroundColor: THEME.COLORS.border, marginVertical: 4, opacity: 0.5 },
  completedLine: { backgroundColor: THEME.COLORS.primary, opacity: 1 },
  stepContent: { paddingTop: 3 },
  stepTitle: { fontSize: 15, color: THEME.COLORS.textTertiary, fontWeight: '500' },
  completedText: { color: THEME.COLORS.textPrimary, fontWeight: '700' },
  detailsCard: { padding: 20, marginBottom: 20 },
  itemRow: { flexDirection: 'row', marginBottom: 10 },
  itemQty: { color: THEME.COLORS.primary, fontWeight: 'bold', width: 30 },
  itemName: { color: THEME.COLORS.textSecondary, flex: 1 },
  itemPrice: { color: THEME.COLORS.textPrimary },
  divider: { height: 1, backgroundColor: THEME.COLORS.border, marginVertical: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { color: THEME.COLORS.textSecondary },
  totalValue: { color: THEME.COLORS.primary, fontWeight: 'bold', fontSize: 18 },
  cancelBtn: { padding: 15, alignItems: 'center', borderRadius: 15, borderWidth: 1, borderColor: THEME.COLORS.danger, marginBottom: 30 },
  cancelText: { color: THEME.COLORS.danger, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.COLORS.background },
  skeletonCard: { 
    padding: 25, 
    backgroundColor: THEME.COLORS.glassSurface, 
    borderRadius: 25, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: THEME.COLORS.border 
  }
});

export default OrderTracking;
