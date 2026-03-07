// src/screens/LandingScreen.jsx
// LANDING PAGE - LUXURY & IDENTITY
// CSCSM Level: High-End UI + Smart Back Handler

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants'; // 🛡️ IMPORT AJOUTÉ POUR LIRE LA VERSION
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useDispatch } from 'react-redux';

import GlassModal from '../components/ui/GlassModal';
import GoldButton from '../components/ui/GoldButton';
import { showSuccessToast } from '../store/slices/uiSlice';
import THEME from '../theme/theme';

const { width, height } = Dimensions.get('window');

// ═════════════════════════════════════════════════════════════════════════
// ⚙️ CONFIGURATION DU LANDING
// ═════════════════════════════════════════════════════════════════════════
const LANDING_CONFIG = {
  SHOW_IMAGE: false, 
  IMAGE_SOURCE: require('../../assets/images/landing-bg.png'),
  DEFAULT_GRADIENT: [THEME.COLORS.deepAsphalt, '#000000'] 
};
// ═════════════════════════════════════════════════════════════════════════

export default function LandingScreen({ navigation }) {
  const dispatch = useDispatch();
  const [showTerms, setShowTerms] = useState(false);

  // 🛡️ LECTURE DYNAMIQUE DE LA VERSION DEPUIS APP.JSON
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const currentYear = new Date().getFullYear();

  // --- ANIMATIONS ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  // --- GESTION DU DOUBLE RETOUR (Double Tap to Exit) ---
  const lastBackPress = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        const currentTimestamp = new Date().getTime();
        
        if (currentTimestamp - lastBackPress.current < 2000) {
          BackHandler.exitApp();
          return true;
        }

        lastBackPress.current = currentTimestamp;
        dispatch(showSuccessToast({
          title: "Quitter Yély ?",
          message: "Appuyez de nouveau pour quitter Yély"
        }));

        return true; 
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [dispatch])
  );
  // -----------------------------------------------------

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1500, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const renderBackground = (children) => {
    if (LANDING_CONFIG.SHOW_IMAGE) {
      return (
        <ImageBackground
          source={LANDING_CONFIG.IMAGE_SOURCE}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)', '#000000']}
            style={styles.gradientOverlay}
          />
          {children}
        </ImageBackground>
      );
    } else {
      return (
        <LinearGradient
          colors={LANDING_CONFIG.DEFAULT_GRADIENT}
          style={styles.backgroundImage}
        >
          {children}
        </LinearGradient>
      );
    }
  };

  return (
    <View style={styles.container}>
      {renderBackground(
        <View style={styles.contentContainer}>
          
          <Animated.View style={[styles.headerSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.logoContainer}>
               <Image 
                 source={require('../../assets/logo.png')} 
                 style={styles.logoImage} 
                 resizeMode="cover" 
               />
            </View>

            <Text style={styles.brandTitle}>YÉLY</Text>
            <Text style={styles.tagline}>L'EXCELLENCE POUR VOUS!</Text>
          </Animated.View>

          <Animated.View style={[styles.animationBox, { opacity: pulseAnim }]}>
            <View style={styles.animLine} />
            <Ionicons name="car-sport-outline" size={24} color={THEME.COLORS.champagneGold} style={{ marginHorizontal: 15 }} />
            <View style={styles.animLine} />
          </Animated.View>

          <Animated.View style={[styles.bottomSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            
            <Text style={styles.description}>
              Réservez des chauffeurs professionnels et vivez une expérience de transport sûre, élégante et fiable à Maféré.
            </Text>

            <View style={styles.buttonWrapper}>
              <GoldButton
                title="COMMENCER L'EXPÉRIENCE"
                onPress={() => navigation.navigate('Login')}
                icon="arrow-forward"
              />
            </View>

            <TouchableOpacity 
              onPress={() => setShowTerms(true)}
              style={styles.termsLink}
            >
              <Text style={styles.termsText}>Conditions d'utilisation</Text>
            </TouchableOpacity>

            {/* 🛡️ VERSION ET ANNÉE DYNAMIQUES ICI */}
            <Text style={styles.copyright}>© {currentYear} Yély • v{appVersion}</Text>
          </Animated.View>
        </View>
      )}

      <GlassModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
        title="CONDITIONS GÉNÉRALES"
      >
        <View style={{ maxHeight: height * 0.65, width: '100%' }}>
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            bounces={false}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 10 }}
          >
            <View style={styles.modalTextBg}>
              <Text style={styles.termsContent}>
                <Text style={styles.boldGold}>1. ACCEPTATION DES CONDITIONS</Text>{"\n"}
                En utilisant l'application Yély, vous acceptez d'être lié par les présentes conditions d'utilisation.{"\n"}{"\n"}

                <Text style={styles.boldGold}>2. SÉCURITÉ ET RESPONSABILITÉ</Text>{"\n"}
                Yély s'engage à connecter les passagers avec des chauffeurs vérifiés à Maféré. Toutefois, les chauffeurs sont des prestataires indépendants.{"\n"}{"\n"}

                <Text style={styles.boldGold}>3. PAIEMENTS</Text>{"\n"}
                Les tarifs sont calculés automatiquement en fonction de la distance et de la catégorie de véhicule choisie.{"\n"}{"\n"}

                <Text style={styles.boldGold}>4. ANNULATIONS</Text>{"\n"}
                Des frais peuvent s'appliquer si vous annulez une course plus de 5 minutes après l'acceptation du chauffeur.{"\n"}{"\n"}

                <Text style={styles.boldGold}>5. CONFIDENTIALITÉ</Text>{"\n"}
                Vos données personnelles sont protégées et ne sont utilisées que pour le bon fonctionnement du service.
              </Text>
            </View>
            
            <GoldButton 
              title="J'AI COMPRIS" 
              onPress={() => setShowTerms(false)}
              style={{ marginTop: 20 }}
            />
          </ScrollView>
        </View>
      </GlassModal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backgroundImage: { flex: 1, width: width, height: height },
  gradientOverlay: { ...StyleSheet.absoluteFillObject },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.xl,
    paddingTop: height * 0.15,
    paddingBottom: THEME.SPACING.xl,
  },
  headerSection: { alignItems: 'center' },
  logoContainer: {
    width: 110, 
    height: 110,
    borderRadius: 55,
    overflow: 'hidden', 
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)'
  },
  logoImage: { width: '100%', height: '100%' },
  brandTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: THEME.COLORS.champagneGold,
    letterSpacing: 4,
    textShadowColor: 'rgba(212, 175, 55, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tagline: {
    fontSize: 12,
    color: '#FFF',
    letterSpacing: 3,
    marginTop: 5,
    opacity: 0.8,
    fontWeight: '300'
  },
  animationBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 40 },
  animLine: { flex: 1, height: 1, backgroundColor: THEME.COLORS.champagneGold },
  bottomSection: { width: '100%', alignItems: 'center' },
  description: {
    color: '#DDD',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
    fontSize: 14,
    opacity: 0.9,
    paddingHorizontal: 20
  },
  buttonWrapper: {
    width: '100%',
    marginBottom: 20,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  termsLink: { padding: 10 },
  termsText: {
    color: THEME.COLORS.champagneGold, 
    fontSize: 13,
    textDecorationLine: 'underline',
    fontWeight: '500'
  },
  copyright: { color: '#555', fontSize: 10, marginTop: 20, fontWeight: '500' },
  modalTextBg: { 
    backgroundColor: '#0A0A0A', 
    padding: 15, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(212, 175, 55, 0.3)' 
  },
  termsContent: { color: '#FFF', lineHeight: 22, fontSize: 13 },
  boldGold: { color: THEME.COLORS.champagneGold, fontWeight: 'bold', fontSize: 14 }
});