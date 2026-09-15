// src/components/ui/SplashOrbitalLoader.jsx
// LOADER ORBITAL & ONDULATION EN CORDE (4 POINTS NOIRS)
// Standard: Industriel / Bank Grade (< 325 lignes, Zero-Lag, 60-120 FPS Reanimated)

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

// Parametres cinematiques
const TOTAL_CYCLE_MS = 11200; // 5000ms rotation + 600ms morph + 5000ms vague + 600ms morph
const ROTATION_MS = 5000;
const MORPH_IN_END_MS = 5600;
const WAVE_END_MS = 10600;

const RADIUS = 46;
const SPACING = 30;
const WAVE_AMPLITUDE = 16;
const WAVE_PERIOD_MS = 800;
const PHASE_OFFSET = 0.85;

/**
 * Calcul pur sur le UI thread des coordonnees de chaque point selon le temps de cycle.
 */
const computeDotTransform = (index, progress) => {
  'worklet';
  const t = progress * TOTAL_CYCLE_MS;
  const baseAngleOffset = index * (Math.PI / 2); // Repartition orthogonale a 90 degres
  const lineX = (index - 1.5) * SPACING;
  const circX0 = RADIUS * Math.cos(baseAngleOffset);
  const circY0 = RADIUS * Math.sin(baseAngleOffset);

  // Phase 1 : 5 rotations completes en cercle (10*PI radians)
  if (t <= ROTATION_MS) {
    const currentAngle = (t / ROTATION_MS) * (10 * Math.PI) + baseAngleOffset;
    return {
      x: RADIUS * Math.cos(currentAngle),
      y: RADIUS * Math.sin(currentAngle),
      scale: 1,
    };
  }

  // Phase 2 : Morphing fluide du cercle vers la ligne horizontale
  if (t <= MORPH_IN_END_MS) {
    const k = (t - ROTATION_MS) / (MORPH_IN_END_MS - ROTATION_MS);
    const easeK = k * k * (3 - 2 * k); // Smoothstep
    return {
      x: circX0 + (lineX - circX0) * easeK,
      y: circY0 + (0 - circY0) * easeK,
      scale: 1,
    };
  }

  // Phase 3 : Ondulation en corde scintillante (onde progressive de gauche a droite) pendant 5s
  if (t <= WAVE_END_MS) {
    const tWave = t - MORPH_IN_END_MS;
    const waveDuration = WAVE_END_MS - MORPH_IN_END_MS;
    const envelope = Math.sin((Math.PI * tWave) / waveDuration);
    const waveY =
      WAVE_AMPLITUDE *
      envelope *
      Math.sin((2 * Math.PI * tWave) / WAVE_PERIOD_MS - index * PHASE_OFFSET);

    return {
      x: lineX,
      y: waveY,
      scale: 1 + 0.12 * envelope * Math.sin((2 * Math.PI * tWave) / WAVE_PERIOD_MS - index * PHASE_OFFSET),
    };
  }

  // Phase 4 : Morphing fluide de la ligne vers l'orbite circulaire de depart
  const k = (t - WAVE_END_MS) / (TOTAL_CYCLE_MS - WAVE_END_MS);
  const easeK = k * k * (3 - 2 * k); // Smoothstep
  return {
    x: lineX + (circX0 - lineX) * easeK,
    y: 0 + (circY0 - 0) * easeK,
    scale: 1,
  };
};

/**
 * Sous-composant pour un point individuel
 */
const AnimatedDot = ({ index, progress }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const { x, y, scale } = computeDotTransform(index, progress.value);
    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale },
      ],
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

const SplashOrbitalLoader = () => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: TOTAL_CYCLE_MS,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [progress]);

  return (
    <View style={styles.container}>
      <AnimatedDot index={0} progress={progress} />
      <AnimatedDot index={1} progress={progress} />
      <AnimatedDot index={2} progress={progress} />
      <AnimatedDot index={3} progress={progress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#121418',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default React.memo(SplashOrbitalLoader);
