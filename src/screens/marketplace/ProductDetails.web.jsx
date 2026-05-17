// src/screens/marketplace/ProductDetails.web.jsx
// DETAILS PRODUIT PREMIUM ADAPTATIF - Design Minimaliste & Industriel
// CSCSM Level: Bank Grade

import React, { useState, useRef, useEffect } from 'react';
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
  FlatList,
  Dimensions
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

const CATEGORY_LABELS = {
  'Food': 'Nourriture',
  'Supermarket': 'Supermarche',
  'Cosmetics': 'Cosmetiques',
  'Electronics': 'Electronique',
  'Home': 'Maison',
  'Other': 'Autres'
};

const ProductDetails = ({ route, navigation }) => {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;

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

  // Diaporama automatique toutes les 5 secondes (uniquement sur mobile/PWA)
  useEffect(() => {
    if (!isMobile || images.length <= 1) return;

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
  }, [activeImage, images.length, isMobile]);

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
  const displayQuantity = quantityInCart > 0 ? quantityInCart : quantity;

  // --- RENDU MOBILE / PWA PHONE (< 768px) ---
  if (isMobile) {
    const isLongDescription = description.length > 180;
    const displayDescription = isLongDescription 
      ? `${description.slice(0, 180)}...` 
      : description;

    const IMG_HEIGHT = height * 0.42;

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
          <View style={[styles.imageWrapper, { height: IMG_HEIGHT }]}>
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
                <Image source={{ uri: item }} style={[styles.mainImageMobile, { width, height: IMG_HEIGHT }]} />
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
          <View style={styles.contentCardMobile}>
            <View style={styles.mainInfoMobile}>
              <View style={styles.rowBetweenMobile}>
                <Text style={styles.categoryMobile}>
                  {CATEGORY_LABELS[product.category] || product.category}
                </Text>
                {product.rating && (
                  <View style={styles.ratingBoxMobile}>
                    <Ionicons name="star" size={14} color={THEME.COLORS.primary} />
                    <Text style={styles.ratingTextMobile}>{product.rating}</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.productNameMobile}>{product.name}</Text>
              <Text style={styles.priceMobile}>{product.price.toLocaleString()} FCFA</Text>
            </View>

            <View style={styles.dividerMobile} />

            {/* DESCRIPTION */}
            <View style={styles.sectionMobile}>
              <Text style={styles.sectionTitleMobile}>Description</Text>
              <Text style={styles.descriptionTextMobile}>
                {displayDescription}
              </Text>
              {isLongDescription && (
                <TouchableOpacity 
                  style={styles.readMoreBtnMobile} 
                  onPress={() => setIsDescModalVisible(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.readMoreTextMobile}>Lire plus</Text>
                  <Ionicons name="chevron-forward" size={14} color={THEME.COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>

            {/* VENDEUR CERTIFIE */}
            <GlassCard style={styles.sellerSectionMobile} padding={15}>
              <View style={styles.sellerInfoMobile}>
                <View style={styles.sellerAvatarMobile}>
                   <Ionicons name="storefront-outline" size={22} color={THEME.COLORS.primary} />
                </View>
                <View style={styles.sellerDetailsMobile}>
                  <Text style={styles.sellerNameMobile}>{product.seller?.name || 'Boutique Yely'}</Text>
                  <Text style={styles.sellerStatusMobile}>Partenaire Certifie Yely</Text>
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
          <View style={styles.modalContentMobile}>
            <View style={styles.modalHeaderMobile}>
              <Ionicons name="document-text-outline" size={28} color={THEME.COLORS.primary} />
              <Text style={styles.modalTitleMobile}>Description complete</Text>
            </View>
            
            <ScrollView 
              ref={modalScrollViewRef}
              style={styles.modalScrollMobile}
              contentContainerStyle={styles.modalScrollContentMobile}
              onScroll={(e) => {
                const offsetY = e.nativeEvent.contentOffset.y;
                setShowModalScrollTop(offsetY > 120);
              }}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalDescTextMobile}>{description}</Text>
            </ScrollView>
            
            <View style={styles.modalFooterMobile}>
              <TouchableOpacity 
                style={styles.modalCloseBtnMobile}
                onPress={() => setIsDescModalVisible(false)}
              >
                <Text style={styles.modalCloseTextMobile}>Fermer</Text>
              </TouchableOpacity>
            </View>

            {showModalScrollTop && (
              <TouchableOpacity 
                style={styles.modalScrollTopBtnMobile}
                onPress={() => modalScrollViewRef.current?.scrollTo({ y: 0, animated: true })}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-up" size={18} color="#000" />
              </TouchableOpacity>
            )}
          </View>
        </GlassModal>

        {/* FOOTER FIXE AVEC COMPTEUR REDUX */}
        <View style={[styles.footerMobile, { paddingBottom: Math.max(insets.bottom, 15) }]}>
          <View style={styles.footerRowMobile}>
            <View style={styles.qtyContainerMobile}>
              <TouchableOpacity style={styles.qtyActionMobile} onPress={handleRemove}>
                <Ionicons name="remove" size={20} color={THEME.COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.qtyValueMobile}>{displayQuantity}</Text>
              <TouchableOpacity style={styles.qtyActionMobile} onPress={handleAdd}>
                <Ionicons name="add" size={20} color={THEME.COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.btnWrapperMobile}>
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
    );
  }

  // --- RENDU D'ORIGINE PC / DESKTOP (>= 768px) ---
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
          <Text style={styles.headerTitle}>Details du Produit</Text>
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

              {/* VIGNETTES THUMBNAILS (Uniquement si plusieurs images) */}
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
              
              {/* Badge Categorie & Note */}
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

              {/* Fiche Vendeur */}
              <GlassCard style={styles.sellerSection} padding={20}>
                <View style={styles.sellerInfo}>
                  <View style={styles.sellerAvatar}>
                    <Ionicons name="storefront-outline" size={24} color={THEME.COLORS.primary} />
                  </View>
                  <View>
                    <Text style={styles.sellerName}>{product.seller?.name || 'Boutique Yely'}</Text>
                    <Text style={styles.sellerStatus}>Partenaire Certifie Yely</Text>
                  </View>
                </View>
              </GlassCard>

              <View style={styles.divider} />

              {/* CONTROLEUR DE QUANTITE & BOUTON PANIER INTEGRES */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.background,
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

  // --- STYLES MOBILE RESPONSIVE PWA (< 768px) ---
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
    backgroundColor: THEME.COLORS.danger,
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
  imageWrapper: { width: '100%', position: 'relative' },
  mainImageMobile: { resizeMode: 'cover' },
  imageGradient: { ...StyleSheet.absoluteFillObject },
  pagination: { position: 'absolute', bottom: 35, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  activeDot: { width: 18, backgroundColor: THEME.COLORS.primary },
  contentCardMobile: { 
    marginTop: -25, 
    backgroundColor: THEME.COLORS.background, 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    paddingHorizontal: 24, 
    paddingTop: 30,
    flex: 1
  },
  mainInfoMobile: { marginBottom: 15 },
  rowBetweenMobile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  categoryMobile: { fontSize: 12, fontWeight: '700', color: THEME.COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },
  ratingBoxMobile: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(212,175,55,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingTextMobile: { fontSize: 12, fontWeight: '700', color: THEME.COLORS.primary },
  productNameMobile: { fontSize: 26, fontWeight: '800', color: THEME.COLORS.textPrimary, marginBottom: 8 },
  priceMobile: { fontSize: 22, fontWeight: '700', color: THEME.COLORS.primary },
  dividerMobile: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 20 },
  sectionMobile: { marginBottom: 25 },
  sectionTitleMobile: { fontSize: 16, fontWeight: '700', color: THEME.COLORS.textPrimary, marginBottom: 10 },
  descriptionTextMobile: { fontSize: 15, color: THEME.COLORS.textSecondary, lineHeight: 24 },
  readMoreBtnMobile: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  readMoreTextMobile: { color: THEME.COLORS.primary, fontWeight: 'bold', fontSize: 14 },
  sellerSectionMobile: { marginTop: 5 },
  sellerInfoMobile: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  sellerAvatarMobile: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },
  sellerDetailsMobile: { flex: 1 },
  sellerNameMobile: { fontSize: 15, fontWeight: '700', color: THEME.COLORS.textPrimary },
  sellerStatusMobile: { fontSize: 12, color: THEME.COLORS.success, marginTop: 2 },
  footerMobile: { 
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
  footerRowMobile: { flexDirection: 'row', gap: 15, alignItems: 'center' },
  qtyContainerMobile: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 25, height: 50, paddingHorizontal: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  qtyActionMobile: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  qtyValueMobile: { fontSize: 18, fontWeight: '700', color: THEME.COLORS.textPrimary, marginHorizontal: 10, minWidth: 20, textAlign: 'center' },
  btnWrapperMobile: { flex: 1 },
  modalContentMobile: { maxHeight: 400, padding: 5 },
  modalHeaderMobile: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)', paddingBottom: 15, marginBottom: 15 },
  modalTitleMobile: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  modalScrollMobile: { maxHeight: 250 },
  modalScrollContentMobile: { paddingBottom: 20 },
  modalDescTextMobile: { fontSize: 15, color: 'rgba(255, 255, 255, 0.85)', lineHeight: 24 },
  modalFooterMobile: { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)', paddingTop: 15, alignItems: 'center' },
  modalCloseBtnMobile: { backgroundColor: THEME.COLORS.primary, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 20 },
  modalCloseTextMobile: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  modalScrollTopBtnMobile: { position: 'absolute', bottom: 80, right: 15, width: 36, height: 36, borderRadius: 18, backgroundColor: THEME.COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 }
});

export default ProductDetails;
