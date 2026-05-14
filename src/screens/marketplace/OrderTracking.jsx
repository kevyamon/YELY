// src/screens/marketplace/OrderTracking.jsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import OrderStatusTimeline from '../../components/marketplace/OrderStatusTimeline';
import { marketplaceApiSlice } from '../../store/api/marketplaceApiSlice';
import THEME from '../../theme/theme';

const OrderTracking = ({ route, navigation }) => {
  const { orderId } = route.params;
  
  // Utilisation de useGetMyOrdersQuery pour trouver la commande spécifique
  const { data, isLoading } = marketplaceApiSlice.useGetMyOrdersQuery();
  const order = data?.data?.find(o => o._id === orderId);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME.COLORS.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Commande introuvable</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <MaterialCommunityIcons name="close" size={24} color={THEME.COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Suivi de commande</Text>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialCommunityIcons name="help-circle-outline" size={24} color={THEME.COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderNumber}>Commande #{order._id.slice(-6).toUpperCase()}</Text>
              <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={[styles.statusBadge, order.status === 'cancelled' && styles.statusBadgeError]}>
              <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <OrderStatusTimeline currentStatus={order.status} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Récapitulatif</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.quantity}x</Text>
              <Text style={styles.itemName}>{item.product?.name || 'Produit'}</Text>
              <Text style={styles.itemPrice}>{item.priceAtPurchase * item.quantity} FCFA</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total payé (Cash)</Text>
            <Text style={styles.totalValue}>{order.totalPrice} FCFA</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Infos Livraison</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker" size={20} color={THEME.COLORS.primary} />
            <Text style={styles.infoText}>{order.deliveryAddress?.address || 'Adresse de livraison'}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="store" size={20} color={THEME.COLORS.primary} />
            <Text style={styles.infoText}>Vendeur: {order.seller?.name || 'Partenaire Yély'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.supportBtn}>
          <MaterialCommunityIcons name="chat-outline" size={20} color={THEME.COLORS.primary} />
          <Text style={styles.supportBtnText}>Besoin d'aide ? Contacter le support</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingVertical: THEME.SPACING.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.COLORS.glassSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: THEME.FONTS.sizes.h3,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
  },
  scrollContent: {
    padding: THEME.SPACING.xl,
  },
  card: {
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: THEME.BORDERS.radius.xl,
    padding: THEME.SPACING.xl,
    marginBottom: THEME.SPACING.lg,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    ...THEME.SHADOWS.soft,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: THEME.FONTS.sizes.body,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
  },
  orderDate: {
    fontSize: THEME.FONTS.sizes.caption,
    color: THEME.COLORS.textTertiary,
  },
  statusBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeError: {
    backgroundColor: 'rgba(192, 57, 43, 0.15)',
  },
  statusText: {
    color: THEME.COLORS.primary,
    fontSize: 10,
    fontWeight: THEME.FONTS.weights.bold,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.COLORS.border,
    marginVertical: THEME.SPACING.lg,
  },
  sectionTitle: {
    fontSize: THEME.FONTS.sizes.body,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
    marginBottom: THEME.SPACING.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.SPACING.sm,
  },
  itemQty: {
    width: 30,
    fontSize: THEME.FONTS.sizes.bodySmall,
    color: THEME.COLORS.primary,
    fontWeight: THEME.FONTS.weights.bold,
  },
  itemName: {
    flex: 1,
    fontSize: THEME.FONTS.sizes.bodySmall,
    color: THEME.COLORS.textSecondary,
  },
  itemPrice: {
    fontSize: THEME.FONTS.sizes.bodySmall,
    color: THEME.COLORS.textPrimary,
    fontWeight: THEME.FONTS.weights.medium,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: THEME.FONTS.sizes.body,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
  },
  totalValue: {
    fontSize: THEME.FONTS.sizes.h3,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.SPACING.sm,
  },
  infoText: {
    marginLeft: THEME.SPACING.md,
    fontSize: THEME.FONTS.sizes.bodySmall,
    color: THEME.COLORS.textSecondary,
    flex: 1,
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.SPACING.lg,
  },
  supportBtnText: {
    marginLeft: 8,
    color: THEME.COLORS.primary,
    fontWeight: THEME.FONTS.weights.bold,
    fontSize: THEME.FONTS.sizes.bodySmall,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.background,
  },
  errorText: {
    color: THEME.COLORS.textSecondary,
    marginBottom: THEME.SPACING.lg,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: THEME.COLORS.primary,
    borderRadius: 20,
  },
  backBtnText: {
    color: THEME.COLORS.textInverse,
    fontWeight: 'bold',
  }
});

export default OrderTracking;
