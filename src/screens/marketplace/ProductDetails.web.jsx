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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useGetProductQuery } from '../../store/api/marketplaceApiSlice';
import { showToast } from '../../store/slices/uiSlice';
import { addToCart, selectCartItems, removeFromCart, updateQuantity } from '../../store/slices/cartSlice';
import useMarketplaceSocketEvents from '../../hooks/useMarketplaceSocketEvents';
import THEME from '../../theme/theme';
import GoldButton from '../../components/ui/GoldButton';
import GlassCard from '../../components/ui/GlassCard';
import GlassModal from '../../components/ui/GlassModal';
import MarketplaceDetailsHeader from '../../components/marketplace/MarketplaceDetailsHeader';

const CATEGORY_LABELS = {
  'Food': 'Nourriture',
  'Supermarket': 'Supermarché',
  'Cosmetics': 'Cosmétiques',
  'Electronics': 'Électronique',
  'Home': 'Maison & Déco',
  'Fashion': 'Mode & Chaussures',
  'Sports': 'Sport & Loisirs',
  'Tools': 'Bricolage & Outils',
  'Toys': 'Jeux & Jouets',
  'Automotive': 'Auto & Accessoires',
  'Office': 'Bureau & Papeterie',
  'Other': 'Autres'
};

const ProductDetails = ({ route, navigation }) => {
  const { width, height } = useWindowDimensions();
  const isLargeScreen = width > 768;

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
  const [isDescModalVisible, setIsDescModalVisible] = useState(false);
  const [showModalScrollTop, setShowModalScrollTop] = useState(false);
  const modalScrollViewRef = useRef(null);
  
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
  }, [activeImage, images.length, isLargeScreen, width]);

  const handleAdd = () => {
    if (product?.category !== 'Food' && product?.manageStock) {
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

    if (product.category !== 'Food' && product.manageStock) {
      const availableStock = product.stockCount || 0;
      if (quantity > availableStock) {
        dispatch(showToast({
          type: 'warning',
          title: 'Stock insuffisant',
          message: `Il n'y a que ${availableStock} articles disponibles en stock.`
        }));
        return;
      }
    }

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

  // RENDER DESKTOP LAYOUT (PC)
  const renderDesktopLayout = () => {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} transparent translucent />

        {/* HEADER DE NAVIGATION PREMIUM MODULAIRE */}
        <MarketplaceDetailsHeader title="Détails du Produit" isOverlay={false} />

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
                
                {/* Badge Catégorie, Note & Stock */}
                <View style={styles.metadataRow}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>
                      {CATEGORY_LABELS[product.category] || product.category || 'Général'}
                    </Text>
                  </View>
                  
                  {product.category === 'Food' ? (
                    <View style={[styles.stockBadge, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                      <View style={[styles.stockDot, { backgroundColor: '#10B981' }]} />
                      <Text style={[styles.stockText, { color: '#10B981' }]}>Toujours dispo</Text>
                    </View>
                  ) : product.stockCount === 0 || product.isSoldOut ? (
                    <View style={[styles.stockBadge, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                      <View style={[styles.stockDot, { backgroundColor: THEME.COLORS.danger }]} />
                      <Text style={[styles.stockText, { color: THEME.COLORS.danger, fontWeight: '800' }]}>Rupture</Text>
                    </View>
                  ) : product.stockCount <= 5 ? (
                    <View style={[styles.stockBadge, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                      <View style={[styles.stockDot, { backgroundColor: '#F59E0B' }]} />
                      <Text style={[styles.stockText, { color: '#F59E0B' }]}>Limité ({product.stockCount})</Text>
                    </View>
                  ) : (
                    <View style={[styles.stockBadge, { backgroundColor: 'rgba(212,175,55,0.1)' }]}>
                      <View style={[styles.stockDot, { backgroundColor: THEME.COLORS.primary }]} />
                      <Text style={[styles.stockText, { color: THEME.COLORS.primary }]}>En Stock ({product.stockCount})</Text>
                    </View>
                  )}
                </View>

                {/* Titre & Prix */}
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.price}>{product.price.toLocaleString()} FCFA</Text>

                <View style={styles.divider} />

                {/* FICHE TECHNIQUE / SPÉCIFICATIONS GRID (DESKTOP) */}
                <Text style={styles.sectionSubtitle}>Fiche Technique</Text>
                <View style={styles.specGridDesktop}>
                  <GlassCard style={styles.specCardDesktop} padding={12}>
                    <MaterialCommunityIcons name="tag-outline" size={20} color={THEME.COLORS.primary} />
                    <View style={styles.specTextCol}>
                      <Text style={styles.specLabel}>Catégorie</Text>
                      <Text style={styles.specValue}>{CATEGORY_LABELS[product.category] || product.category || 'Général'}</Text>
                    </View>
                  </GlassCard>

                  <GlassCard style={styles.specCardDesktop} padding={12}>
                    <MaterialCommunityIcons name="shield-check-outline" size={20} color={THEME.COLORS.primary} />
                    <View style={styles.specTextCol}>
                      <Text style={styles.specLabel}>Confiance</Text>
                      <Text style={styles.specValue}>100% Vérifié</Text>
                    </View>
                  </GlassCard>

                  <GlassCard style={styles.specCardDesktop} padding={12}>
                    <MaterialCommunityIcons name="truck-delivery-outline" size={20} color={THEME.COLORS.primary} />
                    <View style={styles.specTextCol}>
                      <Text style={styles.specLabel}>Livraison</Text>
                      <Text style={styles.specValue}>Express dispo</Text>
                    </View>
                  </GlassCard>

                  <GlassCard style={styles.specCardDesktop} padding={12}>
                    <MaterialCommunityIcons name="star-circle-outline" size={20} color={THEME.COLORS.primary} />
                    <View style={styles.specTextCol}>
                      <Text style={styles.specLabel}>Évaluation</Text>
                      <Text style={styles.specValue}>
                        {product.rating ? `${product.rating} / 5` : 'Excellente'}
                      </Text>
                    </View>
                  </GlassCard>
                </View>



                {/* Description */}
                <GlassCard style={styles.descriptionCard} padding={18}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="text-box-outline" size={18} color={THEME.COLORS.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.sectionTitle}>Description</Text>
                  </View>
                  <Text style={styles.descriptionText}>{description}</Text>
                </GlassCard>

                {/* Vendeur Certifié */}
                <GlassCard style={styles.sellerSection} padding={16}>
                  <View style={styles.sellerInfo}>
                    <View style={styles.sellerAvatarContainer}>
                      <View style={styles.sellerAvatar}>
                        <Ionicons name="storefront" size={22} color={THEME.COLORS.primary} />
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

                <View style={styles.divider} />

                {/* CONTRÔLEUR DE QUANTITÉ & BOUTON PANIER INTÉGRÉS */}
                {product.category !== 'Food' && (product.stockCount === 0 || product.isSoldOut) ? (
                  <View style={styles.actionBlock}>
                    <View style={styles.btnWrapper}>
                      <GoldButton 
                        title="Stock épuisé"
                        onPress={() => {}}
                        icon="alert-circle-outline"
                        style={{ opacity: 0.5 }}
                        disabled={true}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.actionBlock}>
                    <View style={styles.qtyContainer}>
                      <TouchableOpacity style={styles.qtyAction} onPress={handleRemove}>
                        <Ionicons name="remove" size={20} color={THEME.COLORS.textPrimary} />
                      </TouchableOpacity>
                      
                      <Text style={styles.qtyValue}>
                        {quantityInCart > 0 ? `${quantityInCart} dans le panier` : quantity}
                      </Text>
                      
                      <TouchableOpacity style={styles.qtyAction} onPress={handleAdd}>
                        <Ionicons name="add" size={20} color={THEME.COLORS.textPrimary} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.btnWrapper}>
                      <GoldButton 
                        title={quantityInCart > 0 ? "Panier mis à jour" : "Ajouter au panier"} 
                        onPress={handleAddToCart}
                        icon={quantityInCart > 0 ? "checkmark-circle-outline" : "cart-outline"}
                      />
                    </View>
                  </View>
                )}

              </View>

            </View>

          </View>
        </ScrollView>
      </View>
    );
  };

  // RENDER MOBILE LAYOUT (TELEPHONE EN PWA)
  const renderMobileLayout = () => {
    const isLongDescription = description.length > 150;

    return (
      <View style={styles.mobileContainer}>
        <StatusBar barStyle="light-content" transparent translucent />

        {/* HEADER DE NAVIGATION EN OVERLAY MODULAIRE */}
        <MarketplaceDetailsHeader title="Détails du Produit" isOverlay={true} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 130 }}
        >
          {/* CARROUSEL IMAGE AUTO-DEFILANT */}
          <View style={styles.mobileImageWrapper}>
            {images.length > 0 ? (
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
                  <Image key={i} source={{ uri: item }} style={[styles.mobileMainImage, { width }]} />
                ))}
              </ScrollView>
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
          <View style={[
            styles.mobileContentCard,
            !isDarkMode && {
              marginTop: -30,
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              backgroundColor: THEME.COLORS.background,
              paddingTop: 30,
              borderTopWidth: 1.5,
              borderLeftWidth: 1.5,
              borderRightWidth: 1.5,
              borderColor: 'rgba(212, 175, 55, 0.25)',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: -10 },
              shadowOpacity: 0.08,
              shadowRadius: 20,
              elevation: 5,
            }
          ]}>
            <View style={styles.mobileMainInfo}>
              <View style={styles.mobileRowBetween}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>
                    {CATEGORY_LABELS[product.category] || product.category || 'Général'}
                  </Text>
                </View>
                
                {product.category === 'Food' ? (
                  <View style={[styles.stockBadge, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                    <View style={[styles.stockDot, { backgroundColor: '#10B981' }]} />
                    <Text style={[styles.stockText, { color: '#10B981' }]}>Toujours dispo</Text>
                  </View>
                ) : product.stockCount === 0 || product.isSoldOut ? (
                  <View style={[styles.stockBadge, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                    <View style={[styles.stockDot, { backgroundColor: THEME.COLORS.danger }]} />
                    <Text style={[styles.stockText, { color: THEME.COLORS.danger, fontWeight: '800' }]}>Rupture</Text>
                  </View>
                ) : product.stockCount <= 5 ? (
                  <View style={[styles.stockBadge, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                    <View style={[styles.stockDot, { backgroundColor: '#F59E0B' }]} />
                    <Text style={[styles.stockText, { color: '#F59E0B' }]}>Limité ({product.stockCount})</Text>
                  </View>
                ) : (
                  <View style={[styles.stockBadge, { backgroundColor: 'rgba(212,175,55,0.1)' }]}>
                    <View style={[styles.stockDot, { backgroundColor: THEME.COLORS.primary }]} />
                    <Text style={[styles.stockText, { color: THEME.COLORS.primary }]}>En Stock ({product.stockCount})</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.mobileProductName}>{product.name}</Text>
              <Text style={styles.mobilePrice}>{product.price.toLocaleString()} FCFA</Text>
            </View>

            {/* FICHE TECHNIQUE (MOBILE GRID) */}
            <Text style={styles.sectionSubtitle}>Fiche Technique</Text>
            <View style={styles.specGridMobile}>
              <GlassCard style={styles.specCardMobile} padding={12}>
                <MaterialCommunityIcons name="tag-outline" size={20} color={THEME.COLORS.primary} />
                <Text style={styles.specLabel}>Catégorie</Text>
                <Text style={styles.specValue} numberOfLines={1}>
                  {CATEGORY_LABELS[product.category] || product.category || 'Général'}
                </Text>
              </GlassCard>

              <GlassCard style={styles.specCardMobile} padding={12}>
                <MaterialCommunityIcons name="shield-check-outline" size={20} color={THEME.COLORS.primary} />
                <Text style={styles.specLabel}>Confiance</Text>
                <Text style={styles.specValue} numberOfLines={1}>100% Vérifié</Text>
              </GlassCard>

              <GlassCard style={styles.specCardMobile} padding={12}>
                <MaterialCommunityIcons name="truck-delivery-outline" size={20} color={THEME.COLORS.primary} />
                <Text style={styles.specLabel}>Livraison</Text>
                <Text style={styles.specValue} numberOfLines={1}>Express dispo</Text>
              </GlassCard>

              <GlassCard style={styles.specCardMobile} padding={12}>
                <MaterialCommunityIcons name="star-circle-outline" size={20} color={THEME.COLORS.primary} />
                <Text style={styles.specLabel}>Évaluation</Text>
                <Text style={styles.specValue} numberOfLines={1}>
                  {product.rating ? `${product.rating} / 5` : 'Excellente'}
                </Text>
              </GlassCard>
            </View>

            {/* DESCRIPTION CARD */}
            <GlassCard style={styles.descriptionCard} padding={18}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="text-box-outline" size={18} color={THEME.COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.sectionTitle}>Description</Text>
              </View>
              <Text 
                style={styles.mobileDescriptionText}
                numberOfLines={isLongDescription ? 3 : undefined}
                ellipsizeMode="tail"
              >
                {description}
              </Text>
              {isLongDescription && (
                <TouchableOpacity 
                  style={styles.mobileReadMoreBtn} 
                  onPress={() => setIsDescModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.mobileReadMoreText}>Lire plus</Text>
                  <Ionicons 
                    name="chevron-forward" 
                    size={14} 
                    color={THEME.COLORS.primary} 
                  />
                </TouchableOpacity>
              )}
            </GlassCard>

            {/* VENDEUR CERTIFIE */}
            <GlassCard style={styles.mobileSellerSection} padding={16}>
              <View style={styles.mobileSellerInfo}>
                <View style={styles.sellerAvatarContainer}>
                  <View style={styles.mobileSellerAvatar}>
                     <Ionicons name="storefront" size={20} color={THEME.COLORS.primary} />
                  </View>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
                  </View>
                </View>
                
                <View style={styles.mobileSellerDetails}>
                  <Text style={styles.mobileSellerName}>{product.seller?.name || 'Boutique Yély'}</Text>
                  <Text style={styles.mobileSellerStatus}>Partenaire Certifié Yély</Text>
                </View>
              </View>
            </GlassCard>
          </View>
        </ScrollView>

        {/* FOOTER FIXE AVEC CAPSULE FLOTTANTE D'ACHAT PREMIUM */}
        <View style={[
          styles.floatingFooter, 
          { 
            bottom: Math.max(insets.bottom + 10, 20),
            backgroundColor: isDarkMode ? 'rgba(20, 20, 20, 0.88)' : 'rgba(255, 255, 255, 0.92)',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          }
        ]}>
          {product.category !== 'Food' && (product.stockCount === 0 || product.isSoldOut) ? (
            <GoldButton 
              title="Stock épuisé"
              onPress={() => {}}
              icon="alert-circle-outline"
              style={[styles.purchaseBtn, { opacity: 0.5 }]}
              disabled={true}
            />
          ) : quantityInCart === 0 ? (
            <GoldButton 
              title="Ajouter au panier"
              onPress={handleAddToCart}
              icon="cart-outline"
              style={styles.purchaseBtn}
            />
          ) : (
            <View style={styles.mobileUnifiedQtyContainer}>
              <TouchableOpacity style={styles.mobileUnifiedQtyAction} onPress={handleRemove}>
                <Ionicons name="remove" size={22} color={THEME.COLORS.textPrimary} />
              </TouchableOpacity>
              
              <Text style={styles.mobileUnifiedQtyText}>
                {quantityInCart} dans le panier
              </Text>
              
              <TouchableOpacity style={styles.mobileUnifiedQtyAction} onPress={handleAdd}>
                <Ionicons name="add" size={22} color={THEME.COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
 
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
    letterSpacing: 0.8,
  },
  stockBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(46,204,113,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  stockDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2ecc71', marginRight: 6 },
  stockText: { fontSize: 11, fontWeight: '800', color: '#2ecc71', textTransform: 'uppercase' },

  productName: {
    fontSize: 32,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
    marginBottom: THEME.SPACING.sm,
    letterSpacing: -0.5,
  },
  price: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 24,
  },
  
  // Desktop specifications grid style
  sectionSubtitle: { fontSize: 15, fontWeight: '800', color: THEME.COLORS.textPrimary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  specGridDesktop: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  specCardDesktop: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  specTextCol: { marginLeft: 12 },
  specLabel: { fontSize: 11, color: THEME.COLORS.textSecondary, fontWeight: '500' },
  specValue: { fontSize: 13, fontWeight: '800', color: THEME.COLORS.textPrimary, marginTop: 1 },
  
  // Trust Badges Ticker
  trustRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.04)', marginBottom: 22 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trustText: { fontSize: 10.5, fontWeight: '600', color: THEME.COLORS.textSecondary },

  descriptionCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    marginBottom: 20,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.COLORS.textPrimary,
  },
  descriptionText: {
    fontSize: 15,
    color: THEME.COLORS.textSecondary,
    lineHeight: 24,
  },
  sellerSection: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    marginBottom: 20,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatarContainer: { position: 'relative', marginRight: 15 },
  sellerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
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
  sellerName: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.COLORS.textPrimary,
  },
  sellerStatus: {
    fontSize: 12,
    color: '#2ecc71',
    fontWeight: '600',
    marginTop: 2,
  },
  sellerActionBtn: { marginLeft: 'auto', padding: 4 },

  actionBlock: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    width: '100%',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 25,
    height: 52,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  qtyAction: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  qtyValue: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.COLORS.textPrimary,
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  btnWrapper: {
    flex: 1,
  },

  // MOBILE RESPONSIVE STYLES (WEB)
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
  },
  mobileCircularBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mobileHeaderOverlayTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
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
    borderWidth: 1,
    borderColor: THEME.COLORS.background,
  },
  mobileCartBadgeOverlayText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  mobileImageWrapper: { height: 380, width: '100%', position: 'relative' },
  mobileMainImage: { height: 380, resizeMode: 'cover' },
  mobilePlaceholderImage: { height: 380, width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.COLORS.glassSurface },
  mobilePagination: { position: 'absolute', bottom: 35, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  mobileDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  mobileActiveDot: { width: 18, backgroundColor: THEME.COLORS.primary, borderRadius: 3 },
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
  mobileProductName: { fontSize: 24, fontWeight: '900', color: THEME.COLORS.textPrimary, marginBottom: 8, letterSpacing: -0.5 },
  mobilePrice: { fontSize: 22, fontWeight: '800', color: THEME.COLORS.primary },
  mobileDescriptionText: { fontSize: 14.5, color: THEME.COLORS.textSecondary, lineHeight: 22 },
  mobileReadMoreBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 4 },
  mobileReadMoreText: { color: THEME.COLORS.primary, fontWeight: '800', fontSize: 13.5 },
  mobileSellerSection: { 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.04)',
    marginBottom: 10 
  },
  mobileSellerInfo: { flexDirection: 'row', alignItems: 'center' },
  mobileSellerAvatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(255,255,255,0.04)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(212,175,55,0.3)' 
  },
  mobileSellerDetails: { flex: 1, marginLeft: 15 },
  mobileSellerName: { fontSize: 15, fontWeight: '800', color: THEME.COLORS.textPrimary },
  mobileSellerStatus: { fontSize: 11.5, color: '#2ecc71', fontWeight: '600', marginTop: 1 },
  
  // Mobile specifications grid layout (web)
  specGridMobile: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  specCardMobile: {
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  // Floating Purchase Footer capsule (web mobile)
  floatingFooter: { 
    position: 'absolute', 
    left: 20, 
    right: 20, 
    borderRadius: 30, 
    padding: 10,
    borderWidth: 1,
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
  mobileUnifiedQtyContainer: {
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
  mobileUnifiedQtyAction: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileUnifiedQtyText: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.COLORS.primary,
  },
  modalContent: { maxHeight: 500, padding: 5 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: THEME.COLORS.border || 'rgba(0, 0, 0, 0.08)', paddingBottom: 15, marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  modalScroll: { maxHeight: 300 },
  modalScrollContent: { paddingBottom: 20 },
  modalDescText: { fontSize: 15, color: THEME.COLORS.textSecondary, lineHeight: 24 },
  modalFooter: { borderTopWidth: 1, borderTopColor: THEME.COLORS.border || 'rgba(0, 0, 0, 0.08)', paddingTop: 15, alignItems: 'center' },
  modalCloseBtn: { backgroundColor: THEME.COLORS.primary, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 20 },
  modalCloseText: { color: '#000000', fontWeight: 'bold', fontSize: 14 },
  modalScrollTopBtn: { position: 'absolute', bottom: 80, right: 15, width: 36, height: 36, borderRadius: 18, backgroundColor: THEME.COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 }
});

export default ProductDetails;
