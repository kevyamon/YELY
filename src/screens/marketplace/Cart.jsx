// src/screens/marketplace/Cart.jsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image,
  Alert,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { 
  selectCartItems, 
  selectCartTotal, 
  removeFromCart, 
  updateQuantity,
  clearCart 
} from '../../store/slices/cartSlice';
import { useCreateOrderMutation } from '../../store/api/marketplaceApiSlice';
import THEME from '../../theme/theme';

const Cart = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const totalAmount = useSelector(selectCartTotal);
  const [createOrder, { isLoading }] = useCreateOrderMutation();

  const handleCheckout = async () => {
    if (items.length === 0) return;

    try {
      // Pour cette v1, on prend le premier vendeur (on pourra gérer le multi-vendeur plus tard)
      const sellerId = items[0].sellerId;
      
      const orderData = {
        seller: sellerId,
        items: items.map(item => ({
          product: item.id,
          quantity: item.quantity,
          priceAtPurchase: item.price
        })),
        itemsPrice: totalAmount,
        deliveryAddress: {
          address: "Position actuelle", // On pourra brancher le sélecteur de map plus tard
          coordinates: [0, 0] // MOCK: Enverra une très grande distance (plafonnée à 300 FCFA par le backend)
        }
      };

      const result = await createOrder(orderData).unwrap();
      if (result.success) {
        dispatch(clearCart());
        navigation.navigate('OrderTracking', { orderId: result.data._id });
      }
    } catch (error) {
      Alert.alert('Erreur', error.data?.message || 'Impossible de passer la commande');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>{item.price} FCFA</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            onPress={() => dispatch(updateQuantity({ id: item.id, quantity: Math.max(1, item.quantity - 1) }))}
            style={styles.qtyBtn}
          >
            <MaterialCommunityIcons name="minus" size={16} color={THEME.COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity 
            onPress={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
            style={styles.qtyBtn}
          >
            <MaterialCommunityIcons name="plus" size={16} color={THEME.COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity onPress={() => dispatch(removeFromCart(item.id))} style={styles.removeBtn}>
        <MaterialCommunityIcons name="trash-can-outline" size={24} color={THEME.COLORS.danger} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: THEME.COLORS.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={[styles.header, { paddingTop: insets.top + THEME.SPACING.md }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Mon Panier</Text>
        </View>
        <TouchableOpacity onPress={() => dispatch(clearCart())}>
          <Text style={styles.clearText}>Vider</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="cart-outline" size={80} color={THEME.COLORS.textTertiary} />
            <Text style={styles.emptyText}>Votre panier est vide</Text>
            <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('MarketplaceHub')}>
              <Text style={styles.shopBtnText}>Découvrir les produits</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sous-total</Text>
            <Text style={styles.summaryValue}>{totalAmount} FCFA</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Livraison (Est.)</Text>
            <Text style={styles.summaryValue}>100 - 300 FCFA</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total (Est.)</Text>
            <Text style={styles.totalValue}>{totalAmount + 100} - {totalAmount + 300} FCFA</Text>
          </View>

          <TouchableOpacity 
            style={[styles.checkoutBtn, isLoading && { opacity: 0.7 }]} 
            onPress={handleCheckout}
            disabled={isLoading}
          >
            <Text style={styles.checkoutBtnText}>
              {isLoading ? 'Traitement...' : 'Passer la commande (Cash)'}
            </Text>
            <MaterialCommunityIcons name="check-circle" size={20} color={THEME.COLORS.textInverse} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      )}
    </View>
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
  backButton: {
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
  listContent: {
    padding: THEME.SPACING.xl,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: THEME.BORDERS.radius.lg,
    padding: THEME.SPACING.md,
    marginBottom: THEME.SPACING.md,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: THEME.BORDERS.radius.sm,
  },
  itemInfo: {
    flex: 1,
    marginLeft: THEME.SPACING.md,
  },
  itemName: {
    fontSize: THEME.FONTS.sizes.body,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
  },
  itemPrice: {
    fontSize: THEME.FONTS.sizes.bodySmall,
    color: THEME.COLORS.primary,
    fontWeight: THEME.FONTS.weights.semiBold,
    marginVertical: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.COLORS.background,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    paddingHorizontal: THEME.SPACING.md,
    fontSize: THEME.FONTS.sizes.bodySmall,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
  },
  removeBtn: {
    justifyContent: 'center',
    paddingLeft: THEME.SPACING.md,
  },
  footer: {
    backgroundColor: THEME.COLORS.glassModal,
    paddingHorizontal: THEME.SPACING.xl,
    paddingTop: THEME.SPACING.lg,
    paddingBottom: THEME.SPACING.xxl,
    borderTopWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: THEME.COLORS.textSecondary,
    fontSize: THEME.FONTS.sizes.bodySmall,
  },
  summaryValue: {
    color: THEME.COLORS.textPrimary,
    fontSize: THEME.FONTS.sizes.bodySmall,
    fontWeight: THEME.FONTS.weights.medium,
  },
  totalRow: {
    marginTop: THEME.SPACING.sm,
    paddingTop: THEME.SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.COLORS.border,
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
  checkoutBtn: {
    backgroundColor: THEME.COLORS.primary,
    height: 54,
    borderRadius: THEME.BORDERS.radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: THEME.SPACING.lg,
    ...THEME.SHADOWS.gold,
  },
  checkoutBtnText: {
    color: THEME.COLORS.textInverse,
    fontSize: THEME.FONTS.sizes.body,
    fontWeight: THEME.FONTS.weights.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: THEME.FONTS.sizes.h3,
    color: THEME.COLORS.textTertiary,
    marginTop: THEME.SPACING.xl,
  },
  shopBtn: {
    marginTop: THEME.SPACING.xxl,
    paddingHorizontal: THEME.SPACING.xxl,
    paddingVertical: THEME.SPACING.md,
    backgroundColor: THEME.COLORS.primary,
    borderRadius: THEME.BORDERS.radius.pill,
  },
  shopBtnText: {
    color: THEME.COLORS.textInverse,
    fontWeight: THEME.FONTS.weights.bold,
  }
});

export default Cart;
