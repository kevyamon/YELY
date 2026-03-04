// src/components/subscription/PricingCard.jsx
// COMPOSANT UI - Carte de Prix Animée avec Dégradé de Promo
// STANDARD: Premium UI

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import THEME from '../../theme/theme';

const PricingCard = ({ title, price, originalPrice, isPromo, description, onPress }) => {
  const scale = useSharedValue(1);

  // Animation de pulsation du badge si la promo est active
  useEffect(() => {
    if (isPromo) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1, // Infini
        true
      );
    } else {
      scale.value = 1;
    }
  }, [isPromo]);

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <TouchableOpacity 
      style={[styles.card, isPromo && styles.cardPromo]} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      {isPromo && (
        <Animated.View style={[styles.promoBadge, animatedBadgeStyle]}>
          <Text style={styles.promoText}>-40% FLASH</Text>
        </Animated.View>
      )}

      <View style={styles.header}>
        <Ionicons name="card-outline" size={24} color={THEME.COLORS.champagneGold} />
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.priceContainer}>
        {isPromo && (
          <View style={styles.crossedContainer}>
            <Text style={styles.crossedPrice}>{originalPrice}</Text>
            <View style={styles.strikeLine} />
          </View>
        )}
        <Text style={[styles.price, isPromo && styles.pricePromo]}>{price} FCFA</Text>
      </View>

      <Text style={styles.description}>{description}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.COLORS.glassDark,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(12, 10, 0, 0.2)',
    overflow: 'hidden'
  },
  cardPromo: {
    borderColor: THEME.COLORS.champagneGold,
    backgroundColor: 'rgba(212, 175, 55, 0.08)', // Leger fond or
  },
  promoBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#E74C3C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  promoText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.COLORS.textPrimary || '#FFFFFF',
    marginLeft: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  crossedContainer: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 3,
  },
  crossedPrice: {
    fontSize: 18,
    color: THEME.COLORS.textSecondary,
    fontWeight: 'bold',
  },
  strikeLine: {
    position: 'absolute',
    top: '50%',
    left: -2,
    right: -2,
    height: 2,
    backgroundColor: '#E74C3C',
    transform: [{ rotate: '-10deg' }],
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.COLORS.textPrimary || '#FFFFFF',
  },
  pricePromo: {
    color: THEME.COLORS.champagneGold,
  },
  description: {
    fontSize: 14,
    color: THEME.COLORS.textSecondary,
    marginTop: 5,
  }
});

export default PricingCard;