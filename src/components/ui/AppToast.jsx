// src/components/ui/AppToast.jsx
// Système de notifications Toast

import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ANIMATIONS, BORDERS, COLORS, FONTS, SHADOWS, SPACING } from '../../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TOAST_CONFIG = {
  success: {
    icon: 'checkmark-circle',
    color: COLORS.success,
    bgColor: 'rgba(46, 204, 113, 0.15)',
    borderColor: 'rgba(46, 204, 113, 0.30)',
  },
  error: {
    icon: 'close-circle',
    color: COLORS.danger,
    bgColor: 'rgba(231, 76, 60, 0.15)',
    borderColor: 'rgba(231, 76, 60, 0.30)',
  },
  warning: {
    icon: 'warning',
    color: COLORS.warning,
    bgColor: 'rgba(243, 156, 18, 0.15)',
    borderColor: 'rgba(243, 156, 18, 0.30)',
  },
  info: {
    icon: 'information-circle',
    color: COLORS.info,
    bgColor: 'rgba(52, 152, 219, 0.15)',
    borderColor: 'rgba(52, 152, 219, 0.30)',
  },
};

const AppToast = ({
  visible,
  type = 'info',
  title,
  message,
  duration = 3000,
  onHide,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const config = TOAST_CONFIG[type] || TOAST_CONFIG.info;

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, ANIMATIONS.spring.bouncy);
      opacity.value = withTiming(1, { duration: ANIMATIONS.duration.fast });

      // Auto-hide
      translateY.value = withDelay(
        duration,
        withTiming(-100, { duration: ANIMATIONS.duration.normal }, (finished) => {
          if (finished && onHide) {
            runOnJS(onHide)();
          }
        })
      );
      opacity.value = withDelay(
        duration,
        withTiming(0, { duration: ANIMATIONS.duration.normal })
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + SPACING.sm,
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        },
        animatedStyle,
      ]}
    >
      <Ionicons name={config.icon} size={24} color={config.color} />
      <View style={styles.textContainer}>
        {title && <Text style={[styles.title, { color: config.color }]}>{title}</Text>}
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDERS.radius.lg,
    borderWidth: BORDERS.width.thin,
    zIndex: 9999,
    ...SHADOWS.medium,
  },
  textContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.bodySmall,
    fontWeight: FONTS.weights.bold,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.caption,
    marginTop: SPACING.xxs,
  },
});

export default AppToast;