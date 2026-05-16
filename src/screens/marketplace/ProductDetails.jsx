// src/screens/marketplace/ProductDetails.jsx
// DETAILS PRODUIT PREMIUM - Design Minimaliste & Industriel
// CSCSM Level: Bank Grade

import React, { useState, useRef } from 'react';
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
  useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  interpolate,
  Extrapolate,
  interpolateColor
} from 'react-native-reanimated';
import { useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';

import { useGetProductQuery } from '../../store/api/marketplaceApiSlice';
import { showToast } from '../../store/slices/uiSlice';
import { addToCart } from '../../store/slices/cartSlice';
import useMarketplaceSocketEvents from '../../hooks/useMarketplaceSocketEvents';
import THEME from '../../theme/theme';
import GoldButton from '../../components/ui/GoldButton';
import GlassCard from '../../components/ui/GlassCard';
import GlassModal from '../../components/ui/GlassModal';

const { width, height } = Dimensions.get('window');
const IMG_HEIGHT = height * 0.5;

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
  
  const scrollY = useSharedValue(0);

  const product = productData?.data;
  const images = product?.images && product?.images.length > 0 ? product.images : (product?.image ? [product.image] : []);

  // Scroll Handler pour le header dynamique
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Styles animés pour le header unifié
  const headerContainerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollY.value,
      [IMG_HEIGHT - 100, IMG_HEIGHT - 40],
      ['transparent', THEME.COLORS.background]
    );
    const borderBottomColor = interpolateColor(
      scrollY.value,
      [IMG_HEIGHT - 100, IMG_HEIGHT - 40],
      ['transparent', isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)']
    );
    return {
      backgroundColor,
      borderBottomColor,
      borderBottomWidth: 1,
    };
  });

  const headerTitleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [IMG_HEIGHT - 100, IMG_HEIGHT - 40], [0, 1], Extrapolate.CLAMP);
    const translateY = interpolate(scrollY.value, [IMG_HEIGHT - 100, IMG_HEIGHT - 40], [-10, 0], Extrapolate.CLAMP);
    return { 
      opacity, 
      transform: [{ translateY }]
    };
  });

  const headerBtnStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollY.value,
      [IMG_HEIGHT - 100, IMG_HEIGHT - 40],
      ['rgba(0, 0, 0, 0.4)', 'transparent']
    );
    const borderColor = interpolateColor(
      scrollY.value,
      [IMG_HEIGHT - 100, IMG_HEIGHT - 40],
      ['rgba(255, 255, 255, 0.15)', 'transparent']
    );
    return {
      backgroundColor,
      borderColor,
      borderWidth: 1,
    };
  });

  const headerIconStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      scrollY.value,
      [IMG_HEIGHT - 100, IMG_HEIGHT - 40],
      ['#FFFFFF', THEME.COLORS.textPrimary]
    );
    return { color };
  });

  const imgScaleStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollY.value, [-100, 0], [1.2, 1], Extrapolate.CLAMP);
    return { transform: [{ scale }] };
  });

  const handleAddToCart = () => {
    if (!product) return;

    // Normalisation pour garantir que l'ID est présent (support _id et id)
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
  const isLongDescription = description.length > 180;
  const displayDescription = isLongDescription 
    ? `${description.slice(0, 180)}...` 
    : description;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} transparent translucent />

      {/* HEADER UNIQUE INTELLIGENT */}
      <Animated.View style={[styles.header, { paddingTop: insets.top }, headerContainerStyle]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.navBtnWrapper}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Animated.View style={[styles.navBtn, headerBtnStyle]}>
              <Animated.Text style={headerIconStyle}>
                <Ionicons name="arrow-back" size={24} />
              </Animated.Text>
            </Animated.View>
          </TouchableOpacity>
          
          <Animated.Text style={[styles.headerTitle, headerTitleStyle]} numberOfLines={1}>
            {product.name}
          </Animated.Text>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('Cart')} 
            style={styles.navBtnWrapper}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Animated.View style={[styles.navBtn, headerBtnStyle]}>
              <Animated.Text style={headerIconStyle}>
                <Ionicons name="cart-outline" size={24} />
              </Animated.Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDescModalVisible}
      >
        {/* CARROUSEL IMAGE */}
        <View style={styles.imageWrapper}>
          <Animated.View style={[styles.imgContainer, imgScaleStyle]}>
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
          </Animated.View>
          
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(248,249,250,0.8)']}
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

        <View style={styles.content}>
          <View style={styles.mainInfo}>
            <View style={styles.rowBetween}>
              <Text style={styles.category}>{CATEGORY_LABELS[product.category] || product.category}</Text>
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

          <GlassCard style={styles.sellerSection} padding={15}>
            <View style={styles.sellerInfo}>
              <View style={styles.sellerAvatar}>
                 <Ionicons name="storefront-outline" size={22} color={THEME.COLORS.primary} />
              </View>
              <View>
                <Text style={styles.sellerName}>{product.seller?.name || 'Boutique Yély'}</Text>
                <Text style={styles.sellerStatus}>Partenaire Certifié</Text>
              </View>
            </View>
          </GlassCard>

          <View style={{ height: 140 }} />
        </View>
      </Animated.ScrollView>

      {/* MODALE DE DESCRIPTION COMPLÈTE */}
      <GlassModal
        visible={isDescModalVisible}
        onClose={() => setIsDescModalVisible(false)}
        position="center"
        closeOnBackdrop={true}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Ionicons name="document-text-outline" size={28} color={THEME.COLORS.primary} />
            <Text style={styles.modalTitle}>Description complète</Text>
          </View>
          
          <Animated.ScrollView 
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
          </Animated.ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={() => setIsDescModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>

          {/* BOUTON INTERNE SCROLL TO TOP */}
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

      {/* FOOTER FIXE ÉPURÉ */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.footerRow}>
          <View style={styles.qtyContainer}>
            <TouchableOpacity style={styles.qtyAction} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
              <Ionicons name="remove" size={20} color={THEME.COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyAction} onPress={() => setQuantity(quantity + 1)}>
              <Ionicons name="add" size={20} color={THEME.COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <GoldButton 
              title="Ajouter au panier" 
              onPress={handleAddToCart}
              icon="cart-outline"
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    zIndex: 100,
  },
  headerContent: { 
    height: 60, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20 
  },
  headerTitle: { 
    flex: 1, 
    textAlign: 'center', 
    fontSize: 16, 
    fontWeight: '700', 
    color: THEME.COLORS.textPrimary, 
    marginHorizontal: 10 
  },
  navBtnWrapper: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  imageWrapper: { height: IMG_HEIGHT },
  imgContainer: { width: '100%', height: '100%' },
  mainImage: { width: width, height: IMG_HEIGHT, resizeMode: 'cover' },
  imageGradient: { ...StyleSheet.absoluteFillObject },
  pagination: { position: 'absolute', bottom: 25, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  activeDot: { width: 18, backgroundColor: THEME.COLORS.primary },
  content: { marginTop: -25, backgroundColor: THEME.COLORS.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 25, paddingTop: 30 },
  mainInfo: { marginBottom: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  category: { fontSize: 12, fontWeight: '700', color: THEME.COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(212,175,55,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontSize: 12, fontWeight: '700', color: THEME.COLORS.primary },
  productName: { fontSize: 28, fontWeight: '800', color: THEME.COLORS.textPrimary, marginBottom: 8 },
  price: { fontSize: 22, fontWeight: '700', color: THEME.COLORS.primary },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: THEME.COLORS.textPrimary, marginBottom: 10 },
  descriptionText: { fontSize: 15, color: THEME.COLORS.textSecondary, lineHeight: 24 },
  sellerSection: { marginTop: 10 },
  sellerInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  sellerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },
  sellerName: { fontSize: 15, fontWeight: '700', color: THEME.COLORS.textPrimary },
  sellerStatus: { fontSize: 12, color: THEME.COLORS.success, marginTop: 2 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: THEME.COLORS.background, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 20, paddingTop: 15 },
  footerRow: { flexDirection: 'row', gap: 15, alignItems: 'center' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 25, height: 58, paddingHorizontal: 5 },
  qtyAction: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  qtyValue: { fontSize: 18, fontWeight: '700', color: THEME.COLORS.textPrimary, marginHorizontal: 10, minWidth: 20, textAlign: 'center' },
  errorText: { color: THEME.COLORS.textSecondary, marginBottom: 20, fontSize: 16 },
  
  // Modale description styles
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  readMoreText: {
    color: THEME.COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalContent: {
    maxHeight: height * 0.6,
    padding: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 15,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalScroll: {
    maxHeight: height * 0.4,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  modalDescText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 24,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 15,
    alignItems: 'center',
  },
  modalCloseBtn: {
    backgroundColor: THEME.COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  modalCloseText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalScrollTopBtn: {
    position: 'absolute',
    bottom: 80,
    right: 15,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
});

export default ProductDetails;
