// src/screens/marketplace/MarketplaceHub.jsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  useColorScheme,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
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
    const unsubscribeFocus = navigation.addListener('focus', () => {
      setSearchQuery('');
    });

    return () => {
      scrollTopSub.remove();
      toggleModalSub.remove();
      if (typeof unsubscribeFocus === 'function') {
        unsubscribeFocus();
      }
    };
  }, [navigation]);

  const cardWidth = (width - THEME.SPACING.lg * 2 - 12) / 2;

  const handleSearchSubmit = () => {
    if (searchQuery.trim().length > 0) {
      navigation.navigate('ProductList', { search: searchQuery.trim(), category: undefined });
    }
  };

  const handleSelectCategory = useCallback((catType) => {
    setSelectedCategoryFilter(catType);
    setIsCategoriesModalVisible(false);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsCategoriesModalVisible(false);
  }, []);

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

  const [isRefreshingManual, setIsRefreshingManual] = useState(false);

  const handleHeaderRefresh = useCallback(() => {
    if (isRefreshingManual) return;
    setIsRefreshingManual(true);
    refetch();
    setTimeout(() => {
      setIsRefreshingManual(false);
    }, 1800);
  }, [refetch, isRefreshingManual]);

  const safeTop = Math.max(insets?.top || 0, 28);
  const calculatedHeaderHeight = safeTop + (Platform.OS === 'ios' ? 115 : 105);

  return (
    <View style={[styles.container, { backgroundColor: THEME.COLORS.background }]}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={isDarkMode ? 'rgba(212, 175, 55, 0.15)' : THEME.COLORS.primary} 
      />
      <MarketplaceHeader 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearchSubmit={handleSearchSubmit}
        navigation={navigation}
        insets={insets}
        isDarkMode={isDarkMode}
        onRefreshPress={handleHeaderRefresh}
        isRefreshing={isRefreshingManual || isFetching}
      />

      {/* BANDE D'ACTUALISATION ÉPURÉE SUR DEMANDE EXPLICITE */}
      {isRefreshingManual && (
        <View style={[
          styles.refreshBannerContainer, 
          { top: calculatedHeaderHeight }
        ]}>
          <ActivityIndicator size="small" color={THEME.COLORS.primary} />
          <Text style={styles.refreshBannerText}>Actualisation de la Marketplace...</Text>
        </View>
      )}

      <FlatList
        ref={listRef}
        data={categorySections}
        keyExtractor={item => item.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingTop: calculatedHeaderHeight, paddingBottom: 90 }]}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
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
        onClose={handleCloseModal}
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
  refreshBannerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 90,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(214, 175, 55, 0.3)',
  },
  refreshBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#121418',
  }
});

export default MarketplaceHub;
