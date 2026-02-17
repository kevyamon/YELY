// src/components/ride/VehicleCard.jsx
// CARTE VÉHICULE - Affiche le détail d'un forfait (Echo, Standard, VIP)

import { Ionicons } from '@expo/vector-icons';
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

  // Définition de l'icône selon la gamme
  const getIconConfig = (type) => {
    switch (type?.toLowerCase()) {
      case 'echo':
        return { name: 'leaf', color: THEME.COLORS.success };
      case 'vip':
        return { name: 'star', color: THEME.COLORS.champagneGold };
      case 'standard':
      default:
        return { name: 'car', color: THEME.COLORS.textSecondary };
    }
  };

  const iconConfig = getIconConfig(vehicle.type);

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <Pressable
        onPressIn={() => (scale.value = withSpring(0.95))}
        onPressOut={() => (scale.value = withSpring(1))}
        onPress={() => onPress(vehicle)}
        style={[
          styles.card,
          isSelected && styles.cardSelected
        ]}
      >
        {/* Badge VIP/Promo Optionnel */}
        {vehicle.type?.toLowerCase() === 'vip' && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PREMIUM</Text>
          </View>
        )}

        <View style={styles.iconContainer}>
          <Ionicons name={iconConfig.name} size={32} color={iconConfig.color} />
        </View>

        <View style={styles.detailsContainer}>
          <Text style={[styles.vehicleName, isSelected && styles.textGold]}>
            Yély {vehicle.name}
          </Text>
          
          <View style={styles.etaRow}>
             <Ionicons name="time-outline" size={12} color={THEME.COLORS.textTertiary} />
             <Text style={styles.etaText}>~{vehicle.duration} min</Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={[styles.priceText, isSelected && styles.textGold]}>
            {vehicle.estimatedPrice} F
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginRight: 12,
  },
  card: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: 120,
    height: 140,
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  cardSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)', // Légèrement teinté or
    borderColor: THEME.COLORS.champagneGold,
    borderWidth: 2,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: THEME.COLORS.champagneGold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderBottomLeftRadius: 8,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#121418',
  },
  iconContainer: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  vehicleName: {
    color: THEME.COLORS.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaText: {
    color: THEME.COLORS.textTertiary,
    fontSize: 11,
    marginLeft: 4,
  },
  priceContainer: {
    marginTop: 'auto',
  },
  priceText: {
    color: THEME.COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '900',
  },
  textGold: {
    color: THEME.COLORS.champagneGold,
  }
});

export default VehicleCard;