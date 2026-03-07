// src/screens/LandingScreen.jsx
// LANDING PAGE - THE GOLDEN TICKET (Ultra-Minimalist & VIP Shimmer)
// CSCSM Level: Masterpiece UI / Reanimated Engine

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  Image,
  ScrollView,
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

import GlassModal from '../components/ui/GlassModal';
import GoldButton from '../components/ui/GoldButton';
import { showSuccessToast } from '../store/slices/uiSlice';
import THEME from '../theme/theme';

const { width, height } = Dimensions.get('window');

export default function LandingScreen({ navigation }) {
  const dispatch = useDispatch();
  const [showTerms, setShowTerms] = useState(false);

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const currentYear = new Date().getFullYear();

  // DETECTION DU MODE (L'Or s'adapte, le noir reste noir)
  const isDark = THEME.COLORS.background === THEME.COLORS.pureBlack;
  const backgroundGradient = isDark 
    ? [THEME.COLORS.primary, THEME.COLORS.primaryDark] 
    : [THEME.COLORS.primaryLight, THEME.COLORS.primary];

  // ==========================================
  // MOTEUR D'ANIMATION (Reanimated)
  // ==========================================
  
  // 1. Valeurs pour la Cascade d'apparition (Slide-Up)
  const titleY = useSharedValue(50);
  const titleOpacity = useSharedValue(0);
  const subtitleY = useSharedValue(50);
  const subtitleOpacity = useSharedValue(0);
  const btnY = useSharedValue(50);
  const btnOpacity = useSharedValue(0);
  const linksOpacity = useSharedValue(0);

  // 2. Valeur pour la lévitation du logo
  const levitationY = useSharedValue(0);

  // 3. Valeur pour le VIP Shimmer (Reflet sur le bouton)
  const shimmerX = useSharedValue(-width);

  useEffect(() => {
    // Lancement de la cascade d'apparition (Staggered Entry)
    titleOpacity.value = withTiming(1, { duration: 800 });
    titleY.value = withSpring(0, { damping: 12, stiffness: 100 });

    subtitleOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    subtitleY.value = withDelay(200, withSpring(0, { damping: 12, stiffness: 100 }));

    btnOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
    btnY.value = withDelay(400, withSpring(0, { damping: 12, stiffness: 100 }));

    linksOpacity.value = withDelay(800, withTiming(1, { duration: 1000 }));

    // SURPRISE 1 : Lévitation continue du Logo
    levitationY.value = withRepeat(
      withTiming(-12, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      -1, // Infini
      true // Aller-retour
    );

    // SURPRISE 2 : Le VIP Shimmer (balayage lumineux toutes les 3.5s)
    shimmerX.value = withRepeat(
      withSequence(
        withTiming(width, { duration: 1200, easing: Easing.linear }), // Traversement
        withTiming(-width, { duration: 0 }), // Reset invisible instantané
        withDelay(3500, withTiming(-width, { duration: 0 })) // Pause avant de recommencer
      ),
      -1,
      false
    );
  }, []);

  // Styles Animés
  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value, transform: [{ translateY: titleY.value }] }));
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value, transform: [{ translateY: subtitleY.value }] }));
  const btnStyle = useAnimatedStyle(() => ({ opacity: btnOpacity.value, transform: [{ translateY: btnY.value }] }));
  const linksStyle = useAnimatedStyle(() => ({ opacity: linksOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({ transform: [{ translateY: levitationY.value }] }));
  const shimmerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shimmerX.value }] }));

  // ==========================================
  // GESTION DU RETOUR
  // ==========================================
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

  return (
    <View style={styles.container}>
      <LinearGradient colors={backgroundGradient} style={styles.backgroundImage}>
        <View style={styles.contentContainer}>
          
          <View style={styles.topSpace} />

          {/* SECTION CENTRALE : LOGO LÉVITANT ET TYPOGRAPHIE MINIMALISTE */}
          <View style={styles.centerSection}>
            <Animated.View style={[styles.logoContainer, logoStyle]}>
               <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="cover" />
            </Animated.View>

            <Animated.Text style={[styles.mainTitle, titleStyle]}>
              L'ÉLITE DU{'\n'}TRANSPORT.
            </Animated.Text>
            
            <Animated.View style={subtitleStyle}>
              <View style={styles.separator} />
              <Text style={styles.subTitle}>À Maféré.</Text>
            </Animated.View>
          </View>

          {/* SECTION BASSE : CTA ABSOLUTE BLACK ET LIENS */}
          <View style={styles.bottomSection}>
            <Animated.View style={[styles.buttonWrapper, btnStyle]}>
              <TouchableOpacity 
                style={styles.blackCtaButton}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Register')}
              >
                {/* L'EFFET SHIMMER INJECTÉ DANS LE BOUTON */}
                <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
                  <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.25)', 'transparent']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.shimmerGradient}
                  />
                </Animated.View>

                <Text style={styles.blackCtaText}>CRÉER MON COMPTE</Text>
                <Ionicons name="arrow-forward" size={20} color={THEME.COLORS.primaryLight} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.linksContainer, linksStyle]}>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
                <Text style={styles.loginText}>
                  Déjà membre ? <Text style={styles.loginTextBold}>Se connecter</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowTerms(true)} style={styles.termsLink}>
                <Text style={styles.termsText}>Conditions d'utilisation</Text>
              </TouchableOpacity>

              <Text style={styles.copyright}>© {currentYear} Yély • v{appVersion}</Text>
            </Animated.View>
          </View>

        </View>
      </LinearGradient>

      {/* MODAL CGU (Inchangé) */}
      <GlassModal visible={showTerms} onClose={() => setShowTerms(false)} title="CONDITIONS GÉNÉRALES">
        <View style={{ maxHeight: height * 0.65, width: '100%' }}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 10 }}>
            <View style={styles.modalTextBg}>
              <Text style={styles.termsContent}>
                <Text style={styles.boldGold}>1. ACCEPTATION DES CONDITIONS</Text>{"\n"}
                En utilisant l'application Yély, vous acceptez d'être lié par les présentes conditions.{"\n"}{"\n"}
                <Text style={styles.boldGold}>2. SÉCURITÉ ET RESPONSABILITÉ</Text>{"\n"}
                Yély s'engage à connecter les passagers avec des chauffeurs vérifiés à Maféré.
              </Text>
            </View>
            <GoldButton title="J'AI COMPRIS" onPress={() => setShowTerms(false)} style={{ marginTop: 20 }} />
          </ScrollView>
        </View>
      </GlassModal>

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
  topSpace: { height: height * 0.10 }, // Espace pour aérer le haut
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
    color: '#000000', // Noir absolu sur Or
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
    backgroundColor: '#000000', // NOIR ABSOLU GARANTI
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
    overflow: 'hidden', // Crucial pour que le Shimmer ne dépasse pas du bouton
  },
  blackCtaText: {
    color: THEME.COLORS.primaryLight, 
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
    zIndex: 2, // Le texte reste au-dessus du reflet
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    width: 100, // Largeur du faisceau lumineux
    transform: [{ skewX: '-20deg' }], // Inclinaison pour un effet vitesse/luxe
    zIndex: 1,
  },
  shimmerGradient: {
    flex: 1,
  },
  linksContainer: { alignItems: 'center' },
  loginLink: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  loginText: { color: '#222222', fontSize: 15, fontWeight: '500' },
  loginTextBold: { color: '#000000', fontWeight: '900', textDecorationLine: 'underline' },
  termsLink: { padding: 5 },
  termsText: { color: '#444444', fontSize: 12, fontWeight: '700' },
  copyright: { color: '#555555', fontSize: 10, marginTop: 15, fontWeight: '600' },
  
  modalTextBg: { backgroundColor: THEME.COLORS.richBlack, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)' },
  termsContent: { color: THEME.COLORS.pureWhite, lineHeight: 22, fontSize: 13 },
  boldGold: { color: THEME.COLORS.champagneGold, fontWeight: 'bold', fontSize: 14 }
});