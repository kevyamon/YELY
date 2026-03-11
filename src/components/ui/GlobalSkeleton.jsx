// src/components/ui/GlobalSkeleton.jsx
// SKELETON ADAPTATIF ET MODULAIRE
// CSCSM Level: Bank Grade

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import THEME from '../../theme/theme';

const GlobalSkeleton = ({ visible, fullScreen = true, children }) => {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.8,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0.4);
    }
  }, [visible, pulseAnim]);

  if (!visible) return null;

  // Si le developpeur a fourni ses propres formes a faire clignoter
  if (children) {
    return (
      <Animated.View style={[{ opacity: pulseAnim }, fullScreen && styles.overlay]}>
        {children}
      </Animated.View>
    );
  }

  // Comportement par defaut si aucun composant enfant n'est fourni
  return (
    <View style={fullScreen ? styles.overlay : styles.inlineContainer}>
      <Animated.View style={[styles.defaultLoaderBlock, { opacity: pulseAnim }]} />
    </View>
  );
};

const styles = StyleSheet.create({
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
  }
});

export default GlobalSkeleton;