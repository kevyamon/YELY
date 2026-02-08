// src/components/ui/GoldButton.jsx
// Bouton principal avec effet premium

import { Ionicons } from '@expo/vector-icons'; // Import nécessaire pour les icônes en string
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import {
    ANIMATIONS,
    BORDERS,
    COLORS,
    DIMENSIONS,
    FONTS,
    SHADOWS,
    SPACING
} from '../../theme/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const GoldButton = ({
  title,
  onPress,
  variant = 'primary', // 'primary', 'secondary', 'danger', 'ghost'
  size = 'normal',      // 'small', 'normal', 'large'
  loading = false,
  disabled = false,
  icon = null,          // Peut être un string (ex: "car") ou un composant JSX
  fullWidth = true,
  style,
  textStyle,
  pulsating = false,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, ANIMATIONS.spring.snappy);
    opacity.value = withTiming(0.9, { duration: ANIMATIONS.duration.fast });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, ANIMATIONS.spring.bouncy);
    opacity.value = withTiming(1, { duration: ANIMATIONS.duration.fast });
  };

  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondary;
      case 'danger':
        return styles.danger;
      case 'ghost':
        return styles.ghost;
      default:
        return styles.primary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'danger':
        return styles.dangerText;
      case 'ghost':
        return styles.ghostText;
      default:
        return styles.primaryText;
    }
  };

  const getHeight = () => {
    switch (size) {
      case 'small': return DIMENSIONS.button.heightSmall;
      case 'large': return DIMENSIONS.button.heightLarge;
      default: return DIMENSIONS.button.height;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return FONTS.sizes.bodySmall;
      case 'large': return FONTS.sizes.h4;
      default: return FONTS.sizes.body;
    }
  };

  // Détermine la couleur de l'icône selon le variant
  const getIconColor = () => {
    if (variant === 'primary') return COLORS.deepAsphalt;
    if (variant === 'ghost') return COLORS.champagneGold;
    return COLORS.moonlightWhite;
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        animatedStyle,
        styles.base,
        getButtonStyle(),
        {
          height: getHeight(),
          width: fullWidth ? '100%' : 'auto',
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? COLORS.deepAsphalt : COLORS.moonlightWhite}
          size="small"
        />
      ) : (
        <View style={styles.contentRow}>
          {/* ✅ GESTION CORRECTE DE L'ICÔNE */}
          {icon && (
            <View style={styles.iconWrapper}>
              {typeof icon === 'string' ? (
                <Ionicons 
                  name={icon} 
                  size={size === 'large' ? 24 : 20} 
                  color={getIconColor()} 
                />
              ) : (
                icon
              )}
            </View>
          )}
          
          <Text
            style={[
              getTextStyle(),
              { fontSize: getFontSize() },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BORDERS.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: COLORS.champagneGold,
    ...SHADOWS.gold,
  },
  primaryText: {
    color: COLORS.deepAsphalt,
    fontWeight: FONTS.weights.bold,
    letterSpacing: 0.5,
  },
  secondary: {
    backgroundColor: COLORS.transparent,
    borderWidth: BORDERS.width.normal,
    borderColor: COLORS.moonlightWhite,
  },
  secondaryText: {
    color: COLORS.moonlightWhite,
    fontWeight: FONTS.weights.semiBold,
  },
  danger: {
    backgroundColor: COLORS.danger,
  },
  dangerText: {
    color: COLORS.moonlightWhite,
    fontWeight: FONTS.weights.bold,
  },
  ghost: {
    backgroundColor: COLORS.transparent,
  },
  ghostText: {
    color: COLORS.champagneGold,
    fontWeight: FONTS.weights.semiBold,
  },
  disabled: {
    opacity: 0.45,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GoldButton;