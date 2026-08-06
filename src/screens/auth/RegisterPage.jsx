import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import AuthActionLinks from '../../components/auth/AuthActionLinks';
import AuthFormWrapper from '../../components/auth/AuthFormWrapper';
import PasswordStrengthInput from '../../components/auth/PasswordStrengthInput';
import PhoneInputGroup from '../../components/auth/PhoneInputGroup';
import TermsModal from '../../components/auth/TermsModal';
import GlassInput from '../../components/ui/GlassInput';
import GlassModal from '../../components/ui/GlassModal';
import GoldButton from '../../components/ui/GoldButton';

import { useRegisterMutation, useGoogleAuthMutation } from '../../store/api/usersApiSlice';
import { setCredentials } from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';
import { ERROR_MESSAGES, VALIDATORS } from '../../utils/validators';

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '874118617681-i438m7c4ti48b584o6u00omffvckhphd.apps.googleusercontent.com';

const RegisterPage = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const [googleAuth, { isLoading: isGoogleLoading }] = useGoogleAuthMutation();
  
  const [role, setRole] = useState(route.params?.role?.toLowerCase() || 'rider');
  const [countryCode, setCountryCode] = useState('CI');
  const [callingCode, setCallingCode] = useState('225');
  const [passwordScore, setPasswordScore] = useState(0);
  const [showDriverRestrictionModal, setShowDriverRestrictionModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });

  const handleRoleSelection = (selectedRole) => {
    if (selectedRole === 'driver' && Platform.OS !== 'android') {
      setShowDriverRestrictionModal(true);
      return;
    }
    setRole(selectedRole);
  };

  const validateFormAndShowTerms = () => {
    const { name, email, password, phone } = formData;
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      dispatch(showErrorToast({ title: "Informations manquantes", message: "Veuillez remplir tous les champs." }));
      return;
    }
    if (!VALIDATORS.name(name)) {
      dispatch(showErrorToast({ title: "Nom invalide", message: ERROR_MESSAGES.name }));
      return;
    }
    if (!VALIDATORS.email(email)) {
      dispatch(showErrorToast({ title: "Email invalide", message: ERROR_MESSAGES.email }));
      return;
    }
    if (passwordScore < 1 && password.length < 8) { 
       dispatch(showErrorToast({ title: "Mot de passe trop faible", message: "Votre mot de passe doit contenir au moins 8 caractères, un chiffre et un symbole." }));
       return;
    }
    setShowTermsModal(true);
  };

  const executeRegistration = async () => {
    try {
      let finalPhone = formData.phone.replace(/\s/g, '').trim();
      if (!finalPhone.startsWith('+')) finalPhone = `+${callingCode}${finalPhone}`;
      const res = await register({ ...formData, phone: finalPhone, role }).unwrap();
      const { user, accessToken, refreshToken } = res.data;
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      setShowTermsModal(false);
      dispatch(showSuccessToast({ title: "Bienvenue sur Yély", message: "Votre compte a été créé avec succès." }));
    } catch (err) {
      setShowTermsModal(false);
      const errorMessage = err?.data?.errors?.[0]?.message || err?.data?.message || "Une erreur est survenue.";
      dispatch(showErrorToast({ title: "Inscription impossible", message: errorMessage }));
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
                  role: role || 'rider'
                }).unwrap();

                const { user, accessToken, refreshToken } = res.data;
                dispatch(setCredentials({ user, accessToken, refreshToken }));
                dispatch(showSuccessToast({ title: "Connexion Google", message: `Bienvenue sur Yély, ${user.name} !` }));
              } catch (authErr) {
                dispatch(showErrorToast({ title: "Erreur Authentification", message: authErr?.data?.message || "Échec de l'inscription Google." }));
              }
            }
          }
        });

        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMomentum()) {
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
      dispatch(showErrorToast({ 
        title: "Connexion Google Mobile", 
        message: "Veuillez utiliser la version Web/PWA pour la connexion Google 1-clic." 
      }));
    }
  };

  return (
    <AuthFormWrapper
      title="Créer un compte"
      onBack={() => navigation.navigate('Landing')}
      actionButton={
        <GoldButton 
          title="S'inscrire" 
          onPress={validateFormAndShowTerms} 
          loading={isLoading} 
        />
      }
    >
      <View style={styles.roleContainer}>
        {['rider', 'driver', 'seller'].map((r) => (
          <TouchableOpacity 
            key={r}
            style={[styles.roleBtn, role === r && styles.roleBtnActive]} 
            onPress={() => handleRoleSelection(r)}
          >
            <Ionicons 
              name={r === 'rider' ? 'person' : r === 'driver' ? 'car' : 'storefront'} 
              size={16} 
              color={role === r ? THEME.COLORS.textInverse : THEME.COLORS.primary} 
            />
            <Text 
              style={[styles.roleText, role === r && styles.roleTextActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {r === 'rider' ? 'Passager' : r === 'driver' ? 'Chauffeur' : 'Vendeur'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nom complet</Text>
          <GlassInput 
            icon="person-outline" 
            placeholder="Votre nom complet" 
            value={formData.name} 
            onChangeText={(t) => setFormData({ ...formData, name: t })} 
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Téléphone</Text>
          <PhoneInputGroup 
            phone={formData.phone} 
            setPhone={(t) => setFormData({ ...formData, phone: t })} 
            countryCode={countryCode} 
            setCountryCode={setCountryCode} 
            callingCode={callingCode} 
            setCallingCode={setCallingCode} 
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Adresse email</Text>
          <GlassInput 
            icon="mail-outline" 
            placeholder="Votre adresse email" 
            keyboardType="email-address" 
            autoCapitalize="none" 
            value={formData.email} 
            onChangeText={(t) => setFormData({ ...formData, email: t })} 
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Mot de passe</Text>
          <PasswordStrengthInput 
            password={formData.password} 
            setPassword={(t) => setFormData({ ...formData, password: t })} 
            onStrengthChange={setPasswordScore} 
          />
        </View>

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
          <Text style={styles.googleAuthText}>S'inscrire avec Google</Text>
        </TouchableOpacity>
      </View>

      <AuthActionLinks 
        subLabel="Déjà membre ?"
        subActionLabel="Se connecter"
        subOnPress={() => navigation.navigate('Login')}
      />

      <GlassModal 
        visible={showDriverRestrictionModal} 
        onClose={() => setShowDriverRestrictionModal(false)} 
        title="Appareil non compatible" 
        icon="phone-portrait-outline"
      >
        <Text style={styles.modalText}>
          L'application Chauffeur n'est disponible que sur <Text style={styles.boldPrimary}>Android</Text>.
        </Text>
        <GoldButton 
          title="J'ai compris" 
          onPress={() => setShowDriverRestrictionModal(false)} 
          style={styles.modalBtn}
        />
      </GlassModal>

      <TermsModal 
        visible={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
        onAccept={executeRegistration} 
        isLoading={isLoading} 
      />
    </AuthFormWrapper>
  );
};

const styles = StyleSheet.create({
  roleContainer: { 
    flexDirection: 'row', 
    gap: THEME.SPACING.sm, 
    marginBottom: THEME.SPACING.lg,
    marginTop: THEME.SPACING.sm,
  },
  roleBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 10, 
    paddingHorizontal: THEME.SPACING.xs,
    borderRadius: THEME.BORDERS.radius.pill, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.12)', 
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  roleBtnActive: { 
    backgroundColor: THEME.COLORS.primary, 
    borderColor: THEME.COLORS.primaryDark,
    ...THEME.SHADOWS.gold,
  },
  roleText: { 
    marginLeft: 4, 
    fontWeight: '700', 
    fontSize: 13,
    color: THEME.COLORS.primary,
  },
  roleTextActive: { 
    color: THEME.COLORS.textInverse,
  },
  formContainer: {
    gap: THEME.SPACING.md,
  },
  inputGroup: { 
    marginBottom: THEME.SPACING.xs 
  },
  inputLabel: { 
    color: THEME.COLORS.textSecondary, 
    fontSize: THEME.FONTS.sizes.caption, 
    fontWeight: THEME.FONTS.weights.semiBold, 
    marginBottom: THEME.SPACING.xs, 
    marginLeft: THEME.SPACING.xs, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
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
  modalText: { 
    color: THEME.COLORS.textPrimary, 
    fontSize: THEME.FONTS.sizes.body, 
    textAlign: 'center', 
    lineHeight: 22, 
    marginBottom: THEME.SPACING.md 
  },
  boldPrimary: { 
    fontWeight: 'bold', 
    color: THEME.COLORS.primary 
  },
  modalBtn: { 
    marginTop: THEME.SPACING.lg 
  }
});

export default RegisterPage;