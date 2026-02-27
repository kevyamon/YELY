// src/components/ui/SessionRefreshSkeleton.jsx
// Jauge de rafraichissement de session - Remplacement dynamique du texte

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import THEME from '../../theme/theme';

const SessionRefreshSkeleton = ({ isRefreshing, fallbackText, textStyle }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isRefreshing) {
      progress.value = 0;
      progress.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1, // Boucle infinie pendant le chargement
        false
      );
    } else {
      progress.value = 0;
    }
  }, [isRefreshing, progress]);

  const animatedFillStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  if (!isRefreshing) {
    return <Text style={textStyle}>{fallbackText}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={[textStyle, styles.loadingText]}>Mise à jour session...</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, animatedFillStyle]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    minHeight: 40,
    paddingVertical: 4,
  },
  loadingText: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 6,
  },
  track: {
    height: 4,
    width: 120,
    backgroundColor: THEME.COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: THEME.COLORS.champagneGold,
    borderRadius: 2,
  },
});

export default SessionRefreshSkeleton;