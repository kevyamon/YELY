//src/screens/auth/RegisterPage.jsx
// PAGE INSCRIPTION - Architecture Modulaire & UX Optimisee (Validation par Modale CGU)
// STANDARD: Industriel / Bank Grade

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

import GlassCard from '../../components/ui/GlassCard';
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
    
    if (passwordScore < 1) { 
       dispatch(showErrorToast({ 
         title: "Mot de passe trop faible", 
         message: "Votre mot de passe doit contenir au moins 8 caracteres, un chiffre et un symbole." 
       }));
       return;
    }

    // Si tout est valide, on ouvre la modale des conditions
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
                onPress={() => handleRoleSelection('rider')}
              >
                <Ionicons 
                  name="person" 
                  size={20} 
                  color={role === 'rider' ? THEME.COLORS.textInverse : THEME.COLORS.textSecondary} 
                />
                <Text style={[styles.roleText, role === 'rider' && styles.roleTextActive]}>Passager</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.roleBtn, role === 'driver' && styles.roleBtnActive]} 
                onPress={() => handleRoleSelection('driver')}
              >
                <Ionicons 
                  name="car" 
                  size={20} 
                  color={role === 'driver' ? THEME.COLORS.textInverse : THEME.COLORS.textSecondary} 
                />
                <Text style={[styles.roleText, role === 'driver' && styles.roleTextActive]}>Chauffeur</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.upperFields}>
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
            </View>

            <View style={styles.passwordWrapper}>
              <PasswordStrengthInput 
                password={formData.password}
                setPassword={(t) => setFormData({ ...formData, password: t })}
                onStrengthChange={setPasswordScore}
              />
            </View>

            <View style={styles.lowerSection}>
              <GoldButton
                title="S'INSCRIRE"
                onPress={validateFormAndShowTerms}
                style={styles.registerButton}
                icon="arrow-forward-outline"
              />
            </View>
          </GlassCard>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footer}>
            <Text style={styles.footerText}>
              Deja membre ? <Text style={styles.linkText}>Se connecter</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      <GlassModal
        visible={showDriverRestrictionModal}
        onClose={() => setShowDriverRestrictionModal(false)}
        title="Appareil Non Compatible"
        icon="phone-portrait-outline"
      >
        <Text style={styles.modalText}>
          Pour des raisons techniques liees a la cartographie et au suivi GPS en arriere-plan, l'application Chauffeur Yely n'est disponible que sur les appareils <Text style={{fontWeight: 'bold', color: THEME.COLORS.champagneGold}}>Android</Text>.
        </Text>
        <Text style={styles.modalSubText}>
          Si vous possedez un telephone Android, veuillez telecharger l'application depuis notre site officiel pour vous inscrire en tant que chauffeur.
        </Text>
        <GoldButton 
          title="J'ai compris" 
          onPress={() => setShowDriverRestrictionModal(false)} 
          style={{marginTop: 15}}
        />
      </GlassModal>

      <TermsModal 
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={executeRegistration}
        isLoading={isLoading}
      />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.COLORS.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: THEME.SPACING.xl, paddingTop: THEME.SPACING.sm, paddingBottom: THEME.SPACING.lg },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: THEME.SPACING.md, alignSelf: 'flex-start' },
  backText: { color: THEME.COLORS.champagneGold, marginLeft: 8, fontSize: 16, fontWeight: '600' },
  mainTitle: { color: THEME.COLORS.champagneGold, textAlign: 'center', fontSize: THEME.FONTS.sizes.h3, fontWeight: 'bold', marginBottom: THEME.SPACING.md, letterSpacing: 2 },
  card: { padding: THEME.SPACING.lg, overflow: 'visible' },
  roleContainer: { flexDirection: 'row', gap: 15, marginBottom: THEME.SPACING.lg, zIndex: 1 },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: THEME.COLORS.border, backgroundColor: THEME.COLORS.glassSurface },
  roleBtnActive: { backgroundColor: THEME.COLORS.success, borderColor: THEME.COLORS.success },
  roleText: { marginLeft: 8, fontWeight: '600', color: THEME.COLORS.textSecondary },
  roleTextActive: { color: THEME.COLORS.textInverse },
  upperFields: { zIndex: 1 },
  passwordWrapper: { minHeight: 160, justifyContent: 'flex-start', zIndex: 999, elevation: 10, position: 'relative' },
  lowerSection: { zIndex: 1, elevation: 1, marginTop: THEME.SPACING.md },
  registerButton: { marginTop: THEME.SPACING.sm },
  footer: { marginTop: THEME.SPACING.lg, alignItems: 'center' },
  footerText: { color: THEME.COLORS.textTertiary },
  linkText: { color: THEME.COLORS.champagneGold, fontWeight: 'bold' },
  modalText: { color: THEME.COLORS.textPrimary, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 10 },
  modalSubText: { color: THEME.COLORS.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 20, fontStyle: 'italic', marginBottom: 10 }
});

export default RegisterPage;