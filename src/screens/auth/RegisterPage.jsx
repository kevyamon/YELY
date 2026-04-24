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
      actionButton={
        <GoldButton 
          title="S'inscrire" 
          onPress={validateFormAndShowTerms} 
          loading={isLoading} 
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
            <Ionicons 
              name={r === 'rider' ? 'person' : 'car'} 
              size={22} 
              color={role === r ? THEME.COLORS.textInverse : THEME.COLORS.primary} 
            />
            <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
              {r === 'rider' ? 'Passager' : 'Chauffeur'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nom complet</Text>
          <View style={styles.goldInputContainer}>
            <GlassInput 
              icon="person-outline" 
              placeholder="Jean Dupont" 
              value={formData.name} 
              onChangeText={(t) => setFormData({ ...formData, name: t })} 
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Téléphone</Text>
          <View style={styles.goldInputContainer}>
            <PhoneInputGroup 
              phone={formData.phone} 
              setPhone={(t) => setFormData({ ...formData, phone: t })} 
              countryCode={countryCode} 
              setCountryCode={setCountryCode} 
              callingCode={callingCode} 
              setCallingCode={setCallingCode} 
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Adresse email</Text>
          <View style={styles.goldInputContainer}>
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

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Mot de passe</Text>
          <View style={styles.goldInputContainer}>
            <PasswordStrengthInput 
              password={formData.password} 
              setPassword={(t) => setFormData({ ...formData, password: t })} 
              onStrengthChange={setPasswordScore} 
            />
          </View>
        </View>
      </View>

      <AuthActionLinks 
        subLabel="Déjà membre ?"
        subActionLabel="Se connecter"
        subOnPress={() => navigation.navigate('Login')}
      />

      <GlassModal 
        visible={showDriverRestrictionModal} 
        onClose={() => setShowDriverRestrictionModal(false)} 
        title="Appareil non compatible" 
        icon="phone-portrait-outline"
      >
        <Text style={styles.modalText}>
          L'application Chauffeur n'est disponible que sur <Text style={styles.boldPrimary}>Android</Text>.
        </Text>
        <GoldButton 
          title="J'ai compris" 
          onPress={() => setShowDriverRestrictionModal(false)} 
          style={styles.modalBtn}
        />
      </GlassModal>

      <TermsModal 
        visible={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
        onAccept={executeRegistration} 
        isLoading={isLoading} 
      />
    </AuthFormWrapper>
  );
};

const styles = StyleSheet.create({
  roleContainer: { 
    flexDirection: 'row', 
    gap: THEME.SPACING.lg, 
    marginBottom: THEME.SPACING.xxl,
    marginTop: THEME.SPACING.lg,
  },
  roleBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: THEME.SPACING.lg, 
    borderRadius: THEME.BORDERS.radius.pill, 
    borderWidth: THEME.BORDERS.width.thick, 
    borderColor: THEME.COLORS.primary, 
    backgroundColor: THEME.COLORS.transparent,
  },
  roleBtnActive: { 
    backgroundColor: THEME.COLORS.primary, 
    borderColor: THEME.COLORS.primaryDark,
    ...THEME.SHADOWS.gold,
  },
  roleText: { 
    marginLeft: THEME.SPACING.sm, 
    fontWeight: THEME.FONTS.weights.bold, 
    fontSize: THEME.FONTS.sizes.h4,
    color: THEME.COLORS.primary,
  },
  roleTextActive: { 
    color: THEME.COLORS.textInverse,
  },
  formContainer: {
    gap: THEME.SPACING.lg,
  },
  inputGroup: { 
    marginBottom: THEME.SPACING.xs 
  },
  inputLabel: { 
    color: THEME.COLORS.textSecondary, 
    fontSize: THEME.FONTS.sizes.caption, 
    fontWeight: THEME.FONTS.weights.semiBold, 
    marginBottom: THEME.SPACING.sm, 
    marginLeft: THEME.SPACING.xs, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  goldInputContainer: {
    backgroundColor: THEME.COLORS.primary,
    borderRadius: THEME.BORDERS.radius.lg,
    padding: THEME.BORDERS.width.thick,
  },
  modalText: { 
    color: THEME.COLORS.textPrimary, 
    fontSize: THEME.FONTS.sizes.body, 
    textAlign: 'center', 
    lineHeight: 22, 
    marginBottom: THEME.SPACING.md 
  },
  boldPrimary: { 
    fontWeight: 'bold', 
    color: THEME.COLORS.primary 
  },
  modalBtn: { 
    marginTop: THEME.SPACING.lg 
  }
});

export default RegisterPage;