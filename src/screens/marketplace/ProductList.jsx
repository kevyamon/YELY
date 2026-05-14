// src/screens/marketplace/ProductList.jsx
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  StatusBar,
  Animated
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProductCard from '../../components/marketplace/ProductCard';
import { useGetProductsQuery } from '../../store/api/marketplaceApiSlice';
import useMarketplaceSocketEvents from '../../hooks/useMarketplaceSocketEvents';
import THEME from '../../theme/theme';

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
  const { category } = route.params || {};
  const [search, setSearch] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const flatListRef = useRef(null);
  const scrollTopOpacity = useRef(new Animated.Value(0)).current;

  const displayTitle = CATEGORY_LABELS[category] || category || 'Produits';

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

  const { data, isLoading, isError, refetch } = useGetProductsQuery({
    category,
    search: search.length > 2 ? search : undefined
  });

  const products = data?.data || [];

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

      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={20} color={THEME.COLORS.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un produit..."
          placeholderTextColor={THEME.COLORS.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={THEME.COLORS.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
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

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.COLORS.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={products}
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
          refreshing={isLoading}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
      )}

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
  }
});

export default ProductList;
