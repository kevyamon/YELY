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
          <View style={styles.goldInputContainer}>
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
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Mot de passe</Text>
          <View style={styles.goldInputContainer}>
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
    gap: THEME.SPACING.lg,
    marginTop: THEME.SPACING.xxl,
  },
  inputGroup: {
    marginBottom: THEME.SPACING.xs,
  },
  inputLabel: {
    color: THEME.COLORS.textSecondary,
    fontSize: THEME.FONTS.sizes.caption,
    fontWeight: THEME.FONTS.weights.semiBold,
    marginBottom: THEME.SPACING.sm,
    marginLeft: THEME.SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  goldInputContainer: {
    backgroundColor: THEME.COLORS.primary,
    borderRadius: THEME.BORDERS.radius.lg,
    padding: THEME.BORDERS.width.thick,
  },
  inputRow: {
    flexDirection: 'row',
    gap: THEME.SPACING.sm,
    alignItems: 'stretch',
    backgroundColor: THEME.COLORS.background,
    borderRadius: THEME.BORDERS.radius.lg - THEME.BORDERS.width.thick,
  },
  countryPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: THEME.SPACING.md,
    backgroundColor: THEME.COLORS.background,
    borderTopLeftRadius: THEME.BORDERS.radius.lg - THEME.BORDERS.width.thick,
    borderBottomLeftRadius: THEME.BORDERS.radius.lg - THEME.BORDERS.width.thick,
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