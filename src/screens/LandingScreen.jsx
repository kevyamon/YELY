// src/screens/LandingScreen.jsx
// LANDING PAGE - FULLSCREEN MOTION DESIGN (Nouvelle Vidéo & Titres Blancs Permanents)
// CSCSM Level: Masterpiece UI / Fullscreen Video Engine

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  AppState,
  BackHandler,
  Dimensions,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import { showSuccessToast } from '../store/slices/uiSlice';
import THEME from '../theme/theme';

const { width } = Dimensions.get('window');
const LOCAL_MOTION_DESIGN = require('../../assets/videos/landing.mp4');

export default function LandingScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(false);

  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      if (!status.isPlaying && status.shouldPlay && !status.isBuffering) {
        videoRef.current?.playAsync().catch(() => {});
      }
    } else if (status.error) {
      setVideoError(true);
    }
  };

  const appVersion = Constants.expoConfig?.version || '1.1.0';
  const currentYear = new Date().getFullYear();

  const titleY = useSharedValue(50);
  const titleOpacity = useSharedValue(0);
  const subtitleY = useSharedValue(50);
  const subtitleOpacity = useSharedValue(0);
  const btnY = useSharedValue(50);
  const btnOpacity = useSharedValue(0);
  const linksOpacity = useSharedValue(0);
  const shimmerX = useSharedValue(-width);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 800 });
    titleY.value = withSpring(0, { damping: 12, stiffness: 100 });

    subtitleOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    subtitleY.value = withDelay(200, withSpring(0, { damping: 12, stiffness: 100 }));

    btnOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
    btnY.value = withDelay(400, withSpring(0, { damping: 12, stiffness: 100 }));

    linksOpacity.value = withDelay(800, withTiming(1, { duration: 1000 }));

    shimmerX.value = withRepeat(
      withSequence(
        withTiming(width, { duration: 1200, easing: Easing.linear }), 
        withTiming(-width, { duration: 0 }), 
        withDelay(3500, withTiming(-width, { duration: 0 })) 
      ),
      -1,
      false
    );
  }, []);

  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value, transform: [{ translateY: titleY.value }] }));
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value, transform: [{ translateY: subtitleY.value }] }));
  const btnStyle = useAnimatedStyle(() => ({ opacity: btnOpacity.value, transform: [{ translateY: btnY.value }] }));
  const linksStyle = useAnimatedStyle(() => ({ opacity: linksOpacity.value }));
  const shimmerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shimmerX.value }] }));

  // Reprise automatique de la vidéo lors du retour de l'app au premier plan
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        videoRef.current?.playAsync().catch(() => {});
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  let lastBackPress = 0;
  useFocusEffect(
    useCallback(() => {
      videoRef.current?.playAsync().catch(() => {});

      const onBackPress = () => {
        const time = new Date().getTime();
        if (time - lastBackPress < 2000) {
          BackHandler.exitApp();
          return true;
        }
        lastBackPress = time;
        dispatch(showSuccessToast({ title: "Quitter Yély ?", message: "Appuyez de nouveau pour quitter" }));
        return true; 
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [dispatch])
  );

  const renderMotionDesign = () => {
    if (Platform.OS === 'web') {
      return (
        <video
          src={LOCAL_MOTION_DESIGN}
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          onError={() => setVideoError(true)}
        />
      );
    }

    if (videoError) {
      return <Image source={require('../../assets/logo.png')} style={styles.fallbackImage} resizeMode="cover" />;
    }

    return (
      <Video
        ref={videoRef}
        source={LOCAL_MOTION_DESIGN}
        style={styles.fullscreenVideo}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
        useNativeControls={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onError={() => setVideoError(true)}
      />
    );
  };

  // Couleurs des liens adaptatifs
  const textColorSecondary = isDarkMode ? 'rgba(255, 255, 255, 0.90)' : 'rgba(18, 20, 24, 0.85)';
  const textColorTertiary = isDarkMode ? 'rgba(255, 255, 255, 0.70)' : 'rgba(18, 20, 24, 0.65)';
  const copyrightColor = isDarkMode ? 'rgba(255, 255, 255, 0.55)' : 'rgba(18, 20, 24, 0.50)';

  return (
    <View style={[styles.container, { backgroundColor: '#0A0C10' }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      
      {/* ARRIÈRE-PLAN VIDÉO FULLSCREEN (Nouvelle Vidéo Cloudinary) */}
      <View style={StyleSheet.absoluteFillObject}>
        {renderMotionDesign()}
      </View>

      {/* VOILE DÉGRADÉ PROGRESSIF : Transparent en haut -> ambré/or en bas */}
      <LinearGradient 
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.45, 1]}
        colors={
          isDarkMode 
            ? ['transparent', 'rgba(10, 12, 16, 0.35)', 'rgba(10, 12, 16, 0.92)']
            : ['transparent', 'rgba(214, 175, 55, 0.30)', 'rgba(245, 215, 80, 0.92)']
        } 
        style={StyleSheet.absoluteFillObject} 
      />

      {/* CONTENU EN SURIMPRESSION */}
      <View style={[styles.contentContainer, { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 16) }]}>
        
        <View style={styles.topSpace} />

        {/* TITRE PRINCIPAL & SOUS-TITRE FIXÉS EN BLANC PERMANENT À HAUT RELIEF */}
        <View style={styles.centerSection}>
          <Animated.Text style={[styles.mainTitle, titleStyle]}>
            Avec Yély, ça va vite !
          </Animated.Text>
          
          <Animated.View style={subtitleStyle}>
            <View style={styles.separator} />
            <Text style={styles.subTitle}>@By Yély Dev Team</Text>
          </Animated.View>
        </View>

        <View style={styles.bottomSection}>
          <Animated.View style={[styles.buttonWrapper, btnStyle]}>
            <TouchableOpacity 
              style={[
                styles.goldCtaButton, 
                { backgroundColor: isDarkMode ? THEME.COLORS.primary : '#121418' }
              ]}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('Register')}
            >
              <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.shimmerGradient}
                />
              </Animated.View>

              <Text style={[styles.goldCtaText, { color: isDarkMode ? '#121418' : THEME.COLORS.primary }]}>
                CRÉER MON COMPTE
              </Text>
              <Ionicons 
                name="arrow-forward" 
                size={20} 
                color={isDarkMode ? '#121418' : THEME.COLORS.primary} 
                style={{ marginLeft: 8 }} 
              />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.linksContainer, linksStyle]}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
              <Text style={[styles.loginText, { color: textColorSecondary }]}>
                Déjà membre ? <Text style={[styles.loginTextBold, { color: isDarkMode ? THEME.COLORS.primary : '#121418' }]}>Se connecter</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.legalLinksRow}>
              <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')} style={styles.termsLink}>
                <Text style={[styles.termsText, { color: textColorTertiary }]}>Conditions d'utilisation</Text>
              </TouchableOpacity>
              <Text style={[styles.bullet, { color: textColorTertiary }]}> • </Text>
              <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')} style={styles.termsLink}>
                <Text style={[styles.termsText, { color: textColorTertiary }]}>Confidentialité</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.copyright, { color: copyrightColor }]}>© {currentYear} Yely • v{appVersion}</Text>
          </Animated.View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000000' 
  },
  fullscreenVideo: { width: '100%', height: '100%' },
  fallbackImage: { width: '100%', height: '100%' },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.xl,
  },
  topSpace: { height: 20 },
  centerSection: { 
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF', // Blanc Éclatant Permanent
    letterSpacing: 1.2,
    textAlign: 'center',
    lineHeight: 48,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  separator: {
    width: 48,
    height: 3.5,
    backgroundColor: THEME.COLORS.primary,
    alignSelf: 'center',
    marginVertical: 14,
    borderRadius: 2,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)', // Blanc Éclatant Permanent
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  bottomSection: { width: '100%', alignItems: 'center' },
  buttonWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  goldCtaButton: {
    height: 60,
    borderRadius: THEME.BORDERS.radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden', 
  },
  goldCtaText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
    zIndex: 2, 
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    width: 100, 
    transform: [{ skewX: '-20deg' }], 
    zIndex: 1,
  },
  shimmerGradient: {
    flex: 1,
  },
  linksContainer: { alignItems: 'center' },
  loginLink: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  loginText: { 
    fontSize: 15, 
    fontWeight: '600',
  },
  loginTextBold: { 
    fontWeight: '900', 
    textDecorationLine: 'underline' 
  },
  legalLinksRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  termsLink: { padding: 5 },
  termsText: { 
    fontSize: 12, 
    fontWeight: '700',
  },
  bullet: { fontSize: 12, marginHorizontal: 5 },
  copyright: { 
    fontSize: 10, 
    marginTop: 8, 
    fontWeight: '600',
  }
});