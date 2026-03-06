// src/screens/SplashScreen.jsx

import { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, FONTS, SHADOWS, SPACING } from '../theme/theme';

const SplashScreen = ({ isWakingUp }) => {
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withSequence(
      withSpring(1.1, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 15, stiffness: 150 })
    );
    textOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logoImage}
          resizeMode="cover"
        />
      </Animated.View>

      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={styles.appName}>YÉLY</Text>
        <Text style={styles.tagline}>Votre course, votre confort</Text>
      </Animated.View>

      {/* Bouclier UX : Affiché uniquement si le serveur Render met du temps à se réveiller */}
      {isWakingUp && (
        <Animated.View entering={FadeIn.delay(300)} style={styles.wakeupContainer}>
          <ActivityIndicator size="large" color={COLORS.champagneGold} />
          <Text style={styles.wakeupText}>Connexion au réseau sécurisé Yély...</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepAsphalt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: COLORS.champagneGold,
    marginBottom: SPACING.xxl,
    ...SHADOWS.gold,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.champagneGold,
    letterSpacing: 8,
  },
  tagline: {
    fontSize: FONTS.sizes.bodySmall,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    letterSpacing: 1,
  },
  wakeupContainer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  wakeupText: {
    color: COLORS.champagneGold,
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.bodySmall,
    opacity: 0.9,
    letterSpacing: 0.5,
  }
});

export default SplashScreen;