// src/components/ride/VehicleCard.jsx
// CARTE VÉHICULE - Redessinée pour s'adapter à la largeur disponible (côte à côte)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import THEME from '../../theme/theme';

const VehicleCard = ({ vehicle, isSelected, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const getIconConfig = (type) => {
    switch (type?.toLowerCase()) {
      case 'echo':
        return { name: 'people-outline', color: '#4CD964' };
      case 'vip':
        return { name: 'star-outline', color: '#D4AF37' };
      default:
        return { name: 'car-outline', color: THEME.COLORS.textSecondary };
    }
  };

  const iconConfig = getIconConfig(vehicle.type);
  const displayName = vehicle.type?.toLowerCase() === 'echo' ? 'Partagé' : (vehicle.name || 'Option');
  const isEcho = vehicle.type?.toLowerCase() === 'echo';

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <Pressable
        onPressIn={() => (scale.value = withSpring(0.96))}
        onPressOut={() => (scale.value = withSpring(1))}
        onPress={() => onPress(vehicle)}
        style={[
          styles.card,
          isSelected && styles.cardSelected
        ]}
      >
        {/* Badge VIP Optionnel */}
        {vehicle.type?.toLowerCase() === 'vip' && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PRIVÉ</Text>
          </View>
        )}

        {/* Conteneur d'icône */}
        <View style={[styles.iconWrapper, isSelected && styles.iconWrapperSelected]}>
          <Ionicons name={iconConfig.name} size={18} color={iconConfig.color} />
        </View>

        {/* Titre et Tarif Fixe */}
        <View style={styles.detailsContainer}>
          <Text style={styles.vehicleName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.subTitleText}>Tarif fixe</Text>
        </View>

        {/* Séparateur liseré fin */}
        <View style={styles.separator} />

        {/* Pied de carte avec le tarif fixe en très grand format */}
        <View style={[styles.priceFooter, isSelected && styles.priceFooterSelected]}>
          <Text style={[styles.priceText, isEcho ? styles.priceTextEcho : styles.priceTextVip]} numberOfLines={1}>
            {vehicle.price ? vehicle.price : '...'}
            <Text style={styles.currencyText}> F</Text>
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 1, // Permet le partage équitable côte à côte
  },
  card: {
    flexDirection: 'column',
    height: 108,
    backgroundColor: THEME.COLORS.glassSurface || '#1A1D24',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: THEME.COLORS.border || 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  cardSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.03)', 
    borderColor: THEME.COLORS.champagneGold || '#D4AF37',
    borderWidth: 2,
    shadowColor: THEME.COLORS.champagneGold || '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, 
    shadowRadius: 8,
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: THEME.COLORS.champagneGold || '#D4AF37',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomLeftRadius: 8,
    zIndex: 10,
  },
  badgeText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#121418',
    letterSpacing: 0.5,
  },
  iconWrapper: {
    marginLeft: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.COLORS.glassLight || 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapperSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  detailsContainer: {
    paddingHorizontal: 10,
    marginTop: 4,
  },
  vehicleName: {
    color: THEME.COLORS.textPrimary || '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 1,
  },
  subTitleText: {
    color: THEME.COLORS.textTertiary || '#718096',
    fontSize: 10.5,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 6,
    width: '100%',
  },
  priceFooter: {
    marginTop: 'auto',
    backgroundColor: 'rgba(0,0,0,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceFooterSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.04)',
  },
  priceText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  priceTextEcho: {
    color: '#2ecc71',
  },
  priceTextVip: {
    color: THEME.COLORS.champagneGold || '#D4AF37',
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '800',
  }
});

export default VehicleCard;