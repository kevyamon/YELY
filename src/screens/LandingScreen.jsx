// src/screens/LandingScreen.jsx
// LANDING PAGE - THE GOLDEN TICKET (Ultra-Minimalist & VIP Shimmer)
// CSCSM Level: Masterpiece UI / Reanimated Engine

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect } from 'react';
import {
  BackHandler,
  Dimensions,
  Image,
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
import { useDispatch } from 'react-redux';

import { showSuccessToast } from '../store/slices/uiSlice';
import THEME from '../theme/theme';

const { width, height } = Dimensions.get('window');

export default function LandingScreen({ navigation }) {
  const dispatch = useDispatch();

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const currentYear = new Date().getFullYear();

  const isDark = THEME.COLORS.background === THEME.COLORS.pureBlack;
  const backgroundGradient = isDark 
    ? [THEME.COLORS.primary, THEME.COLORS.primaryDark] 
    : [THEME.COLORS.primaryLight, THEME.COLORS.primary];

  const titleY = useSharedValue(50);
  const titleOpacity = useSharedValue(0);
  const subtitleY = useSharedValue(50);
  const subtitleOpacity = useSharedValue(0);
  const btnY = useSharedValue(50);
  const btnOpacity = useSharedValue(0);
  const linksOpacity = useSharedValue(0);

  const levitationY = useSharedValue(0);

  const shimmerX = useSharedValue(-width);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 800 });
    titleY.value = withSpring(0, { damping: 12, stiffness: 100 });

    subtitleOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    subtitleY.value = withDelay(200, withSpring(0, { damping: 12, stiffness: 100 }));

    btnOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
    btnY.value = withDelay(400, withSpring(0, { damping: 12, stiffness: 100 }));

    linksOpacity.value = withDelay(800, withTiming(1, { duration: 1000 }));

    levitationY.value = withRepeat(
      withTiming(-12, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      -1, 
      true 
    );

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
  const logoStyle = useAnimatedStyle(() => ({ transform: [{ translateY: levitationY.value }] }));
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
        dispatch(showSuccessToast({ title: "Quitter Yely ?", message: "Appuyez de nouveau pour quitter" }));
        return true; 
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [dispatch])
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={backgroundGradient} style={styles.backgroundImage}>
        <View style={styles.contentContainer}>
          
          <View style={styles.topSpace} />

          <View style={styles.centerSection}>
            <Animated.View style={[styles.logoContainer, logoStyle]}>
               <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="cover" />
            </Animated.View>

            <Animated.Text style={[styles.mainTitle, titleStyle]}>
              Avec Yély ça va vite!.
            </Animated.Text>
            
            <Animated.View style={subtitleStyle}>
              <View style={styles.separator} />
              <Text style={styles.subTitle}>A Mafere.</Text>
            </Animated.View>
          </View>

          <View style={styles.bottomSection}>
            <Animated.View style={[styles.buttonWrapper, btnStyle]}>
              <TouchableOpacity 
                style={styles.blackCtaButton}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Register')}
              >
                <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
                  <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.25)', 'transparent']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.shimmerGradient}
                  />
                </Animated.View>

                <Text style={styles.blackCtaText}>CREER MON COMPTE</Text>
                <Ionicons name="arrow-forward" size={20} color={THEME.COLORS.primaryLight} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.linksContainer, linksStyle]}>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
                <Text style={styles.loginText}>
                  Deja membre ? <Text style={styles.loginTextBold}>Se connecter</Text>
                </Text>
              </TouchableOpacity>

              <View style={styles.legalLinksRow}>
                <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')} style={styles.termsLink}>
                  <Text style={styles.termsText}>Conditions d'utilisation</Text>
                </TouchableOpacity>
                <Text style={styles.bullet}> • </Text>
                <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')} style={styles.termsLink}>
                  <Text style={styles.termsText}>Confidentialite</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.copyright}>© {currentYear} Yely • v{appVersion}</Text>
            </Animated.View>
          </View>

        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: { flex: 1, width: width, height: height },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.xl,
    paddingBottom: THEME.SPACING.xl,
  },
  topSpace: { height: height * 0.10 }, 
  centerSection: { 
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  logoContainer: {
    width: 120, 
    height: 120,
    borderRadius: 60,
    overflow: 'hidden', 
    backgroundColor: THEME.COLORS.pureWhite, 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.SPACING.xxl,
    borderWidth: 2,
    borderColor: '#000000',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  logoImage: { width: '100%', height: '100%' },
  mainTitle: {
    fontSize: 44,
    fontWeight: '900',
    color: '#000000', 
    letterSpacing: 2,
    textAlign: 'center',
    lineHeight: 50,
  },
  separator: {
    width: 40,
    height: 3,
    backgroundColor: '#000000',
    alignSelf: 'center',
    marginVertical: 15,
    borderRadius: 2,
  },
  subTitle: {
    fontSize: 22,
    color: '#111111',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
  },
  bottomSection: { width: '100%', alignItems: 'center' },
  buttonWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  blackCtaButton: {
    backgroundColor: '#000000', 
    height: 60,
    borderRadius: THEME.BORDERS.radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden', 
  },
  blackCtaText: {
    color: THEME.COLORS.primaryLight, 
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
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  loginText: { color: '#222222', fontSize: 15, fontWeight: '500' },
  loginTextBold: { color: '#000000', fontWeight: '900', textDecorationLine: 'underline' },
  legalLinksRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  termsLink: { padding: 5 },
  termsText: { color: '#444444', fontSize: 12, fontWeight: '700' },
  bullet: { color: '#555555', fontSize: 12, marginHorizontal: 5 },
  copyright: { color: '#555555', fontSize: 10, marginTop: 15, fontWeight: '600' }
});