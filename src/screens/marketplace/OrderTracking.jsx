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
import { useGetOrderQuery } from '../../store/api/marketplaceApiSlice';
import socketService from '../../services/socketService';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import GlassCard from '../../components/ui/GlassCard';
import THEME from '../../theme/theme';

const STATUS_MAP = {
  'pending': { label: 'En attente', icon: 'clock-outline', color: '#f39c12', step: 0 },
  'confirmed': { label: 'Confirmée', icon: 'check-circle-outline', color: '#27ae60', step: 1 },
  'searching': { label: 'Recherche livreur', icon: 'magnify', color: '#3498db', step: 2 },
  'picked_up': { label: 'En livraison', icon: 'bike', color: '#9b59b6', step: 3 },
  'delivered': { label: 'Livrée', icon: 'flag-checkered', color: '#2ecc71', step: 4 },
  'cancelled': { label: 'Annulée', icon: 'close-circle-outline', color: '#e74c3c', step: -1 },
  'rejected': { label: 'Refusée', icon: 'alert-circle-outline', color: '#e67e22', step: -1 }
};

const OrderTracking = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { orderId } = route.params;
  const { data: orderData, isLoading, refetch } = useGetOrderQuery(orderId);
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

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME.COLORS.primary} /></View>;
  if (!order) return <View style={styles.center}><Text style={{color: '#FFF'}}>Commande introuvable</Text></View>;

  const currentStatus = STATUS_MAP[order.status] || STATUS_MAP['pending'];

  const renderStep = (step, title, isCompleted, isLast = false) => (
    <View style={styles.stepRow}>
      <View style={styles.stepIndicator}>
        <View style={[styles.circle, isCompleted && styles.completedCircle]}>
          {isCompleted && <Ionicons name="checkmark" size={16} color="#000" />}
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
          <Ionicons name="arrow-back" size={24} color="#FFF" />
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
          <TouchableOpacity style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Annuler la commande</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginLeft: 15 },
  scrollContent: { padding: 20 },
  statusCard: { padding: 30, alignItems: 'center', marginBottom: 20 },
  statusIconBg: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  statusLabel: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  orderNumber: { fontSize: 14, color: '#AAA', marginTop: 5 },
  timelineCard: { padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: THEME.COLORS.primary, marginBottom: 20 },
  timeline: { paddingLeft: 10 },
  stepRow: { flexDirection: 'row', minHeight: 60 },
  stepIndicator: { alignItems: 'center', marginRight: 20 },
  circle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#333', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  completedCircle: { borderColor: THEME.COLORS.primary, backgroundColor: THEME.COLORS.primary },
  line: { width: 2, flex: 1, backgroundColor: '#333', marginVertical: 4 },
  completedLine: { backgroundColor: THEME.COLORS.primary },
  stepContent: { paddingTop: 2 },
  stepTitle: { fontSize: 15, color: '#666', fontWeight: '500' },
  completedText: { color: '#FFF' },
  detailsCard: { padding: 20, marginBottom: 20 },
  itemRow: { flexDirection: 'row', marginBottom: 10 },
  itemQty: { color: THEME.COLORS.primary, fontWeight: 'bold', width: 30 },
  itemName: { color: '#CCC', flex: 1 },
  itemPrice: { color: '#FFF' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { color: '#AAA' },
  totalValue: { color: THEME.COLORS.primary, fontWeight: 'bold', fontSize: 18 },
  cancelBtn: { padding: 15, alignItems: 'center', borderRadius: 15, borderWidth: 1, borderColor: '#e74c3c', marginBottom: 30 },
  cancelText: { color: '#e74c3c', fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }
});

export default OrderTracking;
