// src/screens/SplashScreen.jsx
// SPLASH SCREEN - FOND JAUNE OFFICIEL & VISUEL CENTRÉ (Alignement 100% Natif & PWA)
// STANDARD: Industriel / Bank Grade (Modularisé < 325 lignes, Sans Emojis)

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
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { FONTS } from '../theme/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const splashCenterImg = require('../../assets/images/splash-center.png');

const SplashScreen = ({ isServerReady, onFinish }) => {
  const imageScale = useSharedValue(0.85);
  const imageOpacity = useSharedValue(0);
  
  const snakeAnim = useSharedValue(-100);
  const isFinishing = useSharedValue(false);

  const wipeProgress = useSharedValue(0);
  const [loadingText, setLoadingText] = useState("Démarrage de Yély...");

  useEffect(() => {
    NativeSplashScreen.hideAsync().catch(() => {});

    imageOpacity.value = withTiming(1, { duration: 500 });
    imageScale.value = withSequence(
      withSpring(1.04, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 15, stiffness: 150 })
    );

    snakeAnim.value = withRepeat(
      withTiming(100, { 
        duration: 1400, 
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
        duration: 300, 
        easing: Easing.inOut(Easing.ease) 
      }, (finished) => {
        if (finished) {
          wipeProgress.value = withTiming(1.5, {
            duration: 900,
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
    transform: [{ scale: imageScale.value }],
    opacity: imageOpacity.value,
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
        
        <Animated.View style={[styles.imageContainer, logoStyle]}>
          <Image
            source={splashCenterImg}
            style={styles.splashImage}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View entering={FadeIn.delay(250)} style={styles.loaderWrapper}>
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
    backgroundColor: '#D4AF37',
    overflow: 'hidden',
  },
  innerContent: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: { 
    alignItems: 'center',
    justifyContent: 'center',
    width: 260,
    height: 260,
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
  loaderWrapper: {
    position: 'absolute',
    bottom: 70,
    width: '55%',
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(18, 20, 24, 0.15)',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#121418',
    borderRadius: 10,
    position: 'absolute',
  },
  progressText: {
    color: '#121418',
    fontSize: FONTS.sizes.bodySmall || 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  }
});

export default SplashScreen;