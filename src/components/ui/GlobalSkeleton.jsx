// src/components/ui/GlobalSkeleton.jsx

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING } from '../../theme/theme';

const GlobalSkeleton = ({ visible, message, fullScreen = true }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
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
      pulseAnim.setValue(0.3);
    }
  }, [visible, pulseAnim]);

  if (!visible) return null;

  return (
    <View style={fullScreen ? styles.skeletonOverlay : styles.inlineContainer}>
      <View style={styles.skeletonContainer}>
        <Animated.View style={[styles.skeletonLine, { opacity: pulseAnim, width: '80%', height: 24, marginBottom: SPACING.lg }]} />
        <Animated.View style={[styles.skeletonLine, { opacity: pulseAnim, width: '100%' }]} />
        <Animated.View style={[styles.skeletonLine, { opacity: pulseAnim, width: '90%' }]} />
        <Animated.View style={[styles.skeletonLine, { opacity: pulseAnim, width: '60%' }]} />
        
        {message ? (
          <Text style={styles.skeletonText}>{message}</Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.glassModal,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  inlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  skeletonContainer: {
    width: '80%',
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'flex-start',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: COLORS.champagneGold,
    borderRadius: 6,
    marginBottom: SPACING.md,
  },
  skeletonText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    alignSelf: 'center',
  }
});

export default GlobalSkeleton;