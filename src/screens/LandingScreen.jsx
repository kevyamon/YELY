// src/screens/auth/LandingPage.jsx

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import {
  Dimensions,
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
import GlassModal from '../../components/ui/GlassModal';
import GoldButton from '../../components/ui/GoldButton';
import { closeModal, openModal } from '../../store/slices/uiSlice';
import { COLORS, FONTS, SHADOWS, SPACING } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

const LandingPage = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { isModalOpen, modalType } = useSelector((state) => state.ui);

  // Animations d'entrée
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.8);
  const decorOpacity = useSharedValue(0);

  useEffect(() => {
    // Séquence d'animations
    titleOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    titleTranslateY.value = withDelay(200, withSpring(0, { damping: 20, stiffness: 150 }));
    subtitleOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
    buttonOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
    buttonScale.value = withDelay(800, withSpring(1, { damping: 12, stiffness: 180 }));
    decorOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const decorStyle = useAnimatedStyle(() => ({
    opacity: decorOpacity.value,
  }));

  const handleOrderPress = () => {
    dispatch(openModal({ type: 'decision' }));
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
        <View style={styles.logoMark}>
          <Text style={styles.logoLetter}>Y</Text>
        </View>
      </View>

      {/* Contenu central */}
      <View style={styles.contentSection}>
        <Animated.View style={titleStyle}>
          <Text style={styles.title}>YÉLY</Text>
          <Text style={styles.subtitle2}>Commander un taxi n'a jamais été aussi simple</Text>
        </Animated.View>

        <Animated.View style={subtitleStyle}>
          <Text style={styles.description}>
            Rejoignez des milliers d'utilisateurs qui font confiance à Yély pour leurs déplacements quotidiens.
          </Text>
        </Animated.View>
      </View>

      {/* Bouton d'action */}
      <Animated.View style={[styles.actionSection, buttonStyle]}>
        <GoldButton
          title="COMMANDER UN TAXI"
          onPress={handleOrderPress}
          size="large"
          icon={<Ionicons name="car-sport" size={22} color={COLORS.deepAsphalt} />}
        />

        <Text style={styles.footerText}>
          En continuant, vous acceptez nos{' '}
          <Text style={styles.linkText}>conditions d'utilisation</Text>
        </Text>
      </Animated.View>

      {/* Modale de Décision */}
      <GlassModal
        visible={isModalOpen && modalType === 'decision'}
        onClose={() => dispatch(closeModal())}
        position="center"
      >
        <View style={styles.modalContent}>
          <View style={styles.modalIcon}>
            <Ionicons name="person-circle-outline" size={48} color={COLORS.champagneGold} />
          </View>

          <Text style={styles.modalTitle}>Avez-vous un compte ?</Text>
          <Text style={styles.modalSubtitle}>
            Pour commander votre taxi, connectez-vous ou créez un compte gratuit.
          </Text>

          <View style={styles.modalButtons}>
            <GoldButton
              title="Oui, me connecter"
              onPress={() => handleDecision(true)}
              variant="primary"
              icon={<Ionicons name="log-in-outline" size={20} color={COLORS.deepAsphalt} />}
            />

            <View style={{ height: SPACING.md }} />

            <GoldButton
              title="Non, créer un compte"
              onPress={() => handleDecision(false)}
              variant="secondary"
              icon={<Ionicons name="person-add-outline" size={20} color={COLORS.moonlightWhite} />}
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
  // Décors d'ambiance
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
  // Logo
  logoSection: {
    flex: 0.3,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: COLORS.champagneGold,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.gold,
  },
  logoLetter: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.deepAsphalt,
    marginTop: -2,
  },
  // Contenu
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
  // Action
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
  // Modale
  modalContent: {
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: SPACING.lg,
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

export default LandingPage;