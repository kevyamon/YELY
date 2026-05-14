// src/screens/marketplace/MarketplaceHub.jsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Dimensions,
  StatusBar
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import THEME from '../../theme/theme';

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
  
  const renderCategory = ({ item }) => (
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
          <View>
            <Text style={styles.headerSubtitle}>Livraison vers</Text>
            <View style={styles.locationRow}>
              <Text style={styles.headerTitle}>Votre Position</Text>
              <Ionicons name="chevron-down" size={16} color={THEME.COLORS.primary} style={{marginLeft: 4}}/>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate('Cart')}>
          <MaterialCommunityIcons name="shopping-outline" size={24} color={THEME.COLORS.primary} />
          <View style={styles.cartBadge} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={CATEGORIES}
        renderItem={renderCategory}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={styles.listHeader}>
            
            {/* SEARCH BAR MOCK */}
            <TouchableOpacity style={styles.searchBar} activeOpacity={0.9}>
              <Ionicons name="search" size={20} color={THEME.COLORS.textTertiary} />
              <Text style={styles.searchText}>Rechercher un plat, un produit...</Text>
            </TouchableOpacity>

            {/* BANNER PROMO */}
            <TouchableOpacity activeOpacity={0.9} style={styles.promoContainer}>
              <LinearGradient
                colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.05)']}
                style={styles.promoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.promoContent}>
                  <Text style={styles.promoBadge}>NOUVEAU</Text>
                  <Text style={styles.promoTitle}>Livraison Yély Express</Text>
                  <Text style={styles.promoDesc}>Faites vos courses sans bouger. Nos chauffeurs s'occupent de tout.</Text>
                </View>
                <MaterialCommunityIcons name="moped-electric-outline" size={64} color={THEME.COLORS.primary} style={styles.promoIcon} />
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Que cherchez-vous ?</Text>
          </View>
        )}
      />
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
    fontSize: THEME.FONTS.sizes.body,
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
    width: (width - THEME.SPACING.lg * 2 - THEME.SPACING.md) / 2,
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
  }
});

export default MarketplaceHub;
