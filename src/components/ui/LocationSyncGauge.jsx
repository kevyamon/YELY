// src/components/ui/LocationSyncGauge.jsx
// COMPOSANT REUTILISABLE - Jauge de synchronisation GPS

import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import THEME from '../../theme/theme';

const LocationSyncGauge = ({ isFetching, variant = 'rider' }) => {
  const progressWidth = useSharedValue(0);
  const progressOpacity = useSharedValue(0);

  useEffect(() => {
    if (isFetching) {
      progressOpacity.value = 1;
      progressWidth.value = 0;
      progressWidth.value = withRepeat(
        withTiming(80, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      progressWidth.value = withTiming(100, { duration: 300, easing: Easing.out(Easing.ease) }, () => {
        progressOpacity.value = withTiming(0, { duration: 300 }, () => {
          progressWidth.value = 0;
        });
      });
    }
  }, [isFetching, progressWidth, progressOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
    opacity: variant === 'driver' ? progressOpacity.value * 0.15 : progressOpacity.value,
  }));

  return (
    <Animated.View 
      style={[
        variant === 'rider' ? styles.riderGauge : styles.driverGauge, 
        animatedStyle
      ]} 
    />
  );
};

const styles = StyleSheet.create({
  riderGauge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 4,
    backgroundColor: THEME.COLORS.champagneGold,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  driverGauge: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: THEME.COLORS.champagneGold,
  }
});

export default LocationSyncGauge;