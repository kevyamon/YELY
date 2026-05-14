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
  StatusBar
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

const { width, height } = Dimensions.get('window');
const IMG_HEIGHT = height * 0.5;

const CATEGORY_LABELS = {
  'Food': 'Gastronomie',
  'Supermarket': 'Market',
  'Cosmetics': 'Beauté',
  'Electronics': 'Tech',
  'Home': 'Maison',
  'Other': 'Divers'
};

const ProductDetails = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  useMarketplaceSocketEvents();
  const { productId } = route.params;
  const { data: productData, isLoading, isError } = useGetProductQuery(productId);
  
  const flatListRef = useRef(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const scrollY = useSharedValue(0);

  const product = productData?.data;
  const images = product?.images && product?.images.length > 0 ? product.images : (product?.image ? [product.image] : []);

  // Scroll Handler pour le header dynamique
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Styles animés pour le header
  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [IMG_HEIGHT - 100, IMG_HEIGHT - 40], [0, 1], Extrapolate.CLAMP);
    const translateY = interpolate(scrollY.value, [IMG_HEIGHT - 100, IMG_HEIGHT - 40], [-20, 0], Extrapolate.CLAMP);
    return { 
      opacity, 
      transform: [{ translateY }],
      backgroundColor: THEME.COLORS.background,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.05)'
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
    dispatch(addToCart({ product, quantity }));
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" transparent translucent />

      {/* HEADER UNIQUE INTELLIGENT */}
      <Animated.View style={[styles.header, { paddingTop: insets.top }, headerStyle]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
            <Animated.Text style={headerIconStyle}>
              <Ionicons name="arrow-back" size={24} />
            </Animated.Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.navBtn}>
            <Animated.Text style={headerIconStyle}>
              <Ionicons name="cart-outline" size={24} />
            </Animated.Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* BOUTONS FLOTTANTS (Visibles au top) */}
      <View style={[styles.floatingNav, { top: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.glassBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.glassBtn}>
          <Ionicons name="cart-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
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
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.8)']}
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
              {product.description || "L'excellence Yély au service de votre quotidien."}
            </Text>
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
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  headerContent: { height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: THEME.COLORS.textPrimary, marginHorizontal: 10 },
  navBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  floatingNav: { position: 'absolute', left: 0, right: 0, zIndex: 90, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  glassBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
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
  errorText: { color: THEME.COLORS.textSecondary, marginBottom: 20, fontSize: 16 }
});

export default ProductDetails;
