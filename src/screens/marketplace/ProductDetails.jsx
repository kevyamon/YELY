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
  StatusBar,
  useColorScheme,
  ScrollView,
  Animated,
  Easing,
  BackHandler,
  Modal
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';

import { useGetProductQuery, useGetProductReviewsQuery } from '../../store/api/marketplaceApiSlice';
import { showToast } from '../../store/slices/uiSlice';
import { addToCart, selectCartItems, removeFromCart, updateQuantity } from '../../store/slices/cartSlice';
import useMarketplaceSocketEvents from '../../hooks/useMarketplaceSocketEvents';
import THEME from '../../theme/theme';
import GoldButton from '../../components/ui/GoldButton';
import GlassCard from '../../components/ui/GlassCard';
import GlassModal from '../../components/ui/GlassModal';
import MarketplaceDetailsHeader from '../../components/marketplace/MarketplaceDetailsHeader';
import GlobalSkeleton, { SkeletonBone } from '../../components/ui/GlobalSkeleton';

const { width, height } = Dimensions.get('window');
const IMG_HEIGHT = height * 0.44;

const AnimatedStar = () => {
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const startRotation = () => {
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        rotateAnim.setValue(0);
      });
    };

    startRotation();
    const interval = setInterval(startRotation, 160000);
    return () => clearInterval(interval);
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <MaterialCommunityIcons name="star" size={22} color={THEME.COLORS.primary} />
    </Animated.View>
  );
};

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
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  useMarketplaceSocketEvents();
  const cartItems = useSelector(selectCartItems);
  const { productId } = route.params;
  const { data: productData, isLoading, isError } = useGetProductQuery(productId);
  const { data: reviewsData } = useGetProductReviewsQuery(productId);
  const reviews = reviewsData?.data || [];

  const renderDetailStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <MaterialCommunityIcons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={11}
          color="#D4AF37"
        />
      );
    }
    return <View style={{ flexDirection: 'row', gap: 1 }}>{stars}</View>;
  };
  const colorScheme = useColorScheme();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  useEffect(() => {
    const backAction = () => {
      if (!navigation.canGoBack()) {
        navigation.navigate('Home');
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation]);
  
  const isDarkMode = colorScheme === 'dark';
  
  const flatListRef = useRef(null);
  const modalScrollViewRef = useRef(null);
  
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isDescModalVisible, setIsDescModalVisible] = useState(false);
  const [showModalScrollTop, setShowModalScrollTop] = useState(false);
  
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  const handleImageClick = (index) => {
    setViewerIndex(index);
    setIsViewerVisible(true);
  };

  // PROGRAMMATIC INITIAL SCROLL FOR THE IMAGE VIEWER MODAL (Avoids buggy contentOffset on mount)
  useEffect(() => {
    if (isViewerVisible && modalScrollViewRef.current) {
      const timer = setTimeout(() => {
        modalScrollViewRef.current?.scrollTo({
          x: viewerIndex * width,
          animated: false,
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isViewerVisible, viewerIndex]);

  const product = productData?.data;
  const images = product?.images && product?.images.length > 0 ? product.images : (product?.image ? [product.image] : []);

  const cartItem = cartItems.find(item => item.id === productId);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const reviewsFlatListRef = useRef(null);
  const [activeReviewSlide, setActiveReviewSlide] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(0);

  const reviewsCount = reviews.length;
  const avgRating = reviewsCount > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount).toFixed(1) 
    : (product?.rating ? product.rating.toFixed(1) : '5.0');

  // Diaporama automatique toutes les 5 secondes (Images)
  useEffect(() => {
    if (images.length <= 1 || isViewerVisible || isCarouselPaused) return;

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
      } catch (_err) {
        // Fallback en cas d'erreur de chargement
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeImage, images.length, isViewerVisible, isCarouselPaused]);

  // Diaporama automatique toutes les 6 secondes (Avis)
  useEffect(() => {
    if (reviews.length < 2 || carouselWidth <= 0) return;

    const interval = setInterval(() => {
      let nextIndex = activeReviewSlide + 1;
      if (nextIndex >= reviews.length) {
        nextIndex = 0;
      }
      try {
        reviewsFlatListRef.current?.scrollTo({
          x: nextIndex * carouselWidth,
          animated: true,
        });
        setActiveReviewSlide(nextIndex);
      } catch (_err) {
        // Fallback
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [activeReviewSlide, reviews.length, carouselWidth]);

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

  const renderSkeleton = () => {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} transparent translucent />
        <MarketplaceDetailsHeader title="Chargement..." />
        <GlobalSkeleton visible={true} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 130 }}>
            {/* Image Placeholder */}
            <SkeletonBone width={width} height={IMG_HEIGHT} borderRadius={0} />

            {/* Content Card Overlay */}
            <View style={[styles.contentCard, { marginTop: -25 }]}>
              {/* Category and Stock badge skeletons */}
              <View style={[styles.rowBetween, { marginBottom: 15 }]}>
                <SkeletonBone width={80} height={20} borderRadius={8} />
                <SkeletonBone width={100} height={20} borderRadius={8} />
              </View>

              {/* Title & Price Skeletons */}
              <SkeletonBone width={width * 0.6} height={26} borderRadius={6} style={{ marginBottom: 12 }} />
              <SkeletonBone width={120} height={22} borderRadius={6} style={{ marginBottom: 25 }} />

              {/* Specs Grid Skeletons */}
              <View style={[styles.rowBetween, { marginBottom: 12 }]}>
                <SkeletonBone width="48.5%" height={68} borderRadius={16} />
                <SkeletonBone width="48.5%" height={68} borderRadius={16} />
              </View>
              <View style={[styles.rowBetween, { marginBottom: 25 }]}>
                <SkeletonBone width="48.5%" height={68} borderRadius={16} />
                <SkeletonBone width="48.5%" height={68} borderRadius={16} />
              </View>

              {/* Description Card Skeleton */}
              <SkeletonBone width="100%" height={110} borderRadius={20} style={{ marginBottom: 15 }} />

              {/* Seller Card Skeleton */}
              <SkeletonBone width="100%" height={76} borderRadius={20} />
            </View>
          </ScrollView>
        </GlobalSkeleton>

        {/* Floating Footer Skeleton */}
        <View style={[
          styles.floatingFooter, 
          { 
            bottom: Math.max(insets.bottom + 10, 20),
            backgroundColor: isDarkMode ? 'rgba(20, 20, 20, 0.88)' : 'rgba(255, 255, 255, 0.92)',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          }
        ]}>
          <SkeletonBone width="100%" height={52} borderRadius={24} />
        </View>
      </View>
    );
  };

  if (isLoading) {
    return renderSkeleton();
  }

  if (isError || !product) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Produit introuvable</Text>
        <GoldButton title="Retour" onPress={handleBack} variant="secondary" size="small" fullWidth={false} />
      </View>
    );
  }

  const description = product.description || "L'excellence Yely au service de votre quotidien.";
  const isLongDescription = description.length > 150;

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
              <TouchableOpacity 
                key={i} 
                activeOpacity={0.9} 
                onPress={() => handleImageClick(i)}
                onPressIn={() => setIsCarouselPaused(true)}
                onPressOut={() => setIsCarouselPaused(false)}
              >
                <Image source={{ uri: item }} style={styles.mainImage} />
              </TouchableOpacity>
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

            <TouchableOpacity 
              style={styles.specCardTouch} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ProductReviews', { productId: product._id, productName: product.name })}
            >
              <GlassCard style={styles.specCardContainer} padding={14}>
                <AnimatedStar />
                <Text style={styles.specLabel}>Évaluation</Text>
                <Text style={styles.specValue} numberOfLines={1}>
                  {`${avgRating} / 5`}
                </Text>
                <Text style={styles.specReviewsLink}>Lire les avis ({reviewsCount})</Text>
              </GlassCard>
            </TouchableOpacity>
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
          {product.seller && (
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('SellerProfile', { sellerId: product.seller._id })}
            >
              <GlassCard style={styles.sellerSection} padding={16}>
                <View style={styles.sellerInfoRow}>
                  <View style={styles.sellerAvatarContainer}>
                    {product.seller.profilePicture ? (
                      <Image source={{ uri: product.seller.profilePicture }} style={styles.sellerAvatarImage} />
                    ) : (
                      <View style={styles.sellerAvatar}>
                         <Ionicons name="storefront" size={20} color={THEME.COLORS.primary} />
                      </View>
                    )}
                    <View style={styles.verifiedBadge}>
                      <MaterialCommunityIcons name="check-decagram" size={12} color="#D4AF37" />
                    </View>
                  </View>
                  
                  <View style={styles.sellerDetails}>
                    <Text style={styles.sellerName}>{product.seller.name || 'Boutique Yély'}</Text>
                    <View style={styles.sellerRatingRow}>
                      <Ionicons name="star" size={11} color="#D4AF37" style={{ marginRight: 2 }} />
                      <Text style={styles.sellerRatingVal}>
                        {product.seller.rating ? product.seller.rating.toFixed(1) : '5.0'} / 5
                      </Text>
                      <Text style={styles.sellerRatingSeparator}>•</Text>
                      <Text style={styles.sellerActionText}>Visiter la boutique</Text>
                    </View>
                  </View>

                  <MaterialCommunityIcons name="chevron-right" size={24} color={THEME.COLORS.textTertiary} />
                </View>
              </GlassCard>
            </TouchableOpacity>
          )}

          {/* SECTION AVIS CLIENTS */}
          <GlassCard style={styles.reviewsSectionCard} padding={18}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="comment-text-multiple-outline" size={18} color={THEME.COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Avis clients ({reviews.length})</Text>
            </View>

            {reviews.length === 0 ? (
              <Text style={styles.noReviewsText}>Aucun avis pour le moment.</Text>
            ) : (
              <View style={styles.reviewsListPreview}>
                {reviews.length < 2 ? (
                  reviews.map((item) => (
                    <View key={item._id} style={styles.detailReviewItem}>
                      <View style={styles.detailReviewHeader}>
                        <View style={styles.reviewUserRow}>
                          {item.user?.profilePicture ? (
                            <Image source={{ uri: item.user.profilePicture }} style={styles.reviewAvatarImage} />
                          ) : (
                            <View style={styles.reviewAvatar}>
                              <Text style={styles.reviewAvatarText}>
                                {(item.user?.name || 'C').charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <Text style={styles.detailReviewUser}>{item.user?.name || 'Client Yély'}</Text>
                        </View>
                        <View style={styles.detailReviewStars}>
                          {renderDetailStars(item.rating)}
                        </View>
                      </View>
                      <Text style={styles.detailReviewComment} numberOfLines={2}>
                        {item.comment}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View 
                    onLayout={(e) => {
                      const w = e.nativeEvent.layout.width;
                      if (w > 0) setCarouselWidth(w);
                    }}
                    style={{ width: '100%', overflow: 'hidden' }}
                  >
                    {carouselWidth > 0 && (
                      <ScrollView
                        ref={reviewsFlatListRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                          const index = Math.round(e.nativeEvent.contentOffset.x / carouselWidth);
                          setActiveReviewSlide(index);
                        }}
                        style={{ width: carouselWidth }}
                        contentContainerStyle={{ alignItems: 'center' }}
                      >
                        {reviews.map((item) => (
                          <View key={item._id} style={[styles.carouselReviewItem, { width: carouselWidth }]}>
                            <View style={styles.detailReviewHeader}>
                              <View style={styles.reviewUserRow}>
                                {item.user?.profilePicture ? (
                                  <Image source={{ uri: item.user.profilePicture }} style={styles.reviewAvatarImage} />
                                ) : (
                                  <View style={styles.reviewAvatar}>
                                    <Text style={styles.reviewAvatarText}>
                                      {(item.user?.name || 'C').charAt(0).toUpperCase()}
                                    </Text>
                                  </View>
                                )}
                                <Text style={styles.detailReviewUser}>{item.user?.name || 'Client Yély'}</Text>
                              </View>
                              <View style={styles.detailReviewStars}>
                                {renderDetailStars(item.rating)}
                              </View>
                            </View>
                            <View style={styles.reviewQuoteContainer}>
                              <MaterialCommunityIcons name="format-quote-open" size={20} color="rgba(212,175,55,0.3)" style={{ marginRight: 6 }} />
                              <Text style={styles.detailReviewComment} numberOfLines={3}>
                                {item.comment}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                    
                    <View style={styles.reviewsPagination}>
                      {reviews.map((_, i) => (
                        <View 
                          key={i} 
                          style={[
                            styles.reviewsDot, 
                            { backgroundColor: activeReviewSlide === i ? THEME.COLORS.primary : (isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)') },
                            activeReviewSlide === i && styles.reviewsActiveDot
                          ]} 
                        />
                      ))}
                    </View>
                  </View>
                )}

                {reviews.length > 3 && (
                  <TouchableOpacity 
                    style={styles.viewAllReviewsBtn}
                    onPress={() => navigation.navigate('ProductReviews', { productId: product._id, productName: product.name })}
                  >
                    <Text style={styles.viewAllReviewsText}>Voir tous les {reviews.length} avis</Text>
                    <Ionicons name="arrow-forward" size={14} color={THEME.COLORS.primary} />
                  </TouchableOpacity>
                )}
              </View>
            )}
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

      {/* FULLSCREEN IMAGE VIEWER MODAL */}
      <Modal
        visible={isViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsViewerVisible(false)}
      >
        <View style={styles.viewerContainer}>
          <TouchableOpacity 
            style={[styles.viewerCloseBtn, { top: Math.max(insets.top, 20) }]}
            onPress={() => setIsViewerVisible(false)}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <ScrollView
            ref={modalScrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.viewerScrollView}
            contentContainerStyle={{ alignItems: 'center' }}
            onMomentumScrollEnd={(e) => {
              setViewerIndex(Math.round(e.nativeEvent.contentOffset.x / width));
            }}
          >
            {images.map((item, i) => (
              <View key={i} style={styles.viewerImageWrapper}>
                <Image source={{ uri: item }} style={styles.viewerImage} />
              </View>
            ))}
          </ScrollView>

          {images.length > 1 && (
            <View style={styles.viewerPagination}>
              {images.map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.viewerDot, 
                    viewerIndex === i && styles.viewerActiveDot
                  ]} 
                />
              ))}
            </View>
          )}
        </View>
      </Modal>
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
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  specCard: {
    width: '48.5%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 10,
  },
  specCardTouch: {
    width: '48.5%',
    marginBottom: 10,
  },
  specCardContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  specLabel: { fontSize: 11, color: THEME.COLORS.textSecondary, marginTop: 6, fontWeight: '500' },
  specValue: { fontSize: 13, fontWeight: '800', color: THEME.COLORS.textPrimary, marginTop: 2 },
  specReviewsLink: { fontSize: 9.5, color: THEME.COLORS.primary, fontWeight: '800', marginTop: 4, textTransform: 'uppercase' },
  
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
  sellerInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  sellerAvatarImage: {
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    borderWidth: 1, 
    borderColor: 'rgba(212,175,55,0.3)' 
  },
  verifiedBadge: { 
    position: 'absolute', 
    bottom: -2, 
    right: -2, 
    backgroundColor: '#000000', 
    width: 16, 
    height: 16, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  sellerDetails: { flex: 1 },
  sellerName: { fontSize: 15, fontWeight: '800', color: THEME.COLORS.textPrimary },
  sellerRatingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  sellerRatingVal: { fontSize: 11, color: THEME.COLORS.textSecondary, fontWeight: '700' },
  sellerRatingSeparator: { fontSize: 11, color: THEME.COLORS.textTertiary, marginHorizontal: 6 },
  sellerActionText: { fontSize: 11, color: THEME.COLORS.primary, fontWeight: '700' },

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
  modalScrollTopBtn: { position: 'absolute', bottom: 80, right: 15, width: 36, height: 36, borderRadius: 18, backgroundColor: THEME.COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  reviewsSectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    marginBottom: 15
  },
  noReviewsText: {
    color: THEME.COLORS.textTertiary,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 5
  },
  reviewsListPreview: {
    marginTop: 10
  },
  detailReviewItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 10
  },
  detailReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  detailReviewUser: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.COLORS.textPrimary
  },
  detailReviewStars: {
    flexDirection: 'row'
  },
  detailReviewComment: {
    fontSize: 12.5,
    color: THEME.COLORS.textSecondary,
    lineHeight: 18
  },
  viewAllReviewsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    gap: 6
  },
  viewAllReviewsText: {
    color: THEME.COLORS.primary,
    fontSize: 13,
    fontWeight: '800'
  },
  carouselReviewItem: {
    paddingVertical: 10,
    paddingHorizontal: 5
  },
  reviewUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  reviewAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)'
  },
  reviewAvatarText: {
    color: THEME.COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold'
  },
  reviewQuoteContainer: {
    flexDirection: 'row',
    marginTop: 8,
    paddingLeft: 4,
    alignItems: 'flex-start'
  },
  reviewsPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    gap: 6
  },
  reviewsDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  reviewsActiveDot: {
    width: 14
  },
  reviewAvatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)'
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  viewerScrollView: {
    flex: 1,
    width: width,
  },
  viewerCloseBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 1000,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImageWrapper: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: width,
    height: height * 0.7,
    resizeMode: 'contain',
  },
  viewerPagination: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'center',
  },
  viewerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  viewerActiveDot: {
    backgroundColor: THEME.COLORS.primary || '#D4AF37',
    width: 20,
  }
});

export default ProductDetails;
