// src/screens/auth/ResetPasswordScreen.jsx
// CSCSM Level: Bank Grade

import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import GlassInput from '../../components/ui/GlassInput';
import GoldButton from '../../components/ui/GoldButton';
import { useResetPasswordMutation } from '../../store/api/usersApiSlice';
import THEME from '../../theme/theme';

const ResetPasswordScreen = ({ route, navigation }) => {
  const { email } = route.params;
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleReset = async () => {
    if (otp.length !== 6) {
      Alert.alert("Erreur", "Le code doit contenir 6 chiffres.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Erreur", "Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      await resetPassword({ email, otp, newPassword }).unwrap();
      Alert.alert("Succès", "Votre mot de passe a été modifié. Connectez-vous avec vos nouveaux identifiants.", [
        { text: "OK", onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err) {
      Alert.alert("Erreur", err?.data?.message || "Code invalide ou expiré.");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSpacer} />
        
        <Text style={styles.title}>Nouveau mot de passe</Text>
        <Text style={styles.subtitle}>
          Saisissez le code envoyé à {email} ainsi que votre nouveau mot de passe.
        </Text>

        <View style={styles.form}>
          <GlassInput
            label="Code de sécurité (6 chiffres)"
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
            label="Confirmer le mot de passe"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            icon="checkmark-circle-outline"
          />

          <GoldButton
            title="RÉINITIALISER"
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
  title: { fontSize: 26, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  subtitle: { fontSize: 15, color: THEME.COLORS.textSecondary, textAlign: 'center', marginTop: 10 },
  form: { width: '100%', marginTop: 30 },
  button: { marginTop: 20 },
});

export default ResetPasswordScreen;