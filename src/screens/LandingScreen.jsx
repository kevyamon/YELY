// src/screens/LandingScreen.jsx

import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import {
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import GlassModal from '../components/ui/GlassModal';
import GoldButton from '../components/ui/GoldButton';
import {
  closeModal,
  openModal,
  selectModal,
} from '../store/slices/uiSlice';
import { COLORS, FONTS, SHADOWS, SPACING } from '../theme/theme';

const { width, height } = Dimensions.get('window');

const LandingScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const modal = useSelector(selectModal);

  // Animations d'entrée
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.5);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.8);
  const decorOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 500 }));
    logoScale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 180 }));
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    titleTranslateY.value = withDelay(400, withSpring(0, { damping: 20, stiffness: 150 }));
    subtitleOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    buttonOpacity.value = withDelay(1000, withTiming(1, { duration: 400 }));
    buttonScale.value = withDelay(1000, withSpring(1, { damping: 12, stiffness: 180 }));
    decorOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const decorStyle = useAnimatedStyle(() => ({
    opacity: decorOpacity.value,
  }));

  const handleOrderPress = () => {
    dispatch(openModal({ type: 'decision', position: 'center' }));
  };

  const handleDecision = (hasAccount) => {
    dispatch(closeModal());
    if (hasAccount) {
      navigation.navigate('Login');
    } else {
      navigation.navigate('Register');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.deepAsphalt} />

      {/* Éléments décoratifs */}
      <Animated.View style={[styles.decorCircle1, decorStyle]} />
      <Animated.View style={[styles.decorCircle2, decorStyle]} />

      {/* Logo */}
      <View style={styles.logoSection}>
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </Animated.View>
      </View>

      {/* Contenu central */}
      <View style={styles.contentSection}>
        <Animated.View style={titleStyle}>
          <Text style={styles.title}>YÉLY</Text>
          <Text style={styles.subtitle2}>
            Commander un taxi n'a jamais été aussi simple
          </Text>
        </Animated.View>

        <Animated.View style={subtitleStyle}>
          <Text style={styles.description}>
            Rejoignez des milliers d'utilisateurs qui font confiance à Yély
            pour leurs déplacements quotidiens.
          </Text>
        </Animated.View>
      </View>

      {/* Bouton d'action */}
      <Animated.View style={[styles.actionSection, buttonAnimStyle]}>
        <GoldButton
          title="COMMANDER UN TAXI"
          onPress={handleOrderPress}
          size="large"
          icon="car-sport"
        />

        <Text style={styles.footerText}>
          En continuant, vous acceptez nos{' '}
          <Text style={styles.linkText}>conditions d'utilisation</Text>
        </Text>
      </Animated.View>

      {/* Modale de Décision */}
      <GlassModal
        visible={modal.visible && modal.type === 'decision'}
        onClose={() => dispatch(closeModal())}
        position="center"
      >
        <View style={styles.modalContent}>
          <View style={styles.modalLogoContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.modalLogoImage}
              resizeMode="cover"
            />
          </View>

          <Text style={styles.modalTitle}>Avez-vous un compte ?</Text>
          <Text style={styles.modalSubtitle}>
            Pour commander votre taxi, connectez-vous ou créez un compte
            gratuit.
          </Text>

          <View style={styles.modalButtons}>
            <GoldButton
              title="Oui, me connecter"
              onPress={() => handleDecision(true)}
              variant="primary"
              icon="log-in-outline"
            />

            <View style={{ height: SPACING.md }} />

            <GoldButton
              title="Non, créer un compte"
              onPress={() => handleDecision(false)}
              variant="secondary"
              icon="person-add-outline"
            />
          </View>
        </View>
      </GlassModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepAsphalt,
    paddingHorizontal: SPACING.xxl,
  },
  decorCircle1: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(212, 175, 55, 0.04)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: 100,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(212, 175, 55, 0.03)',
  },

  // ─── LOGO ───
  logoSection: {
    flex: 0.3,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.champagneGold,
    ...SHADOWS.gold,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },

  // ─── CONTENU ───
  contentSection: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 44,
    fontWeight: '900',
    color: COLORS.champagneGold,
    letterSpacing: 10,
    textAlign: 'center',
  },
  subtitle2: {
    fontSize: FONTS.sizes.body,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontWeight: FONTS.weights.medium,
  },
  description: {
    fontSize: FONTS.sizes.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },

  // ─── ACTION ───
  actionSection: {
    flex: 0.3,
    justifyContent: 'center',
    paddingBottom: SPACING.huge,
  },
  footerText: {
    color: COLORS.textTertiary,
    fontSize: FONTS.sizes.caption,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  linkText: {
    color: COLORS.champagneGold,
    textDecorationLine: 'underline',
  },

  // ─── MODALE ───
  modalContent: {
    alignItems: 'center',
  },
  modalLogoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.champagneGold,
    marginBottom: SPACING.lg,
    ...SHADOWS.goldSoft,
  },
  modalLogoImage: {
    width: '100%',
    height: '100%',
  },
  modalTitle: {
    fontSize: FONTS.sizes.h3,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  modalSubtitle: {
    fontSize: FONTS.sizes.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xxl,
  },
  modalButtons: {
    width: '100%',
  },
});

export default LandingScreen;