// src/screens/auth/RegisterPage.jsx
// PAGE INSCRIPTION - Architecture Modulaire & UX Optimisee
// STANDARD: Industriel / Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import GlassCard from '../../components/ui/GlassCard';
import GlassInput from '../../components/ui/GlassInput';
import GoldButton from '../../components/ui/GoldButton';

import PasswordStrengthInput from '../../components/auth/PasswordStrengthInput';
import PhoneInputGroup from '../../components/auth/PhoneInputGroup';

import { useRegisterMutation } from '../../store/api/usersApiSlice';
import { setCredentials } from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';
import { ERROR_MESSAGES, VALIDATORS } from '../../utils/validators';

const RegisterPage = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  
  const [role, setRole] = useState(route.params?.role?.toLowerCase() || 'rider');
  const [countryCode, setCountryCode] = useState('CI');
  const [callingCode, setCallingCode] = useState('225');
  const [passwordScore, setPasswordScore] = useState(0);
  const [hasAcceptedLegal, setHasAcceptedLegal] = useState(false); // Ajout du state legal

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  const validateForm = () => {
    const { name, email, password, phone } = formData;
    
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      dispatch(showErrorToast({ title: "Informations manquantes", message: "Veuillez remplir tous les champs." }));
      return false;
    }
    if (!VALIDATORS.name(name)) {
      dispatch(showErrorToast({ title: "Nom invalide", message: ERROR_MESSAGES.name }));
      return false;
    }
    if (!VALIDATORS.email(email)) {
      dispatch(showErrorToast({ title: "Email invalide", message: ERROR_MESSAGES.email }));
      return false;
    }
    if (passwordScore < 1) { 
       dispatch(showErrorToast({ title: "Securite", message: "Le mot de passe doit respecter tous les criteres de securite." }));
       return false;
    }
    if (!hasAcceptedLegal) {
      dispatch(showErrorToast({ title: "Action requise", message: "Veuillez accepter les conditions d'utilisation et la politique de confidentialite." }));
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      const cleanPhone = formData.phone.replace(/\s/g, '').replace(/^0+/, '');
      const fullPhone = `+${callingCode}${cleanPhone}`;
      
      const res = await register({ ...formData, phone: fullPhone, role }).unwrap();
      const { user, accessToken, refreshToken } = res.data;

      dispatch(setCredentials({ user, accessToken, refreshToken }));
      dispatch(showSuccessToast({ title: "Bienvenue sur Yely", message: "Votre compte a ete cree avec succes." }));

    } catch (err) {
      const errorMessage = err?.data?.message || "Une erreur est survenue lors de l'inscription.";
      dispatch(showErrorToast({ title: "Inscription impossible", message: errorMessage }));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={() => navigation.navigate('Landing')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={THEME.COLORS.champagneGold} />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>

          <Text style={styles.mainTitle}>INSCRIPTION</Text>

          <GlassCard style={styles.card}>
            <View style={styles.roleContainer}>
              <TouchableOpacity 
                style={[styles.roleBtn, role === 'rider' && styles.roleBtnActive]} 
                onPress={() => setRole('rider')}
              >
                <Ionicons name="person" size={20} color={role === 'rider' ? '#FFF' : THEME.COLORS.textSecondary} />
                <Text style={[styles.roleText, role === 'rider' && styles.roleTextActive]}>Passager</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.roleBtn, role === 'driver' && styles.roleBtnActive]} 
                onPress={() => setRole('driver')}
              >
                <Ionicons name="car" size={20} color={role === 'driver' ? '#FFF' : THEME.COLORS.textSecondary} />
                <Text style={[styles.roleText, role === 'driver' && styles.roleTextActive]}>Chauffeur</Text>
              </TouchableOpacity>
            </View>

            <GlassInput
              icon="person-outline"
              placeholder="Nom complet"
              value={formData.name}
              onChangeText={(t) => setFormData({ ...formData, name: t })}
            />

            <PhoneInputGroup 
              phone={formData.phone}
              setPhone={(t) => setFormData({ ...formData, phone: t })}
              countryCode={countryCode}
              setCountryCode={setCountryCode}
              callingCode={callingCode}
              setCallingCode={setCallingCode}
            />

            <GlassInput
              icon="mail-outline"
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(t) => setFormData({ ...formData, email: t })}
            />

            <PasswordStrengthInput 
              password={formData.password}
              setPassword={(t) => setFormData({ ...formData, password: t })}
              onStrengthChange={setPasswordScore}
            />

            <View style={styles.legalContainer}>
              <TouchableOpacity onPress={() => setHasAcceptedLegal(!hasAcceptedLegal)} style={styles.checkbox}>
                <Ionicons 
                  name={hasAcceptedLegal ? "checkbox" : "square-outline"} 
                  size={24} 
                  color={hasAcceptedLegal ? THEME.COLORS.champagneGold : THEME.COLORS.textSecondary} 
                />
              </TouchableOpacity>
              <Text style={styles.legalText}>
                J'ai lu et j'accepte les <Text style={styles.linkText} onPress={() => navigation.navigate('TermsOfService')}>Conditions d'utilisation</Text> et la <Text style={styles.linkText} onPress={() => navigation.navigate('PrivacyPolicy')}>Politique de confidentialite</Text>.
              </Text>
            </View>

            <GoldButton
              title="CREER MON COMPTE"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.registerButton}
              icon="person-add-outline"
            />
          </GlassCard>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footer}>
            <Text style={styles.footerText}>
              Deja membre ? <Text style={styles.linkText}>Se connecter</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.COLORS.deepAsphalt },
  scrollContent: { flexGrow: 1, paddingHorizontal: THEME.SPACING.xl, paddingTop: THEME.SPACING.sm, paddingBottom: THEME.SPACING.lg },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: THEME.SPACING.md, alignSelf: 'flex-start' },
  backText: { color: THEME.COLORS.champagneGold, marginLeft: 8, fontSize: 16, fontWeight: '600' },
  mainTitle: { color: THEME.COLORS.champagneGold, textAlign: 'center', fontSize: THEME.FONTS.sizes.h3, fontWeight: 'bold', marginBottom: THEME.SPACING.md, letterSpacing: 2 },
  card: { padding: THEME.SPACING.lg },
  roleContainer: { flexDirection: 'row', gap: 15, marginBottom: THEME.SPACING.lg },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: THEME.COLORS.glassBorder, backgroundColor: THEME.COLORS.glassLight },
  roleBtnActive: { backgroundColor: "#10B981", borderColor: "#10B981" },
  roleText: { marginLeft: 8, fontWeight: '600', color: THEME.COLORS.textSecondary },
  roleTextActive: { color: '#FFF' },
  legalContainer: { flexDirection: 'row', alignItems: 'center', marginTop: THEME.SPACING.sm, marginBottom: THEME.SPACING.md, paddingRight: THEME.SPACING.xl },
  checkbox: { marginRight: THEME.SPACING.sm },
  legalText: { color: THEME.COLORS.textSecondary, fontSize: 12, lineHeight: 18, flexShrink: 1 },
  registerButton: { marginTop: THEME.SPACING.sm },
  footer: { marginTop: THEME.SPACING.lg, alignItems: 'center' },
  footerText: { color: THEME.COLORS.textTertiary },
  linkText: { color: THEME.COLORS.champagneGold, fontWeight: 'bold' }
});

export default RegisterPage;