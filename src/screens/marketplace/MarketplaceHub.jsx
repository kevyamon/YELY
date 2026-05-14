// src/screens/marketplace/MarketplaceHub.jsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  Dimensions 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import THEME from '../../theme/theme';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: '1', name: 'Nourriture', icon: 'food-apple', color: '#E67E22', type: 'Food' },
  { id: '2', name: 'Cosmétiques', icon: 'lipstick', color: '#9B59B6', type: 'Cosmetics' },
  { id: '3', name: 'Supermarché', icon: 'cart', color: '#27AE60', type: 'Supermarket' },
  { id: '4', name: 'Électronique', icon: 'cellphone', color: '#2980B9', type: 'Electronics' },
  { id: '5', name: 'Maison', icon: 'home-variant', color: '#F1C40F', type: 'Home' },
  { id: '6', name: 'Autres', icon: 'dots-horizontal', color: '#95A5A6', type: 'Other' },
];

const MarketplaceHub = ({ navigation }) => {
  
  const renderCategory = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryCard}
      onPress={() => navigation.navigate('ProductList', { category: item.type })}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrapper, { backgroundColor: item.color + '20' }]}>
        <MaterialCommunityIcons name={item.icon} size={32} color={item.color} />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Marketplace</Text>
        <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate('Cart')}>
          <MaterialCommunityIcons name="basket" size={24} color={THEME.COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={CATEGORIES}
        renderItem={renderCategory}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={() => (
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Toutes les catégories</Text>
            <Text style={styles.sectionSubtitle}>Trouvez tout ce dont vous avez besoin</Text>
          </View>
        )}
      />
    </SafeAreaView>
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
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.COLORS.glassSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: THEME.SPACING.xl,
    paddingBottom: THEME.SPACING.xxl,
  },
  listHeader: {
    marginVertical: THEME.SPACING.xl,
  },
  sectionTitle: {
    fontSize: THEME.FONTS.sizes.h2,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: THEME.FONTS.sizes.body,
    color: THEME.COLORS.textSecondary,
    marginTop: THEME.SPACING.xs,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - THEME.SPACING.xl * 3) / 2,
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: THEME.BORDERS.radius.lg,
    padding: THEME.SPACING.lg,
    marginBottom: THEME.SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    ...THEME.SHADOWS.soft,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.SPACING.md,
  },
  categoryName: {
    fontSize: THEME.FONTS.sizes.body,
    fontWeight: THEME.FONTS.weights.semiBold,
    color: THEME.COLORS.textPrimary,
  }
});

export default MarketplaceHub;
