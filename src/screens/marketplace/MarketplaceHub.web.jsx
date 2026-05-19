// src/screens/marketplace/MarketplaceHub.web.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Modal,
  useColorScheme
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetProductsQuery } from '../../store/api/marketplaceApiSlice';
import useMarketplaceSocketEvents from '../../hooks/useMarketplaceSocketEvents';
import THEME from '../../theme/theme';
import MarketplaceBanner from '../../components/marketplace/MarketplaceBanner';
import ProductCard from '../../components/marketplace/ProductCard';
import GlobalSkeleton, { SkeletonBone } from '../../components/ui/GlobalSkeleton';
import MarketplaceSearchBar from '../../components/marketplace/MarketplaceSearchBar';

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

const CATEGORY_ICONS = {
  'Electronics': { icon: 'laptop', color: '#2980B9' },
  'Cosmetics': { icon: 'lipstick', color: '#9B59B6' },
  'Home': { icon: 'home-variant', color: '#F1C40F' },
  'Food': { icon: 'food-apple', color: '#E67E22' },
  'Supermarket': { icon: 'cart', color: '#27AE60' },
  'Fashion': { icon: 'tshirt-crew', color: '#EC4899' },
  'Sports': { icon: 'soccer', color: '#3B82F6' },
  'Tools': { icon: 'hammer-wrench', color: '#F59E0B' },
  'Toys': { icon: 'toy-brick', color: '#10B981' },
  'Automotive': { icon: 'car-sports', color: '#EF4444' },
  'Office': { icon: 'lead-pencil', color: '#6366F1' },
  'Other': { icon: 'dots-horizontal', color: '#95A5A6' }
};

const HORIZONTAL_CATEGORIES = [
  { id: 'Fashion', name: 'Mode', icon: 'tshirt-crew', type: 'Fashion' },
  { id: 'Supermarket', name: 'Supermarché', icon: 'cart', type: 'Supermarket' },
  { id: 'Electronics', name: 'Électronique', icon: 'laptop', type: 'Electronics' },
  { id: 'Cosmetics', name: 'Cosmétiques', icon: 'lipstick', type: 'Cosmetics' },
  { id: 'Home', name: 'Maison', icon: 'home-variant', type: 'Home' },
  { id: 'Food', name: 'Nourriture', icon: 'food-apple', type: 'Food' },
];

