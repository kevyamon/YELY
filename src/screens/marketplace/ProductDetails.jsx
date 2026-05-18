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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import MarketplaceDetailsHeader from '../../components/marketplace/MarketplaceDetailsHeader';

const { width, height } = Dimensions.get('window');
const IMG_HEIGHT = height * 0.44;
const SPEC_CARD_WIDTH = (width - 48 - 10) / 2; // 24 padding each side, 10 gap

// Exact Category Mapping matching ProductList.jsx
const CATEGORY_LABELS = {
  'Food': 'Nourriture',
  'Supermarket': 'Supermarché',
  'Cosmetics': 'Cosmétiques',
  'Electronics': 'Électronique',
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
        flatListRef.current?.scrollTo({
          x: nextIndex * width,
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
          title: 'Retiré',
          message: `${product?.name || 'Produit'} retiré du panier.`
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
      title: 'Panier mis à jour',
      message: `${product.name} ajouté.`
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
  const isLongDescription = description.length > 150;
  const displayDescription = isLongDescription 
    ? `${description.slice(0, 150)}...` 
    : description;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} transparent translucent />

      {/* HEADER DE NAVIGATION EN OVERLAY MODULAIRE */}
      <MarketplaceDetailsHeader title="Détails du Produit" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 130 }}
      >
        {/* CARROUSEL IMAGE AUTO-DEFILANT */}
        <View style={styles.imageWrapper}>
          <ScrollView 
            ref={flatListRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              setActiveImage(Math.round(e.nativeEvent.contentOffset.x / width));
            }}
          >
            {images.map((item, i) => (
              <Image key={i} source={{ uri: item }} style={styles.mainImage} />
            ))}
          </ScrollView>
          
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent', isDarkMode ? 'rgba(10,10,10,1)' : '#F8F9FA']}
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
        <View style={[
          styles.contentCard,
          !isDarkMode && {
            borderTopWidth: 1.5,
            borderLeftWidth: 1.5,
            borderRightWidth: 1.5,
            borderColor: 'rgba(212, 175, 55, 0.25)',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -6 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 5,
          }
        ]}>
          {/* HEADER PRINCIPAL PRODUIT */}
          <View style={styles.mainInfo}>
            <View style={styles.rowBetween}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {CATEGORY_LABELS[product.category] || product.category || 'Général'}
                </Text>
              </View>
              
              <View style={styles.stockBadge}>
                <View style={styles.stockDot} />
                <Text style={styles.stockText}>En Stock</Text>
              </View>
            </View>
            
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.price}>{product.price.toLocaleString()} FCFA</Text>
          </View>

          {/* FICHE TECHNIQUE / SPÉCIFICATIONS GRID */}
          <Text style={styles.sectionSubtitle}>Fiche Technique</Text>
          <View style={styles.specGrid}>
            <GlassCard style={styles.specCard} padding={14}>
              <MaterialCommunityIcons name={
                product.category === 'Food' ? 'food-apple' :
                product.category === 'Supermarket' ? 'shopping' :
                product.category === 'Cosmetics' ? 'palette-outline' :
                product.category === 'Electronics' ? 'laptop' :
                product.category === 'Home' ? 'home-variant' : 'tag-outline'
              } size={22} color={THEME.COLORS.primary} />
              <Text style={styles.specLabel}>Catégorie</Text>
              <Text style={styles.specValue} numberOfLines={1}>
                {CATEGORY_LABELS[product.category] || product.category || 'Général'}
              </Text>
            </GlassCard>

            <GlassCard style={styles.specCard} padding={14}>
              <MaterialCommunityIcons name="shield-check-outline" size={22} color={THEME.COLORS.primary} />
              <Text style={styles.specLabel}>Confiance</Text>
              <Text style={styles.specValue} numberOfLines={1}>100% Vérifié</Text>
            </GlassCard>

            <GlassCard style={styles.specCard} padding={14}>
              <MaterialCommunityIcons name="truck-delivery-outline" size={22} color={THEME.COLORS.primary} />
              <Text style={styles.specLabel}>Livraison</Text>
              <Text style={styles.specValue} numberOfLines={1}>Express dispo</Text>
            </GlassCard>

            <GlassCard style={styles.specCard} padding={14}>
              <MaterialCommunityIcons name="star-circle-outline" size={22} color={THEME.COLORS.primary} />
              <Text style={styles.specLabel}>Évaluation</Text>
              <Text style={styles.specValue} numberOfLines={1}>
                {product.rating ? `${product.rating} / 5` : 'Excellente'}
              </Text>
            </GlassCard>
          </View>



          <GlassCard style={styles.descriptionCard} padding={18}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="text-box-outline" size={18} color={THEME.COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <Text 
              style={styles.descriptionText}
              numberOfLines={isLongDescription ? 3 : undefined}
              ellipsizeMode="tail"
            >
              {description}
            </Text>
            {isLongDescription && (
              <TouchableOpacity 
                style={styles.readMoreBtn} 
                onPress={() => setIsDescModalVisible(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.readMoreText}>Lire la suite</Text>
                <Ionicons name="chevron-forward" size={14} color={THEME.COLORS.primary} />
              </TouchableOpacity>
            )}
          </GlassCard>

          {/* CARD VENDEUR / PARTENAIRE */}
          <GlassCard style={styles.sellerSection} padding={16}>
            <View style={styles.sellerInfo}>
              <View style={styles.sellerAvatarContainer}>
                <View style={styles.sellerAvatar}>
                   <Ionicons name="storefront" size={20} color={THEME.COLORS.primary} />
                </View>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
                </View>
              </View>
              
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>{product.seller?.name || 'Boutique Yély'}</Text>
                <Text style={styles.sellerStatus}>Partenaire Certifié Yély</Text>
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
            <Ionicons name="document-text" size={24} color={THEME.COLORS.primary} />
            <Text style={styles.modalTitle}>Description Complète</Text>
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

      {/* FOOTER FIXE AVEC CAPSULE FLOTTANTE D'ACHAT PREMIUM */}
      <View style={[
        styles.floatingFooter, 
        { 
          bottom: Math.max(insets.bottom + 10, 20),
          backgroundColor: isDarkMode ? 'rgba(20, 20, 20, 0.88)' : 'rgba(255, 255, 255, 0.92)',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        }
      ]}>
        {quantityInCart === 0 ? (
          <GoldButton 
            title="Ajouter au panier"
            onPress={handleAddToCart}
            icon="cart-outline"
            style={styles.purchaseBtn}
          />
        ) : (
          <View style={styles.unifiedQtyContainer}>
            <TouchableOpacity style={styles.unifiedQtyAction} onPress={handleRemove}>
              <Ionicons name="remove" size={22} color={THEME.COLORS.textPrimary} />
            </TouchableOpacity>
            
            <Text style={styles.unifiedQtyText}>
              {quantityInCart} dans le panier
            </Text>
            
            <TouchableOpacity style={styles.unifiedQtyAction} onPress={handleAdd}>
              <Ionicons name="add" size={22} color={THEME.COLORS.textPrimary} />
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerOverlayTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
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
    borderWidth: 1,
    borderColor: THEME.COLORS.background,
  },
  cartBadgeOverlayText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },

  // Slideshow Style
  imageWrapper: { height: IMG_HEIGHT, width: width },
  mainImage: { width: width, height: IMG_HEIGHT, resizeMode: 'cover' },
  imageGradient: { ...StyleSheet.absoluteFillObject },
  pagination: { position: 'absolute', bottom: 42, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  activeDot: { width: 18, backgroundColor: THEME.COLORS.primary, borderRadius: 3 },

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
  
  // Header Infos
  mainInfo: { marginBottom: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  categoryBadge: { 
    backgroundColor: 'rgba(212,175,55,0.08)', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)'
  },
  categoryText: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: THEME.COLORS.primary, 
    textTransform: 'uppercase', 
    letterSpacing: 0.8 
  },
  stockBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(46,204,113,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  stockDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2ecc71', marginRight: 6 },
  stockText: { fontSize: 11, fontWeight: '800', color: '#2ecc71', textTransform: 'uppercase' },
  productName: { fontSize: 24, fontWeight: '900', color: THEME.COLORS.textPrimary, marginBottom: 8, letterSpacing: -0.5 },
  price: { fontSize: 22, fontWeight: '800', color: THEME.COLORS.primary },
  
  // Specs Grid Layout ("Fiche Technique")
  sectionSubtitle: { fontSize: 15, fontWeight: '800', color: THEME.COLORS.textPrimary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  specCard: {
    width: SPEC_CARD_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  specLabel: { fontSize: 11, color: THEME.COLORS.textSecondary, marginTop: 6, fontWeight: '500' },
  specValue: { fontSize: 13, fontWeight: '800', color: THEME.COLORS.textPrimary, marginTop: 2 },
  
  // Trust Badges Ticker
  trustRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.04)', marginBottom: 22 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trustText: { fontSize: 10.5, fontWeight: '600', color: THEME.COLORS.textSecondary },

  // Section Description
  descriptionCard: { 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.04)',
    marginBottom: 15 
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: THEME.COLORS.textPrimary },
  descriptionText: { fontSize: 14.5, color: THEME.COLORS.textSecondary, lineHeight: 22 },
  readMoreBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 4 },
  readMoreText: { color: THEME.COLORS.primary, fontWeight: '800', fontSize: 13.5 },
  
  // Seller / Boutique Section
  sellerSection: { 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.04)',
    marginBottom: 10 
  },
  sellerInfo: { flexDirection: 'row', alignItems: 'center' },
  sellerAvatarContainer: { position: 'relative', marginRight: 15 },
  sellerAvatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(255,255,255,0.04)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(212,175,55,0.3)' 
  },
  verifiedBadge: { 
    position: 'absolute', 
    bottom: -2, 
    right: -2, 
    backgroundColor: THEME.COLORS.primary, 
    width: 16, 
    height: 16, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: THEME.COLORS.background
  },
  sellerDetails: { flex: 1 },
  sellerName: { fontSize: 15, fontWeight: '800', color: THEME.COLORS.textPrimary },
  sellerStatus: { fontSize: 11.5, color: '#2ecc71', fontWeight: '600', marginTop: 1 },
  sellerActionBtn: { padding: 4 },

  // Floating Purchase Footer Acrylique capsule
  floatingFooter: { 
    position: 'absolute', 
    left: 20, 
    right: 20, 
    backgroundColor: 'rgba(20, 20, 20, 0.88)', 
    borderRadius: 30, 
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8
  },
  purchaseBtn: {
    height: 52,
    borderRadius: 24,
  },
  unifiedQtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
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
    fontSize: 15,
    fontWeight: '800',
    color: THEME.COLORS.primary,
  },

  // Modal Styles
  modalContent: { maxHeight: height * 0.6, padding: 5 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: THEME.COLORS.border || 'rgba(0, 0, 0, 0.08)', paddingBottom: 15, marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  modalScroll: { maxHeight: height * 0.4 },
  modalScrollContent: { paddingBottom: 20 },
  modalDescText: { fontSize: 15, color: THEME.COLORS.textSecondary, lineHeight: 24 },
  modalFooter: { borderTopWidth: 1, borderTopColor: THEME.COLORS.border || 'rgba(0, 0, 0, 0.08)', paddingTop: 15, alignItems: 'center' },
  modalCloseBtn: { backgroundColor: THEME.COLORS.primary, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 20 },
  modalCloseText: { color: '#000000', fontWeight: 'bold', fontSize: 14 },
  modalScrollTopBtn: { position: 'absolute', bottom: 80, right: 15, width: 36, height: 36, borderRadius: 18, backgroundColor: THEME.COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 }
});

export default ProductDetails;
