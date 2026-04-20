// src/screens/auth/RegisterPage.jsx
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
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

import GlassInput from '../../components/ui/GlassInput';
import GlassModal from '../../components/ui/GlassModal';
import GoldButton from '../../components/ui/GoldButton';

import PasswordStrengthInput from '../../components/auth/PasswordStrengthInput';
import PhoneInputGroup from '../../components/auth/PhoneInputGroup';
import TermsModal from '../../components/auth/TermsModal';

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
  
  const [showDriverRestrictionModal, setShowDriverRestrictionModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  const handleRoleSelection = (selectedRole) => {
    if (selectedRole === 'driver') {
      if (Platform.OS !== 'android') {
        setShowDriverRestrictionModal(true);
        return;
      }
    }
    setRole(selectedRole);
  };

  const generateStrongPassword = () => {
    const randomNum = Math.floor(Math.random() * 9000 + 1000);
    const strongPass = `Yely@${randomNum}`;
    setFormData({ ...formData, password: strongPass });
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
       dispatch(showErrorToast({ 
         title: "Mot de passe trop faible", 
         message: "Votre mot de passe doit contenir au moins 8 caracteres, un chiffre et un symbole." 
       }));
       return;
    }

    setShowTermsModal(true);
  };

  const executeRegistration = async () => {
    try {
      let finalPhone = formData.phone.replace(/\s/g, '').trim();
      
      if (!finalPhone.startsWith('+')) {
        finalPhone = `+${callingCode}${finalPhone}`;
      }
      
      const res = await register({ ...formData, phone: finalPhone, role }).unwrap();
      const { user, accessToken, refreshToken } = res.data;

      dispatch(setCredentials({ user, accessToken, refreshToken }));
      
      setShowTermsModal(false);
      dispatch(showSuccessToast({ title: "Bienvenue sur Yely", message: "Votre compte a ete cree avec succes." }));

    } catch (err) {
      setShowTermsModal(false);
      let errorMessage = "Une erreur est survenue lors de l'inscription.";
      
      if (err?.data?.errors && Array.isArray(err.data.errors) && err.data.errors.length > 0) {
        errorMessage = err.data.errors[0].message;
      } else if (err?.data?.message) {
        errorMessage = err.data.message;
      }

      dispatch(showErrorToast({ title: "Inscription impossible", message: errorMessage }));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardContainer}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topNavigation}>
            <TouchableOpacity onPress={() => navigation.navigate('Landing')} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerContainer}>
            <Text style={styles.mainTitle}>Creer un compte</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.roleContainer}>
              <TouchableOpacity 
                style={[styles.roleBtn, role === 'rider' && styles.roleBtnActive]} 
                onPress={() => handleRoleSelection('rider')}
              >
                <Ionicons name="person" size={20} color={role === 'rider' ? THEME.COLORS.background : THEME.COLORS.textSecondary} />
                <Text style={[styles.roleText, role === 'rider' && styles.roleTextActive]}>Passager</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.roleBtn, role === 'driver' && styles.roleBtnActive]} 
                onPress={() => handleRoleSelection('driver')}
              >
                <Ionicons name="car" size={20} color={role === 'driver' ? THEME.COLORS.background : THEME.COLORS.textSecondary} />
                <Text style={[styles.roleText, role === 'driver' && styles.roleTextActive]}>Chauffeur</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.upperFields}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NOM COMPLET</Text>
                <GlassInput
                  icon="person-outline"
                  placeholder="Jean Dupont"
                  value={formData.name}
                  onChangeText={(t) => setFormData({ ...formData, name: t })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>TELEPHONE</Text>
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
                <Text style={styles.inputLabel}>ADRESSE EMAIL</Text>
                <GlassInput
                  icon="mail-outline"
                  placeholder="jean@exemple.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(t) => setFormData({ ...formData, email: t })}
                />
              </View>
            </View>

            <View style={styles.passwordWrapper}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>MOT DE PASSE</Text>
                <PasswordStrengthInput 
                  password={formData.password}
                  setPassword={(t) => setFormData({ ...formData, password: t })}
                  onStrengthChange={setPasswordScore}
                />
                <View style={styles.generatePasswordContainer}>
                  <TouchableOpacity onPress={generateStrongPassword} style={styles.generateButton}>
                    <Ionicons name="key" size={16} color={THEME.COLORS.primary} />
                    <Text style={styles.generateButtonText}>Generer un mot de passe fort</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.actionArea}>
              <GoldButton
                title="S'inscrire"
                onPress={validateFormAndShowTerms}
                style={styles.registerButton}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Deja membre ? <Text onPress={() => navigation.navigate('Login')} style={styles.linkTextHighlight}>Se connecter</Text>
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <GlassModal visible={showDriverRestrictionModal} onClose={() => setShowDriverRestrictionModal(false)} title="Appareil Non Compatible" icon="phone-portrait-outline">
        <Text style={styles.modalText}>Pour des raisons techniques liees a la cartographie, l'application Chauffeur n'est disponible que sur <Text style={{fontWeight: 'bold', color: THEME.COLORS.primary}}>Android</Text>.</Text>
        <GoldButton title="J'ai compris" onPress={() => setShowDriverRestrictionModal(false)} style={{marginTop: 15}}/>
      </GlassModal>

      <TermsModal visible={showTermsModal} onClose={() => setShowTermsModal(false)} onAccept={executeRegistration} isLoading={isLoading} />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.COLORS.background },
  keyboardContainer: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: THEME.SPACING.xl, paddingBottom: THEME.SPACING.xxl },
  topNavigation: { height: 64, justifyContent: 'center', zIndex: 20 },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerContainer: { marginBottom: THEME.SPACING.xxl, marginTop: THEME.SPACING.md },
  mainTitle: { color: THEME.COLORS.textPrimary, fontSize: THEME.FONTS.sizes.hero, fontWeight: THEME.FONTS.weights.bold, letterSpacing: -0.5 },
  formContainer: { flex: 1 },
  roleContainer: { flexDirection: 'row', gap: 15, marginBottom: THEME.SPACING.xxl, zIndex: 1 },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: THEME.BORDERS.radius.lg, borderWidth: 1, borderColor: THEME.COLORS.surface, backgroundColor: THEME.COLORS.surface },
  roleBtnActive: { backgroundColor: THEME.COLORS.primary, borderColor: THEME.COLORS.primary },
  roleText: { marginLeft: 8, fontWeight: THEME.FONTS.weights.bold, color: THEME.COLORS.textSecondary },
  roleTextActive: { color: THEME.COLORS.background },
  upperFields: { zIndex: 10, elevation: 10 },
  inputGroup: { marginBottom: THEME.SPACING.xl },
  inputLabel: { color: THEME.COLORS.textSecondary, fontSize: THEME.FONTS.sizes.caption, fontWeight: THEME.FONTS.weights.bold, marginBottom: THEME.SPACING.sm, marginLeft: THEME.SPACING.sm, textTransform: 'uppercase', letterSpacing: 1 },
  passwordWrapper: { zIndex: 1, elevation: 1, position: 'relative' },
  generatePasswordContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: THEME.SPACING.sm },
  generateButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  generateButtonText: { color: THEME.COLORS.primary, fontSize: THEME.FONTS.sizes.bodySmall, fontWeight: THEME.FONTS.weights.medium },
  actionArea: { zIndex: 1, elevation: 1, marginTop: THEME.SPACING.md }, 
  registerButton: { height: 60, borderRadius: THEME.BORDERS.radius.pill },
  footer: { marginTop: THEME.SPACING.xxxl, alignItems: 'center' },
  footerText: { color: THEME.COLORS.textSecondary, fontSize: THEME.FONTS.sizes.body },
  linkTextHighlight: { color: THEME.COLORS.primary, fontWeight: THEME.FONTS.weights.bold },
  modalText: { color: THEME.COLORS.textPrimary, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 10 }
});

export default RegisterPage;