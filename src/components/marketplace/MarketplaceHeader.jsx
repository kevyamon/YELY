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
  onRefreshPress,
  isRefreshing = false,
}) => {
  const safeTop = Math.max(insets?.top || 0, 28);
  const calculatedHeaderHeight = safeTop + (Platform.OS === 'ios' ? 115 : 105);

  const headerBgColor = isDarkMode ? '#0F1115' : THEME.COLORS.primary;
  const headerContentColor = isDarkMode ? '#F5D750' : '#121418';
  const borderBottomColor = isDarkMode ? 'rgba(212, 175, 55, 0.35)' : 'rgba(18, 20, 24, 0.08)';

  return (
    <View style={[
      styles.collapsibleHeader, 
      { 
        height: calculatedHeaderHeight, 
        paddingTop: safeTop,
        backgroundColor: headerBgColor,
        borderBottomWidth: 1.5,
        borderBottomColor: borderBottomColor,
        shadowColor: isDarkMode ? '#D4AF37' : '#000000',
        elevation: 12,
        shadowOpacity: isDarkMode ? 0.35 : 0.15,
        shadowRadius: 10,
      }
    ]}>
      <View style={[styles.headerTopRow, paddingValue ? { paddingHorizontal: paddingValue } : {}]}>
        <TouchableOpacity 
          style={[styles.hamburgerButton, isDarkMode && styles.darkIconCircle]} 
          onPress={() => {
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate('Home');
            } else {
              navigation.navigate('Home');
            }
          }}
        >
          <Ionicons name="home-outline" size={24} color={headerContentColor} />
        </TouchableOpacity>

        <Text style={[
          styles.headerTitle, 
          { color: headerContentColor },
          isDarkMode && styles.darkHeaderTitleGlow
        ]}>
          Yély Marketplace
        </Text>

        <TouchableOpacity 
          style={[styles.hamburgerButton, isDarkMode && styles.darkIconCircle]}
          onPress={onRefreshPress}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isRefreshing ? "sync" : "refresh-outline"} 
            size={22} 
            color={headerContentColor} 
          />
        </TouchableOpacity>
      </View>

      {/* Barre de recherche intégrée sans tronquage */}
      <View style={styles.searchBarWrapper}>
        <MarketplaceSearchBar 
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          placeholder="Rechercher un produit..."
          style={{
            backgroundColor: isDarkMode ? 'rgba(20, 24, 33, 0.95)' : '#FFFFFF',
            borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.4)' : 'transparent',
            borderRadius: 14,
            marginTop: 6,
            marginBottom: 4,
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
    zIndex: 1000,
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
  },
  darkIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkHeaderTitleGlow: {
    textShadowColor: 'rgba(212, 175, 55, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  }
});

export default MarketplaceHeader;
