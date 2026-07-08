// src/components/marketplace/MarketplaceCategories.jsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import THEME from '../../theme/theme';

const CATEGORY_ICONS = {
  'Electronics': { icon: 'laptop', color: '#2980B9' },
  'Cosmetics': { icon: 'lipstick', color: '#9B59B6' },
  'Home': { icon: 'home-variant', color: '#F1C40F' },
  'Food': { icon: 'food-apple', color: '#E67E22' },
  'Supermarket': { icon: 'cart', color: '#27AE60' },
  'Fashion': { icon: 'tshirt-crew', color: '#EC4899' },
};

const MarketplaceCategories = ({
  categories,
  selectedCategoryFilter,
  handleSelectCategory,
  setIsCategoriesModalVisible,
  isDarkMode
}) => {
  return (
    <View style={[
      styles.floatingCategoriesCard,
      { 
        backgroundColor: isDarkMode ? '#141821' : '#FFFFFF',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'
      }
    ]}>
      <View style={styles.categoriesRowContainer}>
        {categories.map(cat => {
          const config = CATEGORY_ICONS[cat.type] || { color: THEME.COLORS.primary };
          const isSelected = selectedCategoryFilter === cat.type;
          const chipBg = isSelected ? THEME.COLORS.primary : (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6');
          const iconColor = isSelected ? '#000000' : config.color;

          return (
            <TouchableOpacity
              key={cat.id}
              style={styles.catChip}
              onPress={() => handleSelectCategory(selectedCategoryFilter === cat.type ? null : cat.type)}
            >
              <View style={[
                styles.catIconWrapper,
                { 
                  backgroundColor: chipBg,
                  borderColor: 'transparent',
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
                  { color: isSelected ? THEME.COLORS.primary : THEME.COLORS.textPrimary }
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.catChip}
          onPress={() => setIsCategoriesModalVisible(true)}
        >
          <View style={[
            styles.catIconWrapper, 
            { 
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6', 
              borderColor: 'transparent' 
            }
          ]}>
            <MaterialCommunityIcons name="dots-horizontal" size={20} color={THEME.COLORS.textSecondary} />
          </View>
          <Text style={[styles.catChipText, { color: THEME.COLORS.textSecondary }]}>Plus</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingCategoriesCard: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginHorizontal: THEME.SPACING.lg,
    marginTop: 15,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  categoriesRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.SPACING.xs,
  },
  catChip: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
  },
  catIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  catChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default MarketplaceCategories;
