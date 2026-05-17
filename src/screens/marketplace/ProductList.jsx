// src/screens/marketplace/ProductList.jsx
import React, { useState, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  StatusBar,
  Animated,
  Dimensions,
  Platform,
  ScrollView
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
  const insets = useSafeAreaInsets();
  useMarketplaceSocketEvents();
  const { category, search: initialSearch } = route.params || {};
  const [search, setSearch] = useState(initialSearch || '');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'priceAsc' | 'priceDesc'
  const [showScrollTop, setShowScrollTop] = useState(false);
  const flatListRef = useRef(null);
  const scrollTopOpacity = useRef(new Animated.Value(0)).current;

  const displayTitle = category === 'All' ? 'Tous les produits' : (CATEGORY_LABELS[category] || category || 'Produits');

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
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{displayTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      <MarketplaceSearchBar 
        value={search}
        onChangeText={setSearch}
        placeholder="Rechercher un produit..."
        isSearching={isFetching}
        style={{ marginTop: THEME.SPACING.sm }}
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

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="package-variant" size={64} color={THEME.COLORS.textTertiary} />
      <Text style={styles.emptyText}>Aucun produit trouvé</Text>
      <TouchableOpacity style={styles.refreshButton} onPress={refetch}>
        <Text style={styles.refreshText}>Actualiser</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonGrid}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <SkeletonBone width="100%" height={150} borderRadius={20} />
          <SkeletonBone width="80%" height={20} style={{ marginTop: 15 }} />
          <SkeletonBone width="40%" height={15} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      {/* SMART SKELETON DISPLAY THRESHOLD (Prevents FlatList unmounting / Keyboard focus loss) */}
      {(() => {
        const showSkeleton = isLoading || (isFetching && products.length === 0);
        return (
          <GlobalSkeleton visible={showSkeleton}>
            {showSkeleton ? renderSkeleton() : (
              <FlatList
                ref={flatListRef}
                data={sortedProducts}
                renderItem={({ item }) => (
                  <ProductCard 
                    product={item} 
                    onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
                  />
                )}
                keyExtractor={item => item._id}
                numColumns={2}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.columnWrapper}
                ListEmptyComponent={renderEmpty}
                showsVerticalScrollIndicator={false}
                onRefresh={refetch}
                refreshing={isFetching}
                onScroll={handleScroll}
                scrollEventThrottle={16}
              />
            )}
          </GlobalSkeleton>
        );
      })()}

      {/* BOUTON SCROLL TO TOP */}
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
    paddingHorizontal: THEME.SPACING.xl,
    paddingVertical: THEME.SPACING.md,
    backgroundColor: THEME.COLORS.background,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.COLORS.glassSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: THEME.FONTS.sizes.h3,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: THEME.BORDERS.radius.lg,
    paddingHorizontal: THEME.SPACING.md,
    height: 48,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: THEME.SPACING.sm,
    color: THEME.COLORS.textPrimary,
    fontSize: THEME.FONTS.sizes.body,
  },
  listContent: {
    paddingHorizontal: THEME.SPACING.xl,
    paddingBottom: THEME.SPACING.xxl,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.xl,
    paddingTop: THEME.SPACING.md,
  },
  skeletonCard: {
    width: (Dimensions.get('window').width - THEME.SPACING.xl * 2 - THEME.SPACING.md) / 2,
    marginBottom: THEME.SPACING.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: THEME.FONTS.sizes.body,
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
  },
  refreshText: {
    color: THEME.COLORS.primary,
    fontWeight: THEME.FONTS.weights.bold,
  },
  scrollTopBtn: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    borderRadius: 20,
    ...THEME.SHADOWS.goldSoft,
  },
  scrollTopInner: {
    width: 48,
    height: 48,
    borderRadius: 20,
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
