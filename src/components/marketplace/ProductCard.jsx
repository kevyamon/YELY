// src/components/marketplace/ProductCard.jsx
// CARTE PRODUIT PREMIUM - Avec Carrousel Auto-Play & Sélecteur Panier Dynamique
// CSCSM Level: Bank Grade

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  useWindowDimensions,
  Platform
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, removeFromCart, updateQuantity, selectCartItems } from '../../store/slices/cartSlice';
import { showToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const ProductCard = ({ product, onPress, cardWidth }) => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 600;
  const dynamicCardWidth = cardWidth || (isLargeScreen ? 220 : (width - THEME.SPACING.xl * 3) / 2);

  const isSoldOut = product.isSoldOut || (product.category !== 'Food' && product.manageStock && product.stockCount === 0);
  const dispatch = useDispatch();
  const images = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);

  // Verification de la presence dans le panier
  const cartItems = useSelector(selectCartItems);
  const cartItem = cartItems.find(item => item.id === product._id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    if (isSoldOut) return;

    if (product.category !== 'Food' && product.manageStock) {
      const availableStock = product.stockCount || 0;
      if (quantityInCart >= availableStock) {
        dispatch(showToast({
          type: 'warning',
          title: 'Stock limite atteint',
          message: `Désolé, il n'y a que ${availableStock} articles disponibles en stock.`
        }));
        return;
      }
    }

    if (quantityInCart > 0) {
      dispatch(updateQuantity({ id: product._id, quantity: quantityInCart + 1 }));
    } else {
      dispatch(addToCart({ product, quantity: 1 }));
      dispatch(showToast({
        type: 'success',
        title: 'Ajouté',
        message: `${product.name} est dans votre panier.`
      }));
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (quantityInCart > 1) {
      dispatch(updateQuantity({ id: product._id, quantity: quantityInCart - 1 }));
    } else {
      dispatch(removeFromCart(product._id));
      dispatch(showToast({
        type: 'info',
        title: 'Retire',
        message: `${product.name} retire du panier.`
      }));
    }
  };

  const imageHeight = dynamicCardWidth * 0.78;

  return (
    <TouchableOpacity 
      style={[styles.card, { width: dynamicCardWidth }, isSoldOut && styles.soldOutCard]} 
      onPress={onPress}
      activeOpacity={0.9}
      disabled={isSoldOut}
    >
      <View style={[styles.imageContainer, { height: imageHeight }]}>
        {images.length > 0 ? (
          <Image 
            source={{ uri: images[0] }} 
            style={{ width: dynamicCardWidth, height: imageHeight, resizeMode: 'cover' }} 
          />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialCommunityIcons name="image-outline" size={40} color={THEME.COLORS.textTertiary} />
          </View>
        )}
        
        {isSoldOut && (
          <View style={styles.soldOutBadge}>
            <Text style={styles.soldOutText}>EPUISE</Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.price}>{product.price.toLocaleString()} FCFA</Text>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        
        {product.category === 'Food' ? (
          <Text style={[styles.stockTextMini, { color: '#10B981' }]}>Toujours dispo</Text>
        ) : isSoldOut ? (
          <Text style={[styles.stockTextMini, { color: THEME.COLORS.danger }]}>Épuisé</Text>
        ) : product.stockCount <= 5 ? (
          <Text style={[styles.stockTextMini, { color: '#F59E0B' }]}>Stock limité ({product.stockCount})</Text>
        ) : (
          <Text style={[styles.stockTextMini, { color: THEME.COLORS.primary }]}>En stock ({product.stockCount})</Text>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.seller} numberOfLines={1}>{product.seller?.name || 'Vendeur'}</Text>
          <View style={styles.ratingContainer}>
            <MaterialCommunityIcons name="star" size={12} color={THEME.COLORS.primary} />
            <Text style={styles.rating}>{product.rating || '5.0'}</Text>
          </View>
        </View>
      </View>
      
      {/* BOUTON PANIER DYNAMIQUE */}
      <View style={styles.actionContainer}>
        {quantityInCart > 0 ? (
          <View style={styles.quantitySelector}>
            <TouchableOpacity style={styles.miniBtn} onPress={handleRemove}>
              <Ionicons name="remove" size={16} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantityInCart}</Text>
            <TouchableOpacity style={styles.miniBtn} onPress={handleAdd}>
              <Ionicons name="add" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <MaterialCommunityIcons name="cart-plus" size={18} color={THEME.COLORS.textInverse} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: THEME.COLORS.glassSurface, borderRadius: 20, marginBottom: THEME.SPACING.lg, borderWidth: 1, borderColor: THEME.COLORS.border, overflow: 'hidden', ...THEME.SHADOWS.soft },
  soldOutCard: { opacity: 0.6 },
  imageContainer: { width: '100%', backgroundColor: THEME.COLORS.overlay },
  placeholderImage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pagination: { position: 'absolute', bottom: 8, flexDirection: 'row', alignSelf: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  activeDot: { backgroundColor: THEME.COLORS.primary, width: 12 },
  soldOutBadge: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  soldOutText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 10 },
  infoContainer: { padding: 12 },
  price: { fontSize: 14, fontWeight: '700', color: THEME.COLORS.primary },
  name: { fontSize: 12, fontWeight: '500', color: THEME.COLORS.textPrimary, marginVertical: 3 },
  stockTextMini: { fontSize: 8.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1, marginBottom: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  seller: { fontSize: 9, color: THEME.COLORS.textTertiary, flex: 1 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  rating: { fontSize: 9, color: THEME.COLORS.textSecondary, marginLeft: 2 },
  
  actionContainer: { position: 'absolute', bottom: 8, right: 8 },
  addButton: { 
    backgroundColor: THEME.COLORS.primary, 
    width: 32, 
    height: 32, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center', 
    ...THEME.SHADOWS.goldSoft 
  },
  quantitySelector: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: THEME.COLORS.primary, 
    borderRadius: 10, 
    height: 32, 
    paddingHorizontal: 4,
    ...THEME.SHADOWS.goldSoft
  },
  miniBtn: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  quantityText: { color: THEME.COLORS.deepAsphalt, fontWeight: 'bold', fontSize: 13, marginHorizontal: 6 },
});

export default ProductCard;
