// src/components/ride/VehicleCard.jsx
// CARTE VEHICULE COMPACTE - Prix centre et agrandi, typographie soignee et icone Info
// CSCSM Level: Bank Grade (Strictement modulaire < 325 lignes, Zero Emojis)

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import THEME from '../../theme/theme';

const VehicleCard = ({ vehicle, isSelected, onPress, onInfoPress }) => {
  const scale = useSharedValue(1);
  const priceScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  useEffect(() => {
    priceScale.value = withSpring(isSelected ? 1.08 : 1, { damping: 10, stiffness: 100 });
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
        {/* Badge VIP avec typographie soignee */}
        {vehicle.type?.toLowerCase() === 'vip' && (
          <View style={[styles.badge, isSelected ? styles.badgeSelected : styles.badgeUnselected]}>
            <Text style={[styles.badgeText, isSelected ? styles.badgeTextSelected : styles.badgeTextUnselected]}>
              PRIVÉ
            </Text>
          </View>
        )}

        {/* Ligne du haut : Icone a gauche, Prix agrandi et centre */}
        <View style={styles.headerRow}>
          <View style={[styles.iconWrapper, isSelected ? styles.iconWrapperSelected : styles.iconWrapperUnselected]}>
            <Ionicons name={iconConfig.name} size={16} color={iconConfig.color} />
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

          {/* Espaceur droit pour centrage du prix et degagement du badge */}
          <View style={styles.headerSpacer} />
        </View>

        {/* Ligne du bas : Nom du forfait, sous-titre et bouton Info tactile */}
        <View style={styles.detailsContainer}>
          <View style={styles.bottomRow}>
            <View style={styles.nameBlock}>
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

            <TouchableOpacity
              style={[styles.infoBtn, isSelected ? styles.infoBtnSelected : styles.infoBtnUnselected]}
              onPress={(e) => {
                e.stopPropagation?.();
                onInfoPress?.(vehicle);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="information-circle-outline" 
                size={16} 
                color={isSelected ? '#121418' : (THEME.COLORS.champagneGold || '#D4AF37')} 
              />
            </TouchableOpacity>
          </View>
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
    height: 88,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderBottomLeftRadius: 8,
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
    letterSpacing: 0.5,
  },
  badgeTextUnselected: {
    color: '#121418',
  },
  badgeTextSelected: {
    color: THEME.PALETTE.warmYellow,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  priceText: {
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 0.3,
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
  headerSpacer: {
    width: 24,
  },
  detailsContainer: {
    marginTop: 'auto',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
  },
  nameBlock: {
    flex: 1,
    marginRight: 6,
  },
  vehicleName: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 1,
  },
  vehicleNameUnselected: {
    color: THEME.COLORS.textPrimary,
  },
  vehicleNameSelected: {
    color: '#121418',
  },
  subTitleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  subTitleTextUnselected: {
    color: THEME.COLORS.textSecondary,
  },
  subTitleTextSelected: {
    color: 'rgba(18, 20, 24, 0.75)',
  },
  infoBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBtnUnselected: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  infoBtnSelected: {
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
});

export default VehicleCard;