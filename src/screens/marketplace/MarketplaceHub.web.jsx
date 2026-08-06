// src/screens/marketplace/MarketplaceHub.web.jsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  Animated, 
  DeviceEventEmitter, 
  useWindowDimensions, 
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
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const paddingValue = isLargeScreen ? width * 0.08 : width * 0.05;

  const insets = useSafeAreaInsets();
  useMarketplaceSocketEvents();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);
  const [isCategoriesModalVisible, setIsCategoriesModalVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);

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



  useEffect(() => {
    const scrollTopSub = DeviceEventEmitter.addListener('scroll_to_top_hub', () => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    const toggleModalSub = DeviceEventEmitter.addListener('toggle_categories_modal', () => {
      setIsCategoriesModalVisible(prev => !prev);
    });
    const focusSub = navigation.addListener('focus', () => {
      setSearchQuery('');
    });

    return () => {
      scrollTopSub.remove();
      toggleModalSub.remove();
      focusSub();
    };
  }, [navigation]);

  // Intercepter le bouton Retour d'Android/PWA pour fermer la modale au lieu de quitter la page
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (isCategoriesModalVisible) {
        e.preventDefault();
        setIsCategoriesModalVisible(false);
      }
    });
    return unsubscribe;
  }, [navigation, isCategoriesModalVisible]);

  const handleSearchSubmit = () => {
    if (searchQuery.trim().length > 0) {
      navigation.navigate('ProductList', { search: searchQuery.trim(), category: undefined });
    }
  };

  const handleSelectCategory = useCallback((catType) => {
    setSelectedCategoryFilter(catType);
    setIsCategoriesModalVisible(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsCategoriesModalVisible(false);
  }, []);

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <SkeletonBone width="100%" height={160} borderRadius={20} style={{ marginBottom: 20 }} />
      <SkeletonBone width="40%" height={24} borderRadius={8} style={{ marginBottom: 15 }} />
      <View style={styles.skeletonGrid}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={styles.skeletonCard}>
            <SkeletonBone width="100%" height={150} borderRadius={16} />
            <SkeletonBone width="60%" height={15} borderRadius={4} style={{ marginTop: 10 }} />
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: THEME.COLORS.background }]}>
      <MarketplaceHeader 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearchSubmit={handleSearchSubmit}
        navigation={navigation}
        insets={insets}
        isDarkMode={isDarkMode}
        paddingValue={paddingValue}
      />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 120, paddingBottom: 100 }]}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        <View style={styles.innerContainer}>
          <View style={[styles.yellowSection, { backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.15)' : THEME.COLORS.primary }]}>
            <View style={[styles.bannerWrapper, { paddingHorizontal: paddingValue }]}>
              <MarketplaceBanner navigation={navigation} />
            </View>
            <View style={{ paddingHorizontal: paddingValue }}>
              <MarketplaceCategories 
                categories={HORIZONTAL_CATEGORIES}
                selectedCategoryFilter={selectedCategoryFilter}
                handleSelectCategory={handleSelectCategory}
                setIsCategoriesModalVisible={setIsCategoriesModalVisible}
                isDarkMode={isDarkMode}
              />
            </View>
          </View>

          <View style={{ paddingHorizontal: paddingValue }}>
            {isLoading && renderSkeleton()}

            {!isLoading && !selectedCategoryFilter && popularProducts.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitleText}>Produits populaires</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('ProductList', { category: undefined })}>
                    <Text style={styles.seeAllButtonText}>Voir tout</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.productsGrid}>
                  {popularProducts.map(product => (
                    <View key={`popular-web-${product._id}`} style={[styles.productCardWrapper, { width: isLargeScreen ? '25%' : '50%' }]}>
                      <ProductCard 
                        product={product} 
                        cardWidth={isLargeScreen ? 220 : (width - THEME.SPACING.lg * 2 - 16) / 2}
                        onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {selectedCategoryFilter && (
              <TouchableOpacity style={styles.resetFilterButton} onPress={() => setSelectedCategoryFilter(null)}>
                <Text style={styles.resetFilterText}>Réinitialiser le filtre catégorie</Text>
              </TouchableOpacity>
            )}

            {!isLoading && categorySections.map(item => {
              const displayedProducts = item.products.slice(0, 16);
              const hasMoreThan16 = item.products.length > 16;
              return (
                <View key={`sec-${item.key}`} style={styles.sectionContainer}>
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
                      <View key={`cat-web-${item.key}-${product._id}`} style={[styles.productCardWrapper, { width: isLargeScreen ? '25%' : '50%' }]}>
                        <ProductCard 
                          product={product} 
                          cardWidth={isLargeScreen ? 220 : (width - THEME.SPACING.lg * 2 - 16) / 2}
                          onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

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
    backgroundColor: THEME.COLORS.background,
  },
  scrollContent: {
    width: '100%',
    alignItems: 'center',
  },
  innerContainer: {
    width: '100%',
    maxWidth: 1000,
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
    width: '100%',
  },
  sectionContainer: {
    marginTop: THEME.SPACING.xl,
    marginBottom: THEME.SPACING.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SPACING.md,
  },
  sectionTitleText: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.COLORS.textPrimary,
  },
  seeAllButtonText: {
    fontSize: 14,
    color: THEME.COLORS.primary,
    fontWeight: '700',
    cursor: 'pointer',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  productCardWrapper: {
    padding: 6,
  },
  resetFilterButton: {
    backgroundColor: 'rgba(214, 175, 55, 0.1)',
    borderRadius: THEME.BORDERS.radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: THEME.SPACING.md,
    borderWidth: 1,
    borderColor: THEME.COLORS.primary,
    cursor: 'pointer',
  },
  resetFilterText: {
    color: THEME.COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  skeletonContainer: {
    paddingVertical: 20,
  },
  skeletonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  skeletonCard: {
    flex: 1,
  },
});

export default MarketplaceHub;
