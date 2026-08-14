// src/screens/LandingScreen.jsx
// ÉCRAN DE BIENVENUE - LANDING SCREEN YÉLY (Courbe Organique Dorée & Fond Blanc Pur)
// STANDARD: Industriel / Bank Grade / Theme Tokens

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import React, { useCallback, useEffect } from 'react';
import {
  BackHandler,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';
import { useDispatch } from 'react-redux';

import { showSuccessToast } from '../store/slices/uiSlice';
import THEME, { BORDERS, COLORS, FONTS, PALETTE, SHADOWS, SPACING } from '../theme/theme';

export default function LandingScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const responsiveFontSize = width < 360 ? 22 : (width < 400 ? 25 : 28);

  const appVersion = Constants.expoConfig?.version || '1.6';
  const currentYear = new Date().getFullYear();

  const titleY = useSharedValue(35);
  const titleOpacity = useSharedValue(0);
  const subtitleY = useSharedValue(35);
  const subtitleOpacity = useSharedValue(0);
  const btnY = useSharedValue(35);
  const btnOpacity = useSharedValue(0);
  const linksOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 700 });
    titleY.value = withSpring(0, { damping: 14, stiffness: 120 });

    subtitleOpacity.value = withDelay(150, withTiming(1, { duration: 700 }));
    subtitleY.value = withDelay(150, withSpring(0, { damping: 14, stiffness: 120 }));

    btnOpacity.value = withDelay(300, withTiming(1, { duration: 700 }));
    btnY.value = withDelay(300, withSpring(0, { damping: 14, stiffness: 120 }));

    linksOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }]
  }));
  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleY.value }]
  }));
  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
    transform: [{ translateY: btnY.value }]
  }));
  const linksStyle = useAnimatedStyle(() => ({
    opacity: linksOpacity.value
  }));

  let lastBackPress = 0;
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        try {
          SystemUI.setBackgroundColorAsync(PALETTE.pureWhite).catch(() => {});
          NavigationBar.setPositionAsync('absolute').catch(() => {});
          NavigationBar.setBackgroundColorAsync(PALETTE.pureWhite).catch(() => {});
          NavigationBar.setButtonStyleAsync('dark').catch(() => {});
        } catch (e) {}
      }

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

      return () => {
        sub.remove();
      };
    }, [dispatch])
  );

  // Tracé précis de la courbe organique dorée supérieure
  const curvePath = `M 0 0 L ${width} 0 L ${width} ${height * 0.46} C ${width * 0.70} ${height * 0.58}, ${width * 0.25} ${height * 0.58}, 0 ${height * 0.48} Z`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* FOND VECTORIEL AVEC BULLE ORGANIQUE SUPÉRIEURE & BLANC EN BAS */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <SvgLinearGradient id="goldCurveGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={PALETTE.warmGold} stopOpacity="1" />
            <Stop offset="100%" stopColor={PALETTE.warmYellow} stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        <Path d={curvePath} fill="url(#goldCurveGrad)" />
      </Svg>

      {/* CONTENU PRINCIPAL PARFAITEMENT STRUCTURÉ */}
      <View
        style={[
          styles.contentContainer,
          {
            paddingTop: Math.max(insets.top + SPACING.lg, 44),
            paddingBottom: Math.max(insets.bottom + SPACING.md, 24)
          }
        ]}
      >
        {/* SECTION SUPÉRIEURE : TITRE UNIQUE & SOUSTITRE */}
        <View style={styles.topSection}>
          <View style={styles.titleWrapper}>
            <Animated.Text
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.65}
              style={[styles.mainTitle, { fontSize: responsiveFontSize }, titleStyle]}
            >
              Avec Yély, ça va vite !
            </Animated.Text>
          </View>

          <Animated.View style={[styles.subtitleWrapper, subtitleStyle]}>
            <View style={styles.separator} />
            <Text style={styles.subTitle}>@By Yély Dev Team</Text>
          </Animated.View>
        </View>

        {/* SECTION INFÉRIEURE : BOUTON PRINCIPAL & LIENS */}
        <View style={styles.bottomSection}>
          <Animated.View style={[styles.buttonWrapper, btnStyle]}>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Register')}
            >
              <Ionicons name="person-add" size={20} color={PALETTE.warmYellow} style={styles.buttonIconLeft} />
              <Text style={styles.primaryButtonText}>CRÉER MON COMPTE</Text>
              <Ionicons name="arrow-forward" size={20} color={PALETTE.warmYellow} style={styles.buttonIconRight} />
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
              <Text style={styles.bullet}>•</Text>
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
  container: {
    flex: 1,
    backgroundColor: PALETTE.pureWhite,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xl,
  },
  titleWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  mainTitle: {
    fontSize: FONTS.sizes.h1 + 6,
    fontWeight: FONTS.weights.bold,
    color: PALETTE.charcoal,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitleWrapper: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  separator: {
    width: 44,
    height: 4,
    backgroundColor: PALETTE.pureWhite,
    borderRadius: BORDERS.radius.xs,
    marginBottom: SPACING.md,
  },
  subTitle: {
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.bold,
    color: PALETTE.richBlack,
    letterSpacing: 0.5,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  buttonWrapper: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  primaryButton: {
    height: 58,
    borderRadius: BORDERS.radius.pill,
    backgroundColor: PALETTE.charcoal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    elevation: 6,
    ...SHADOWS.medium,
  },
  buttonIconLeft: {
    marginRight: SPACING.sm,
  },
  buttonIconRight: {
    marginLeft: SPACING.sm,
  },
  primaryButtonText: {
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.bold,
    color: PALETTE.warmYellow,
    letterSpacing: 1.2,
  },
  linksContainer: {
    alignItems: 'center',
  },
  loginLink: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  loginText: {
    fontSize: FONTS.sizes.bodySmall + 1,
    fontWeight: FONTS.weights.semiBold,
    color: PALETTE.charcoal,
  },
  loginTextBold: {
    fontWeight: FONTS.weights.bold,
    color: PALETTE.pureBlack,
    textDecorationLine: 'underline',
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  termsLink: {
    padding: SPACING.xs,
  },
  termsText: {
    fontSize: FONTS.sizes.caption + 1,
    fontWeight: FONTS.weights.bold,
    color: PALETTE.charcoal,
  },
  bullet: {
    fontSize: FONTS.sizes.caption + 1,
    marginHorizontal: SPACING.sm,
    color: PALETTE.charcoal,
    fontWeight: FONTS.weights.bold,
  },
  copyright: {
    fontSize: FONTS.sizes.caption,
    marginTop: SPACING.sm,
    fontWeight: FONTS.weights.semiBold,
    color: PALETTE.charcoal,
  },
});