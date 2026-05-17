// src/screens/marketplace/ProductDetails.jsx
// DETAILS PRODUIT PREMIUM - Design Minimaliste & Industriel
// CSCSM Level: Bank Grade

import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Dimensions, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator,
  StatusBar,
  useColorScheme,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';

import { useGetProductQuery } from '../../store/api/marketplaceApiSlice';
import { showToast } from '../../store/slices/uiSlice';
import { addToCart, selectCartItems, removeFromCart, updateQuantity } from '../../store/slices/cartSlice';
import useMarketplaceSocketEvents from '../../hooks/useMarketplaceSocketEvents';
import THEME from '../../theme/theme';
import GoldButton from '../../components/ui/GoldButton';
import GlassCard from '../../components/ui/GlassCard';
import GlassModal from '../../components/ui/GlassModal';

const { width, height } = Dimensions.get('window');
const IMG_HEIGHT = height * 0.42;

// Exact Category Mapping matching ProductList.jsx
const CATEGORY_LABELS = {
  'Food': 'Nourriture',
  'Supermarket': 'Supermarche',
  'Cosmetics': 'Cosmetiques',
  'Electronics': 'Electronique',
  'Home': 'Maison',
  'Other': 'Autres'
};

const ProductDetails = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  useMarketplaceSocketEvents();
  const cartItems = useSelector(selectCartItems);
  const { productId } = route.params;
  const { data: productData, isLoading, isError } = useGetProductQuery(productId);
  const colorScheme = useColorScheme();
  
  const isDarkMode = colorScheme === 'dark';
  
  const flatListRef = useRef(null);
  const modalScrollViewRef = useRef(null);
  
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isDescModalVisible, setIsDescModalVisible] = useState(false);
  const [showModalScrollTop, setShowModalScrollTop] = useState(false);

  const product = productData?.data;
  const images = product?.images && product?.images.length > 0 ? product.images : (product?.image ? [product.image] : []);

  const cartItem = cartItems.find(item => item.id === productId);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  // Diaporama automatique toutes les 5 secondes
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      let nextIndex = activeImage + 1;
      if (nextIndex >= images.length) {
        nextIndex = 0;
      }
      try {
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        setActiveImage(nextIndex);
      } catch (err) {
        // Fallback en cas d'erreur de chargement
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeImage, images.length]);

  const handleAdd = () => {
    if (quantityInCart > 0) {
      dispatch(updateQuantity({ id: productId, quantity: quantityInCart + 1 }));
    } else {
      setQuantity(q => q + 1);
    }
  };

  const handleRemove = () => {
    if (quantityInCart > 0) {
      if (quantityInCart > 1) {
        dispatch(updateQuantity({ id: productId, quantity: quantityInCart - 1 }));
      } else {
        dispatch(removeFromCart(productId));
        setQuantity(1);
        dispatch(showToast({
          type: 'info',
          title: 'Retire',
          message: `${product?.name || 'Produit'} retire du panier.`
        }));
      }
    } else {
      setQuantity(q => Math.max(1, q - 1));
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    const normalizedProduct = {
      ...product,
      _id: product._id || product.id
    };

    dispatch(addToCart({ 
      product: normalizedProduct, 
      quantity: quantityInCart > 0 ? 0 : quantity 
    }));

    dispatch(showToast({
      type: 'success',
      title: 'Panier mis a jour',
      message: `${product.name} ajoute.`
    }));
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME.COLORS.primary} />
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Produit introuvable</Text>
        <GoldButton title="Retour" onPress={() => navigation.goBack()} variant="secondary" size="small" fullWidth={false} />
      </View>
    );
  }

  const description = product.description || "L'excellence Yely au service de votre quotidien.";
  const isLongDescription = description.length > 180;
  const displayDescription = isLongDescription 
    ? `${description.slice(0, 180)}...` 
    : description;

  const displayQuantity = quantityInCart > 0 ? quantityInCart : quantity;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} transparent translucent />

      {/* HEADER DE NAVIGATION EN OVERLAY */}
      <View style={[styles.headerOverlay, { paddingTop: Math.max(insets.top, 15) }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.circularBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerOverlayTitle} numberOfLines={1}>
          Details du Produit
        </Text>
        
        <TouchableOpacity 
          onPress={() => navigation.navigate('Cart')} 
          style={styles.circularBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="cart" size={24} color={THEME.COLORS.primary} />
          {cartItems.length > 0 && (
            <View style={styles.cartBadgeOverlay}>
              <Text style={styles.cartBadgeOverlayText}>
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
      >
        {/* CARROUSEL IMAGE AUTO-DEFILANT */}
        <View style={styles.imageWrapper}>
          <FlatList 
            ref={flatListRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              setActiveImage(Math.round(e.nativeEvent.contentOffset.x / width));
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.mainImage} />
            )}
            keyExtractor={(_, i) => `img-${i}`}
          />
          
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent', isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(248,249,250,0.8)']}
            style={styles.imageGradient}
          />

          {images.length > 1 && (
            <View style={styles.pagination}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, activeImage === i && styles.activeDot]} />
              ))}
            </View>
          )}
        </View>

        {/* SECTION CENTER : INFORMATIONS DU PRODUIT */}
        <View style={styles.contentCard}>
          <View style={styles.mainInfo}>
            <View style={styles.rowBetween}>
              <Text style={styles.category}>
                {CATEGORY_LABELS[product.category] || product.category}
              </Text>
              {product.rating && (
                <View style={styles.ratingBox}>
                  <Ionicons name="star" size={14} color={THEME.COLORS.primary} />
                  <Text style={styles.ratingText}>{product.rating}</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.price}>{product.price.toLocaleString()} FCFA</Text>
          </View>

          <View style={styles.divider} />

          {/* DESCRIPTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {displayDescription}
            </Text>
            {isLongDescription && (
              <TouchableOpacity 
                style={styles.readMoreBtn} 
                onPress={() => setIsDescModalVisible(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.readMoreText}>Lire plus</Text>
                <Ionicons name="chevron-forward" size={14} color={THEME.COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* VENDEUR CERTIFIE */}
          <GlassCard style={styles.sellerSection} padding={15}>
            <View style={styles.sellerInfo}>
              <View style={styles.sellerAvatar}>
                 <Ionicons name="storefront-outline" size={22} color={THEME.COLORS.primary} />
              </View>
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>{product.seller?.name || 'Boutique Yely'}</Text>
                <Text style={styles.sellerStatus}>Partenaire Certifie Yely</Text>
              </View>
            </View>
          </GlassCard>
        </View>
      </ScrollView>

      {/* DESCRIPTION MODAL */}
      <GlassModal
        visible={isDescModalVisible}
        onClose={() => setIsDescModalVisible(false)}
        position="center"
        closeOnBackdrop={true}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Ionicons name="document-text-outline" size={28} color={THEME.COLORS.primary} />
            <Text style={styles.modalTitle}>Description complete</Text>
          </View>
          
          <ScrollView 
            ref={modalScrollViewRef}
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            onScroll={(e) => {
              const offsetY = e.nativeEvent.contentOffset.y;
              setShowModalScrollTop(offsetY > 120);
            }}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalDescText}>{description}</Text>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={() => setIsDescModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>

          {showModalScrollTop && (
            <TouchableOpacity 
              style={styles.modalScrollTopBtn}
              onPress={() => modalScrollViewRef.current?.scrollTo({ y: 0, animated: true })}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-up" size={18} color="#000" />
            </TouchableOpacity>
          )}
        </View>
      </GlassModal>

      {/* FOOTER FIXE AVEC BOUTON DE CONTRÔLE PANIER UNIFIÉ */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 15) }]}>
        {quantityInCart === 0 ? (
          <GoldButton 
            title="Ajouter au panier"
            onPress={handleAddToCart}
            icon="cart-outline"
          />
        ) : (
          <View style={styles.unifiedQtyContainer}>
            <TouchableOpacity style={styles.unifiedQtyAction} onPress={handleRemove}>
              <Ionicons name="remove" size={24} color={THEME.COLORS.textPrimary} />
            </TouchableOpacity>
            
            <Text style={styles.unifiedQtyText}>
              {quantityInCart} dans le panier
            </Text>
            
            <TouchableOpacity style={styles.unifiedQtyAction} onPress={handleAdd}>
              <Ionicons name="add" size={24} color={THEME.COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.COLORS.background },
  errorText: { color: THEME.COLORS.textSecondary, marginBottom: 20, fontSize: 16 },
  
  // Header Overlay Style
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  circularBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerOverlayTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cartBadgeOverlay: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: THEME.COLORS.danger || '#e74c3c',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeOverlayText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Slideshow Style
  imageWrapper: { height: IMG_HEIGHT, width: width },
  mainImage: { width: width, height: IMG_HEIGHT, resizeMode: 'cover' },
  imageGradient: { ...StyleSheet.absoluteFillObject },
  pagination: { position: 'absolute', bottom: 35, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  activeDot: { width: 18, backgroundColor: THEME.COLORS.primary },

  // Content Card
  contentCard: { 
    marginTop: -25, 
    backgroundColor: THEME.COLORS.background, 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    paddingHorizontal: 24, 
    paddingTop: 30,
    flex: 1
  },
  mainInfo: { marginBottom: 15 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  category: { fontSize: 12, fontWeight: '700', color: THEME.COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(212,175,55,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontSize: 12, fontWeight: '700', color: THEME.COLORS.primary },
  productName: { fontSize: 26, fontWeight: '800', color: THEME.COLORS.textPrimary, marginBottom: 8 },
  price: { fontSize: 22, fontWeight: '700', color: THEME.COLORS.primary },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 20 },
  
  // Section Description
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: THEME.COLORS.textPrimary, marginBottom: 10 },
  descriptionText: { fontSize: 15, color: THEME.COLORS.textSecondary, lineHeight: 24 },
  readMoreBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  readMoreText: { color: THEME.COLORS.primary, fontWeight: 'bold', fontSize: 14 },
  
  // Seller Style
  sellerSection: { marginTop: 5 },
  sellerInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  sellerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },
  sellerDetails: { flex: 1 },
  sellerName: { fontSize: 15, fontWeight: '700', color: THEME.COLORS.textPrimary },
  sellerStatus: { fontSize: 12, color: THEME.COLORS.success || '#2ecc71', marginTop: 2 },

  // Sticky Footer
  footer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: THEME.COLORS.background, 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255,255,255,0.06)', 
    paddingHorizontal: 20, 
    paddingTop: 15 
  },
  footerRow: { flexDirection: 'row', gap: 15, alignItems: 'center' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 25, height: 50, paddingHorizontal: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  qtyAction: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  qtyValue: { fontSize: 18, fontWeight: '700', color: THEME.COLORS.textPrimary, marginHorizontal: 10, minWidth: 20, textAlign: 'center' },
  btnWrapper: { flex: 1 },
  unifiedQtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 30,
    height: 52,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  unifiedQtyAction: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unifiedQtyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.COLORS.primary,
  },

  // Modal Styles
  modalContent: { maxHeight: height * 0.6, padding: 5 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)', paddingBottom: 15, marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  modalScroll: { maxHeight: height * 0.4 },
  modalScrollContent: { paddingBottom: 20 },
  modalDescText: { fontSize: 15, color: 'rgba(255, 255, 255, 0.85)', lineHeight: 24 },
  modalFooter: { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)', paddingTop: 15, alignItems: 'center' },
  modalCloseBtn: { backgroundColor: THEME.COLORS.primary, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 20 },
  modalCloseText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  modalScrollTopBtn: { position: 'absolute', bottom: 80, right: 15, width: 36, height: 36, borderRadius: 18, backgroundColor: THEME.COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 }
});

export default ProductDetails;
