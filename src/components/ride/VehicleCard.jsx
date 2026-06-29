// src/components/ride/VehicleCard.jsx
// CARTE VÉHICULE - Disposition horizontale premium avec animation d'échelle du prix
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import THEME from '../../theme/theme';

const VehicleCard = ({ vehicle, isSelected, onPress }) => {
  const scale = useSharedValue(1);
  const priceScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  useEffect(() => {
    priceScale.value = withSpring(isSelected ? 1.15 : 1, { damping: 10, stiffness: 100 });
  }, [isSelected, priceScale]);

  const priceAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: priceScale.value }],
    };
  });

  const getIconConfig = (type) => {
    switch (type?.toLowerCase()) {
      case 'echo':
        return { name: 'people-outline', color: '#2ecc71' };
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

        {/* Ligne du haut : Icône à gauche, Prix à droite */}
        <View style={styles.headerRow}>
          <View style={[styles.iconWrapper, isSelected && styles.iconWrapperSelected]}>
            <Ionicons name={iconConfig.name} size={18} color={iconConfig.color} />
          </View>
          
          <Animated.View style={[styles.priceContainer, priceAnimatedStyle]}>
            <Text style={[styles.priceText, isEcho ? styles.priceTextEcho : styles.priceTextVip]} numberOfLines={1}>
              {vehicle.price ? vehicle.price : '...'}
              <Text style={styles.currencyText}> F</Text>
            </Text>
          </Animated.View>
        </View>

        {/* Ligne du bas : Nom du forfait et sous-titre */}
        <View style={styles.detailsContainer}>
          <Text style={styles.vehicleName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.subTitleText}>Tarif fixe</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 1,
  },
  card: {
    flexDirection: 'column',
    height: 104,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  cardSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderColor: '#D4AF37',
    borderWidth: 2,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#D4AF37',
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapperSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priceText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  priceTextEcho: {
    color: '#2ecc71',
  },
  priceTextVip: {
    color: '#D4AF37',
  },
  currencyText: {
    fontSize: 13,
    fontWeight: '800',
  },
  detailsContainer: {
    marginTop: 'auto',
  },
  vehicleName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  subTitleText: {
    color: '#718096',
    fontSize: 10.5,
    fontWeight: '500',
  },
});

export default VehicleCard;