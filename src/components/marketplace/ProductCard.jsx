// src/components/marketplace/ProductCard.jsx
// CARTE PRODUIT PREMIUM - Avec Carrousel Auto-Play & Sélecteur Panier Dynamique
// CSCSM Level: Bank Grade

import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  FlatList,
  Platform
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, removeFromCart, updateQuantity, selectCartItems } from '../../store/slices/cartSlice';
import { showToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Platform.OS === 'web' ? 220 : (width - THEME.SPACING.xl * 3) / 2;

const ProductCard = ({ product, onPress }) => {
  const isSoldOut = product.isSoldOut;
  const dispatch = useDispatch();
  const flatListRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const images = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);

  // Vérification de la présence dans le panier
  const cartItems = useSelector(selectCartItems);
  const cartItem = cartItems.find(item => item.id === product._id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  // AUTO-PLAY LOGIC
  useEffect(() => {
    if (images.length <= 1 || isSoldOut) return;

    const interval = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= images.length) {
        nextIndex = 0;
      }
      
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeIndex, images.length, isSoldOut]);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / CARD_WIDTH);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handleAdd = (e) => {
    e.stopPropagation();
    if (isSoldOut) return;

    if (quantityInCart > 0) {
      dispatch(updateQuantity({ id: product._id, quantity: quantityInCart + 1 }));
    } else {
      dispatch(addToCart({ product, quantity: 1 }));
      dispatch(showToast({
        type: 'success',
        title: 'Ajouté !',
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
        title: 'Retiré',
        message: `${product.name} retiré du panier.`
      }));
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.card, isSoldOut && styles.soldOutCard]} 
      onPress={onPress}
      activeOpacity={0.9}
      disabled={isSoldOut}
    >
      <View style={styles.imageContainer}>
        {images.length > 0 ? (
          <>
            <FlatList
              ref={flatListRef}
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              keyExtractor={(_, index) => `img-${index}`}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.image} />
              )}
            />
            {images.length > 1 && (
              <View style={styles.pagination}>
                {images.map((_, i) => (
                  <View 
                    key={i} 
                    style={[styles.dot, activeIndex === i && styles.activeDot]} 
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialCommunityIcons name="image-outline" size={40} color={THEME.COLORS.textTertiary} />
          </View>
        )}
        
        {isSoldOut && (
          <View style={styles.soldOutBadge}>
            <Text style={styles.soldOutText}>ÉPUISÉ</Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.price}>{product.price.toLocaleString()} FCFA</Text>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        
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
  card: { width: CARD_WIDTH, backgroundColor: THEME.COLORS.glassSurface, borderRadius: 20, marginBottom: THEME.SPACING.lg, borderWidth: 1, borderColor: THEME.COLORS.border, overflow: 'hidden', ...THEME.SHADOWS.soft },
  soldOutCard: { opacity: 0.6 },
  imageContainer: { width: '100%', height: CARD_WIDTH, backgroundColor: THEME.COLORS.overlay },
  image: { width: CARD_WIDTH, height: CARD_WIDTH, resizeMode: 'cover' },
  placeholderImage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pagination: { position: 'absolute', bottom: 8, flexDirection: 'row', alignSelf: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  activeDot: { backgroundColor: THEME.COLORS.primary, width: 12 },
  soldOutBadge: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  soldOutText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 10 },
  infoContainer: { padding: 12 },
  price: { fontSize: 16, fontWeight: 'bold', color: THEME.COLORS.primary },
  name: { fontSize: 13, fontWeight: '600', color: THEME.COLORS.textPrimary, marginVertical: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  seller: { fontSize: 10, color: THEME.COLORS.textTertiary, flex: 1 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  rating: { fontSize: 10, color: THEME.COLORS.textSecondary, marginLeft: 2 },
  
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
