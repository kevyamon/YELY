// src/screens/SplashScreen.jsx

import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, FONTS, SHADOWS, SPACING } from '../theme/theme';

// ATTENTION : Le composant reçoit maintenant 'isServerReady' en prop !
const SplashScreen = ({ isServerReady }) => {
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const progress = useSharedValue(0); // Valeur de la jauge (0 à 100)

  const [progressText, setProgressText] = useState(0);

  // Met à jour le texte du pourcentage pendant que l'animation tourne
  useAnimatedReaction(
    () => progress.value,
    (currentValue) => {
      runOnJS(setProgressText)(Math.round(currentValue));
    }
  );

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withSequence(
      withSpring(1.1, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 15, stiffness: 150 })
    );
    textOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));

    // Lancement de la jauge : Monte de 0 à 85% en 1.8 secondes (simulation fluide)
    progress.value = withTiming(85, { 
      duration: 1800, 
      easing: Easing.out(Easing.cubic) 
    });
  }, []);

  useEffect(() => {
    // Quand le serveur répond OK, on pousse la jauge à 100% instantanément
    if (isServerReady) {
      progress.value = withTiming(100, { 
        duration: 400, 
        easing: Easing.inOut(Easing.ease) 
      });
    }
  }, [isServerReady]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logoImage}
          resizeMode="cover"
        />
      </Animated.View>

      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={styles.appName}>YÉLY</Text>
        <Text style={styles.tagline}>Votre course, votre confort</Text>
      </Animated.View>

      {/* Jauge de connexion affichée en permanence */}
      <Animated.View entering={FadeIn.delay(300)} style={styles.loaderWrapper}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressBarStyle]} />
        </View>
        <Text style={styles.progressText}>
          {progressText === 100 
            ? "Système opérationnel" 
            : `Connexion sécurisée... ${progressText}%`}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepAsphalt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: COLORS.champagneGold,
    marginBottom: SPACING.xxl,
    ...SHADOWS.gold,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.champagneGold,
    letterSpacing: 8,
  },
  tagline: {
    fontSize: FONTS.sizes.bodySmall,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    letterSpacing: 1,
  },
  loaderWrapper: {
    position: 'absolute',
    bottom: 80,
    width: '65%',
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.glassSurface,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.champagneGold,
    borderRadius: 10,
  },
  progressText: {
    color: COLORS.champagneGold,
    fontSize: FONTS.sizes.bodySmall,
    fontWeight: '600',
    letterSpacing: 0.5,
  }
});

export default SplashScreen;