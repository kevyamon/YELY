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
  useColorScheme
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
  const colorScheme = useColorScheme();
  
  const isDarkMode = colorScheme === 'dark';
  const dynamicBg = isDarkMode ? '#000000' : '#F8F9FA';
  const dynamicTextColor = isDarkMode ? '#FFFFFF' : '#1A1A1A';
  const dynamicTextColorSec = isDarkMode ? '#CCCCCC' : '#555555';
  
  const dynamicItemStyle = {
    backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.25)' : 'rgba(212, 175, 55, 0.4)',
  };

  const dynamicSummaryCardStyle = {
    backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.25)' : 'rgba(212, 175, 55, 0.4)',
  };

  const dynamicBackBtnStyle = {
    backgroundColor: isDarkMode ? 'rgba(18, 18, 18, 0.85)' : 'rgba(255, 255, 255, 0.85)',
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    navigation.navigate('Checkout');
  };

  const renderItem = ({ item }) => (
    <GlassCard style={[styles.cartItem, dynamicItemStyle]}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: dynamicTextColor, textShadowColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'transparent' }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.itemSeller, { color: dynamicTextColorSec }]} numberOfLines={1}>Vendu par {item.sellerName || 'Boutique'}</Text>
        <Text style={[styles.itemPrice, { color: THEME.COLORS.primary, textShadowColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'transparent' }]}>{item.price.toLocaleString()} F</Text>
        
        <View style={styles.quantityRow}>
          <View style={styles.quantitySelector}>
            <TouchableOpacity 
              style={styles.qtyBtn} 
              onPress={() => dispatch(updateQuantity({ id: item.id, quantity: Math.max(1, item.quantity - 1) }))}
            >
              <Ionicons name="remove" size={18} color={THEME.COLORS.primary} />
            </TouchableOpacity>
            <Text style={[styles.qtyText, { color: dynamicTextColor }]}>{item.quantity}</Text>
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
      <Text style={[styles.emptyTitle, { color: dynamicTextColor }]}>Votre panier est vide</Text>
      <Text style={[styles.emptySubtitle, { color: dynamicTextColorSec }]}>Découvrez nos meilleurs produits et faites-vous plaisir !</Text>
      <TouchableOpacity 
        style={styles.exploreBtn}
        onPress={() => navigation.navigate('MarketplaceHub')}
      >
        <Text style={styles.exploreText}>EXPLORER LE MARCHÉ</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenWrapper 
      backgroundColor={dynamicBg}
      style={{ flex: 1 }}
    >
      <View style={[styles.header, { paddingTop: 10, backgroundColor: dynamicBg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, dynamicBackBtnStyle]}>
          <Ionicons name="chevron-back" size={24} color={dynamicTextColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: dynamicTextColor }]}>Mon Panier</Text>
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
          <GlassCard style={[styles.summaryCard, dynamicSummaryCardStyle]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: dynamicTextColorSec }]}>Total Articles</Text>
              <Text style={[styles.summaryValue, { color: dynamicTextColor }]}>{totalAmount.toLocaleString()} F</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: dynamicTextColorSec }]}>Livraison</Text>
              <Text style={[styles.summaryValue, { color: THEME.COLORS.success }]}>Calculé au checkout</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.2)' : 'rgba(212, 175, 55, 0.35)' }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: dynamicTextColor }]}>TOTAL ESTIMÉ</Text>
              <Text style={[styles.totalValue, { color: THEME.COLORS.primary }]}>{totalAmount.toLocaleString()} F</Text>
            </View>
          </GlassCard>
          
          <GoldButton 
            title="CONFIRMER LA COMMANDE" 
            onPress={handleCheckout}
            icon="chevron-forward"
          />
        </View>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingBottom: 20,
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
  },
  title: { fontSize: 20, fontWeight: 'bold' },
  clearText: { color: THEME.COLORS.danger, fontSize: 14, fontWeight: '600' },
  listContent: { padding: 20 },
  cartItem: { 
    flexDirection: 'row', 
    padding: 12, 
    marginBottom: 15, 
    borderRadius: 18,
    borderWidth: 1,
  },
  itemImage: { width: 90, height: 90, borderRadius: 12, backgroundColor: THEME.COLORS.overlay },
  itemInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  itemName: { fontSize: 16, fontWeight: 'bold', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 2 },
  itemSeller: { fontSize: 12, marginTop: 2 },
  itemPrice: { fontSize: 17, fontWeight: '800', marginTop: 4, textShadowOffset: {width: 0, height: 1}, textShadowRadius: 2 },
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
  qtyText: { fontWeight: 'bold', marginHorizontal: 10, fontSize: 16 },
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
    ...THEME.SHADOWS.goldSoft
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: 'bold' },
  divider: { height: 1, marginVertical: 12 },
  totalLabel: { fontSize: 15, fontWeight: '800' },
  totalValue: { fontSize: 22, fontWeight: '900' },
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
  emptyTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  emptySubtitle: { textAlign: 'center', paddingHorizontal: 50, lineHeight: 22, marginBottom: 35 },
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
