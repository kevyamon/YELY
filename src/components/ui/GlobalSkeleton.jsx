// src/components/ui/GlobalSkeleton.jsx
// SKELETON ADAPTATIF ET MODULAIRE - Moteur Shimmer Natif 60FPS
// CSCSM Level: Bank Grade

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import THEME from '../../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GlobalSkeleton = ({ visible, fullScreen = true, children, style }) => {
  const translateX = useRef(new Animated.Value(-SCREEN_WIDTH)).current;

  useEffect(() => {
    if (visible) {
      const shimmerAnim = Animated.loop(
        Animated.timing(translateX, {
          toValue: SCREEN_WIDTH,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      shimmerAnim.start();
      return () => shimmerAnim.stop();
    } else {
      translateX.setValue(-SCREEN_WIDTH);
    }
  }, [visible, translateX]);

  if (!visible) return null;

  const shimmerOverlay = (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        { transform: [{ translateX }] },
        { zIndex: 10 }
      ]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0)',
          'rgba(255, 255, 255, 0.03)',
          'rgba(255, 255, 255, 0.15)',
          'rgba(255, 255, 255, 0.03)',
          'rgba(255, 255, 255, 0)'
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFillObject}
      />
    </Animated.View>
  );

  if (children) {
    return (
      <View style={[styles.container, fullScreen && styles.overlay, style]}>
        {children}
        {shimmerOverlay}
      </View>
    );
  }

  return (
    <View style={[styles.container, fullScreen ? styles.overlay : styles.inlineContainer, style]}>
      <View style={styles.defaultLoaderBlock}>
        {shimmerOverlay}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.COLORS.background,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  defaultLoaderBlock: {
    width: '80%',
    height: 120,
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: THEME.BORDERS.radius.xl,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    overflow: 'hidden',
    position: 'relative',
  }
});

export default GlobalSkeleton;