//src/screens/auth/RegisterPage.jsx
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import AuthActionLinks from '../../components/auth/AuthActionLinks';
import AuthFormWrapper from '../../components/auth/AuthFormWrapper';
import PasswordStrengthInput from '../../components/auth/PasswordStrengthInput';
import PhoneInputGroup from '../../components/auth/PhoneInputGroup';
import TermsModal from '../../components/auth/TermsModal';
import GlassInput from '../../components/ui/GlassInput';
import GlassModal from '../../components/ui/GlassModal';
import GoldButton from '../../components/ui/GoldButton';

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

  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });

  const handleRoleSelection = (selectedRole) => {
    if (selectedRole === 'driver' && Platform.OS !== 'android') {
      setShowDriverRestrictionModal(true);
      return;
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
    if (passwordScore < 1 && password.length < 8) { 
       dispatch(showErrorToast({ title: "Mot de passe trop faible", message: "Votre mot de passe doit contenir au moins 8 caractères, un chiffre et un symbole." }));
       return;
    }
    setShowTermsModal(true);
  };

  const executeRegistration = async () => {
    try {
      let finalPhone = formData.phone.replace(/\s/g, '').trim();
      if (!finalPhone.startsWith('+')) finalPhone = `+${callingCode}${finalPhone}`;
      const res = await register({ ...formData, phone: finalPhone, role }).unwrap();
      const { user, accessToken, refreshToken } = res.data;
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      setShowTermsModal(false);
      dispatch(showSuccessToast({ title: "Bienvenue sur Yély", message: "Votre compte a été créé avec succès." }));
    } catch (err) {
      setShowTermsModal(false);
      const errorMessage = err?.data?.errors?.[0]?.message || err?.data?.message || "Une erreur est survenue.";
      dispatch(showErrorToast({ title: "Inscription impossible", message: errorMessage }));
    }
  };

  return (
    <AuthFormWrapper
      title="Créer un compte"
      onBack={() => navigation.navigate('Landing')}
      footer={
        <AuthActionLinks 
          subLabel="Déjà membre ?"
          subActionLabel="Se connecter"
          subOnPress={() => navigation.navigate('Login')}
        />
      }
    >
      <View style={styles.roleContainer}>
        {['rider', 'driver'].map((r) => (
          <TouchableOpacity 
            key={r}
            style={[styles.roleBtn, role === r && styles.roleBtnActive]} 
            onPress={() => handleRoleSelection(r)}
          >
            <Ionicons name={r === 'rider' ? 'person' : 'car'} size={20} color={role === r ? THEME.COLORS.background : THEME.COLORS.textSecondary} />
            <Text style={[styles.roleText, role === r && styles.roleTextActive]}>{r === 'rider' ? 'Passager' : 'Chauffeur'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Nom complet</Text>
        <GlassInput icon="person-outline" placeholder="Jean Dupont" value={formData.name} onChangeText={(t) => setFormData({ ...formData, name: t })} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Téléphone</Text>
        <PhoneInputGroup phone={formData.phone} setPhone={(t) => setFormData({ ...formData, phone: t })} countryCode={countryCode} setCountryCode={setCountryCode} callingCode={callingCode} setCallingCode={setCallingCode} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Adresse email</Text>
        <GlassInput icon="mail-outline" placeholder="jean@exemple.com" keyboardType="email-address" autoCapitalize="none" value={formData.email} onChangeText={(t) => setFormData({ ...formData, email: t })} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Mot de passe</Text>
        <PasswordStrengthInput password={formData.password} setPassword={(t) => setFormData({ ...formData, password: t })} onStrengthChange={setPasswordScore} />
      </View>

      <GoldButton title="S'inscrire" onPress={validateFormAndShowTerms} style={styles.registerButton} loading={isLoading} />

      <GlassModal visible={showDriverRestrictionModal} onClose={() => setShowDriverRestrictionModal(false)} title="Appareil Non Compatible" icon="phone-portrait-outline">
        <Text style={styles.modalText}>L'application Chauffeur n'est disponible que sur <Text style={styles.boldPrimary}>Android</Text>.</Text>
        <GoldButton title="J'ai compris" onPress={() => setShowDriverRestrictionModal(false)} style={styles.modalBtn}/>
      </GlassModal>

      <TermsModal visible={showTermsModal} onClose={() => setShowTermsModal(false)} onAccept={executeRegistration} isLoading={isLoading} />
    </AuthFormWrapper>
  );
};

const styles = StyleSheet.create({
  roleContainer: { flexDirection: 'row', gap: 15, marginBottom: THEME.SPACING.xl },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: THEME.BORDERS.radius.lg, borderWidth: 1, borderColor: THEME.COLORS.surface, backgroundColor: THEME.COLORS.surface },
  roleBtnActive: { backgroundColor: THEME.COLORS.primary, borderColor: THEME.COLORS.primary },
  roleText: { marginLeft: 8, fontWeight: THEME.FONTS.weights.bold, color: THEME.COLORS.textSecondary },
  roleTextActive: { color: THEME.COLORS.background },
  inputGroup: { marginBottom: THEME.SPACING.xl },
  inputLabel: { color: THEME.COLORS.textSecondary, fontSize: THEME.FONTS.sizes.caption, fontWeight: THEME.FONTS.weights.bold, marginBottom: THEME.SPACING.sm, marginLeft: THEME.SPACING.sm, textTransform: 'uppercase', letterSpacing: 1 },
  registerButton: { height: 60, marginTop: THEME.SPACING.sm },
  modalText: { color: THEME.COLORS.textPrimary, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 10 },
  boldPrimary: { fontWeight: 'bold', color: THEME.COLORS.primary },
  modalBtn: { marginTop: 15 }
});

export default RegisterPage;