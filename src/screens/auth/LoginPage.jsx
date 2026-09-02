// src/screens/auth/LoginPage.jsx
// ECRAN DE CONNEXION - Standard Phone / Email & Securite Renforcee
// STANDARD: Industriel / Bank Grade (Modularise < 325 lignes, Sans Emojis)

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { LayoutAnimation, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
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
import { getApiErrorMessage } from '../../utils/errorHelper';
import THEME from '../../theme/theme';

const LoginPage = ({ navigation }) => {
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const { error } = useSelector((state) => state.ui);

  const [authMode, setAuthMode] = useState('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('CI');
  const [callingCode, setCallingCode] = useState('225');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    let identifier = '';
    if (authMode === 'phone') {
      if (!phoneNumber.trim()) {
        dispatch(showErrorToast({ title: "Champ requis", message: "Veuillez entrer votre numero de telephone." }));
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
      dispatch(showSuccessToast({ title: "Connexion reussie", message: `Bon retour parmi nous, ${user.name} !` }));
    } catch (err) {
      dispatch(showErrorToast({ 
        title: "Erreur de connexion", 
        message: getApiErrorMessage(err, "Identifiants incorrects.") 
      }));
    }
  };

  return (
    <AuthFormWrapper
      title="Bon retour"
      subtitle="Accedez a votre espace securise."
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
            {authMode === 'phone' ? 'Numero de Telephone' : 'Adresse E-mail'}
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
              {authMode === 'phone' ? 'Utiliser mon adresse e-mail' : 'Utiliser mon numero de telephone'}
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
      </View>

      <AuthActionLinks
        leftLabel="Mot de passe oublie ?"
        leftOnPress={() => navigation.navigate('ForgotPassword')}
        rightLabel="Creer un compte"
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