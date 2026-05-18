// src/screens/marketplace/MarketplaceHub.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Dimensions,
  StatusBar,
  Animated,
  DeviceEventEmitter,
  Platform,
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

const { width } = Dimensions.get('window');

const CATEGORY_LABELS = {
  'Food': 'Nourriture',
  'Supermarket': 'Supermarché',
  'Cosmetics': 'Cosmétiques',
  'Electronics': 'Électronique',
  'Home': 'Maison',
  'Other': 'Autres'
};

const CATEGORY_ICONS = {
  'Electronics': { icon: 'laptop', color: '#2980B9' },
  'Cosmetics': { icon: 'lipstick', color: '#9B59B6' },
  'Home': { icon: 'home-variant', color: '#F1C40F' },
  'Food': { icon: 'food-apple', color: '#E67E22' },
  'Supermarket': { icon: 'cart', color: '#27AE60' },
  'Other': { icon: 'dots-horizontal', color: '#95A5A6' }
};

const HORIZONTAL_CATEGORIES = [
  { id: 'Electronics', name: 'Électronique', icon: 'laptop', type: 'Electronics' },
  { id: 'Cosmetics', name: 'Beauté', icon: 'lipstick', type: 'Cosmetics' },
  { id: 'Home', name: 'Maison', icon: 'home-variant', type: 'Home' },
  { id: 'Food', name: 'Nourriture', icon: 'food-apple', type: 'Food' },
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

  // Écoute du défilement pour le Header Intelligent
  const scrollY = useRef(new Animated.Value(0)).current;
  const listRef = useRef(null);

  // Fetch de tous les produits actifs
  const { data: productsResponse, isLoading, isFetching, refetch } = useGetProductsQuery();
  const allProducts = productsResponse?.data || [];

  // Produits populaires : Triés par salesCount décroissant (Top 8)
  const popularProducts = useMemo(() => {
    const active = allProducts.filter(p => p.isActive);
    return [...active]
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0) || (b.rating || 0) - (a.rating || 0))
      .slice(0, 8);
  }, [allProducts]);

  // Groupement des produits restants par catégorie
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

    // Mappage des sections triées et filtrées si un filtre horizontal est actif
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

  // Interpolations pour le Header intelligent rétractable
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [Platform.OS === 'ios' ? 120 : 100, 0],
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
    // Événements globaux du Tabbar
    const scrollTopSub = DeviceEventEmitter.addListener('scroll_to_top_hub', () => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
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

  // Calcul de la largeur de carte pour 2 colonnes avec espace de 12px
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
        <View style={styles.headerTopRow}>
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
        <View style={styles.miniStickyInner}>
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
          <View style={styles.miniSearchContainer}>
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

      {/* FLUID LIST */}
      <FlatList
        ref={listRef}
        data={categorySections}
        keyExtractor={item => item.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent, 
          { 
            paddingTop: Platform.OS === 'ios' ? 120 : 100,
            paddingBottom: 90 
          }
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        onRefresh={refetch}
        refreshing={isFetching}
        ListHeaderComponent={
          <Animated.View style={{ transform: [{ scale: bannerScale }] }}>
            {/* BARRE DE RECHERCHE PRINCIPALE (TYPE MAQUETTE) */}
            <MarketplaceSearchBar 
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              placeholder="Rechercher un produit..."
              style={styles.mainSearchBar}
            />

            {/* BANNER PROMO DYNAMIQUE ADAPTÉE AU DESIGN JAUNE */}
            <MarketplaceBanner navigation={navigation} />

            {/* HORIZONTAL CATEGORY BAR CHIPS */}
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

            {/* SECTION POPULAIRES (TOP 8) */}
            {!selectedCategoryFilter && popularProducts.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitleText}>Produits populaires</Text>
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
              <TouchableOpacity 
                style={styles.resetFilterButton}
                onPress={() => setSelectedCategoryFilter(null)}
              >
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
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('ProductList', { category: item.key })}
                  >
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

              {!hasMoreThan16 && (
                <View style={styles.catFooterLine}>
                  <View style={styles.lineDivider} />
                  <Text style={styles.catFooterText}>C'est tout pour cette catégorie</Text>
                  <View style={styles.lineDivider} />
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          isLoading ? renderSkeleton() : (
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
          )
        }
      />

      {/* MODALE OVERLAY DES CATÉGORIES (SANS CHANGEMENT DE PAGE) */}
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
  },
  collapsibleHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: THEME.SPACING.xl,
    backgroundColor: '#000000',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F5D142',
    letterSpacing: 0.5,
  },
  hamburgerButton: {
    padding: THEME.SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniStickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 150,
    paddingHorizontal: THEME.SPACING.lg,
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
  },
  miniSearchContainer: {
    marginTop: THEME.SPACING.xs,
    marginBottom: THEME.SPACING.sm,
  },
  miniSearchBarInput: {
    height: 40,
  },
  listContent: {
    paddingHorizontal: THEME.SPACING.lg,
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
    gap: 8,
  },
  catChip: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  catIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionContainer: {
    marginTop: THEME.SPACING.lg,
    marginBottom: THEME.SPACING.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SPACING.md,
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
    fontSize: 11,
    color: THEME.COLORS.textTertiary,
    marginHorizontal: 12,
    fontWeight: '500',
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
    gap: 12,
  },
  emptyFeedText: {
    fontSize: 14,
    color: THEME.COLORS.textTertiary,
    textAlign: 'center',
  },
  skeletonContainer: {
    paddingVertical: 10,
  },
  skeletonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonCard: {
    width: (width - THEME.SPACING.lg * 2 - 16) / 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCardContainer: {
    backgroundColor: THEME.COLORS.glassModal,
    borderTopLeftRadius: THEME.BORDERS.radius.xxl,
    borderTopRightRadius: THEME.BORDERS.radius.xxl,
    padding: THEME.SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : THEME.SPACING.xxl,
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
    fontSize: 20,
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
    aspectRatio: 1,
    borderRadius: THEME.BORDERS.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
    fontSize: 11,
    fontWeight: '700',
    color: THEME.COLORS.textPrimary,
    textAlign: 'center',
  },
});

export default MarketplaceHub;
