// src/screens/marketplace/ProductDetails.web.jsx
// DETAILS PRODUIT RESPONSIVE PWA - Design Premium Minimaliste
// CSCSM Level: Bank Grade

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  StatusBar,
  useColorScheme,
  useWindowDimensions,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useGetProductQuery } from '../../store/api/marketplaceApiSlice';
import { showToast } from '../../store/slices/uiSlice';
import { addToCart, selectCartItems, removeFromCart, updateQuantity } from '../../store/slices/cartSlice';
import useMarketplaceSocketEvents from '../../hooks/useMarketplaceSocketEvents';
import THEME from '../../theme/theme';
import GoldButton from '../../components/ui/GoldButton';
import GlassCard from '../../components/ui/GlassCard';

const CATEGORY_LABELS = {
  'Food': 'Nourriture',
  'Supermarket': 'Supermarché',
  'Cosmetics': 'Cosmétiques',
  'Electronics': 'Électronique',
  'Home': 'Maison',
  'Other': 'Autres'
};

const ProductDetails = ({ route, navigation }) => {
  const { width, height } = useWindowDimensions();
  const isLargeScreen = width > 600;

  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  useMarketplaceSocketEvents();
  const cartItems = useSelector(selectCartItems);
  const { productId } = route.params;
  const { data: productData, isLoading, isError } = useGetProductQuery(productId);
  const colorScheme = useColorScheme();
  
  const isDarkMode = colorScheme === 'dark';
  
  const flatListRef = useRef(null);
  
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  
  const product = productData?.data;
  const images = product?.images && product?.images.length > 0 ? product.images : (product?.image ? [product.image] : []);

  const cartItem = cartItems.find(item => item.id === productId);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  // Diaporama automatique toutes les 5 secondes en vue mobile
  useEffect(() => {
    if (isLargeScreen || images.length <= 1) return;

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
  }, [activeImage, images.length, isLargeScreen]);

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

  const description = product.description || "L'excellence Yély au service de votre quotidien.";

  // RENDER DESKTOP LAYOUT (PC)
  const renderDesktopLayout = () => {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} transparent translucent />

        {/* HEADER DE NAVIGATION PREMIUM */}
        <View style={[styles.header, { paddingTop: insets.top + THEME.SPACING.md }]}>
          <View style={styles.headerLeft}>
            <View style={styles.backButtonWrapper}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={THEME.COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.headerTitle}>Détails du Produit</Text>
          </View>

          {/* Bouton Panier */}
          <View style={styles.cartButtonWrapper}>
            <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate('Cart')}>
              <Ionicons name="cart-outline" size={24} color={THEME.COLORS.primary} />
              {cartItems.length > 0 && <View style={styles.cartBadge} />}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
          <View style={styles.innerContainer}>
            
            {/* LAYOUT DEUX COLONNES PREMIUM POUR DESKTOP */}
            <View style={styles.splitLayout}>
              
              {/* COLONNE GAUCHE : GALERIE D'IMAGES */}
              <View style={styles.leftColumn}>
                <View style={styles.mainImageWrapper}>
                  {images.length > 0 ? (
                    <Image source={{ uri: images[activeImage] }} style={styles.mainImage} />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <Ionicons name="image-outline" size={80} color={THEME.COLORS.textTertiary} />
                    </View>
                  )}
                </View>

                {/* VIGNETTES THUMBNAILS */}
                {images.length > 1 && (
                  <View style={styles.thumbnailGrid}>
                    {images.map((img, i) => (
                      <TouchableOpacity 
                        key={i} 
                        onPress={() => setActiveImage(i)}
                        style={[
                          styles.thumbnailWrapper,
                          activeImage === i && styles.activeThumbnailWrapper
                        ]}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: img }} style={styles.thumbnail} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* COLONNE DROITE : METADATA & ACTIONS */}
              <View style={styles.rightColumn}>
                
                {/* Badge Catégorie & Note */}
                <View style={styles.metadataRow}>
                  <Text style={styles.categoryBadge}>
                    {CATEGORY_LABELS[product.category] || product.category}
                  </Text>
                  {product.rating && (
                    <View style={styles.ratingBox}>
                      <Ionicons name="star" size={14} color={THEME.COLORS.primary} />
                      <Text style={styles.ratingText}>{product.rating}</Text>
                    </View>
                  )}
                </View>

                {/* Titre & Prix */}
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.price}>{product.price.toLocaleString()} FCFA</Text>

                <View style={styles.divider} />

                {/* Description */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.descriptionText}>{description}</Text>
                </View>

                {/* Vendeur Certifié */}
                <GlassCard style={styles.sellerSection} padding={20}>
                  <View style={styles.sellerInfo}>
                    <View style={styles.sellerAvatar}>
                      <Ionicons name="storefront-outline" size={24} color={THEME.COLORS.primary} />
                    </View>
                    <View>
                      <Text style={styles.sellerName}>{product.seller?.name || 'Boutique Yély'}</Text>
                      <Text style={styles.sellerStatus}>Partenaire Certifié Yély</Text>
                    </View>
                  </View>
                </GlassCard>

                <View style={styles.divider} />

                {/* CONTRÔLEUR DE QUANTITÉ & BOUTON PANIER INTÉGRÉS */}
                <View style={styles.actionBlock}>
                  <View style={styles.qtyContainer}>
                    <TouchableOpacity style={styles.qtyAction} onPress={handleRemove}>
                      <Ionicons name="remove" size={20} color={THEME.COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{quantityInCart > 0 ? quantityInCart : quantity}</Text>
                    <TouchableOpacity style={styles.qtyAction} onPress={handleAdd}>
                      <Ionicons name="add" size={20} color={THEME.COLORS.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.btnWrapper}>
                    <GoldButton 
                      title={quantityInCart > 0 ? "Dans le panier" : "Ajouter au panier"} 
                      onPress={handleAddToCart}
                      icon={quantityInCart > 0 ? "checkmark-circle-outline" : "cart-outline"}
                      disabled={quantityInCart > 0}
                    />
                  </View>
                </View>

              </View>

            </View>

          </View>
        </ScrollView>
      </View>
    );
  };

  // RENDER MOBILE LAYOUT (TELEPHONE)
  const renderMobileLayout = () => {
    const isLongDescription = description.length > 180;
    const displayDescription = isLongDescription && !isDescExpanded
      ? `${description.slice(0, 180)}...`
      : description;

    return (
      <View style={styles.mobileContainer}>
        <StatusBar barStyle="light-content" transparent translucent />

        {/* HEADER DE NAVIGATION EN OVERLAY */}
        <View style={[styles.mobileHeaderOverlay, { paddingTop: Math.max(insets.top, 15) }]}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.mobileCircularBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.mobileHeaderOverlayTitle} numberOfLines={1}>
            Détails du Produit
          </Text>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('Cart')} 
            style={styles.mobileCircularBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="cart" size={24} color={THEME.COLORS.primary} />
            {cartItems.length > 0 && (
              <View style={styles.mobileCartBadgeOverlay}>
                <Text style={styles.mobileCartBadgeOverlayText}>
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
          <View style={styles.mobileImageWrapper}>
            {images.length > 0 ? (
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
                  <Image source={{ uri: item }} style={[styles.mobileMainImage, { width }]} />
                )}
                keyExtractor={(_, i) => `img-${i}`}
              />
            ) : (
              <View style={styles.mobilePlaceholderImage}>
                <Ionicons name="image-outline" size={80} color={THEME.COLORS.textTertiary} />
              </View>
            )}
            
            {images.length > 1 && (
              <View style={styles.mobilePagination}>
                {images.map((_, i) => (
                  <View key={i} style={[styles.mobileDot, activeImage === i && styles.mobileActiveDot]} />
                ))}
              </View>
            )}
          </View>

          {/* SECTION CENTER : INFORMATIONS DU PRODUIT */}
          <View style={styles.mobileContentCard}>
            <View style={styles.mobileMainInfo}>
              <View style={styles.mobileRowBetween}>
                <Text style={styles.mobileCategory}>
                  {CATEGORY_LABELS[product.category] || product.category}
                </Text>
                {product.rating && (
                  <View style={styles.mobileRatingBox}>
                    <Ionicons name="star" size={14} color={THEME.COLORS.primary} />
                    <Text style={styles.mobileRatingText}>{product.rating}</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.mobileProductName}>{product.name}</Text>
              <Text style={styles.mobilePrice}>{product.price.toLocaleString()} FCFA</Text>
            </View>

            <View style={styles.mobileDivider} />

            {/* DESCRIPTION */}
            <View style={styles.mobileSection}>
              <Text style={styles.mobileSectionTitle}>Description</Text>
              <Text style={styles.mobileDescriptionText}>
                {displayDescription}
              </Text>
              {isLongDescription && (
                <TouchableOpacity 
                  style={styles.mobileReadMoreBtn} 
                  onPress={() => setIsDescExpanded(!isDescExpanded)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.mobileReadMoreText}>
                    {isDescExpanded ? "Lire moins" : "Lire plus"}
                  </Text>
                  <Ionicons 
                    name={isDescExpanded ? "chevron-up" : "chevron-forward"} 
                    size={14} 
                    color={THEME.COLORS.primary} 
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* VENDEUR CERTIFIE */}
            <GlassCard style={styles.mobileSellerSection} padding={15}>
              <View style={styles.mobileSellerInfo}>
                <View style={styles.mobileSellerAvatar}>
                   <Ionicons name="storefront-outline" size={22} color={THEME.COLORS.primary} />
                </View>
                <View style={styles.mobileSellerDetails}>
                  <Text style={styles.mobileSellerName}>{product.seller?.name || 'Boutique Yély'}</Text>
                  <Text style={styles.mobileSellerStatus}>Partenaire Certifié Yély</Text>
                </View>
              </View>
            </GlassCard>
          </View>
        </ScrollView>

        {/* FOOTER FIXE AVEC BOUTON DE CONTRÔLE PANIER UNIFIÉ */}
        <View style={[styles.mobileFooter, { paddingBottom: Math.max(insets.bottom, 15) }]}>
          {quantityInCart === 0 ? (
            <GoldButton 
              title="Ajouter au panier"
              onPress={handleAddToCart}
              icon="cart-outline"
            />
          ) : (
            <View style={styles.mobileUnifiedQtyContainer}>
              <TouchableOpacity style={styles.mobileUnifiedQtyAction} onPress={handleRemove}>
                <Ionicons name="remove" size={24} color={THEME.COLORS.textPrimary} />
              </TouchableOpacity>
              
              <Text style={styles.mobileUnifiedQtyText}>
                {quantityInCart} dans le panier
              </Text>
              
              <TouchableOpacity style={styles.mobileUnifiedQtyAction} onPress={handleAdd}>
                <Ionicons name="add" size={24} color={THEME.COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // SWITCH RESPONSIVE
  if (isLargeScreen) {
    return renderDesktopLayout();
  } else {
    return renderMobileLayout();
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.background,
    overflowX: 'hidden',
    maxWidth: '100%',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: THEME.COLORS.textSecondary,
    marginBottom: 20,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '6%',
    paddingVertical: THEME.SPACING.md,
    backgroundColor: THEME.COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: THEME.COLORS.glassSurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    cursor: 'pointer',
  },
  backButtonWrapper: {
    zIndex: 999,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.COLORS.glassSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  cartButtonWrapper: {
    zIndex: 999,
  },
  cartBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.COLORS.danger,
    borderWidth: 1,
    borderColor: THEME.COLORS.glassSurface,
  },
  scrollContent: {
    paddingBottom: THEME.SPACING.xxl,
  },
  innerContainer: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: '6%',
    paddingTop: THEME.SPACING.xl,
  },
  splitLayout: {
    flexDirection: 'row',
    gap: 48,
    alignItems: 'flex-start',
    width: '100%',
  },
  leftColumn: {
    width: 480,
  },
  mainImageWrapper: {
    width: 480,
    height: 480,
    borderRadius: 24,
    backgroundColor: THEME.COLORS.glassSurface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  thumbnailWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
    cursor: 'pointer',
  },
  activeThumbnailWrapper: {
    borderColor: THEME.COLORS.primary,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  rightColumn: {
    flex: 1,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SPACING.md,
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212,175,55,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.COLORS.primary,
  },
  productName: {
    fontSize: 32,
    fontWeight: '800',
    color: THEME.COLORS.textPrimary,
    marginBottom: THEME.SPACING.sm,
  },
  price: {
    fontSize: 26,
    fontWeight: '700',
    color: THEME.COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 24,
  },
  section: {
    marginBottom: THEME.SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.COLORS.textPrimary,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    color: THEME.COLORS.textSecondary,
    lineHeight: 26,
  },
  sellerSection: {
    marginTop: THEME.SPACING.md,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.COLORS.textPrimary,
  },
  sellerStatus: {
    fontSize: 12,
    color: THEME.COLORS.success,
    marginTop: 2,
  },
  actionBlock: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    width: '100%',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 25,
    height: 52,
    paddingHorizontal: 6,
  },
  qtyAction: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.COLORS.textPrimary,
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  btnWrapper: {
    flex: 1,
  },

  // MOBILE RESPONSIVE STYLES
  mobileContainer: { flex: 1, backgroundColor: THEME.COLORS.background, overflowX: 'hidden', maxWidth: '100%' },
  mobileHeaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.40)',
  },
  mobileCircularBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  mobileHeaderOverlayTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  mobileCartBadgeOverlay: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: THEME.COLORS.danger,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  mobileCartBadgeOverlayText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mobileImageWrapper: { height: 380, width: '100%', position: 'relative' },
  mobileMainImage: { height: 380, resizeMode: 'cover' },
  mobilePlaceholderImage: { height: 380, width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.COLORS.glassSurface },
  mobilePagination: { position: 'absolute', bottom: 35, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  mobileDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  mobileActiveDot: { width: 18, backgroundColor: THEME.COLORS.primary },
  mobileContentCard: { 
    marginTop: -25, 
    backgroundColor: THEME.COLORS.background, 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    paddingHorizontal: 24, 
    paddingTop: 30,
    flex: 1
  },
  mobileMainInfo: { marginBottom: 15 },
  mobileRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  mobileCategory: { fontSize: 12, fontWeight: '700', color: THEME.COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },
  mobileRatingBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(212,175,55,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  mobileRatingText: { fontSize: 12, fontWeight: '700', color: THEME.COLORS.primary },
  mobileProductName: { fontSize: 26, fontWeight: '800', color: THEME.COLORS.textPrimary, marginBottom: 8 },
  mobilePrice: { fontSize: 22, fontWeight: '700', color: THEME.COLORS.primary },
  mobileDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 20 },
  mobileSection: { marginBottom: 25 },
  mobileSectionTitle: { fontSize: 16, fontWeight: '700', color: THEME.COLORS.textPrimary, marginBottom: 10 },
  mobileDescriptionText: { fontSize: 15, color: THEME.COLORS.textSecondary, lineHeight: 24 },
  mobileReadMoreBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  mobileReadMoreText: { color: THEME.COLORS.primary, fontWeight: 'bold', fontSize: 14 },
  mobileSellerSection: { marginTop: 5 },
  mobileSellerInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  mobileSellerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },
  mobileSellerDetails: { flex: 1 },
  mobileSellerName: { fontSize: 15, fontWeight: '700', color: THEME.COLORS.textPrimary },
  mobileSellerStatus: { fontSize: 12, color: THEME.COLORS.success, marginTop: 2 },
  mobileFooter: { 
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
  mobileUnifiedQtyContainer: {
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
  mobileUnifiedQtyAction: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileUnifiedQtyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.COLORS.primary,
  },
});

export default ProductDetails;
