// src/screens/marketplace/ProductDetails.web.jsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  StatusBar,
  useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useGetProductQuery } from '../../store/api/marketplaceApiSlice';
import { showToast } from '../../store/slices/uiSlice';
import { addToCart, selectCartItems } from '../../store/slices/cartSlice';
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
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  useMarketplaceSocketEvents();
  const cartItems = useSelector(selectCartItems);
  const { productId } = route.params;
  const { data: productData, isLoading, isError } = useGetProductQuery(productId);
  const colorScheme = useColorScheme();
  
  const isDarkMode = colorScheme === 'dark';
  
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  
  const product = productData?.data;
  const images = product?.images && product?.images.length > 0 ? product.images : (product?.image ? [product.image] : []);

  const handleAddToCart = () => {
    if (!product) return;

    const normalizedProduct = {
      ...product,
      _id: product._id || product.id
    };

    dispatch(addToCart({ 
      product: normalizedProduct, 
      quantity: parseInt(quantity) || 1 
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

  const description = product.description || "L'excellence Yély au service de votre quotidien.";

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} transparent translucent />

      {/* HEADER DE NAVIGATION PREMIUM */}
      <View style={[styles.header, { paddingTop: insets.top + THEME.SPACING.md }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={THEME.COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails du Produit</Text>
        </View>

        {/* Bouton Panier */}
        <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate('Cart')}>
          <Ionicons name="cart-outline" size={24} color={THEME.COLORS.primary} />
          {cartItems.length > 0 && <View style={styles.cartBadge} />}
        </TouchableOpacity>
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
                  <TouchableOpacity style={styles.qtyAction} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Ionicons name="remove" size={20} color={THEME.COLORS.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{quantity}</Text>
                  <TouchableOpacity style={styles.qtyAction} onPress={() => setQuantity(quantity + 1)}>
                    <Ionicons name="add" size={20} color={THEME.COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.btnWrapper}>
                  <GoldButton 
                    title="Ajouter au panier" 
                    onPress={handleAddToCart}
                    icon="cart-outline"
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
  }
});

export default ProductDetails;
