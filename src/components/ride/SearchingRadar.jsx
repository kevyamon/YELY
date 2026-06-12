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
  withTiming,
  withDelay,
  Easing
} from 'react-native-reanimated';

import THEME from '../../theme/theme';

const SearchingRadar = () => {
  // 3 ondes distinctes pour simuler la propagation fluide de l'onde
  const scale1 = useSharedValue(1);
  const opacity1 = useSharedValue(0.6);

  const scale2 = useSharedValue(1);
  const opacity2 = useSharedValue(0.6);

  const scale3 = useSharedValue(1);
  const opacity3 = useSharedValue(0.6);

  useEffect(() => {
    const animationConfig = {
      duration: 2200,
      easing: Easing.out(Easing.quad),
    };

    // Onde 1 : démarrage immédiat
    scale1.value = withRepeat(withTiming(3, animationConfig), -1, false);
    opacity1.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 0 }),
        withTiming(0, animationConfig)
      ),
      -1,
      false
    );

    // Onde 2 : décalage de 700ms
    scale2.value = withDelay(
      700,
      withRepeat(withTiming(3, animationConfig), -1, false)
    );
    opacity2.value = withDelay(
      700,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 0 }),
          withTiming(0, animationConfig)
        ),
        -1,
        false
      )
    );

    // Onde 3 : décalage de 1400ms
    scale3.value = withDelay(
      1400,
      withRepeat(withTiming(3, animationConfig), -1, false)
    );
    opacity3.value = withDelay(
      1400,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 0 }),
          withTiming(0, animationConfig)
        ),
        -1,
        false
      )
    );
  }, []);

  const pulseStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: opacity1.value,
  }));

  const pulseStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: opacity2.value,
  }));

  const pulseStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }],
    opacity: opacity3.value,
  }));

  return (
    <View style={styles.radarContainer}>
      <Animated.View style={[styles.pulseCircle, pulseStyle1]} />
      <Animated.View style={[styles.pulseCircle, pulseStyle2]} />
      <Animated.View style={[styles.pulseCircle, pulseStyle3]} />
      <View style={styles.centerIcon}>
        <Ionicons name="car" size={32} color={THEME.COLORS.background} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  radarContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: THEME.SPACING.xl,
  },
  pulseCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.COLORS.champagneGold,
  },
  centerIcon: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: THEME.COLORS.champagneGold,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
});

export default SearchingRadar;