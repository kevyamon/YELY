// src/components/ui/AppToast.jsx
// Systeme de notifications Toast - Absolute Top Layer (Modal Wrapper)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BORDERS, COLORS, FONTS, SPACING } from '../../theme/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

const TOAST_CONFIG = {
  success: {
    icon: 'checkmark-circle',
    color: COLORS.success,
    bgColor: COLORS.glassSurface,
    borderColor: COLORS.border,
  },
  error: {
    icon: 'close-circle',
    color: COLORS.danger,
    bgColor: COLORS.glassSurface,
    borderColor: COLORS.border,
  },
  warning: {
    icon: 'warning',
    color: COLORS.warning,
    bgColor: COLORS.glassSurface,
    borderColor: COLORS.border,
  },
  info: {
    icon: 'information-circle',
    color: COLORS.info,
    bgColor: COLORS.glassSurface,
    borderColor: COLORS.border,
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
  
  const translateY = useRef(new Animated.Value(-150)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  const hideTimerRef = useRef(null);
  const config = TOAST_CONFIG[type] || TOAST_CONFIG.info;

  const clearTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const closeToast = useCallback(() => {
    clearTimer();
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
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
  }, [translateY, opacity, onHide, clearTimer]);

  const startHideTimer = useCallback(() => {
    clearTimer();
    hideTimerRef.current = setTimeout(() => {
      closeToast();
    }, duration);
  }, [clearTimer, closeToast, duration]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderGrant: () => {
        clearTimer();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: translateX }],
        { useNativeDriver: false } 
      ),
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
          const direction = gestureState.dx > 0 ? 1 : -1;
          Animated.timing(translateX, {
            toValue: direction * SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            if (onHide) onHide();
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }).start();
          startHideTimer();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      clearTimer();
      translateX.setValue(0);
      translateY.setValue(-150);
      opacity.setValue(0);

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
      ]).start(() => {
        startHideTimer();
      });
    }

    return () => clearTimer();
  }, [visible, startHideTimer, clearTimer, opacity, translateX, translateY]);

  if (!visible) return null;

  // MODIFICATION SENIOR: Remplacement de <Modal> par une View absolue avec pointerEvents="box-none"
  // Cela permet de cliquer à travers l'écran transparent !
  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 99999, elevation: 99999 }]} pointerEvents="box-none">
      <Animated.View
        {...panResponder.panHandlers}
        // pointerEvents="auto" permet d'interagir avec le toast lui-même (swipe)
        pointerEvents="auto" 
        style={[
          styles.container,
          {
            top: insets.top + SPACING.sm,
            backgroundColor: config.bgColor,
            borderColor: config.borderColor,
            opacity,
            transform: [
              { translateY },
              { translateX }
            ],
          },
        ]}
      >
        <Ionicons name={config.icon} size={24} color={config.color} />
        <View style={styles.textContainer}>
          {title && <Text style={[styles.title, { color: config.color }]}>{title}</Text>}
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </Animated.View>
    </View>
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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