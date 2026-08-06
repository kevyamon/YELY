// src/components/marketplace/MarketplaceHeader.jsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../theme/theme';
import MarketplaceSearchBar from './MarketplaceSearchBar';

const MarketplaceHeader = ({
  searchQuery,
  setSearchQuery,
  handleSearchSubmit,
  navigation,
  insets,
  isDarkMode,
  paddingValue = 0,
}) => {
  const headerBgColor = isDarkMode ? 'rgba(212, 175, 55, 0.15)' : THEME.COLORS.primary;
  const headerContentColor = isDarkMode ? THEME.COLORS.primary : '#121418';

  return (
    <View style={[
      styles.collapsibleHeader, 
      { 
        height: FIXED_HEADER_HEIGHT, 
        paddingTop: insets.top + THEME.SPACING.xs,
        backgroundColor: headerBgColor,
        borderBottomWidth: 0,
      }
    ]}>
      <View style={[styles.headerTopRow, paddingValue ? { paddingHorizontal: paddingValue } : {}]}>
        <TouchableOpacity 
          style={styles.hamburgerButton} 
          onPress={() => {
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate('Home');
            } else {
              navigation.navigate('Home');
            }
          }}
        >
          <Ionicons name="home-outline" size={26} color={headerContentColor} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: headerContentColor }]}>Yély Marketplace</Text>

        <View style={{ width: 26 }} />
      </View>

      {/* Barre de recherche intégrée dans l'en-tête uniformisé */}
      <View style={styles.searchBarWrapper}>
        <MarketplaceSearchBar 
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          placeholder="Rechercher un produit..."
          style={{
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
            borderRadius: 14,
            marginTop: 10,
            marginBottom: 8,
            maxWidth: 600,
            alignSelf: 'center',
            width: '100%',
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  collapsibleHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: THEME.SPACING.lg,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    width: '100%',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  hamburgerButton: {
    padding: THEME.SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
  },
  miniStickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 150,
    paddingHorizontal: THEME.SPACING.lg,
    paddingBottom: THEME.SPACING.sm,
    backgroundColor: '#0B0C0E',
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
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
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
  searchBarWrapper: {
    width: '100%',
    alignItems: 'center',
  }
});

export default MarketplaceHeader;
