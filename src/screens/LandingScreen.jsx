// src/screens/LandingScreen.jsx
// LANDING PAGE - LUXURY & IDENTITY
// CSCSM Level: High-End UI

import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image // Ajout de Image pour le logo
  ,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import GlassModal from '../components/ui/GlassModal';
import GoldButton from '../components/ui/GoldButton';
import THEME from '../theme/theme';

const { width, height } = Dimensions.get('window');

// ═════════════════════════════════════════════════════════════════════════
// ⚙️ CONFIGURATION DU LANDING
// ═════════════════════════════════════════════════════════════════════════
const LANDING_CONFIG = {
  SHOW_IMAGE: true, 
  IMAGE_SOURCE: require('../../assets/images/landing-bg.png'),
  DEFAULT_GRADIENT: [THEME.COLORS.deepAsphalt, '#000000'] 
};
// ═════════════════════════════════════════════════════════════════════════

export default function LandingScreen({ navigation }) {
  const [showTerms, setShowTerms] = useState(false);

  // --- ANIMATIONS ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {renderBackground(
        <View style={styles.contentContainer}>
          
          {/* HEADER SECTION */}
          <Animated.View style={[styles.headerSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            
            {/* LOGO CORRIGÉ : Remplissage complet */}
            <View style={styles.logoContainer}>
               <Image 
                 source={require('../../assets/logo.png')} 
                 style={styles.logoImage} 
                 // cover = Remplit le cercle sans déformer
                 resizeMode="cover" 
               />
            </View>

            <Text style={styles.brandTitle}>YÉLY</Text>
            <Text style={styles.tagline}>L'EXCELLENCE À MAFÉRÉ</Text>
          </Animated.View>

          {/* BOTTOM SECTION */}
          <Animated.View style={[styles.bottomSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            
            {/* DESCRIPTION MISE À JOUR : Maféré */}
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

            {/* COPYRIGHT PRO */}
            <Text style={styles.copyright}>© 2026 Yély • v1.0.0</Text>
          </Animated.View>
        </View>
      )}

      {/* MODAL CONDITIONS D'UTILISATION */}
      <GlassModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
        title="CONDITIONS GÉNÉRALES"
      >
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
        
        <View style={{ height: 20 }} />
        
        <GoldButton 
          title="J'AI COMPRIS" 
          onPress={() => setShowTerms(false)}
          style={{ marginBottom: 10 }}
        />
      </GlassModal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backgroundImage: { flex: 1, width: width, height: height },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.xl,
    paddingTop: height * 0.15,
    paddingBottom: THEME.SPACING.xl,
  },
  
  // HEADER
  headerSection: { alignItems: 'center' },
  logoContainer: {
    width: 110, 
    height: 110,
    borderRadius: 55,
    // On clip pour que l'image ne dépasse pas du cercle
    overflow: 'hidden', 
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)'
  },
  logoImage: {
    // 🛠️ CORRECTION : Remplissage 100% du conteneur
    width: '100%',  
    height: '100%',
    // Plus besoin de borderRadius ici, c'est le parent qui gère
  },
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

  // BOTTOM SECTION
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
    color: THEME.COLORS.textTertiary,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  copyright: {
    color: '#555',
    fontSize: 10,
    marginTop: 20,
    fontWeight: '500'
  },

  // MODAL STYLES
  termsContent: { color: '#FFF', lineHeight: 20, fontSize: 14 },
  boldGold: { color: THEME.COLORS.champagneGold, fontWeight: 'bold', fontSize: 16 }
});