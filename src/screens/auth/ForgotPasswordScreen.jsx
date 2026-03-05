// src/screens/auth/ForgotPasswordScreen.jsx
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';
import GlassInput from '../../components/ui/GlassInput';
import GoldButton from '../../components/ui/GoldButton';
import { useForgotPasswordMutation } from '../../store/api/usersApiSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const ForgotPasswordScreen = ({ navigation }) => {
  const dispatch = useDispatch(); 
  const [email, setEmail] = useState('');
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSendCode = async () => {
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail || !cleanEmail.includes('@')) {
      dispatch(showErrorToast({ 
        title: "Email invalide", 
        message: "Veuillez fournir une adresse e-mail valide." 
      }));
      return;
    }

    try {
      const res = await forgotPassword({ email: cleanEmail }).unwrap();
      
      dispatch(showSuccessToast({ 
        title: "Code envoyé", 
        message: "Consultez votre boîte de réception (et vos spams)." 
      }));
      
      navigation.navigate('ResetPassword', { email: cleanEmail });
    } catch (err) {
      const errorMessage = err?.data?.message || "Nous n'avons pas pu envoyer l'e-mail. Veuillez réessayer.";
      dispatch(showErrorToast({ 
        title: "Échec de l'envoi", 
        message: errorMessage 
      }));
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
        <Text style={styles.title}>Récupération</Text>
        <Text style={styles.subtitle}>Un code de sécurité vous sera envoyé par email.</Text>

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
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Retour à la connexion</Text>
          </TouchableOpacity>
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
  title: { fontSize: 32, fontWeight: 'bold', color: THEME.COLORS.champagneGold },
  subtitle: { fontSize: 16, color: THEME.COLORS.textSecondary, textAlign: 'center', marginTop: 10 },
  form: { width: '100%', marginTop: 40 },
  button: { marginTop: 10 },
  backButton: { marginTop: 25, alignSelf: 'center' },
  backButtonText: { color: THEME.COLORS.textTertiary, fontSize: 14, textDecorationLine: 'underline' }
});

export default ForgotPasswordScreen;