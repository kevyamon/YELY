// src/screens/marketplace/MarketplaceHub.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Dimensions, 
  StatusBar, 
  Animated, 
  DeviceEventEmitter, 
  Platform, 
  useColorScheme 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetProductsQuery } from '../../store/api/marketplaceApiSlice';
import useMarketplaceSocketEvents from '../../hooks/useMarketplaceSocketEvents';
import THEME from '../../theme/theme';
import MarketplaceBanner from '../../components/marketplace/MarketplaceBanner';
import ProductCard from '../../components/marketplace/ProductCard';
import { SkeletonBone } from '../../components/ui/GlobalSkeleton';

// Import des sous-composants modularisés
import MarketplaceHeader from '../../components/marketplace/MarketplaceHeader';
import MarketplaceCategories from '../../components/marketplace/MarketplaceCategories';
import CategoriesModal from '../../components/marketplace/CategoriesModal';

const { width } = Dimensions.get('window');

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

const HORIZONTAL_CATEGORIES = [
  { id: 'Electronics', name: 'Électronique', icon: 'laptop', type: 'Electronics' },
  { id: 'Fashion', name: 'Mode', icon: 'tshirt-crew', type: 'Fashion' },
  { id: 'Home', name: 'Maison', icon: 'home-variant', type: 'Home' },
  { id: 'Cosmetics', name: 'Beauté', icon: 'lipstick', type: 'Cosmetics' },
];

