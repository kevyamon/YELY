// src/screens/LandingScreen.jsx
// LANDING PAGE - LUXURY & IDENTITY
// CSCSM Level: High-End UI

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Assure-toi d'avoir installé expo-linear-gradient
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ImageBackground,
  ScrollView,
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

export default function LandingScreen({ navigation }) {
  const [showTerms, setShowTerms] = useState(false);

  // --- ANIMATIONS ---
  const fadeAnim = useRef(new Animated.Value(0)).current;  // Opacité initiale 0
  const slideAnim = useRef(new Animated.Value(50)).current; // Position initiale +50px (plus bas)

  useEffect(() => {
    // Lancement de l'animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true, // Glisse vers sa position naturelle (0)
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 1. BACKGROUND IMMERSIF */}
      {/* Remplace l'image par une belle photo de ville de nuit ou voiture de luxe */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1493238792015-fa093a3093a1?q=80&w=1920&auto=format&fit=crop' }} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Dégradé sombre pour lisibilité */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)', '#000000']}
          style={styles.gradientOverlay}
        />

        {/* 2. CONTENU ANIMÉ */}
        <View style={styles.contentContainer}>
          
          {/* LOGO & TITRE */}
          <Animated.View style={[styles.headerSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.logoContainer}>
               {/* Si tu as un logo image, remplace l'icône par <Image ... /> */}
               <Ionicons name="car-sport" size={64} color={THEME.COLORS.champagneGold} />
            </View>
            <Text style={styles.brandTitle}>YÉLY</Text>
            <Text style={styles.tagline}>L'EXCELLENCE EN MOUVEMENT</Text>
          </Animated.View>

          {/* ACTION SECTION (Bas de page) */}
          <Animated.View style={[styles.bottomSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            
            <Text style={styles.description}>
              Réservez des chauffeurs professionnels et vivez une expérience de transport sûre, élégante et fiable à Abidjan.
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

            <Text style={styles.copyright}>v1.0.0 • Made with ❤️ in Babi</Text>
          </Animated.View>
        </View>
      </ImageBackground>

      {/* 3. MODAL CONDITIONS D'UTILISATION (Activé !) */}
      <GlassModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
        title="CONDITIONS GÉNÉRALES"
      >
        <ScrollView style={styles.termsScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.termsContent}>
            <Text style={styles.boldGold}>1. ACCEPTATION DES CONDITIONS</Text>{"\n"}
            En utilisant l'application Yély, vous acceptez d'être lié par les présentes conditions d'utilisation.{"\n"}{"\n"}

            <Text style={styles.boldGold}>2. SÉCURITÉ ET RESPONSABILITÉ</Text>{"\n"}
            Yély s'engage à connecter les passagers avec des chauffeurs vérifiés. Toutefois, les chauffeurs sont des prestataires indépendants.{"\n"}{"\n"}

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
        </ScrollView>
      </GlassModal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backgroundImage: { flex: 1, width: width, height: height },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject, // Couvre toute l'image
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between', // Sépare haut et bas
    paddingHorizontal: THEME.SPACING.xl,
    paddingTop: height * 0.15,
    paddingBottom: THEME.SPACING.xl,
  },
  
  // HEADER
  headerSection: { alignItems: 'center' },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)', // Cercle subtil
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)'
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
    marginTop: 20
  },

  // MODAL STYLES
  termsScroll: { flex: 1 },
  termsContent: { color: '#FFF', lineHeight: 20, fontSize: 14 },
  boldGold: { color: THEME.COLORS.champagneGold, fontWeight: 'bold', fontSize: 16 }
});