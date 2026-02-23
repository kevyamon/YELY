// src/components/ride/SearchingRadar.jsx
// COMPOSANT UI - Animation Radar Pure (Responsabilité Unique)
// CSCSM Level: UI Polish

import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';

import THEME from '../../theme/theme';

const SearchingRadar = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 1500 }),
        withTiming(1, { duration: 0 }) 
      ),
      -1, 
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1500 }),
        withTiming(0.5, { duration: 0 })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.radarContainer}>
      <Animated.View style={[styles.pulseCircle, pulseStyle]} />
      <View style={styles.centerIcon}>
        <Ionicons name="car" size={32} color={THEME.COLORS.background} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  radarContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: THEME.SPACING.lg, 
  },
  pulseCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: THEME.COLORS.champagneGold,
  },
  centerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.COLORS.champagneGold,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});

export default SearchingRadar;