import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, LayoutAnimation, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();
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
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
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

  const loadGoogleSdk = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.google && window.google.accounts) {
        resolve(true);
        return;
      }
      if (typeof document === 'undefined') {
        resolve(false);
        return;
      }
      const existingScript = document.getElementById('google-gsi-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true));
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  };

  const handleGoogleSignIn = async () => {
    if (Platform.OS === 'web') {
      try {
        const isLoaded = await loadGoogleSdk();
        if (!isLoaded || !window.google || !window.google.accounts) {
          dispatch(showErrorToast({ 
            title: "Connexion Google", 
            message: "Impossible de charger le service Google. Vérifiez votre connexion internet." 
          }));
          return;
        }

        window.google.accounts.id.initialize({
          client_id: GOOGLE_WEB_CLIENT_ID,
          callback: async (response) => {
            if (response.credential) {
              try {
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
              } catch (authErr) {
                dispatch(showErrorToast({ title: "Erreur Authentification", message: authErr?.data?.message || "Échec de l'authentification Google." }));
              }
            }
          }
        });

        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMomentum()) {
            // Si la pop-up One-Tap est bloquée, tente un rendu de bouton automatique
            window.google.accounts.id.renderButton(
              document.getElementById('google-auth-hidden-container') || document.body,
              { theme: 'outline', size: 'large' }
            );
          }
        });
      } catch (err) {
        dispatch(showErrorToast({ title: "Connexion Google", message: err?.data?.message || "Impossible de se connecter avec Google." }));
      }
    } else {
      try {
        const redirectUrl = 'https://auth.expo.io/@kevyllc/YELY';

        // Flux sécurisé par Code d'Autorisation (Authorization Code Flow) conforme aux règles Google 2026
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${GOOGLE_WEB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=openid%20email%20profile&prompt=select_account`;

        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

        if (result.type === 'success' && result.url) {
          const codeMatch = result.url.match(/code=([^&]+)/);
          const tokenMatch = result.url.match(/access_token=([^&]+)/) || result.url.match(/id_token=([^&]+)/);
          
          let accessToken = tokenMatch ? tokenMatch[1] : null;

          if (!accessToken && codeMatch && codeMatch[1]) {
            const authCode = decodeURIComponent(codeMatch[1]);
            const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                code: authCode,
                client_id: GOOGLE_WEB_CLIENT_ID,
                redirect_uri: redirectUrl,
                grant_type: 'authorization_code'
              }).toString()
            });
            const tokenData = await tokenRes.json();
            accessToken = tokenData.access_token;
          }

          if (accessToken) {
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            const userInfo = await userInfoRes.json();

            if (userInfo.email) {
              const res = await googleAuth({
                email: userInfo.email,
                name: userInfo.name || userInfo.given_name || userInfo.email.split('@')[0],
                profilePicture: userInfo.picture,
                role: 'rider'
              }).unwrap();

              const { user, accessToken: jwtAccess, refreshToken: jwtRefresh } = res.data;
              dispatch(setCredentials({ user, accessToken: jwtAccess, refreshToken: jwtRefresh }));
              dispatch(showSuccessToast({ title: "Connexion Google", message: `Bienvenue sur Yély, ${user.name} !` }));
              return;
            }
          }
        }
        
        if (result.type !== 'dismiss') {
          dispatch(showErrorToast({ title: "Connexion Google", message: "Authentification annulée." }));
        }
      } catch (mobileErr) {
        console.error('[GOOGLE AUTH MOBILE]', mobileErr);
        dispatch(showErrorToast({ title: "Connexion Google", message: mobileErr?.data?.message || "Échec de l'authentification Google." }));
      }
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
          onPress={async () => {
            if (isGoogleSubmitting || isGoogleLoading) return;
            setIsGoogleSubmitting(true);
            try {
              await handleGoogleSignIn();
            } finally {
              setTimeout(() => setIsGoogleSubmitting(false), 2000);
            }
          }}
          disabled={isGoogleLoading || isGoogleSubmitting}
          activeOpacity={0.8}
        >
          {isGoogleLoading || isGoogleSubmitting ? (
            <ActivityIndicator size="small" color="#EA4335" />
          ) : (
            <>
              <Ionicons name="logo-google" size={18} color="#EA4335" style={{ marginRight: 10 }} />
              <Text style={styles.googleAuthText}>Continuer avec Google</Text>
            </>
          )}
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