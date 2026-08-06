// src/screens/LandingScreen.jsx
// LANDING PAGE - FULLSCREEN MOTION DESIGN (Option 1 Immersive VIP)
// CSCSM Level: Masterpiece UI / Fullscreen Video Engine

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
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

const { width, height } = Dimensions.get('window');
const MOTION_DESIGN_URL = 'https://res.cloudinary.com/dkov5qrsp/video/upload/v1785905486/vbsxzwoa5m4mpvcx7jqp.mp4';

export default function LandingScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const [videoError, setVideoError] = useState(false);

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

  let lastBackPress = 0;
  useFocusEffect(
    useCallback(() => {
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
          src={MOTION_DESIGN_URL}
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
        source={{ uri: MOTION_DESIGN_URL }}
        style={styles.fullscreenVideo}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
        onError={() => setVideoError(true)}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* 1. ARRIÈRE-PLAN VIDÉO FULLSCREEN */}
      <View style={StyleSheet.absoluteFillObject}>
        {renderMotionDesign()}
      </View>

      {/* 2. VOILE DÉGRADÉ TRANSLUCIDE (GOLD / DARK) POUR LISIBILITÉ PARFAITE */}
      <LinearGradient 
        colors={['rgba(214, 175, 55, 0.45)', 'rgba(18, 20, 24, 0.88)', 'rgba(10, 12, 16, 0.96)']} 
        style={StyleSheet.absoluteFillObject} 
      />

      {/* 3. CONTENU EN SURIMPRESSION */}
      <View style={[styles.contentContainer, { paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 16) }]}>
        
        <View style={styles.topSection}>
          <View style={styles.brandBadge}>
            <Ionicons name="sparkles" size={14} color={THEME.COLORS.champagneGold} style={{ marginRight: 6 }} />
            <Text style={styles.brandBadgeText}>YÉLY MOBILITY & MARKETPLACE</Text>
          </View>
        </View>

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
              style={styles.goldCtaButton}
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

              <Text style={styles.goldCtaText}>CRÉER MON COMPTE</Text>
              <Ionicons name="arrow-forward" size={20} color="#121418" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.linksContainer, linksStyle]}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
              <Text style={styles.loginText}>
                Déjà membre ? <Text style={styles.loginTextBold}>Se connecter</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.legalLinksRow}>
              <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')} style={styles.termsLink}>
                <Text style={styles.termsText}>Conditions d'utilisation</Text>
              </TouchableOpacity>
              <Text style={styles.bullet}> • </Text>
              <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')} style={styles.termsLink}>
                <Text style={styles.termsText}>Confidentialité</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.copyright}>© {currentYear} Yely • v{appVersion}</Text>
          </Animated.View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0C10' },
  fullscreenVideo: { width: '100%', height: '100%' },
  fallbackImage: { width: '100%', height: '100%' },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.xl,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 10,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(214, 175, 55, 0.3)',
  },
  brandBadgeText: {
    color: '#F5D142',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  centerSection: { 
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF', 
    letterSpacing: 1.2,
    textAlign: 'center',
    lineHeight: 48,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  separator: {
    width: 48,
    height: 3,
    backgroundColor: THEME.COLORS.champagneGold,
    alignSelf: 'center',
    marginVertical: 14,
    borderRadius: 2,
  },
  subTitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
  },
  bottomSection: { width: '100%', alignItems: 'center' },
  buttonWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  goldCtaButton: {
    backgroundColor: THEME.COLORS.primary, 
    height: 60,
    borderRadius: THEME.BORDERS.radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden', 
  },
  goldCtaText: {
    color: '#121418', 
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
  loginText: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 15, fontWeight: '500' },
  loginTextBold: { color: THEME.COLORS.champagneGold, fontWeight: '900', textDecorationLine: 'underline' },
  legalLinksRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  termsLink: { padding: 5 },
  termsText: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 12, fontWeight: '700' },
  bullet: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 12, marginHorizontal: 5 },
  copyright: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 10, marginTop: 10, fontWeight: '600' }
});