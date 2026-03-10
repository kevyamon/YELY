// src/screens/SplashScreen.jsx
// SPLASH SCREEN - LUXURY REVEAL (TRUE DIAGONAL WIPE)
// STANDARD: Counter-Translation Masking / High-End UI

import * as NativeSplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SplashScreen = ({ isServerReady, onFinish }) => {
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const progress = useSharedValue(0); 

  // Valeur unique pour synchroniser la translation du conteneur et la contre-translation du contenu
  const wipeProgress = useSharedValue(0);
  const [progressText, setProgressText] = useState(0);

  useAnimatedReaction(
    () => progress.value,
    (currentValue) => {
      runOnJS(setProgressText)(Math.round(currentValue));
    }
  );

  useEffect(() => {
    // Relais immediat avec le splash natif pour eviter le saut visuel
    NativeSplashScreen.hideAsync().catch(() => {});

    // Animation d'entree standard
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withSequence(
      withSpring(1.1, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 15, stiffness: 150 })
    );
    textOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));

    progress.value = withTiming(85, { 
      duration: 1800, 
      easing: Easing.out(Easing.cubic) 
    });
  }, []);

  useEffect(() => {
    if (isServerReady) {
      // La jauge file a 100%
      progress.value = withTiming(100, { 
        duration: 400, 
        easing: Easing.inOut(Easing.ease) 
      }, (finished) => {
        if (finished) {
          // Lancement du VRAI balayage diagonal (Wipe)
          // On va jusqu'a 1.5 pour s'assurer que la diagonale sort completement de l'ecran
          wipeProgress.value = withTiming(1.5, {
            duration: 1100, // Une duree legerement plus longue pour apprecier la fluidite
            easing: Easing.bezier(0.45, 0, 0.15, 1) // Courbe d'acceleration premium (lent-rapide-lent)
          }, (done) => {
            if (done && onFinish) {
              runOnJS(onFinish)();
            }
          });
        }
      });
    }
  }, [isServerReady]);

  // LE CONTENEUR : Glisse vers le haut a gauche. Il agit comme notre "masque".
  // On arrondit son coin inferieur droit progressivement pour creer la courbe de balayage.
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -wipeProgress.value * SCREEN_WIDTH },
      { translateY: -wipeProgress.value * SCREEN_HEIGHT }
    ],
    borderBottomRightRadius: wipeProgress.value * (SCREEN_WIDTH * 1.2),
  }));

  // LE CONTENU INTERNE : Glisse vers le bas a droite EXACTEMENT a la meme vitesse.
  // L'illusion d'optique est parfaite : les elements restent figes a l'ecran pendant que le masque les efface.
  const innerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: wipeProgress.value * SCREEN_WIDTH },
      { translateY: wipeProgress.value * SCREEN_HEIGHT }
    ],
  }));

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
    <Animated.View style={[styles.absoluteContainer, containerStyle]}>
      {/* C'est ce contenu interne qui subit la contre-translation */}
      <Animated.View style={[styles.innerContent, innerStyle]}>
        
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </Animated.View>

        <Animated.View style={[styles.textContainer, textStyle]}>
          <Text style={styles.appName}>YELY</Text>
          <Text style={styles.tagline}>Votre course, votre confort</Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(300)} style={styles.loaderWrapper}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressBarStyle]} />
          </View>
          <Text style={styles.progressText}>
            {progressText === 100 
              ? "Systeme operationnel" 
              : `Connexion securisee... ${progressText}%`}
          </Text>
        </Animated.View>

      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  absoluteContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 9999,
    backgroundColor: COLORS.background, // Correction : Adaptation automatique au mode sombre/clair
    overflow: 'hidden',
    // L'ombre suit la bordure de balayage, donnant un effet de page qui se retire
    shadowColor: COLORS.pureBlack,
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  innerContent: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
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
  logoImage: { width: '100%', height: '100%' },
  textContainer: { alignItems: 'center' },
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