const MarketplaceHub = ({ navigation }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  useMarketplaceSocketEvents();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);
  const [isCategoriesModalVisible, setIsCategoriesModalVisible] = useState(false);
  const [isMiniSearchActive, setIsMiniSearchActive] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const listRef = useRef(null);

  const { data: productsResponse, isLoading, isFetching, refetch } = useGetProductsQuery();
  const allProducts = productsResponse?.data || [];

  const popularProducts = useMemo(() => {
    const active = allProducts.filter(p => p.isActive);
    return [...active]
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0) || (b.rating || 0) - (a.rating || 0))
      .slice(0, 8);
  }, [allProducts]);

  const categorySections = useMemo(() => {
    const active = allProducts.filter(p => p.isActive);
    const groups = {};
    Object.keys(CATEGORY_LABELS).forEach(cat => { groups[cat] = []; });
    active.forEach(product => {
      if (groups[product.category]) groups[product.category].push(product);
      else groups['Other'].push(product);
    });

    return Object.keys(groups)
      .map(key => ({ key, name: CATEGORY_LABELS[key], products: groups[key] }))
      .filter(section => selectedCategoryFilter ? (section.key === selectedCategoryFilter && section.products.length > 0) : section.products.length > 0);
  }, [allProducts, selectedCategoryFilter]);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [Platform.OS === 'ios' ? 140 : 120, 0],
    extrapolate: 'clamp'
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 70],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  const bannerScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolateLeft: 'extend',
    extrapolateRight: 'clamp'
  });

  useEffect(() => {
    const scrollTopSub = DeviceEventEmitter.addListener('scroll_to_top_hub', () => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
    const toggleModalSub = DeviceEventEmitter.addListener('toggle_categories_modal', () => {
      setIsCategoriesModalVisible(prev => !prev);
    });
    const focusSub = navigation.addListener('focus', () => {
      setSearchQuery('');
      setIsMiniSearchActive(false);
    });
    const scrollListenerId = scrollY.addListener(({ value }) => {
      if (value < 40) setIsMiniSearchActive(false);
    });

    return () => {
      scrollTopSub.remove();
      toggleModalSub.remove();
      focusSub();
      scrollY.removeListener(scrollListenerId);
    };
  }, [navigation, scrollY]);

  const cardWidth = (width - THEME.SPACING.lg * 2 - 12) / 2;

  const handleSearchSubmit = () => {
    if (searchQuery.trim().length > 0) {
      setIsMiniSearchActive(false);
      navigation.navigate('ProductList', { search: searchQuery.trim(), category: undefined });
    }
  };

  const handleSelectCategory = (catType) => {
    setSelectedCategoryFilter(catType);
    setIsCategoriesModalVisible(false);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <SkeletonBone width="100%" height={160} borderRadius={20} style={{ marginBottom: 20 }} />
      <SkeletonBone width="80%" height={24} borderRadius={8} style={{ marginBottom: 15 }} />
      <View style={styles.skeletonGrid}>
        {[1, 2, 4].map(i => (
          <View key={i} style={styles.skeletonCard}>
            <SkeletonBone width="100%" height={120} borderRadius={16} />
            <SkeletonBone width="60%" height={15} borderRadius={4} style={{ marginTop: 10 }} />
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: THEME.COLORS.background }]}>
      <MarketplaceHeader 
        scrollY={scrollY}
        headerHeight={headerHeight}
        headerOpacity={headerOpacity}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearchSubmit={handleSearchSubmit}
        isMiniSearchActive={isMiniSearchActive}
        setIsMiniSearchActive={setIsMiniSearchActive}
        navigation={navigation}
        insets={insets}
        isDarkMode={isDarkMode}
      />

      <FlatList
        ref={listRef}
        data={categorySections}
        keyExtractor={item => item.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingTop: Platform.OS === 'ios' ? 140 : 120, paddingBottom: 90 }]}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        onRefresh={refetch}
        refreshing={isFetching}
        ListHeaderComponent={
          <Animated.View style={{ transform: [{ scale: bannerScale }] }}>
            <View style={[styles.yellowSection, { backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.15)' : THEME.COLORS.primary }]}>
              <View style={styles.bannerWrapper}>
                <MarketplaceBanner navigation={navigation} />
              </View>
              <MarketplaceCategories 
                categories={HORIZONTAL_CATEGORIES}
                selectedCategoryFilter={selectedCategoryFilter}
                handleSelectCategory={handleSelectCategory}
                setIsCategoriesModalVisible={setIsCategoriesModalVisible}
                isDarkMode={isDarkMode}
              />
            </View>

            {!selectedCategoryFilter && popularProducts.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitleText}>Produits populaires</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('ProductList', { category: undefined })}>
                    <Text style={styles.seeAllButtonText}>Voir tout</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.productsGrid}>
                  {popularProducts.map(product => (
                    <ProductCard 
                      key={`popular-${product._id}`} 
                      product={product} 
                      cardWidth={cardWidth}
                      onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}
                    />
                  ))}
                </View>
              </View>
            )}

            {selectedCategoryFilter && (
              <TouchableOpacity style={styles.resetFilterButton} onPress={() => setSelectedCategoryFilter(null)}>
                <Text style={styles.resetFilterText}>Réinitialiser le filtre catégorie</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        }
        renderItem={({ item }) => {
          const displayedProducts = item.products.slice(0, 16);
          const hasMoreThan16 = item.products.length > 16;
          return (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitleText}>{item.name}</Text>
                {hasMoreThan16 && (
                  <TouchableOpacity onPress={() => navigation.navigate('ProductList', { category: item.key })}>
                    <Text style={styles.seeAllButtonText}>Voir tout</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.productsGrid}>
                {displayedProducts.map(product => (
                  <ProductCard 
                    key={`cat-${item.key}-${product._id}`} 
                    product={product} 
                    cardWidth={cardWidth}
                    onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}
                  />
                ))}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={isLoading ? renderSkeleton() : (
          <View style={styles.emptyFeedContainer}>
            <Text style={styles.emptyFeedText}>Aucun produit disponible</Text>
          </View>
        )}
      />

      <CategoriesModal 
        isVisible={isCategoriesModalVisible}
        onClose={() => setIsCategoriesModalVisible(false)}
        selectedCategoryFilter={selectedCategoryFilter}
        handleSelectCategory={handleSelectCategory}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 0,
  },
  yellowSection: {
    width: '100%',
    paddingTop: THEME.SPACING.md,
    paddingBottom: THEME.SPACING.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: THEME.SPACING.md,
  },
  bannerWrapper: {
    paddingHorizontal: THEME.SPACING.lg,
  },
  sectionContainer: {
    marginTop: THEME.SPACING.md,
    marginBottom: THEME.SPACING.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SPACING.md,
    paddingHorizontal: THEME.SPACING.lg,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.COLORS.textPrimary,
  },
  seeAllButtonText: {
    fontSize: 13,
    color: THEME.COLORS.primary,
    fontWeight: '700',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
    paddingHorizontal: THEME.SPACING.lg,
  },
  resetFilterButton: {
    backgroundColor: 'rgba(214, 175, 55, 0.1)',
    borderRadius: THEME.BORDERS.radius.pill,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: THEME.SPACING.md,
    borderWidth: 1,
    borderColor: THEME.COLORS.primary,
    marginHorizontal: THEME.SPACING.lg,
  },
  resetFilterText: {
    color: THEME.COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyFeedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyFeedText: {
    fontSize: 14,
    color: THEME.COLORS.textTertiary,
    textAlign: 'center',
  },
  skeletonContainer: {
    paddingVertical: 10,
    paddingHorizontal: THEME.SPACING.lg,
  },
  skeletonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonCard: {
    width: (width - THEME.SPACING.lg * 2 - 16) / 2,
  },
});

export default MarketplaceHub;
