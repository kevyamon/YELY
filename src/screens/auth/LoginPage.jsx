// src/screens/auth/LoginPage.jsx
// ÉCRAN DE CONNEXION - Native Google Auth & Securite Renforcee
// STANDARD: Industriel / Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { LayoutAnimation, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import { Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import AuthActionLinks from '../../components/auth/AuthActionLinks';
import AuthFormWrapper from '../../components/auth/AuthFormWrapper';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton';
import GlassInput from '../../components/ui/GlassInput';
import GoldButton from '../../components/ui/GoldButton';
import PwaIOSWarningModal from '../../components/ui/PwaIOSWarningModal';

import { configureGoogleSignIn, signInWithGoogle } from '../../services/auth/googleAuth';
import { useLoginMutation, useGoogleAuthMutation } from '../../store/api/usersApiSlice';
import { setCredentials } from '../../store/slices/authSlice';
import { clearError, showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '874118617681-i438m7c4ti48b584o6u00omffvckhphd.apps.googleusercontent.com';

const LoginPage = ({ navigation }) => {
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [googleAuth, { isLoading: isGoogleLoading }] = useGoogleAuthMutation();

  const { error } = useSelector((state) => state.ui);

  const [authMode, setAuthMode] = useState('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('CI');
  const [callingCode, setCallingCode] = useState('225');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  const handleLogin = async () => {
    let identifier = '';
    if (authMode === 'phone') {
      if (!phoneNumber.trim()) {
        dispatch(showErrorToast({ title: "Champ requis", message: "Veuillez entrer votre numéro de téléphone." }));
        return;
      }
      const cleanPhone = phoneNumber.replace(/\s/g, '');
      identifier = `+${callingCode}${cleanPhone}`;
    } else {
      if (!email.trim()) {
        dispatch(showErrorToast({ title: "Champ requis", message: "Veuillez entrer votre adresse email." }));
        return;
      }
      identifier = email.trim();
    }

    if (!password) {
      dispatch(showErrorToast({ title: "Champ requis", message: "Veuillez entrer votre mot de passe." }));
      return;
    }

    try {
      const res = await login({ identifier, password, clientPlatform: Platform.OS }).unwrap();
      const { user, accessToken, refreshToken } = res.data;
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      dispatch(showSuccessToast({ title: "Connexion réussie", message: `Bon retour parmi nous, ${user.name} !` }));
    } catch (err) {
      dispatch(showErrorToast({ title: "Erreur de connexion", message: err?.data?.message || "Identifiants incorrects." }));
    }
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleSubmitting || isGoogleLoading) return;
    setIsGoogleSubmitting(true);

    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_WEB_CLIENT_ID,
            callback: async (response) => {
              if (response.credential) {
                try {
                  const res = await googleAuth({ idToken: response.credential, role: 'rider' }).unwrap();
                  const { user, accessToken, refreshToken } = res.data;
                  dispatch(setCredentials({ user, accessToken, refreshToken }));
                  dispatch(showSuccessToast({ title: "Connexion Google", message: `Bienvenue sur Yély, ${user.name} !` }));
                } catch (authErr) {
                  dispatch(showErrorToast({ title: "Authentification Google", message: authErr?.data?.message || "Échec de connexion." }));
                }
              }
            }
          });
          window.google.accounts.id.prompt();
        } else {
          dispatch(showErrorToast({ title: "Connexion Google", message: "Service Google indisponible sur ce navigateur." }));
        }
      } else {
        const googleResult = await signInWithGoogle();
        if (googleResult?.cancelled || googleResult?.inProgress) return;

        if (googleResult?.idToken) {
          const res = await googleAuth({
            idToken: googleResult.idToken,
            email: googleResult.email,
            name: googleResult.name,
            profilePicture: googleResult.profilePicture,
            role: 'rider'
          }).unwrap();

          const { user, accessToken, refreshToken } = res.data;
          dispatch(setCredentials({ user, accessToken, refreshToken }));
          dispatch(showSuccessToast({ title: "Connexion Google", message: `Bienvenue sur Yély, ${user.name} !` }));
        }
      }
    } catch (err) {
      if (err.message !== 'PLATFORM_WEB_GSI') {
        dispatch(showErrorToast({
          title: "Connexion Google",
          message: err?.message || err?.data?.message || "Impossible de se connecter avec Google."
        }));
      }
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <AuthFormWrapper
      title="Bon retour"
      subtitle="Accédez à votre espace sécurisé."
      onBack={() => navigation.navigate('Landing')}
      actionButton={
        <GoldButton
          title="Se connecter"
          onPress={handleLogin}
          loading={isLoading}
          icon="log-in-outline"
        />
      }
    >
      <View style={styles.formContainer}>
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {authMode === 'phone' ? 'Numéro de Téléphone' : 'Adresse E-mail'}
          </Text>

          {authMode === 'phone' ? (
            <View style={styles.inputRow}>
              <TouchableOpacity
                style={styles.countryPickerContainer}
                onPress={() => setShowCountryPicker(true)}
              >
                <CountryPicker
                  countryCode={countryCode}
                  withFilter
                  withFlag
                  withCallingCode
                  withAlphaFilter
                  onSelect={(country) => {
                    setCountryCode(country.cca2);
                    setCallingCode(country.callingCode[0]);
                  }}
                  visible={showCountryPicker}
                  onClose={() => setShowCountryPicker(false)}
                />
                <Text style={styles.callingCodeText}>+{callingCode}</Text>
                <Ionicons name="chevron-down" size={14} color={THEME.COLORS.textTertiary} style={{ marginLeft: 4 }} />
              </TouchableOpacity>

              <View style={styles.flexItem}>
                <GlassInput
                  value={phoneNumber}
                  onChangeText={(val) => {
                    setPhoneNumber(val);
                    if (error) dispatch(clearError());
                  }}
                  placeholder="07 08 09 10 11"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          ) : (
            <GlassInput
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (error) dispatch(clearError());
              }}
              placeholder="exemple@domaine.com"
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail-outline"
            />
          )}

          <TouchableOpacity
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setAuthMode(authMode === 'phone' ? 'email' : 'phone');
            }}
            style={styles.switchAuthModeBtn}
          >
            <Text style={styles.switchAuthModeText}>
              {authMode === 'phone' ? 'Utiliser mon adresse e-mail' : 'Utiliser mon numéro de téléphone'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Mot de Passe</Text>
          <GlassInput
            value={password}
            onChangeText={(val) => {
              setPassword(val);
              if (error) dispatch(clearError());
            }}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            icon="lock-closed-outline"
            rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowPassword(!showPassword)}
          />
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <GoogleAuthButton
          onPress={handleGoogleSignIn}
          loading={isGoogleLoading || isGoogleSubmitting}
          disabled={isGoogleLoading || isGoogleSubmitting}
        />
      </View>

      <AuthActionLinks
        leftLabel="Mot de passe oublié ?"
        leftOnPress={() => navigation.navigate('ForgotPassword')}
        rightLabel="Créer un compte"
        rightOnPress={() => navigation.navigate('Register')}
      />

      <PwaIOSWarningModal />
    </AuthFormWrapper>
  );
};

