// src/screens/LandingScreen.jsx
// ÉCRAN DE BIENVENUE - LANDING SCREEN YÉLY (Design Épuré, Fond Dégradé d'Or & Thème Fixe)
// STANDARD: Industriel / Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import * as NavigationBar from 'expo-navigation-bar';
import React, { useCallback, useEffect } from 'react';
import {
  BackHandler,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
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
import { useDispatch } from 'react-redux';

import { showSuccessToast } from '../store/slices/uiSlice';
import THEME from '../theme/theme';

export default function LandingScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const appVersion = Constants.expoConfig?.version || '1.6';
  const currentYear = new Date().getFullYear();

  const titleY = useSharedValue(40);
  const titleOpacity = useSharedValue(0);
  const subtitleY = useSharedValue(40);
  const subtitleOpacity = useSharedValue(0);
  const btnY = useSharedValue(40);
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ARRIÈRE-PLAN DÉGRADÉ VECTORIEL VIBRANT YÉLY (Blanc Crème -> Jaune Or) */}
      <LinearGradient
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 0.28, 0.65, 1]}
        colors={['#FFFDF4', '#FFE866', '#FAC800', '#E5AC00']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* CONTENU UNIFORME & LISIBLE */}
      <View
        style={[
          styles.contentContainer,
          { paddingTop: Math.max(insets.top + 20, 48), paddingBottom: Math.max(insets.bottom + 16, 32) }
        ]}
      >
        {/* TITRE PRINCIPAL & MARQUE (Couleurs Fixes Permanentes) */}
        <View style={styles.centerSection}>
          <Animated.Text style={[styles.mainTitle, titleStyle]}>
            {"Avec Yély,\nça va vite !"}
          </Animated.Text>

          <Animated.View style={[styles.subtitleWrapper, subtitleStyle]}>
            <View style={styles.separator} />
            <Text style={styles.subTitle}>@By Yély Dev Team</Text>
          </Animated.View>
        </View>

        {/* SECTION BOUTON ET LIENS */}
        <View style={styles.bottomSection}>
          <Animated.View style={[styles.buttonWrapper, btnStyle]}>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Register')}
            >
              <Ionicons name="person-add" size={20} color={THEME.COLORS.primary} style={styles.buttonIconLeft} />
              <Text style={styles.primaryButtonText}>CRÉER MON COMPTE</Text>
              <Ionicons name="arrow-forward" size={20} color={THEME.COLORS.primary} style={styles.buttonIconRight} />
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
    backgroundColor: '#FAC800',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#121212',
    letterSpacing: -0.5,
    textAlign: 'center',
    lineHeight: 52,
  },
  subtitleWrapper: {
    alignItems: 'center',
    marginTop: 20,
  },
  separator: {
    width: 44,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    marginBottom: 16,
  },
  subTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  buttonWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  primaryButton: {
    height: 60,
    borderRadius: 30,
    backgroundColor: '#141414',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  buttonIconLeft: {
    marginRight: 10,
  },
  buttonIconRight: {
    marginLeft: 10,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FAC800',
    letterSpacing: 1.2,
  },
  linksContainer: {
    alignItems: 'center',
  },
  loginLink: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  loginText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  loginTextBold: {
    fontWeight: '900',
    color: '#121212',
    textDecorationLine: 'underline',
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  termsLink: {
    padding: 4,
  },
  termsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222222',
  },
  bullet: {
    fontSize: 13,
    marginHorizontal: 8,
    color: '#222222',
    fontWeight: '900',
  },
  copyright: {
    fontSize: 12,
    marginTop: 10,
    fontWeight: '700',
    color: '#2A2A2A',
  },
});