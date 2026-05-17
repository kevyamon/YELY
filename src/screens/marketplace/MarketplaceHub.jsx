// src/screens/marketplace/MarketplaceHub.jsx
import React, { useState, useRef } from 'react';
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Dimensions,
  StatusBar,
  TextInput,
  Platform
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Animated } from 'react-native';
import useMarketplaceSocketEvents from '../../hooks/useMarketplaceSocketEvents';
import THEME from '../../theme/theme';
import MarketplaceSearchBar from '../../components/marketplace/MarketplaceSearchBar';
import MarketplaceBanner from '../../components/marketplace/MarketplaceBanner';
import { useSelector } from 'react-redux';
import { selectCartItems } from '../../store/slices/cartSlice';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: '1', name: 'Nourriture', icon: 'food-apple', color: '#E67E22', type: 'Food', desc: 'Repas & Fast Food' },
  { id: '3', name: 'Supermarché', icon: 'cart', color: '#27AE60', type: 'Supermarket', desc: 'Courses & Epicerie' },
  { id: '2', name: 'Cosmétiques', icon: 'lipstick', color: '#9B59B6', type: 'Cosmetics', desc: 'Beauté & Soins' },
  { id: '4', name: 'Électronique', icon: 'cellphone', color: '#2980B9', type: 'Electronics', desc: 'High-Tech' },
  { id: '5', name: 'Maison', icon: 'home-variant', color: '#F1C40F', type: 'Home', desc: 'Déco & Entretien' },
  { id: '6', name: 'Autres', icon: 'dots-horizontal', color: '#95A5A6', type: 'Other', desc: 'Divers' },
];

