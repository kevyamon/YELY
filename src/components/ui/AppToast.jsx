// src/components/ui/AppToast.jsx
// Système de notifications Toast — Compatible Web + Mobile

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BORDERS, COLORS, FONTS, SPACING } from '../../theme/theme';

const TOAST_CONFIG = {
  success: {
    icon: 'checkmark-circle',
    color: COLORS.success,
    bgColor: '#1A1A2E',
    borderColor: 'rgba(3, 1, 14, 0.3)',
  },
  error: {
    icon: 'close-circle',
    color: COLORS.danger,
    bgColor: '#1A1A2E',
    borderColor: 'rgba(3, 1, 14, 0.3)',
  },
  warning: {
    icon: 'warning',
    color: COLORS.warning,
    bgColor: '#1A1A2E',
    borderColor: 'rgba(3, 1, 14, 0.3)',
  },
  info: {
    icon: 'information-circle',
    color: COLORS.info,
    bgColor: '#1A1A2E',
    borderColor: 'rgba(3, 1, 14, 0.3)',
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
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef(null);
  const config = TOAST_CONFIG[type] || TOAST_CONFIG.info;

  useEffect(() => {
    if (visible) {
      // Nettoyer tout timer précédent
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      // Reset à la position initiale
      translateY.setValue(-100);
      opacity.setValue(0);

      // Animation d'entrée : slide down + fade in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Programmer la disparition automatique
      hideTimerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          if (finished && onHide) {
            onHide();
          }
        });
      }, duration);
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          top: insets.top + SPACING.sm,
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          transform: [{ translateY }],
          opacity,
        },
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
    zIndex: 99999,
    elevation: 99999,
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