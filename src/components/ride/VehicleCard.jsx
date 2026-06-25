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

  // Définition de l'icône selon la gamme (Echo: Partagé, VIP: Privé)
  const getIconConfig = (type) => {
    switch (type?.toLowerCase()) {
      case 'echo':
        return { name: 'people-outline', color: THEME.COLORS.success || '#4CD964' };
      case 'vip':
        return { name: 'star-outline', color: THEME.COLORS.champagneGold || '#D4AF37' };
      default:
        return { name: 'car-outline', color: THEME.COLORS.textSecondary };
    }
  };

  const iconConfig = getIconConfig(vehicle.type);

  // Correction de nommage si le type est Echo -> affiche Partagé
  const displayName = vehicle.type?.toLowerCase() === 'echo' ? 'Partagé' : (vehicle.name || 'Option');

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
          <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
        </View>

        {/* Titre et Durée */}
        <View style={styles.detailsContainer}>
          <Text style={[styles.vehicleName, isSelected && styles.textGold]} numberOfLines={1}>
            {displayName}
          </Text>
          
          <View style={styles.etaRow}>
             <Ionicons name="time-outline" size={11} color={THEME.COLORS.textTertiary} />
             <Text style={styles.etaText}>~{vehicle.duration} min</Text>
          </View>
        </View>

        {/* Pied de carte avec le tarif fixe ou chargement */}
        <View style={[styles.priceFooter, isSelected && styles.priceFooterSelected]}>
          <Text style={[styles.priceText, isSelected && styles.textGold]} numberOfLines={1}>
            {vehicle.price ? `${vehicle.price} F` : 'Calcul...'}
          </Text>
          <Text style={[styles.subPriceText, isSelected && styles.textGold]}>
            Tarif fixe
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
    justifyContent: 'space-between',
    height: 135,
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: THEME.COLORS.border || 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.04)', 
    borderColor: THEME.COLORS.champagneGold || '#D4AF37',
    borderWidth: 2,
    shadowColor: THEME.COLORS.champagneGold || '#D4AF37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, 
    shadowRadius: 10,
    elevation: 5,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: THEME.COLORS.champagneGold || '#D4AF37',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderBottomLeftRadius: 8,
    zIndex: 10,
  },
  badgeText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#121418',
    letterSpacing: 0.5,
  },
  iconWrapper: {
    marginLeft: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.COLORS.glassLight || 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapperSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginTop: 4,
  },
  vehicleName: {
    color: THEME.COLORS.textPrimary || '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaText: {
    color: THEME.COLORS.textTertiary || '#718096',
    fontSize: 10,
    marginLeft: 3,
    fontWeight: '600',
  },
  priceFooter: {
    marginTop: 'auto',
    backgroundColor: 'rgba(0,0,0,0.08)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4
  },
  priceFooterSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderTopColor: 'rgba(212, 175, 55, 0.15)',
  },
  priceText: {
    color: THEME.COLORS.textPrimary || '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  subPriceText: {
    color: THEME.COLORS.textTertiary || '#718096',
    fontSize: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  textGold: {
    color: THEME.COLORS.champagneGold || '#D4AF37',
  }
});

export default VehicleCard;