// src/screens/auth/ForgotPasswordScreen.jsx
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import GlassInput from '../../components/ui/GlassInput';
import GoldButton from '../../components/ui/GoldButton';
import { useForgotPasswordMutation } from '../../store/api/usersApiSlice';
import THEME from '../../theme/theme';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert("Erreur", "Veuillez entrer une adresse email valide.");
      return;
    }

    try {
      await forgotPassword({ email }).unwrap();
      // On redirige vers l'écran de reset en passant l'email
      navigation.navigate('ResetPassword', { email });
    } catch (err) {
      Alert.alert("Erreur", err?.data?.message || "Une erreur est survenue.");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSpacer} />
        
        <Ionicons name="lock-open-outline" size={80} color={THEME.COLORS.champagneGold} style={styles.icon} />
        
        <Text style={styles.title}>Mot de passe oublié ?</Text>
        <Text style={styles.subtitle}>
          Entrez votre adresse email. Nous vous enverrons un code de sécurité pour réinitialiser votre accès.
        </Text>

        <View style={styles.form}>
          <GlassInput
            label="Adresse Email"
            placeholder="votre@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
          />

          <GoldButton
            title="ENVOYER LE CODE"
            onPress={handleSendCode}
            loading={isLoading}
            style={styles.button}
          />

          <GoldButton
            title="RETOUR"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.backButton}
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
  icon: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: THEME.COLORS.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 16, color: THEME.COLORS.textSecondary, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  form: { width: '100%', marginTop: 40 },
  button: { marginTop: 10 },
  backButton: { marginTop: 15, borderColor: 'transparent' },
});

export default ForgotPasswordScreen;