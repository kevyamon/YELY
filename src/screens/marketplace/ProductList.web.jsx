// src/screens/marketplace/ProductList.web.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  StatusBar,
  Animated,
  useWindowDimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProductCard from '../../components/marketplace/ProductCard';
import { useGetProductsQuery } from '../../store/api/marketplaceApiSlice';
import useMarketplaceSocketEvents from '../../hooks/useMarketplaceSocketEvents';
import THEME from '../../theme/theme';
import GlobalSkeleton, { SkeletonBone } from '../../components/ui/GlobalSkeleton';
import MarketplaceSearchBar from '../../components/marketplace/MarketplaceSearchBar';

const CATEGORY_LABELS = {
  'Food': 'Nourriture',
  'Supermarket': 'Supermarché',
  'Cosmetics': 'Cosmétiques',
  'Electronics': 'Électronique',
  'Home': 'Maison',
  'Other': 'Autres'
};

const ProductList = ({ route, navigation }) => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 600;
  const cardWidth = isLargeScreen ? 220 : (width - THEME.SPACING.xl * 3) / 2;
  const gridGap = isLargeScreen ? 24 : 16;

  const insets = useSafeAreaInsets();
  const { category, search: initialSearch } = route.params || {};
  const [search, setSearch] = useState(initialSearch || '');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'priceAsc' | 'priceDesc'
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef(null);
  const scrollTopOpacity = useRef(new Animated.Value(0)).current;

  useMarketplaceSocketEvents();

  const displayTitle = category === 'All' ? 'Tous les produits' : (CATEGORY_LABELS[category] || category || 'Produits');

  // Navigation listener pour effacer la barre si on revient/quitte l'écran de recherche
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Préserver le terme si on vient directement du Hub, sinon vider si c'est un nouvel accès
      if (!route.params?.search) {
        setSearch('');
      }
    });
    return unsubscribe;
  }, [navigation, route.params]);

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const shouldShow = offsetY > 200;
    if (shouldShow !== showScrollTop) {
      setShowScrollTop(shouldShow);
      Animated.timing(scrollTopOpacity, {
        toValue: shouldShow ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const { data, isLoading, isError, refetch, isFetching } = useGetProductsQuery({
    category: category === 'All' ? undefined : category,
    search: search.length > 1 ? search : undefined
  });

  const products = data?.data || [];

  const sortedProducts = useMemo(() => {
    let result = [...products];
    if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'priceAsc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'priceDesc') {
      result.sort((a, b) => b.price - a.price);
    }
    return result;
  }, [products, sortBy]);

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + THEME.SPACING.md }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={styles.topRow}>
        <View style={styles.backButtonWrapper}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>{displayTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      <MarketplaceSearchBar 
        value={search}
        onChangeText={setSearch}
        placeholder="Rechercher un produit..."
        isSearching={isFetching}
        style={styles.searchBar}
      />

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.sortBar}
        contentContainerStyle={styles.sortBarContent}
      >
        <TouchableOpacity 
          style={[styles.sortChip, sortBy === 'recent' && styles.sortChipActive]}
          onPress={() => setSortBy('recent')}
        >
          <MaterialCommunityIcons 
            name="clock-outline" 
            size={16} 
            color={sortBy === 'recent' ? THEME.COLORS.deepAsphalt : THEME.COLORS.textSecondary} 
          />
          <Text style={[styles.sortText, sortBy === 'recent' && styles.sortTextActive]}>Plus récents</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.sortChip, sortBy === 'priceAsc' && styles.sortChipActive]}
          onPress={() => setSortBy('priceAsc')}
        >
          <MaterialCommunityIcons 
            name="arrow-up" 
            size={16} 
            color={sortBy === 'priceAsc' ? THEME.COLORS.deepAsphalt : THEME.COLORS.textSecondary} 
          />
          <Text style={[styles.sortText, sortBy === 'priceAsc' && styles.sortTextActive]}>Prix croissant</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.sortChip, sortBy === 'priceDesc' && styles.sortChipActive]}
          onPress={() => setSortBy('priceDesc')}
        >
          <MaterialCommunityIcons 
            name="arrow-down" 
            size={16} 
            color={sortBy === 'priceDesc' ? THEME.COLORS.deepAsphalt : THEME.COLORS.textSecondary} 
          />
          <Text style={[styles.sortText, sortBy === 'priceDesc' && styles.sortTextActive]}>Prix décroissant</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderSkeleton = () => (
    <View style={[styles.skeletonGrid, { gap: gridGap, justifyContent: isLargeScreen ? 'flex-start' : 'space-between' }]}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map(key => (
        <View key={key} style={[styles.skeletonCard, { width: cardWidth }]}>
          <SkeletonBone width="100%" height={cardWidth} borderRadius={16} />
          <SkeletonBone width="60%" height={20} borderRadius={4} style={{ marginTop: 8 }} />
          <SkeletonBone width="40%" height={15} borderRadius={4} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="package-variant" size={64} color={THEME.COLORS.textTertiary} />
      <Text style={styles.emptyText}>Aucun produit trouvé</Text>
      <TouchableOpacity style={styles.refreshButton} onPress={refetch}>
        <Text style={styles.refreshText}>Actualiser</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.innerContainer}>
          {(() => {
            const showSkeleton = isLoading || (isFetching && products.length === 0);
            if (showSkeleton) {
              return renderSkeleton();
            }

            if (sortedProducts.length === 0) {
              return renderEmpty();
            }

            return (
              <View style={[styles.productsGrid, { gap: gridGap, justifyContent: isLargeScreen ? 'flex-start' : 'space-between' }]}>
                {sortedProducts.map(item => (
                  <ProductCard 
                    key={item._id}
                    product={item} 
                    onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
                  />
                ))}
              </View>
            );
          })()}
        </View>
      </ScrollView>

      {/* SCROLL TO TOP */}
      <Animated.View style={[styles.scrollTopBtn, { opacity: scrollTopOpacity }]} pointerEvents={showScrollTop ? 'auto' : 'none'}>
        <TouchableOpacity onPress={scrollToTop} style={styles.scrollTopInner}>
          <MaterialCommunityIcons name="chevron-up" size={24} color={THEME.COLORS.deepAsphalt} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.background,
  },
  header: {
    paddingHorizontal: '6%',
    paddingVertical: THEME.SPACING.md,
    backgroundColor: THEME.COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.SPACING.md,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: THEME.COLORS.glassSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    cursor: 'pointer',
  },
  backButtonWrapper: {
    zIndex: 999,
  },
  title: {
    fontSize: 24,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
  },
  searchBar: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    marginTop: THEME.SPACING.xs,
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
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  skeletonCard: {
    marginBottom: THEME.SPACING.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 120,
    width: '100%',
  },
  emptyText: {
    fontSize: 16,
    color: THEME.COLORS.textSecondary,
    marginTop: THEME.SPACING.md,
  },
  refreshButton: {
    marginTop: THEME.SPACING.xl,
    paddingHorizontal: THEME.SPACING.xl,
    paddingVertical: THEME.SPACING.sm,
    borderRadius: THEME.BORDERS.radius.pill,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: THEME.COLORS.primary,
    cursor: 'pointer',
  },
  refreshText: {
    color: THEME.COLORS.primary,
    fontWeight: THEME.FONTS.weights.bold,
  },
  scrollTopBtn: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    borderRadius: 24,
    ...THEME.SHADOWS.goldSoft,
    zIndex: 99,
  },
  scrollTopInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortBar: {
    marginTop: THEME.SPACING.md,
    flexDirection: 'row',
  },
  sortBarContent: {
    paddingRight: THEME.SPACING.xl,
    gap: THEME.SPACING.sm,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: THEME.BORDERS.radius.pill,
    paddingVertical: THEME.SPACING.xs + 2,
    paddingHorizontal: THEME.SPACING.md,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    gap: 6,
  },
  sortChipActive: {
    backgroundColor: THEME.COLORS.primary,
    borderColor: THEME.COLORS.primary,
  },
  sortText: {
    fontSize: 13,
    fontWeight: THEME.FONTS.weights.medium,
    color: THEME.COLORS.textSecondary,
  },
  sortTextActive: {
    color: THEME.COLORS.deepAsphalt,
    fontWeight: THEME.FONTS.weights.bold,
  },
});

export default ProductList;
