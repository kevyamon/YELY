// src/screens/SplashScreen.native.jsx
// SPLASH SCREEN NATIF (Android & iOS) - Rendu Direct 100% Garanti & Centrage Parfait
// CSCSM Level: Bank Grade (Modularisé < 325 lignes, Sans Emojis, Zero-Fail)

import * as NativeSplashScreen from 'expo-splash-screen';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { FONTS } from '../theme/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const splashVideoSource = require('../../assets/videos/motion.mp4');

const SplashScreenNative = ({ isServerReady, onFinish }) => {
  const snakeAnim = useSharedValue(-100);
  const isFinishing = useSharedValue(false);
  const opacityAnim = useSharedValue(1);
  const [loadingText, setLoadingText] = useState('Démarrage de Yély...');

  const player = useVideoPlayer(splashVideoSource, (playerInstance) => {
    playerInstance.loop = true;
    playerInstance.muted = true;
    playerInstance.play();
  });

  useEffect(() => {
    // Relais immédiat pour cacher l'écran OS
    NativeSplashScreen.hideAsync().catch(() => {});

    // Animation continue du serpentin de chargement
    snakeAnim.value = withRepeat(
      withTiming(100, {
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false
    );
  }, [snakeAnim]);

  useEffect(() => {
    if (isServerReady) {
      isFinishing.value = true;
      setLoadingText('Système opérationnel');

      cancelAnimation(snakeAnim);

      snakeAnim.value = withTiming(
        0,
        { duration: 200, easing: Easing.inOut(Easing.ease) },
        (finished) => {
          if (finished) {
            opacityAnim.value = withTiming(
              0,
              { duration: 450, easing: Easing.out(Easing.ease) },
              (done) => {
                if (done && onFinish) {
                  runOnJS(onFinish)();
                }
              }
            );
          }
        }
      );
    }
  }, [isServerReady, onFinish, isFinishing, snakeAnim, opacityAnim]);

  const animatedScreenStyle = useAnimatedStyle(() => ({
    opacity: opacityAnim.value,
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
    <Animated.View style={[styles.rootContainer, animatedScreenStyle]}>
      {/* 1. Animation Vidéo Centrale : Rendu direct, sans cadre, centré */}
      <View style={styles.centerContainer}>
        <VideoView
          player={player}
          style={styles.videoPlayer}
          contentFit="contain"
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
      </View>

      {/* 2. Loader au bas de l'écran */}
      <Animated.View entering={FadeIn.delay(100)} style={styles.loaderWrapper}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, snakeStyle]} />
        </View>
        <Text style={styles.progressText}>{loadingText}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 99999,
    backgroundColor: '#D4AF37', // Fond jaune officiel
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    maxWidth: 280,
    maxHeight: 280,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
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
    fontSize: FONTS.sizes?.bodySmall || 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default React.memo(SplashScreenNative);
