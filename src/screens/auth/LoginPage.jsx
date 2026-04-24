//src/screens/auth/LoginPage.jsx
import { useEffect, useState } from 'react';
import { LayoutAnimation, Platform, StyleSheet, View } from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import { Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import AuthActionLinks from '../../components/auth/AuthActionLinks';
import AuthFormWrapper from '../../components/auth/AuthFormWrapper';
import GlassInput from '../../components/ui/GlassInput';
import GoldButton from '../../components/ui/GoldButton';
import PwaIOSWarningModal from '../../components/ui/PwaIOSWarningModal';

import { useLoginMutation } from '../../store/api/usersApiSlice';
import { setCredentials } from '../../store/slices/authSlice';
import { clearError, showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const LoginPage = ({ navigation }) => {
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
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

  return (
    <AuthFormWrapper
      onBack={() => navigation.navigate('Landing')}
      actionButton={
        <View style={styles.actionButtonContainer}>
          <GoldButton
            title="Se connecter"
            onPress={handleLogin}
            loading={isLoading}
            icon="log-in-outline"
          />
        </View>
      }
    >
      <View style={styles.customHeader}>
        <Text style={styles.massiveTitle}>Bon retour</Text>
        <Text style={styles.subTitle}>Accédez à votre espace sécurisé.</Text>
      </View>

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
                    backgroundColor: THEME.COLORS.background,
                    onBackgroundTextColor: THEME.COLORS.textPrimary,
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
                placeholder="Tél ou Email"
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
      </View>

      <View style={styles.footerLinks}>
        <AuthActionLinks 
          leftLabel="Mot de passe oublié ?"
          leftOnPress={() => navigation.navigate('ForgotPassword')}
          rightLabel="Créer un compte"
          rightOnPress={() => navigation.navigate('Register')}
        />
      </View>

      <PwaIOSWarningModal 
        forceShow={showPwaModal} 
        onClose={() => setShowPwaModal(false)} 
        isDriver={true} 
      />
    </AuthFormWrapper>
  );
};

const styles = StyleSheet.create({
  customHeader: {
    marginBottom: THEME.SPACING.xxxl,
    marginTop: THEME.SPACING.sm,
  },
  massiveTitle: {
    fontSize: 42,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.primary,
    lineHeight: 48,
    letterSpacing: -1,
  },
  subTitle: {
    fontSize: THEME.FONTS.sizes.body,
    color: THEME.COLORS.textSecondary,
    marginTop: THEME.SPACING.sm,
    fontWeight: THEME.FONTS.weights.regular,
  },
  formContainer: {
    gap: THEME.SPACING.xl,
  },
  inputGroup: {
    marginBottom: THEME.SPACING.md,
  },
  inputLabel: {
    color: THEME.COLORS.textSecondary,
    fontSize: THEME.FONTS.sizes.caption,
    fontWeight: THEME.FONTS.weights.bold,
    marginBottom: THEME.SPACING.xs,
    marginLeft: THEME.SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  inputRow: {
    flexDirection: 'row',
    gap: THEME.SPACING.sm,
    alignItems: 'stretch',
  },
  countryPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    paddingHorizontal: THEME.SPACING.md,
    borderRadius: THEME.BORDERS.radius.lg,
    minHeight: THEME.DIMENSIONS.input.height,
    borderWidth: 0,
  },
  callingCodeText: {
    color: THEME.COLORS.textPrimary,
    marginLeft: THEME.SPACING.xs,
    fontWeight: THEME.FONTS.weights.semiBold,
    fontSize: THEME.FONTS.sizes.body,
  },
  flexItem: {
    flex: 1,
  },
  actionButtonContainer: {
    paddingTop: THEME.SPACING.md,
  },
  footerLinks: {
    marginTop: THEME.SPACING.xxl,
  },
  errorBox: {
    backgroundColor: 'rgba(192, 57, 43, 0.1)',
    paddingVertical: THEME.SPACING.md,
    paddingHorizontal: THEME.SPACING.lg,
    borderRadius: THEME.BORDERS.radius.md,
    marginBottom: THEME.SPACING.xl,
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