const MarketplaceHub = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  useMarketplaceSocketEvents();
  const cartItems = useSelector(selectCartItems);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const listRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleScroll = (event) => {
    setShowScrollTop(event.nativeEvent.contentOffset.y > 150);
  };

  const scrollToTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim().length > 0) {
      navigation.navigate('ProductList', { search: searchQuery.trim(), category: undefined });
    }
  };
  
  // ANIMATION STAGGERED
  const animatedValues = React.useRef(CATEGORIES.map(() => new Animated.Value(0))).current;

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setSearchQuery('');
    });
    return unsubscribe;
  }, [navigation]);

  React.useEffect(() => {
    const animations = CATEGORIES.map((_, i) => {
      return Animated.timing(animatedValues[i], {
        toValue: 1,
        duration: 500,
        delay: i * 80,
        useNativeDriver: true,
      });
    });
    Animated.stagger(80, animations).start();
  }, []);

  const renderCategory = ({ item, index }) => (
    <Animated.View style={{ 
      flex: 1, 
      opacity: animatedValues[index],
      transform: [{
        translateY: animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0]
        })
      }]
    }}>
      <TouchableOpacity 
        style={styles.categoryCard}
        onPress={() => navigation.navigate('ProductList', { category: item.type })}
        activeOpacity={0.8}
      >
        <View style={[styles.iconWrapper, { backgroundColor: item.color + '15' }]}>
          <MaterialCommunityIcons name={item.icon} size={32} color={item.color} />
        </View>
        <View style={styles.categoryTextWrapper}>
          <Text style={styles.categoryName} numberOfLines={1} adjustsFontSizeToFit>{item.name}</Text>
          <Text style={styles.categoryDesc} numberOfLines={1}>{item.desc}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: THEME.COLORS.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* HEADER PREMIUM */}
      <View style={[styles.header, { paddingTop: insets.top + THEME.SPACING.md }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={THEME.COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Marketplace</Text>
        </View>
        <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate('Cart')}>
          <MaterialCommunityIcons name="shopping-outline" size={24} color={THEME.COLORS.primary} />
          {cartItems.length > 0 && <View style={styles.cartBadge} />}
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        data={CATEGORIES}
        renderItem={renderCategory}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            
            {/* REAL SEARCH BAR */}
            <MarketplaceSearchBar 
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              style={{ marginTop: THEME.SPACING.md, marginBottom: THEME.SPACING.xl }}
            />

            {/* BANNER PROMO DYNAMIQUE EN TEMPS RÉEL */}
            <MarketplaceBanner navigation={navigation} />
            {/* HERO ALL PRODUCTS CARD */}
            <TouchableOpacity 
              activeOpacity={0.8} 
              style={styles.allProductsHero}
              onPress={() => navigation.navigate('ProductList', { category: 'All' })}
            >
              <LinearGradient
                colors={['rgba(212, 175, 55, 0.15)', 'rgba(0, 0, 0, 0.4)']}
                style={styles.allProductsGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.allProductsContent}>
                  <View style={styles.allProductsHeader}>
                    <View style={styles.allProductsIconBg}>
                      <MaterialCommunityIcons name="storefront" size={20} color={THEME.COLORS.primary} />
                    </View>
                    <Text style={styles.allProductsBadge}>COMPLET</Text>
                  </View>
                  <View style={{ marginTop: THEME.SPACING.sm }}>
                    <Text style={styles.allProductsTitle}>Tous les produits</Text>
                    <Text style={styles.allProductsDesc}>Explorez l'intégralité de notre catalogue en un seul endroit.</Text>
                  </View>
                </View>
                <MaterialCommunityIcons 
                  name="chevron-right" 
                  size={24} 
                  color={THEME.COLORS.primary} 
                  style={styles.allProductsChevron} 
                />
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Que cherchez-vous ?</Text>
          </View>
        }
      />
      <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.xl,
    paddingVertical: THEME.SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: THEME.SPACING.md,
    padding: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    color: THEME.COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerTitle: {
    fontSize: THEME.FONTS.sizes.h3,
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
  listContent: {
    paddingHorizontal: THEME.SPACING.lg,
    paddingBottom: THEME.SPACING.xxl,
  },
  listHeader: {
    marginBottom: THEME.SPACING.xl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: THEME.BORDERS.radius.lg,
    paddingHorizontal: THEME.SPACING.lg,
    height: 50,
    marginTop: THEME.SPACING.md,
    marginBottom: THEME.SPACING.xl,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  searchText: {
    marginLeft: THEME.SPACING.md,
    color: THEME.COLORS.textTertiary,
    fontSize: THEME.FONTS.sizes.body,
  },
  promoContainer: {
    borderRadius: THEME.BORDERS.radius.xl,
    overflow: 'hidden',
    marginBottom: THEME.SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  promoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.SPACING.xl,
  },
  promoContent: {
    flex: 1,
    paddingRight: THEME.SPACING.lg,
  },
  promoBadge: {
    backgroundColor: THEME.COLORS.primary,
    color: THEME.COLORS.deepAsphalt,
    fontSize: 10,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: THEME.SPACING.sm,
    letterSpacing: 1,
  },
  promoTitle: {
    fontSize: THEME.FONTS.sizes.h3,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.primary,
    marginBottom: THEME.SPACING.xs,
  },
  promoDesc: {
    fontSize: THEME.FONTS.sizes.caption,
    color: THEME.COLORS.textSecondary,
    lineHeight: 18,
  },
  promoIcon: {
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: THEME.FONTS.sizes.h3,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
    marginBottom: THEME.SPACING.sm,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '95%',
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: THEME.BORDERS.radius.lg,
    padding: THEME.SPACING.lg,
    marginBottom: THEME.SPACING.md,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.SPACING.md,
  },
  categoryTextWrapper: {
    width: '100%',
  },
  categoryName: {
    fontSize: THEME.FONTS.sizes.body,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
    marginBottom: 2,
  },
  categoryDesc: {
    fontSize: 11,
    color: THEME.COLORS.textTertiary,
  },
  allProductsHero: {
    borderRadius: THEME.BORDERS.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginBottom: THEME.SPACING.md,
    backgroundColor: THEME.COLORS.glassSurface,
  },
  allProductsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: THEME.SPACING.lg,
  },
  allProductsContent: {
    flex: 1,
  },
  allProductsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.SPACING.sm,
  },
  allProductsIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  allProductsBadge: {
    fontSize: 10,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.primary,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: THEME.BORDERS.radius.pill,
    letterSpacing: 0.5,
  },
  allProductsTitle: {
    fontSize: 18,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
  },
  allProductsDesc: {
    fontSize: 12,
    color: THEME.COLORS.textSecondary,
    marginTop: 2,
  },
  allProductsChevron: {
    marginLeft: THEME.SPACING.md,
  },
});

export default MarketplaceHub;
