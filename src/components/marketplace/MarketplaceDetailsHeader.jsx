// src/components/marketplace/MarketplaceDetailsHeader.jsx
// HEADER DE DETAILS REUTILISABLE & MODULAIRE - Design Premium
// CSCSM Level: Bank Grade

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  useColorScheme 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import { selectCartItems } from '../../store/slices/cartSlice';
import THEME from '../../theme/theme';

const MarketplaceDetailsHeader = ({ 
  title = "Détails", 
  onBackPress = null, 
  showCart = true, 
  isOverlay = true 
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const cartItems = useSelector(selectCartItems);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Home');
      }
    }
  };

  const handleGoToCart = () => {
    navigation.navigate('Cart');
  };

  if (isOverlay) {
    return (
      <View style={[styles.headerOverlay, { paddingTop: Math.max(insets.top, 15) }]}>
        <TouchableOpacity 
          onPress={handleBack} 
          style={styles.circularBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerOverlayTitle} numberOfLines={1}>
          {title}
        </Text>
        
        {showCart ? (
          <TouchableOpacity 
            onPress={handleGoToCart} 
            style={styles.circularBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="cart" size={22} color={THEME.COLORS.primary} />
            {cartCount > 0 && (
              <View style={styles.cartBadgeOverlay}>
                <Text style={styles.cartBadgeOverlayText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholderBtn} />
        )}
      </View>
    );
  }

  // Standard Non-Overlay Inline Header (Adapts to theme dynamically)
  return (
    <View style={[
      styles.standardHeader, 
      { 
        paddingTop: insets.top + THEME.SPACING.md,
        backgroundColor: isDarkMode ? THEME.COLORS.background : '#FFFFFF',
        borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      }
    ]}>
      <View style={styles.standardInner}>
        <TouchableOpacity 
          onPress={handleBack} 
          style={[styles.standardCircularBtn, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={isDarkMode ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        
        <Text style={[styles.standardTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]} numberOfLines={1}>
          {title}
        </Text>
        
        {showCart ? (
          <TouchableOpacity 
            onPress={handleGoToCart} 
            style={[styles.standardCircularBtn, { 
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              borderColor: 'rgba(212, 175, 55, 0.15)',
              borderWidth: 1
            }]}
            activeOpacity={0.8}
          >
            <Ionicons name="cart-outline" size={22} color={THEME.COLORS.primary} />
            {cartCount > 0 && (
              <View style={styles.cartBadgeOverlay}>
                <Text style={styles.cartBadgeOverlayText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholderBtn} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Overlay Style
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  circularBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerOverlayTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 15,
  },
  placeholderBtn: {
    width: 42,
  },

  // Standard Header Style
  standardHeader: {
    paddingBottom: THEME.SPACING.md,
    borderBottomWidth: 1,
    width: '100%',
  },
  standardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  standardCircularBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  standardTitle: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 15,
  },

  // Badge Style
  cartBadgeOverlay: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: THEME.COLORS.danger || '#e74c3c',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: THEME.COLORS.background || '#FFFFFF',
  },
  cartBadgeOverlayText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
});

export default MarketplaceDetailsHeader;
