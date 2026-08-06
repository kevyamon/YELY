// src/components/ui/AppToast.jsx
// SYSTÈME TOAST CAPSULE VIP - Minimaliste, Immersif & Dynamic Island Level
// CSCSM Level: Masterpiece UI / Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import THEME from '../../theme/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 50;

const TOAST_CONFIG = {
  success: {
    icon: 'checkmark-circle-sharp',
    color: '#2ECC71',
    badgeBg: 'rgba(46, 204, 113, 0.14)',
  },
  error: {
    icon: 'close-circle-sharp',
    color: '#E74C3C',
    badgeBg: 'rgba(231, 76, 60, 0.14)',
  },
  warning: {
    icon: 'alert-circle-sharp',
    color: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.14)',
  },
  info: {
    icon: 'information-circle-sharp',
    color: THEME.COLORS.primary || '#D4AF37',
    badgeBg: 'rgba(212, 175, 55, 0.15)',
  },
};

const AppToast = ({
  visible,
  type = 'info',
  title,
  message,
  duration = 3200,
  onHide,
}) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const translateY = useRef(new Animated.Value(-120)).current;
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

  const onHideRef = useRef(onHide);
  useEffect(() => {
    onHideRef.current = onHide;
  }, [onHide]);

  const closeToast = useCallback(() => {
    clearTimer();
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished && onHideRef.current) {
        onHideRef.current();
      }
    });
  }, [translateY, opacity, clearTimer]);

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
        return Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4;
      },
      onPanResponderGrant: () => {
        clearTimer();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: translateX, dy: translateY }],
        { useNativeDriver: false } 
      ),
      onPanResponderRelease: (_, gestureState) => {
        // Swipe Haut ou Côtés pour fermer
        if (gestureState.dy < -20 || Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
          closeToast();
        } else {
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              tension: 130,
              friction: 12,
              useNativeDriver: true,
            }),
            Animated.spring(translateY, {
              toValue: 0,
              tension: 130,
              friction: 12,
              useNativeDriver: true,
            }),
          ]).start();
          startHideTimer();
        }
      },
    })
  ).current;

  const lastContentRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      lastContentRef.current = null;
      return;
    }

    const currentContent = `${title}-${message}`;
    if (lastContentRef.current === currentContent) return;

    lastContentRef.current = currentContent;
    
    clearTimer();
    translateX.setValue(0);
    translateY.setValue(-120);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 130,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      startHideTimer();
    });

    return () => clearTimer();
  }, [visible, title, message, startHideTimer, clearTimer, opacity, translateX, translateY]);

  if (!visible) return null;

  // Style capsule dynamique selon le thème
  const containerBg = isDarkMode ? 'rgba(18, 20, 24, 0.94)' : 'rgba(255, 255, 255, 0.96)';
  const containerBorder = isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(18, 20, 24, 0.08)';
  const titleColor = isDarkMode ? '#FFFFFF' : '#121418';
  const msgColor = isDarkMode ? 'rgba(255, 255, 255, 0.70)' : 'rgba(18, 20, 24, 0.65)';

  return (
    <View style={styles.topLayer} pointerEvents="box-none">
      <Animated.View
        {...panResponder.panHandlers}
        pointerEvents="auto" 
        style={[
          styles.capsule,
          {
            top: Math.max(insets.top + 8, 16),
            backgroundColor: containerBg,
            borderColor: containerBorder,
            opacity,
            transform: [
              { translateY },
              { translateX }
            ],
          },
        ]}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={closeToast} style={styles.innerRow}>
          <View style={[styles.iconBadge, { backgroundColor: config.badgeBg }]}>
            <Ionicons name={config.icon} size={18} color={config.color} />
          </View>
          
          <View style={styles.textContainer}>
            {title ? (
              <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
                {title}
              </Text>
            ) : null}
            {message ? (
              <Text style={[styles.message, { color: msgColor }]} numberOfLines={2}>
                {message}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={closeToast} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={14} color={msgColor} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  topLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999999,
    elevation: 999999,
    alignItems: 'center',
  },
  capsule: {
    position: 'absolute',
    width: '90%',
    maxWidth: 380,
    borderRadius: 26,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 12,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  message: {
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 15,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
    opacity: 0.6,
  }
});

export default AppToast;