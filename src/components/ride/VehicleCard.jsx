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
    priceScale.value = withSpring(isSelected ? 1.12 : 1, { damping: 10, stiffness: 100 });
  }, [isSelected, priceScale]);

  const priceAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: priceScale.value }],
    };
  });

  const getIconConfig = (type) => {
    switch (type?.toLowerCase()) {
      case 'echo':
        return { name: 'people-outline', color: isSelected ? '#1B5E20' : THEME.COLORS.success };
      case 'vip':
        return { name: 'star-outline', color: isSelected ? '#121418' : THEME.COLORS.primary };
      default:
        return { name: 'car-outline', color: isSelected ? '#121418' : THEME.COLORS.textSecondary };
    }
  };

  const iconConfig = getIconConfig(vehicle.type);
  const displayName = vehicle.type?.toLowerCase() === 'echo' ? 'Partagé' : (vehicle.name || 'Privé (Seul)');
  const isEcho = vehicle.type?.toLowerCase() === 'echo';

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <Pressable
        onPressIn={() => (scale.value = withSpring(0.96))}
        onPressOut={() => (scale.value = withSpring(1))}
        onPress={() => onPress(vehicle)}
        style={[
          styles.card,
          isSelected ? styles.cardSelected : styles.cardUnselected
        ]}
      >
        {/* Badge VIP Optionnel */}
        {vehicle.type?.toLowerCase() === 'vip' && (
          <View style={[styles.badge, isSelected ? styles.badgeSelected : styles.badgeUnselected]}>
            <Text style={[styles.badgeText, isSelected ? styles.badgeTextSelected : styles.badgeTextUnselected]}>
              PRIVÉ
            </Text>
          </View>
        )}

        {/* Ligne du haut : Icône à gauche, Prix à droite */}
        <View style={styles.headerRow}>
          <View style={[styles.iconWrapper, isSelected ? styles.iconWrapperSelected : styles.iconWrapperUnselected]}>
            <Ionicons name={iconConfig.name} size={18} color={iconConfig.color} />
          </View>
          
          <Animated.View style={[styles.priceContainer, priceAnimatedStyle]}>
            <Text 
              style={[
                styles.priceText, 
                isSelected 
                  ? (isEcho ? styles.priceTextEchoSelected : styles.priceTextSelected) 
                  : (isEcho ? styles.priceTextEcho : styles.priceTextVip)
              ]} 
              numberOfLines={1}
            >
              {vehicle.price ? vehicle.price : '...'}
              <Text style={[styles.currencyText, isSelected && styles.currencyTextSelected]}> F</Text>
            </Text>
          </Animated.View>
        </View>

        {/* Ligne du bas : Nom du forfait et sous-titre */}
        <View style={styles.detailsContainer}>
          <Text 
            style={[
              styles.vehicleName, 
              isSelected ? styles.vehicleNameSelected : styles.vehicleNameUnselected
            ]} 
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <Text style={[styles.subTitleText, isSelected ? styles.subTitleTextSelected : styles.subTitleTextUnselected]}>
            Tarif fixe
          </Text>
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
    height: 108,
    borderRadius: 18,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  cardUnselected: {
    backgroundColor: 'rgba(250, 200, 0, 0.09)',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  cardSelected: {
    backgroundColor: THEME.PALETTE.warmYellow,
    borderColor: THEME.COLORS.primaryDark,
    borderWidth: 2,
    shadowColor: THEME.PALETTE.warmYellow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: 10,
    zIndex: 10,
  },
  badgeUnselected: {
    backgroundColor: THEME.COLORS.primary,
  },
  badgeSelected: {
    backgroundColor: '#121418',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  badgeTextUnselected: {
    color: '#121418',
  },
  badgeTextSelected: {
    color: THEME.PALETTE.warmYellow,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  iconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapperUnselected: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  iconWrapperSelected: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
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
    color: THEME.COLORS.success,
  },
  priceTextEchoSelected: {
    color: '#0E6251',
  },
  priceTextVip: {
    color: THEME.COLORS.primary,
  },
  priceTextSelected: {
    color: '#121418',
  },
  currencyText: {
    fontSize: 13,
    fontWeight: '800',
  },
  currencyTextSelected: {
    color: '#121418',
  },
  detailsContainer: {
    marginTop: 'auto',
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  vehicleNameUnselected: {
    color: THEME.COLORS.textPrimary,
  },
  vehicleNameSelected: {
    color: '#121418',
  },
  subTitleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  subTitleTextUnselected: {
    color: THEME.COLORS.textSecondary,
  },
  subTitleTextSelected: {
    color: 'rgba(18, 20, 24, 0.75)',
  },
});

export default VehicleCard;