// src/screens/marketplace/Cart.jsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image,
  Dimensions,
  StatusBar
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectCartItems, 
  selectCartTotal, 
  removeFromCart, 
  updateQuantity,
  clearCart
} from '../../store/slices/cartSlice';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import GlassCard from '../../components/ui/GlassCard';
import GoldButton from '../../components/ui/GoldButton';
import THEME from '../../theme/theme';

const { width } = Dimensions.get('window');

const Cart = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const totalAmount = useSelector(selectCartTotal);

  const handleCheckout = () => {
    if (items.length === 0) return;
    navigation.navigate('Checkout');
  };

  const renderItem = ({ item }) => (
    <GlassCard style={styles.cartItem}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemSeller} numberOfLines={1}>Vendu par {item.sellerName || 'Boutique'}</Text>
        <Text style={styles.itemPrice}>{item.price.toLocaleString()} F</Text>
        
        <View style={styles.quantityRow}>
          <View style={styles.quantitySelector}>
            <TouchableOpacity 
              style={styles.qtyBtn} 
              onPress={() => dispatch(updateQuantity({ id: item.id, quantity: Math.max(1, item.quantity - 1) }))}
            >
              <Ionicons name="remove" size={18} color={THEME.COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity 
              style={styles.qtyBtn} 
              onPress={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
            >
              <Ionicons name="add" size={18} color={THEME.COLORS.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.removeBtn}
            onPress={() => dispatch(removeFromCart(item.id))}
          >
            <MaterialCommunityIcons name="delete-outline" size={22} color={THEME.COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </GlassCard>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBg}>
        <MaterialCommunityIcons name="cart-off" size={64} color={THEME.COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>Votre panier est vide</Text>
      <Text style={styles.emptySubtitle}>Découvrez nos meilleurs produits et faites-vous plaisir !</Text>
      <TouchableOpacity 
        style={styles.exploreBtn}
        onPress={() => navigation.navigate('MarketplaceHub')}
      >
        <Text style={styles.exploreText}>EXPLORER LE MARCHÉ</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={THEME.COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Mon Panier</Text>
        {items.length > 0 ? (
          <TouchableOpacity onPress={() => dispatch(clearCart())}>
            <Text style={styles.clearText}>Vider</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 40 }} />}
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 250 }]}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      {items.length > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <GlassCard style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Articles</Text>
              <Text style={styles.summaryValue}>{totalAmount.toLocaleString()} F</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Livraison</Text>
              <Text style={[styles.summaryValue, { color: '#27ae60' }]}>Calculé au checkout</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>TOTAL ESTIMÉ</Text>
              <Text style={styles.totalValue}>{totalAmount.toLocaleString()} F</Text>
            </View>
          </GlassCard>
          
          <GoldButton 
            title="CONFIRMER LA COMMANDE" 
            onPress={handleCheckout}
            icon="chevron-forward"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingBottom: 20,
    backgroundColor: THEME.COLORS.background
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: THEME.COLORS.glassSurface, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.border
  },
  title: { fontSize: 20, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  clearText: { color: THEME.COLORS.danger, fontSize: 14, fontWeight: '600' },
  listContent: { padding: 20 },
  cartItem: { 
    flexDirection: 'row', 
    padding: 12, 
    marginBottom: 15, 
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
  },
  itemImage: { width: 90, height: 90, borderRadius: 12, backgroundColor: THEME.COLORS.overlay },
  itemInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  itemName: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 2 },
  itemSeller: { color: '#CCCCCC', fontSize: 12, marginTop: 2 },
  itemPrice: { color: '#D4AF37', fontSize: 17, fontWeight: '800', marginTop: 4, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 2 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  quantitySelector: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(212, 175, 55, 0.15)', 
    borderRadius: 8, 
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)'
  },
  qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  qtyText: { color: THEME.COLORS.textPrimary, fontWeight: 'bold', marginHorizontal: 10, fontSize: 16 },
  removeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  footer: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    backgroundColor: 'transparent'
  },
  summaryCard: { 
    padding: 20, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    ...THEME.SHADOWS.goldSoft
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { color: '#BBBBBB', fontSize: 14 },
  summaryValue: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: 'rgba(212, 175, 55, 0.3)', marginVertical: 12 },
  totalLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  totalValue: { color: '#D4AF37', fontSize: 22, fontWeight: '900' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 120 },
  emptyIconBg: { 
    width: 140, 
    height: 140, 
    borderRadius: 70, 
    backgroundColor: 'rgba(212, 175, 55, 0.05)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)'
  },
  emptyTitle: { color: THEME.COLORS.textPrimary, fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  emptySubtitle: { color: THEME.COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 50, lineHeight: 22, marginBottom: 35 },
  exploreBtn: { 
    backgroundColor: THEME.COLORS.primary, 
    paddingHorizontal: 35, 
    paddingVertical: 18, 
    borderRadius: THEME.BORDERS.radius.pill,
    ...THEME.SHADOWS.gold
  },
  exploreText: { color: THEME.COLORS.deepAsphalt, fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});

export default Cart;