const styles = StyleSheet.create({
  formContainer: { gap: THEME.SPACING.md, marginTop: THEME.SPACING.md },
  inputGroup: { marginBottom: THEME.SPACING.xs },
  inputLabel: {
    color: THEME.COLORS.textSecondary,
    fontSize: THEME.FONTS.sizes.caption,
    fontWeight: THEME.FONTS.weights.semiBold,
    marginBottom: THEME.SPACING.xs,
    marginLeft: THEME.SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputRow: { flexDirection: 'row', gap: THEME.SPACING.sm, alignItems: 'center' },
  countryPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.SPACING.sm,
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: THEME.BORDERS.radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  callingCodeText: { color: THEME.COLORS.textPrimary, marginLeft: 4, fontWeight: '600', fontSize: 14 },
  flexItem: { flex: 1 },
  switchAuthModeBtn: { marginTop: 6, alignSelf: 'flex-end' },
  switchAuthModeText: { color: THEME.COLORS.primary, fontSize: 12, fontWeight: '600' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: THEME.SPACING.xs },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)' },
  dividerText: { color: THEME.COLORS.textTertiary, paddingHorizontal: 12, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  errorBox: {
    backgroundColor: 'rgba(192, 57, 43, 0.1)',
    paddingVertical: THEME.SPACING.md,
    paddingHorizontal: THEME.SPACING.lg,
    borderRadius: THEME.BORDERS.radius.md,
    marginBottom: THEME.SPACING.md,
    borderLeftWidth: 4,
    borderColor: THEME.COLORS.danger,
  },
  errorText: { color: THEME.COLORS.danger, fontSize: THEME.FONTS.sizes.bodySmall, fontWeight: THEME.FONTS.weights.medium }
});

export default LoginPage;