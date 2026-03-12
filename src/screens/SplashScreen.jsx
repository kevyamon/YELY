// src/screens/SplashScreen.jsx
// SPLASH SCREEN - LUXURY REVEAL (TRUE DIAGONAL WIPE) & SNAKE LOADER
// STANDARD: Counter-Translation Masking / High-End UI

import * as NativeSplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
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
  
  const snakeAnim = useSharedValue(-100);
  const isFinishing = useSharedValue(false);

  const wipeProgress = useSharedValue(0);
  const [loadingText, setLoadingText] = useState("Réveil du serveur en cours...");

  useEffect(() => {
    NativeSplashScreen.hideAsync().catch(() => {});

    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withSequence(
      withSpring(1.1, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 15, stiffness: 150 })
    );
    textOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));

    // Animation du serpent infinie (ne s'arrête jamais)
    snakeAnim.value = withRepeat(
      withTiming(100, { 
        duration: 1500, 
        easing: Easing.inOut(Easing.ease) 
      }),
      -1,
      false
    );
  }, []);

  useEffect(() => {
    if (isServerReady) {
      isFinishing.value = true;
      setLoadingText("Système opérationnel");
      
      cancelAnimation(snakeAnim);
      
      snakeAnim.value = withTiming(0, { 
        duration: 400, 
        easing: Easing.inOut(Easing.ease) 
      }, (finished) => {
        if (finished) {
          wipeProgress.value = withTiming(1.5, {
            duration: 1100,
            easing: Easing.bezier(0.45, 0, 0.15, 1)
          }, (done) => {
            if (done && onFinish) {
              runOnJS(onFinish)();
            }
          });
        }
      });
    }
  }, [isServerReady]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -wipeProgress.value * SCREEN_WIDTH },
      { translateY: -wipeProgress.value * SCREEN_HEIGHT }
    ],
    borderBottomRightRadius: wipeProgress.value * (SCREEN_WIDTH * 1.2),
  }));

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

  const snakeStyle = useAnimatedStyle(() => {
    if (isFinishing.value) {
      return { left: '0%', width: '100%' };
    }
    return {
      left: `${snakeAnim.value}%`,
      width: '40%',
    };
  });

  return (
    <Animated.View style={[styles.absoluteContainer, containerStyle]}>
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
            <Animated.View style={[styles.progressFill, snakeStyle]} />
          </View>
          <Text style={styles.progressText}>{loadingText}</Text>
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
    backgroundColor: COLORS.background,
    overflow: 'hidden',
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
    position: 'absolute',
  },
  progressText: {
    color: COLORS.champagneGold,
    fontSize: FONTS.sizes.bodySmall,
    fontWeight: '600',
    letterSpacing: 0.5,
  }
});

export default SplashScreen;