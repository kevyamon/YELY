// src/screens/marketplace/ProductDetails.jsx
// DETAILS PRODUIT PREMIUM - Design Cinematic & UX GTY Express
// CSCSM Level: Bank Grade

import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Dimensions, 
  ScrollView, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  interpolate,
  Extrapolate 
} from 'react-native-reanimated';
import { useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';

import ScreenWrapper from '../../components/ui/ScreenWrapper';
import GlassCard from '../../components/ui/GlassCard';
import GoldButton from '../../components/ui/GoldButton';
import { useGetProductQuery } from '../../store/api/marketplaceApiSlice';
import { showToast } from '../../store/slices/uiSlice';
import { addToCart } from '../../store/slices/cartSlice';
import THEME from '../../theme/theme';

const { width, height } = Dimensions.get('window');
const IMG_HEIGHT = height * 0.45;

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
  const { productId } = route.params;
  const { data: productData, isLoading, isError } = useGetProductQuery(productId);
  
  const flatListRef = useRef(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const scrollY = useSharedValue(0);

  const product = productData?.data;
  const images = product?.images && product?.images.length > 0 ? product.images : (product?.image ? [product.image] : []);

  // AUTO-PLAY LOGIC
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      let nextIndex = activeImage + 1;
      if (nextIndex >= images.length) {
        nextIndex = 0;
      }
      
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveImage(nextIndex);
    }, 4000); // Un peu plus lent sur les details (4s)

    return () => clearInterval(interval);
  }, [activeImage, images.length]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 100], [0, 1], Extrapolate.CLAMP);
    return { opacity, backgroundColor: THEME.COLORS.background };
  });

  const imgScaleStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollY.value, [-100, 0], [1.3, 1], Extrapolate.CLAMP);
    return { transform: [{ scale }] };
  });

  const handleAddToCart = () => {
    dispatch(addToCart({ product, quantity }));
    dispatch(showToast({
      type: 'success',
      title: 'Panier mis à jour',
      message: `${quantity}x ${product.name} ajouté(s) au panier.`
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
        <Text style={styles.errorText}>Impossible de charger le produit.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.errorBtn}>
          <Text style={styles.errorBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" transparent translucent />

      {/* HEADER FLOTTANT ANIMÉ */}
      <Animated.View style={[styles.header, { paddingTop: insets.top }, headerStyle]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBtn}>
            <Ionicons name="arrow-back" size={24} color={THEME.COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
          <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.navigate('Cart')}>
            <Ionicons name="cart-outline" size={24} color={THEME.COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* HEADER TRANSPARENT (Initial) */}
      <View style={[styles.transparentHeader, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.glassBackBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.glassBackBtn} onPress={() => navigation.navigate('Cart')}>
          <Ionicons name="cart-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* CARROUSEL D'IMAGES AUTO-PLAY */}
        <View style={styles.imageWrapper}>
          <Animated.View style={[styles.imgContainer, imgScaleStyle]}>
             <FlatList 
                ref={flatListRef}
                data={images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScrollToIndexFailed={() => {}}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / width);
                  setActiveImage(index);
                }}
                renderItem={({ item }) => (
                  <Image source={{ uri: item }} style={styles.mainImage} />
                )}
                keyExtractor={(_, i) => `img-${i}`}
             />
          </Animated.View>
          
          {images.length > 1 && (
            <View style={styles.imagePagination}>
              {images.map((_, i) => (
                <View 
                  key={i} 
                  style={[styles.paginationDot, activeImage === i && styles.activePaginationDot]} 
                />
              ))}
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(18, 20, 24, 0.8)']}
            style={styles.gradient}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.mainInfo}>
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>{product.price.toLocaleString()} FCFA</Text>
            </View>
            <Text style={styles.productName}>{product.name}</Text>
            
            <View style={styles.metaRow}>
              <View style={styles.badge}>
                <Ionicons name="star" size={14} color={THEME.COLORS.primary} />
                <Text style={styles.badgeText}>{product.rating || '5.0'}</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="time-outline" size={14} color={THEME.COLORS.textSecondary} />
                <Text style={styles.badgeText}>20-30 min</Text>
              </View>
              <Text style={styles.categoryBadge}>{CATEGORY_LABELS[product.category] || product.category}</Text>
            </View>
          </View>

          <GlassCard style={styles.sellerCard}>
            <View style={styles.sellerAvatar}>
               <Ionicons name="person" size={24} color={THEME.COLORS.primary} />
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{product.seller?.name || 'Vendeur Yély'}</Text>
              <Text style={styles.sellerStatus}>Vendeur Vérifié</Text>
            </View>
            <TouchableOpacity style={styles.contactBtn}>
               <Ionicons name="chatbubble-ellipses-outline" size={24} color={THEME.COLORS.primary} />
            </TouchableOpacity>
          </GlassCard>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{product.description || "Pas de description disponible pour ce produit."}</Text>
          </View>

          <View style={styles.spacer} />
        </View>
      </Animated.ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.quantitySelector}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
            <Ionicons name="remove" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(quantity + 1)}>
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addCartBtn} onPress={handleAddToCart}>
          <Text style={styles.addCartText}>Ajouter au panier</Text>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>{(product.price * quantity).toLocaleString()} F</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.COLORS.background },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 60 },
  headerTitle: { flex: 1, marginHorizontal: 15, fontSize: 18, fontWeight: 'bold', color: THEME.COLORS.textPrimary, textAlign: 'center' },
  circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: THEME.COLORS.glassSurface, justifyContent: 'center', alignItems: 'center' },
  transparentHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 90, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  glassBackBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  imageWrapper: { height: IMG_HEIGHT, position: 'relative' },
  imgContainer: { width: '100%', height: '100%' },
  mainImage: { width: width, height: IMG_HEIGHT, resizeMode: 'cover' },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  imagePagination: { position: 'absolute', bottom: 30, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  paginationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  activePaginationDot: { backgroundColor: THEME.COLORS.primary, width: 20 },
  content: { marginTop: -20, backgroundColor: THEME.COLORS.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 30 },
  mainInfo: { marginBottom: 25 },
  priceTag: { backgroundColor: 'rgba(212, 175, 55, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 12 },
  priceText: { color: THEME.COLORS.primary, fontWeight: 'bold', fontSize: 18 },
  productName: { fontSize: 26, fontWeight: '800', color: THEME.COLORS.textPrimary },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 15, alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: THEME.COLORS.glassSurface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 12, color: THEME.COLORS.textSecondary, fontWeight: '600' },
  categoryBadge: { fontSize: 12, color: THEME.COLORS.primary, fontWeight: 'bold', textTransform: 'uppercase', marginLeft: 'auto' },
  sellerCard: { flexDirection: 'row', alignItems: 'center', padding: 15, marginBottom: 25 },
  sellerAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)' },
  sellerInfo: { flex: 1, marginLeft: 15 },
  sellerName: { fontSize: 16, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  sellerStatus: { fontSize: 12, color: '#27ae60', marginTop: 2 },
  contactBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.COLORS.textPrimary, marginBottom: 10 },
  descriptionText: { fontSize: 15, color: THEME.COLORS.textSecondary, lineHeight: 24 },
  spacer: { height: 120 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: THEME.COLORS.background, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 20, paddingTop: 15, flexDirection: 'row', gap: 15 },
  quantitySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.COLORS.glassSurface, borderRadius: 20, height: 56, paddingHorizontal: 8 },
  qtyBtn: { width: 40, height: 40, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  qtyText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginHorizontal: 15 },
  addCartBtn: { flex: 1, height: 56, backgroundColor: THEME.COLORS.primary, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  addCartText: { color: THEME.COLORS.deepAsphalt, fontWeight: '800', fontSize: 16 },
  totalBadge: { backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 10 },
  totalBadgeText: { color: THEME.COLORS.deepAsphalt, fontWeight: 'bold', fontSize: 13 },
  errorText: { color: THEME.COLORS.textSecondary, marginBottom: 20 },
  errorBtn: { backgroundColor: THEME.COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  errorBtnText: { color: '#000', fontWeight: 'bold' }
});

export default ProductDetails;
