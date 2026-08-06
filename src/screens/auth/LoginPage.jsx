import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { LayoutAnimation, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import { Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import AuthActionLinks from '../../components/auth/AuthActionLinks';
import AuthFormWrapper from '../../components/auth/AuthFormWrapper';
import GlassInput from '../../components/ui/GlassInput';
import GoldButton from '../../components/ui/GoldButton';
import PwaIOSWarningModal from '../../components/ui/PwaIOSWarningModal';

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

  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [countryCode, setCountryCode] = useState('CI');
  const [callingCode, setCallingCode] = useState('225');
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);

  useEffect(() => {
    const isEmail = /[a-zA-Z@]/.test(formData.identifier);
    if (isEmail !== isEmailMode) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsEmailMode(isEmail);
    }
  }, [formData.identifier]);

  const handleLogin = async () => {
    if (!formData.identifier.trim() || !formData.password.trim()) {
      dispatch(showErrorToast({ title: "Informations manquantes", message: "Veuillez saisir votre identifiant et votre mot de passe." }));
      return;
    }

    try {
      let finalIdentifier = formData.identifier.trim();
      if (!isEmailMode) {
        const cleanPhone = finalIdentifier.replace(/\s/g, '');
        finalIdentifier = `+${callingCode}${cleanPhone}`;
      }

      const res = await login({ 
        ...formData, 
        identifier: finalIdentifier,
        clientPlatform: Platform.OS 
      }).unwrap();
      
      const { user, accessToken, refreshToken } = res.data;
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      dispatch(showSuccessToast({ title: "Connexion réussie", message: `Ravi de vous revoir, ${user.name.split(' ')[0]} !` }));
    } catch (err) {
      const errorMessage = err?.data?.message || "Vos identifiants sont incorrects. Veuillez réessayer.";
      if (errorMessage === 'DEVICE_NOT_SUPPORTED') {
        setShowPwaModal(true);
        return;
      }
      dispatch(showErrorToast({ title: "Connexion impossible", message: errorMessage }));
    }
  };

  const handleGoogleSignIn = async () => {
    if (Platform.OS === 'web') {
      try {
        if (!window.google || !window.google.accounts) {
          dispatch(showErrorToast({ 
            title: "Google Auth", 
            message: "Initialisation Google Auth Web en cours. Veuillez réessayer." 
          }));
          return;
        }
        window.google.accounts.id.initialize({
          client_id: GOOGLE_WEB_CLIENT_ID,
          callback: async (response) => {
            if (response.credential) {
              const base64Url = response.credential.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
              const payload = JSON.parse(jsonPayload);
              
              const res = await googleAuth({
                email: payload.email,
                name: payload.name,
                profilePicture: payload.picture,
                role: 'rider'
              }).unwrap();

              const { user, accessToken, refreshToken } = res.data;
              dispatch(setCredentials({ user, accessToken, refreshToken }));
              dispatch(showSuccessToast({ title: "Connexion Google", message: `Bienvenue, ${user.name} !` }));
            }
          }
        });
        window.google.accounts.id.prompt();
      } catch (err) {
        dispatch(showErrorToast({ title: "Connexion Google", message: err?.data?.message || "Impossible de se connecter avec Google." }));
      }
    } else {
      dispatch(showErrorToast({ 
        title: "Connexion Google", 
        message: "Redirection vers la fenêtre Google sécurisée..." 
      }));
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
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Identifiant</Text>
          <View style={styles.inputRow}>
            {!isEmailMode && (
              <View style={styles.countryPickerContainer}>
                <CountryPicker
                  countryCode={countryCode}
                  withFilter 
                  withFlag 
                  withCallingCode
                  theme={{
                    backgroundColor: THEME.COLORS.primary,
                    onBackgroundTextColor: THEME.COLORS.textInverse,
                  }}
                  onSelect={(c) => { 
                    setCountryCode(c.cca2); 
                    setCallingCode(c.callingCode[0]); 
                  }}
                />
                <Text style={styles.callingCodeText}>+{callingCode}</Text>
              </View>
            )}
            <View style={styles.flexItem}>
              <GlassInput
                icon={isEmailMode ? "mail-outline" : "call-outline"}
                placeholder="Téléphone ou Email"
                autoCapitalize="none"
                value={formData.identifier}
                onChangeText={(t) => {
                  setFormData({ ...formData, identifier: t });
                  if (error) dispatch(clearError());
                }}
              />
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Mot de passe</Text>
          <GlassInput
            icon="lock-closed-outline"
            placeholder="Votre mot de passe"
            secureTextEntry
            value={formData.password}
            onChangeText={(t) => {
              setFormData({ ...formData, password: t });
              if (error) dispatch(clearError());
            }}
          />
        </View>

        {/* BASSIN DE SÉPARATION & BOUTON GOOGLE AUTH */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity 
          style={styles.googleAuthButton} 
          onPress={handleGoogleSignIn}
          disabled={isGoogleLoading}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-google" size={18} color="#EA4335" style={{ marginRight: 10 }} />
          <Text style={styles.googleAuthText}>Continuer avec Google</Text>
        </TouchableOpacity>

      </View>

      <AuthActionLinks 
        leftLabel="Mot de passe oublié ?"
        leftOnPress={() => navigation.navigate('ForgotPassword')}
        rightLabel="Créer un compte"
        rightOnPress={() => navigation.navigate('Register')}
      />

      <PwaIOSWarningModal 
        forceShow={showPwaModal} 
        onClose={() => setShowPwaModal(false)} 
        isDriver={true} 
      />
    </AuthFormWrapper>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    gap: THEME.SPACING.md,
    marginTop: THEME.SPACING.lg,
  },
  inputGroup: {
    marginBottom: THEME.SPACING.xs,
  },
  inputLabel: {
    color: THEME.COLORS.textSecondary,
    fontSize: THEME.FONTS.sizes.caption,
    fontWeight: THEME.FONTS.weights.semiBold,
    marginBottom: THEME.SPACING.xs,
    marginLeft: THEME.SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputRow: {
    flexDirection: 'row',
    gap: THEME.SPACING.sm,
    alignItems: 'center',
  },
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
  callingCodeText: {
    color: THEME.COLORS.textPrimary,
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 14,
  },
  flexItem: {
    flex: 1,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: THEME.SPACING.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    color: THEME.COLORS.textTertiary,
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  googleAuthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: THEME.BORDERS.radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  googleAuthText: {
    color: THEME.COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: 'rgba(192, 57, 43, 0.1)',
    paddingVertical: THEME.SPACING.md,
    paddingHorizontal: THEME.SPACING.lg,
    borderRadius: THEME.BORDERS.radius.md,
    marginBottom: THEME.SPACING.md,
    borderLeftWidth: 4,
    borderColor: THEME.COLORS.danger,
  },
  errorText: {
    color: THEME.COLORS.danger,
    fontSize: THEME.FONTS.sizes.bodySmall,
    fontWeight: THEME.FONTS.weights.medium,
  }
});

export default LoginPage;