// src/components/ride/VehicleCard.jsx
// CARTE VÉHICULE - GLOW UP UI (Réparé : dimensions strictes conservées)

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

        {/* Conteneur d'icône avec le nouveau style */}
        <View style={[styles.iconWrapper, isSelected && styles.iconWrapperSelected]}>
          <Ionicons name={iconConfig.name} size={26} color={iconConfig.color} />
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

        {/* Pied de carte "Prix libre" structuré mais ajusté pour rentrer */}
        <View style={[styles.priceFooter, isSelected && styles.priceFooterSelected]}>
          <Text style={[styles.priceText, isSelected && styles.textGold]}>
            Prix libre
          </Text>
          <Text style={[styles.subPriceText, isSelected && styles.textGold]}>
            Proposé par le chauffeur
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginRight: 12, // RETOUR À L'ORIGINAL : vital pour le snapToInterval=132 du parent
  },
  card: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: 120, // RETOUR À L'ORIGINAL
    height: 140, // RETOUR À L'ORIGINAL : vital pour rentrer dans les 150px du parent
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: 16, // Maintenu à 16 pour éviter les bugs de bordures
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    paddingTop: 8, // Ajustement interne
    position: 'relative',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)', 
    borderColor: THEME.COLORS.champagneGold,
    borderWidth: 2,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, 
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
    zIndex: 10,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#121418',
    letterSpacing: 0.5,
  },
  iconWrapper: {
    marginLeft: 8,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.COLORS.glassLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapperSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginTop: 2,
  },
  vehicleName: {
    color: THEME.COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
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
    fontWeight: '500',
  },
  priceFooter: {
    marginTop: 'auto',
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  priceFooterSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  priceText: {
    color: THEME.COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subPriceText: {
    color: THEME.COLORS.textTertiary,
    fontSize: 8,
    marginTop: 2,
    fontWeight: '500',
  },
  textGold: {
    color: THEME.COLORS.champagneGold,
  }
});

export default VehicleCard;