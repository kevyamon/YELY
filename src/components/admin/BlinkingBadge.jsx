// src/components/admin/BlinkingBadge.jsx
// COMPOSANT PARTAGE - Pastille de notification intelligente (Pulse 60FPS)
// CSCSM Level: Bank Grade

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import THEME from '../../theme/theme';

const BlinkingBadge = ({ count }) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.15, 
          duration: 600,
          useNativeDriver: true, 
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  if (count == null) return null;

  return (
    <Animated.View style={[styles.badge, { opacity }]}>
      <Text style={styles.badgeText}>{count}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: THEME.COLORS.danger,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: THEME.COLORS.background,
    zIndex: 10,
    shadowColor: THEME.COLORS.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  }
});

export default BlinkingBadge;