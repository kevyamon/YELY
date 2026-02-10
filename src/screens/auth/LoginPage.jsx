// src/screens/auth/LoginPage.jsx

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import GlassInput from '../../components/ui/GlassInput';
import GoldButton from '../../components/ui/GoldButton';
import socketService from '../../services/socketService';
import { useLoginMutation } from '../../store/api/usersApiSlice';
import { setCredentials } from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast, showToast } from '../../store/slices/uiSlice';
import { COLORS, FONTS, SHADOWS, SPACING } from '../../theme/theme';

const LoginPage = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [login, { isLoading }] = useLoginMutation();

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      dispatch(showToast({
        type: 'warning',
        title: 'Champs requis',
        message: 'Veuillez remplir tous les champs.',
      }));
      return;
    }

    try {
      const res = await login({ identifier: identifier.trim(), password }).unwrap();

      dispatch(setCredentials({
        user: res.user,
        token: res.token,
      }));

      socketService.connect(res.token);

      dispatch(showSuccessToast({
        title: `Bienvenue ${res.user.name} !`,
        message: 'Connexion réussie.',
      }));
    } catch (err) {
      const errorMsg = err?.data?.message || 'Erreur de connexion. Vérifiez vos identifiants.';
      dispatch(showErrorToast({
        title: 'Échec de connexion',
        message: errorMsg,
      }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header avec bouton retour */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          {/* Logo et Titre */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.title}>Bon retour</Text>
            <Text style={styles.subtitle}>
              Connectez-vous avec votre email ou votre numéro de téléphone
            </Text>
          </Animated.View>

          {/* Formulaire */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.formSection}>
            <GlassInput
              label="Email ou Téléphone"
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="exemple@mail.com ou 07XXXXXXXX"
              keyboardType="email-address"
              autoCapitalize="none"
              icon="person-outline"
            />

            <GlassInput
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              placeholder="Votre mot de passe"
              secureTextEntry
              icon="lock-closed-outline"
            />

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Bouton de connexion */}
          <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.actionSection}>
            <GoldButton
              title="SE CONNECTER"
              onPress={handleLogin}
              loading={isLoading}
              icon="log-in-outline"
            />

            <View style={styles.registerLink}>
              <Text style={styles.registerLinkText}>Pas encore de compte ? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLinkAction}>S'inscrire</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepAsphalt,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.huge,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.glassLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: SPACING.huge,
    marginBottom: SPACING.xxxl,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.champagneGold,
    marginBottom: SPACING.xl,
    ...SHADOWS.goldSoft,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: FONTS.sizes.h1,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  formSection: {
    marginBottom: SPACING.xl,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -SPACING.sm,
  },
  forgotPasswordText: {
    color: COLORS.champagneGold,
    fontSize: FONTS.sizes.bodySmall,
    fontWeight: FONTS.weights.medium,
  },
  actionSection: {
    marginTop: SPACING.xl,
  },
  registerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xxl,
  },
  registerLinkText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.bodySmall,
  },
  registerLinkAction: {
    color: COLORS.champagneGold,
    fontSize: FONTS.sizes.bodySmall,
    fontWeight: FONTS.weights.bold,
  },
});

export default LoginPage;