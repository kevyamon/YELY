// src/components/subscription/PricingCard.jsx
// COMPOSANT UI - Carte de tarification avec gestion Promo
// STANDARD: Industriel / Theme Dynamique

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';
import GlassCard from '../ui/GlassCard';

const PricingCard = ({ 
  title, 
  price, 
  crossedPrice, 
  isPromo, 
  description, 
  onPress 
}) => {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.cardWrapper}>
      <GlassCard style={styles.pricingCard}>
        <Text style={styles.planTitle}>{title}</Text>
        <View style={styles.priceRow}>
          {isPromo && <Text style={styles.crossedPrice}>{crossedPrice} FCFA</Text>}
          <Text style={[styles.planPrice, isPromo && styles.promoPrice]}>
            {price} FCFA
          </Text>
        </View>
        <Text style={styles.planDesc}>{description}</Text>
        
        {isPromo && (
          <View style={styles.promoBadge}>
            <Text style={styles.promoBadgeText}>PROMO FLASH</Text>
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 20,
  },
  pricingCard: {
    padding: 25,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  planTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: THEME.COLORS.textPrimary || '#FFFFFF',
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  crossedPrice: {
    fontSize: 18,
    color: THEME.COLORS.textSecondary || '#A0AEC0',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  planPrice: {
    fontSize: 26,
    fontWeight: 'bold',
    color: THEME.COLORS.champagneGold || '#FFD700',
  },
  promoPrice: {
    color: THEME.COLORS.error || '#FF4757', 
    fontSize: 30,
  },
  planDesc: {
    fontSize: 14,
    color: THEME.COLORS.textSecondary || '#CBD5E0',
    textAlign: 'center',
  },
  promoBadge: {
    position: 'absolute',
    top: 15,
    right: -30,
    backgroundColor: THEME.COLORS.error || '#FF4757',
    paddingVertical: 5,
    paddingHorizontal: 30,
    transform: [{ rotate: '45deg' }],
  },
  promoBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default PricingCard;