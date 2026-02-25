// src/components/ui/SessionRefreshSkeleton.jsx
// COMPOSANT REUTILISABLE - Indicateur de renouvellement de session

import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import THEME from '../../theme/theme';

const SessionRefreshSkeleton = ({ isRefreshing, fallbackText, textStyle }) => {
  const skeletonOpacity = useSharedValue(0.15);
  
  useEffect(() => {
    if (isRefreshing) {
      skeletonOpacity.value = withRepeat(
        withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [isRefreshing, skeletonOpacity]);

  const skeletonStyle = useAnimatedStyle(() => ({
    opacity: skeletonOpacity.value,
  }));

  if (isRefreshing) {
    return <Animated.View style={[styles.skeleton, skeletonStyle]} />;
  }

  return <Text style={textStyle}>{fallbackText}</Text>;
};

const styles = StyleSheet.create({
  skeleton: {
    width: 140,
    height: 16,
    backgroundColor: THEME.COLORS.champagneGold,
    borderRadius: 8,
    marginBottom: 4,
    marginLeft: 4,
  }
});

export default SessionRefreshSkeleton;