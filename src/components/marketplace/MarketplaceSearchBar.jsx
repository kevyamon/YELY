// src/components/marketplace/MarketplaceSearchBar.jsx
import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Platform 
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import THEME from '../../theme/theme';

const MarketplaceSearchBar = ({
  value,
  onChangeText,
  onSubmitEditing,
  placeholder = "Rechercher un plat, un produit...",
  isSearching = false,
  style = {},
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[
      styles.searchContainer,
      isFocused && styles.searchContainerFocused,
      style
    ]}>
      {/* Left Icon: Magnify or Golden Loader */}
      <View style={styles.iconWrapper}>
        {isSearching ? (
          <ActivityIndicator size="small" color={THEME.COLORS.primary} />
        ) : (
          <Ionicons name="search" size={20} color={isFocused ? THEME.COLORS.primary : THEME.COLORS.textTertiary} />
        )}
      </View>

      {/* Real TextInput */}
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={THEME.COLORS.textTertiary}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        returnKeyType="search"
        underlineColorAndroid="transparent"
      />

      {/* Right Icon: Clear Button */}
      {value.length > 0 && (
        <TouchableOpacity 
          onPress={() => onChangeText('')} 
          style={styles.clearButton}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="close-circle" size={18} color={THEME.COLORS.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: THEME.BORDERS.radius.lg,
    paddingHorizontal: THEME.SPACING.md,
    height: 50,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    transition: 'border-color 0.2s ease', // Only works on Web, safe on Native
  },
  searchContainerFocused: {
    borderColor: THEME.COLORS.primary,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  iconWrapper: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: THEME.COLORS.textPrimary,
    fontSize: THEME.FONTS.sizes.body,
    paddingVertical: 0,
    height: '100%',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        outlineWidth: 0,
        backgroundColor: 'transparent',
      }
    }),
  },
  clearButton: {
    padding: THEME.SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MarketplaceSearchBar;
