// src/screens/marketplace/MarketplaceHub.web.jsx
import React, { useState, useRef, useEffect } from 'react';
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Animated
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useMarketplaceSocketEvents from '../../hooks/useMarketplaceSocketEvents';
import THEME from '../../theme/theme';
import MarketplaceSearchBar from '../../components/marketplace/MarketplaceSearchBar';

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

  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleScroll = (event) => {
    setShowScrollTop(event.nativeEvent.contentOffset.y > 150);
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim().length > 0) {
      navigation.navigate('ProductList', { search: searchQuery.trim(), category: undefined });
    }
  };

  // Reset la barre de recherche au retour sur l'écran
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setSearchQuery('');
    });
    return unsubscribe;
  }, [navigation]);

  // ANIMATION STAGGERED
  const animatedValues = useRef(CATEGORIES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = CATEGORIES.map((_, i) => {
      return Animated.timing(animatedValues[i], {
        toValue: 1,
        duration: 500,
        delay: i * 60,
        useNativeDriver: true,
      });
    });
    Animated.stagger(60, animations).start();
  }, []);

  const renderCategory = (item, index) => {
    return (
      <Animated.View 
        key={item.id}
        style={{ 
          opacity: animatedValues[index],
          transform: [{
            translateY: animatedValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: [15, 0]
            })
          }]
        }}
      >
        <TouchableOpacity 
          style={styles.categoryCard}
          onPress={() => navigation.navigate('ProductList', { category: item.type })}
          activeOpacity={0.8}
        >
          <View style={[styles.iconWrapper, { backgroundColor: item.color + '15' }]}>
            <MaterialCommunityIcons name={item.icon} size={32} color={item.color} />
          </View>
          <View style={styles.categoryTextWrapper}>
            <Text style={styles.categoryName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.categoryDesc} numberOfLines={1}>{item.desc}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* HEADER DESKTOP PREMIUM */}
      <View style={[styles.header, { paddingTop: insets.top + THEME.SPACING.md }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={THEME.COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Marketplace Yély</Text>
        </View>
        
        {/* Panier */}
        <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate('Cart')}>
          <MaterialCommunityIcons name="shopping-outline" size={24} color={THEME.COLORS.primary} />
          <View style={styles.cartBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.innerContainer}>
          {/* BARRE DE RECHERCHE CENTRÉE ET LARGE SUR PC */}
          <MarketplaceSearchBar 
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            style={styles.searchBar}
          />

          {/* BANNER PROMO DESKTOP */}
          <TouchableOpacity activeOpacity={0.9} style={styles.promoContainer}>
            <LinearGradient
              colors={['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.03)']}
              style={styles.promoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.promoContent}>
                <Text style={styles.promoBadge}>NOUVEAU</Text>
                <Text style={styles.promoTitle}>Livraison Yély Express</Text>
                <Text style={styles.promoDesc}>
                  Faites vos courses en ligne en toute simplicité. Nos chauffeurs s'occupent de récupérer et livrer vos produits en temps réel à votre porte.
                </Text>
              </View>
              <MaterialCommunityIcons name="moped-electric-outline" size={80} color={THEME.COLORS.primary} style={styles.promoIcon} />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Que cherchez-vous aujourd'hui ?</Text>

          {/* GRID RESPONSIVE DE CATÉGORIES (Wrapping Flexbox pour PC) */}
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((item, index) => renderCategory(item, index))}
          </View>
        </View>
      </ScrollView>

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
    paddingHorizontal: '6%',
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
    padding: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
  },
  cartButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
  searchBar: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    marginBottom: THEME.SPACING.xl,
  },
  promoContainer: {
    borderRadius: THEME.BORDERS.radius.xl,
    overflow: 'hidden',
    marginBottom: THEME.SPACING.xxl,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  promoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.SPACING.xxl,
    paddingVertical: THEME.SPACING.xl,
  },
  promoContent: {
    flex: 1,
    paddingRight: THEME.SPACING.xl,
  },
  promoBadge: {
    backgroundColor: THEME.COLORS.primary,
    color: THEME.COLORS.deepAsphalt,
    fontSize: 11,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginBottom: THEME.SPACING.md,
    letterSpacing: 1,
  },
  promoTitle: {
    fontSize: 26,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.primary,
    marginBottom: THEME.SPACING.sm,
  },
  promoDesc: {
    fontSize: THEME.FONTS.sizes.body,
    color: THEME.COLORS.textSecondary,
    lineHeight: 22,
  },
  promoIcon: {
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
    marginBottom: THEME.SPACING.xl,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'flex-start',
    width: '100%',
  },
  categoryCard: {
    width: 250,
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: THEME.BORDERS.radius.lg,
    padding: THEME.SPACING.xl,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    alignItems: 'flex-start',
    cursor: 'pointer',
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.SPACING.lg,
  },
  categoryTextWrapper: {
    width: '100%',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
    marginBottom: 4,
  },
  categoryDesc: {
    fontSize: 12,
    color: THEME.COLORS.textTertiary,
  }
});

export default MarketplaceHub;
