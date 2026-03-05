// src/screens/auth/ResetPasswordScreen.jsx
// CSCSM Level: Bank Grade

import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';
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
  
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleReset = async () => {
    if (otp.length !== 6) {
      dispatch(showErrorToast({ title: "Code incomplet", message: "Le code de sécurité doit contenir exactement 6 chiffres." }));
      return;
    }
    if (newPassword.length < 8) {
      dispatch(showErrorToast({ title: "Mot de passe faible", message: "Votre mot de passe doit faire au moins 8 caractères." }));
      return;
    }
    if (newPassword !== confirmPassword) {
      dispatch(showErrorToast({ title: "Saisie incorrecte", message: "Les mots de passe saisis ne sont pas identiques." }));
      return;
    }

    try {
      await resetPassword({ email, otp, newPassword }).unwrap();
      dispatch(showSuccessToast({ 
        title: "Succès", 
        message: "Votre mot de passe a été mis à jour. Vous pouvez vous connecter." 
      }));
      navigation.navigate('Login');
    } catch (err) {
      dispatch(showErrorToast({ 
        title: "Échec", 
        message: err?.data?.message || "Ce code de sécurité est incorrect ou a expiré." 
      }));
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSpacer} />
        <Text style={styles.title}>Nouveau mot de passe</Text>
        <Text style={styles.subtitle}>Saisissez le code reçu par mail.</Text>

        <View style={styles.form}>
          <GlassInput
            label="Code de sécurité"
            placeholder="000000"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            icon="key-outline"
          />
          <GlassInput
            label="Nouveau mot de passe"
            placeholder="••••••••"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            icon="lock-closed-outline"
          />
          <GlassInput
            label="Confirmer"
            placeholder="••••••••"
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  scrollContent: { padding: 25, alignItems: 'center' },
  headerSpacer: { height: 60 },
  title: { fontSize: 26, fontWeight: 'bold', color: THEME.COLORS.champagneGold },
  subtitle: { fontSize: 15, color: THEME.COLORS.textSecondary, marginTop: 10 },
  form: { width: '100%', marginTop: 30 },
  button: { marginTop: 20 },
});

export default ResetPasswordScreen;