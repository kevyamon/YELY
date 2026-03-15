// src/screens/auth/ResetPasswordScreen.jsx
// CSCSM Level: Bank Grade (Securite Cryptographique & Z-Index Fix)

import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';
import PasswordStrengthInput from '../../components/auth/PasswordStrengthInput';
import GlassInput from '../../components/ui/GlassInput';
import GoldButton from '../../components/ui/GoldButton';
import { useResetPasswordMutation } from '../../store/api/usersApiSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const ResetPasswordScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { email } = route.params;
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordScore, setPasswordScore] = useState(0);
  
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleReset = async () => {
    if (otp.length !== 6) {
      dispatch(showErrorToast({ title: "Code incomplet", message: "Le code de securite doit contenir exactement 6 chiffres." }));
      return;
    }
    if (passwordScore < 1) {
      dispatch(showErrorToast({ title: "Mot de passe faible", message: "Le nouveau mot de passe doit respecter tous les criteres de securite (12 caracteres minimum, majuscule, chiffre, symbole)." }));
      return;
    }
    if (newPassword !== confirmPassword) {
      dispatch(showErrorToast({ title: "Saisie incorrecte", message: "Les mots de passe saisis ne sont pas identiques." }));
      return;
    }

    try {
      await resetPassword({ email, otp, newPassword }).unwrap();
      dispatch(showSuccessToast({ 
        title: "Succes", 
        message: "Votre mot de passe a ete mis a jour. Vous pouvez vous connecter." 
      }));
      navigation.navigate('Login');
    } catch (err) {
      dispatch(showErrorToast({ 
        title: "Echec", 
        message: err?.data?.message || "Ce code de securite est incorrect ou a expire." 
      }));
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerSpacer} />
        <Text style={styles.title}>Nouveau mot de passe</Text>
        <Text style={styles.subtitle}>Saisissez le code recu par mail.</Text>

        <View style={styles.form}>
          
          {/* Zone Superieure (Arriere-plan relatif) */}
          <View style={styles.upperFields}>
            <GlassInput
              placeholder="000000"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              icon="key-outline"
            />
          </View>

          {/* Zone Centrale (Premier plan absolu pour la modale de suggestion) */}
          <View style={styles.passwordWrapper}>
            <PasswordStrengthInput
              password={newPassword}
              setPassword={setNewPassword}
              onStrengthChange={setPasswordScore}
            />
          </View>

          {/* Zone Inferieure (Passe sous la modale de suggestion) */}
          <View style={styles.lowerSection}>
            <GlassInput
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              icon="checkmark-circle-outline"
            />
            
            <GoldButton
              title="CONFIRMER"
              onPress={handleReset}
              loading={isLoading}
              style={styles.button}
            />
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: THEME.COLORS.background 
  },
  scrollContent: { 
    padding: THEME.SPACING.xxl, 
    alignItems: 'center' 
  },
  headerSpacer: { 
    height: 60 
  },
  title: { 
    fontSize: THEME.FONTS.sizes.h2, 
    fontWeight: THEME.FONTS.weights.bold, 
    color: THEME.COLORS.champagneGold 
  },
  subtitle: { 
    fontSize: THEME.FONTS.sizes.body, 
    color: THEME.COLORS.textSecondary, 
    marginTop: THEME.SPACING.sm 
  },
  form: { 
    width: '100%', 
    marginTop: THEME.SPACING.xxl 
  },
  upperFields: { 
    zIndex: 1 
  },
  passwordWrapper: {
    minHeight: 110,
    justifyContent: 'flex-start',
    zIndex: 999,
    elevation: 10,
    position: 'relative'
  },
  lowerSection: { 
    zIndex: 1, 
    elevation: 1 
  },
  button: { 
    marginTop: THEME.SPACING.xl 
  },
});

export default ResetPasswordScreen;