const MarketplaceHub = ({ navigation }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const paddingValue = isLargeScreen ? '8%' : '5%';

  const insets = useSafeAreaInsets();
  useMarketplaceSocketEvents();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);
  const [isCategoriesModalVisible, setIsCategoriesModalVisible] = useState(false);
  const [isMiniSearchActive, setIsMiniSearchActive] = useState(false);

  // Défilement
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);

  // Fetch des produits
  const { data: productsResponse, isLoading, isFetching, refetch } = useGetProductsQuery();
  const allProducts = productsResponse?.data || [];

  // Produits populaires (Top 8)
  const popularProducts = useMemo(() => {
    const active = allProducts.filter(p => p.isActive);
    return [...active]
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0) || (b.rating || 0) - (a.rating || 0))
      .slice(0, 8);
  }, [allProducts]);

  // Sections triées par catégorie
  const categorySections = useMemo(() => {
    const active = allProducts.filter(p => p.isActive);
    const groups = {};

    Object.keys(CATEGORY_LABELS).forEach(cat => {
      groups[cat] = [];
    });

    active.forEach(product => {
      if (groups[product.category]) {
        groups[product.category].push(product);
      } else {
        groups['Other'].push(product);
      }
    });

    return Object.keys(groups)
      .map(key => ({
        key,
        name: CATEGORY_LABELS[key],
        products: groups[key]
      }))
      .filter(section => {
        if (selectedCategoryFilter) {
          return section.key === selectedCategoryFilter && section.products.length > 0;
        }
        return section.products.length > 0;
      });
  }, [allProducts, selectedCategoryFilter]);

  // Interpolations Header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [100, 0],
    extrapolate: 'clamp'
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 70],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  useEffect(() => {
    // Événements globaux du Tabbar
    const scrollTopSub = DeviceEventEmitter.addListener('scroll_to_top_hub', () => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });

    const toggleModalSub = DeviceEventEmitter.addListener('toggle_categories_modal', () => {
      setIsCategoriesModalVisible(prev => !prev);
    });

    // Réinitialisation de la recherche au focus de l'écran
    const focusSub = navigation.addListener('focus', () => {
      setSearchQuery('');
      setIsMiniSearchActive(false);
    });

    // Auto-fermeture de la recherche mini lors du dépliement (scroll-up)
    const scrollListenerId = scrollY.addListener(({ value }) => {
      if (value < 40) {
        setIsMiniSearchActive(false);
      }
    });

    return () => {
      scrollTopSub.remove();
      toggleModalSub.remove();
      focusSub();
      scrollY.removeListener(scrollListenerId);
    };
  }, [navigation, scrollY]);

  const handleSearchSubmit = () => {
    if (searchQuery.trim().length > 0) {
      setIsMiniSearchActive(false);
      navigation.navigate('ProductList', { search: searchQuery.trim(), category: undefined });
    }
  };

  const handleSelectCategory = (catType) => {
    setSelectedCategoryFilter(catType);
    setIsCategoriesModalVisible(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

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
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      {/* HEADER FIXE FLUIDE AVEC DÉPLACEMENT BOUTON HOME À DROITE */}
      <Animated.View style={[
        styles.collapsibleHeader, 
        { 
          height: headerHeight, 
          opacity: headerOpacity,
          paddingTop: insets.top + THEME.SPACING.md,
          backgroundColor: isDarkMode ? '#000000' : THEME.COLORS.background,
          borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : THEME.COLORS.border
        }
      ]}>
        <View style={[styles.headerTopRow, { paddingHorizontal: paddingValue }]}>
          <Text style={styles.headerTitle}>Yély Marketplace</Text>
          <TouchableOpacity 
            style={styles.hamburgerButton} 
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="home-outline" size={25} color={THEME.COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* MINI HEADER COLLAPSED STICKY */}
      <Animated.View style={[
        styles.miniStickyHeader,
        {
          paddingTop: insets.top + 8,
          opacity: scrollY.interpolate({
            inputRange: [70, 110],
            outputRange: [0, 1],
            extrapolate: 'clamp'
          }),
          transform: [{
            translateY: scrollY.interpolate({
              inputRange: [70, 110],
              outputRange: [-20, 0],
              extrapolate: 'clamp'
            })
          }],
          pointerEvents: isMiniSearchActive ? 'auto' : 'box-none',
          backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.95)' : THEME.COLORS.background,
          borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : THEME.COLORS.border
        }
      ]}>
        <View style={[styles.miniStickyInner, { paddingHorizontal: paddingValue }]}>
          <Text style={styles.miniTitle}>Yély</Text>
          <View style={styles.miniStickyButtons}>
            <TouchableOpacity 
              style={styles.miniIconWrapper}
              onPress={() => setIsMiniSearchActive(prev => !prev)}
            >
              <Ionicons name="search" size={20} color={THEME.COLORS.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.miniIconWrapper}
              onPress={() => navigation.navigate('Home')}
            >
              <Ionicons name="home-outline" size={20} color={THEME.COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
        
        {isMiniSearchActive && (
          <View style={[styles.miniSearchContainer, { paddingHorizontal: paddingValue }]}>
            <MarketplaceSearchBar 
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              placeholder="Rechercher..."
              style={styles.miniSearchBarInput}
            />
          </View>
        )}
      </Animated.View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingTop: 100,
            paddingBottom: 100,
            paddingHorizontal: paddingValue
          }
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.innerContainer}>
          {/* BARRE DE RECHERCHE PRINCIPALE (TYPE MAQUETTE) */}
          <MarketplaceSearchBar 
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            placeholder="Rechercher un produit..."
            style={styles.mainSearchBar}
          />

          {/* CARROUSEL DYNAMIQUE JAUNE */}
          <MarketplaceBanner navigation={navigation} />

          {/* HORIZONTAL CATEGORY BAR CHIPS */}
          {!isLargeScreen ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.categoriesRowMobile}
              style={styles.categoriesScrollViewMobile}
            >
              {HORIZONTAL_CATEGORIES.map(cat => {
                const config = CATEGORY_ICONS[cat.type] || { color: THEME.COLORS.primary };
                const isSelected = selectedCategoryFilter === cat.type;
                const chipBg = isSelected ? config.color + '26' : (isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)');
                const chipBorder = isSelected ? config.color : (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)');
                const iconColor = config.color;

                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catChipMobile,
                      selectedCategoryFilter === cat.type && styles.catChipActive
                    ]}
                    onPress={() => handleSelectCategory(selectedCategoryFilter === cat.type ? null : cat.type)}
                  >
                    <View style={[
                      styles.catIconWrapper,
                      { 
                        backgroundColor: chipBg,
                        borderColor: chipBorder,
                      }
                    ]}>
                      <MaterialCommunityIcons 
                        name={cat.icon} 
                        size={20} 
                        color={iconColor} 
                      />
                    </View>
                    <Text 
                      style={[
                        styles.catChipText,
                        { color: isSelected ? config.color : THEME.COLORS.textPrimary }
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.catChipMobile}
                onPress={() => setIsCategoriesModalVisible(true)}
              >
                <View style={[styles.catIconWrapper, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                  <MaterialCommunityIcons name="dots-horizontal" size={20} color={THEME.COLORS.textSecondary} />
                </View>
                <Text style={[styles.catChipText, { color: THEME.COLORS.textSecondary }]}>Plus</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View style={styles.categoriesRow}>
              {HORIZONTAL_CATEGORIES.map(cat => {
                const config = CATEGORY_ICONS[cat.type] || { color: THEME.COLORS.primary };
                const isSelected = selectedCategoryFilter === cat.type;
                const chipBg = isSelected ? config.color + '26' : (isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)');
                const chipBorder = isSelected ? config.color : (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)');
                const iconColor = config.color;

                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catChip,
                      selectedCategoryFilter === cat.type && styles.catChipActive
                    ]}
                    onPress={() => handleSelectCategory(selectedCategoryFilter === cat.type ? null : cat.type)}
                  >
                    <View style={[
                      styles.catIconWrapper,
                      { 
                        backgroundColor: chipBg,
                        borderColor: chipBorder,
                      }
                    ]}>
                      <MaterialCommunityIcons 
                        name={cat.icon} 
                        size={20} 
                        color={iconColor} 
                      />
                    </View>
                    <Text style={[
                      styles.catChipText,
                      { color: isSelected ? config.color : THEME.COLORS.textPrimary }
                    ]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.catChip}
                onPress={() => setIsCategoriesModalVisible(true)}
              >
                <View style={[styles.catIconWrapper, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                  <MaterialCommunityIcons name="dots-horizontal" size={20} color={THEME.COLORS.textSecondary} />
                </View>
                <Text style={[styles.catChipText, { color: THEME.COLORS.textSecondary }]}>Plus</Text>
              </TouchableOpacity>
            </View>
          )}

          {isLoading && renderSkeleton()}

          {/* SECTION POPULAIRES (TOP 8) */}
          {!isLoading && !selectedCategoryFilter && popularProducts.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitleText}>Produits populaires</Text>
              </View>
              
              <View style={styles.productsGrid}>
                {popularProducts.map(product => (
                  <View 
                    key={`popular-web-${product._id}`} 
                    style={[styles.productCardWrapper, { width: isLargeScreen ? '25%' : '50%' }]}
                  >
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
            <TouchableOpacity 
              style={styles.resetFilterButton}
              onPress={() => setSelectedCategoryFilter(null)}
            >
              <Text style={styles.resetFilterText}>Réinitialiser le filtre catégorie</Text>
            </TouchableOpacity>
          )}

          {/* SECTIONS PAR CATÉGORIES */}
          {!isLoading && categorySections.map(item => {
            const displayedProducts = item.products.slice(0, 16);
            const hasMoreThan16 = item.products.length > 16;

            return (
              <View key={`sec-${item.key}`} style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitleText}>{item.name}</Text>
                  {hasMoreThan16 && (
                    <TouchableOpacity 
                      onPress={() => navigation.navigate('ProductList', { category: item.key })}
                    >
                      <Text style={styles.seeAllButtonText}>Voir tout</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.productsGrid}>
                  {displayedProducts.map(product => (
                    <View 
                      key={`cat-web-${item.key}-${product._id}`} 
                      style={[styles.productCardWrapper, { width: isLargeScreen ? '25%' : '50%' }]}
                    >
                      <ProductCard 
                        product={product} 
                        cardWidth={isLargeScreen ? 220 : (width - THEME.SPACING.lg * 2 - 16) / 2}
                        onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}
                      />
                    </View>
                  ))}
                </View>

                {!hasMoreThan16 && (
                  <View style={styles.catFooterLine}>
                    <View style={styles.lineDivider} />
                    <Text style={styles.catFooterText}>C'est tout pour cette catégorie</Text>
                    <View style={styles.lineDivider} />
                  </View>
                )}
              </View>
            );
          })}

          {!isLoading && categorySections.length === 0 && (
            <View style={styles.emptyFeedContainer}>
              <MaterialCommunityIcons 
                name="store-search-outline" 
                size={80} 
                color={THEME.COLORS.primary} 
                style={{ marginBottom: 16, opacity: 0.8 }} 
              />
              <Text style={[styles.emptyFeedText, { fontWeight: '800', color: THEME.COLORS.textPrimary, fontSize: 18, marginTop: 0, textAlign: 'center' }]}>
                Aucun produit trouvé
              </Text>
              <Text style={{ fontSize: 14, color: THEME.COLORS.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 32, lineHeight: 20 }}>
                Il n'y a actuellement aucun article disponible correspondant à vos critères ou à cette catégorie.
              </Text>
              {selectedCategoryFilter && (
                <TouchableOpacity 
                  style={[styles.resetFilterButton, { marginTop: 20, alignSelf: 'center', minWidth: 220 }]}
                  onPress={() => setSelectedCategoryFilter(null)}
                >
                  <Text style={styles.resetFilterText}>Voir toutes les catégories</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* MODALE OVERLAY DES CATÉGORIES */}
      <Modal
        visible={isCategoriesModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCategoriesModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsCategoriesModalVisible(false)}
        >
          <View style={styles.modalCardContainer}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Catégories</Text>
              <TouchableOpacity onPress={() => setIsCategoriesModalVisible(false)}>
                <Ionicons name="close" size={24} color={THEME.COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalGrid}>
              <TouchableOpacity
                style={[
                  styles.modalCatItem, 
                  !selectedCategoryFilter && styles.modalCatItemActive,
                  {
                    backgroundColor: !selectedCategoryFilter ? 'rgba(214, 175, 55, 0.22)' : 'rgba(255, 255, 255, 0.03)',
                    borderColor: !selectedCategoryFilter ? THEME.COLORS.primary : 'rgba(255, 255, 255, 0.06)'
                  }
                ]}
                onPress={() => handleSelectCategory(null)}
              >
                <View style={[styles.modalCatIconBg, { backgroundColor: 'rgba(214, 175, 55, 0.15)' }]}>
                  <MaterialCommunityIcons name="all-inclusive" size={24} color={THEME.COLORS.primary} />
                </View>
                <Text style={[styles.modalCatLabel, { color: !selectedCategoryFilter ? THEME.COLORS.primary : THEME.COLORS.textPrimary }]}>Tout voir</Text>
              </TouchableOpacity>

              {Object.keys(CATEGORY_LABELS).map(key => {
                const label = CATEGORY_LABELS[key];
                const config = CATEGORY_ICONS[key] || { icon: 'package-variant', color: '#95A5A6' };
                const isSelected = selectedCategoryFilter === key;

                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.modalCatItem, 
                      isSelected && styles.modalCatItemActive,
                      {
                        backgroundColor: isSelected ? config.color + '22' : 'rgba(255, 255, 255, 0.03)',
                        borderColor: isSelected ? config.color : 'rgba(255, 255, 255, 0.06)'
                      }
                    ]}
                    onPress={() => handleSelectCategory(key)}
                  >
                    <View style={[styles.modalCatIconBg, { backgroundColor: config.color + '1C' }]}>
                      <MaterialCommunityIcons name={config.icon} size={24} color={config.color} />
                    </View>
                    <Text style={[styles.modalCatLabel, { color: isSelected ? config.color : THEME.COLORS.textPrimary }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.background,
  },
  collapsibleHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#000000',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F5D142',
    letterSpacing: 0.5,
  },
  hamburgerButton: {
    padding: THEME.SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  miniStickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 150,
    paddingBottom: THEME.SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  miniStickyInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  miniTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F5D142',
  },
  miniStickyButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  miniIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  miniSearchContainer: {
    marginTop: THEME.SPACING.xs,
    marginBottom: THEME.SPACING.sm,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  miniSearchBarInput: {
    height: 40,
  },
  scrollContent: {
    width: '100%',
    alignItems: 'center',
  },
  innerContainer: {
    width: '100%',
    maxWidth: 1000,
  },
  mainSearchBar: {
    marginTop: THEME.SPACING.sm,
    marginBottom: THEME.SPACING.md,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: THEME.SPACING.md,
    gap: 12,
  },
  categoriesScrollViewMobile: {
    marginVertical: THEME.SPACING.md,
    width: '100%',
  },
  categoriesRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: THEME.SPACING.xs,
  },
  catChipMobile: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
  },
  catChip: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    cursor: 'pointer',
  },
  catIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  catChipActive: {
    opacity: 0.95,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
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
    width: '25%', // 4 items per row on PC
    padding: 6,
  },
  catFooterLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: THEME.SPACING.lg,
    opacity: 0.5,
  },
  lineDivider: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.COLORS.border,
  },
  catFooterText: {
    fontSize: 12,
    color: THEME.COLORS.textTertiary,
    marginHorizontal: 12,
    fontWeight: '500',
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
  emptyFeedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    gap: 12,
  },
  emptyFeedText: {
    fontSize: 16,
    color: THEME.COLORS.textTertiary,
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCardContainer: {
    backgroundColor: THEME.COLORS.glassModal,
    borderRadius: THEME.BORDERS.radius.xl,
    padding: THEME.SPACING.xxl,
    width: '90%',
    maxWidth: 500,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SPACING.xl,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCatItem: {
    width: '30%',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: THEME.BORDERS.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    cursor: 'pointer',
  },
  modalCatItemActive: {
    borderColor: THEME.COLORS.primary,
    backgroundColor: 'rgba(214, 175, 55, 0.08)',
  },
  modalCatIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalCatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.COLORS.textPrimary,
    textAlign: 'center',
    width: '100%',
  },
});

export default MarketplaceHub;
