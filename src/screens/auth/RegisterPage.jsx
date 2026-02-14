// src/screens/auth/RegisterPage.jsx

import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import { Checkbox, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import GlassCard from '../../components/ui/GlassCard';
import GlassInput from '../../components/ui/GlassInput';
import GoldButton from '../../components/ui/GoldButton';

import { useRegisterMutation } from '../../store/api/usersApiSlice';
import { setCredentials } from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';
import { ERROR_MESSAGES, VALIDATORS } from '../../utils/validators'; // Import propre

export default function RegisterPage({ navigation, route }) {
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const [role, setRole] = useState(route.params?.role?.toLowerCase() || 'rider');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  const [countryCode, setCountryCode] = useState('CI');
  const [callingCode, setCallingCode] = useState('225');

  const validateForm = () => {
    const { name, email, password, phone } = formData;

    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      dispatch(showErrorToast({ title: "Champs requis", message: "Veuillez tout remplir." }));
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

    if (!VALIDATORS.password(password)) {
      dispatch(showErrorToast({ title: "Mot de passe faible", message: ERROR_MESSAGES.password }));
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      const fullPhone = `+${callingCode}${formData.phone.replace(/^0+/, '')}`; // Retire le 0 initial si présent
      
      // Appel API
      const res = await register({ ...formData, phone: fullPhone, role }).unwrap();

      // DEBUG: Vérification console si besoin
      // console.log('Register Response:', res);

      // Le backend renvoie maintenant : { success: true, data: { user, accessToken... } }
      const { user, accessToken, refreshToken } = res.data;

      dispatch(setCredentials({ user, accessToken, refreshToken }));

      dispatch(showSuccessToast({
        title: "Bienvenue !",
        message: "Compte créé avec succès."
      }));
      
      // La navigation sera gérée par l'AppNavigator via isAuthenticated, 
      // mais on peut forcer si besoin.

    } catch (err) {
      console.error('[REGISTER_ERROR]', err);
      const errorMessage = err?.data?.message || "Erreur lors de l'inscription.";
      
      dispatch(showErrorToast({
        title: "Échec inscription",
        message: errorMessage
      }));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.mainTitle}>INSCRIPTION {role === 'rider' ? 'PASSAGER' : 'CHAUFFEUR'}</Text>

          <GlassCard style={styles.card}>
            {/* SÉLECTEUR DE RÔLE */}
            <View style={styles.roleSelectionBox}>
              <View style={styles.choiceContainer}>
                <TouchableOpacity style={styles.choiceItem} onPress={() => setRole('rider')}>
                  <Checkbox.Android status={role === 'rider' ? 'checked' : 'unchecked'} color={THEME.COLORS.champagneGold} />
                  <Text style={styles.choiceText}>Passager</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.choiceItem} onPress={() => setRole('driver')}>
                  <Checkbox.Android status={role === 'driver' ? 'checked' : 'unchecked'} color={THEME.COLORS.champagneGold} />
                  <Text style={styles.choiceText}>Chauffeur</Text>
                </TouchableOpacity>
              </View>
            </View>

            <GlassInput
              icon="person-outline"
              placeholder="Nom complet"
              value={formData.name}
              onChangeText={(t) => setFormData({ ...formData, name: t })}
            />

            <View style={styles.phoneRow}>
              <View style={styles.countryPickerContainer}>
                <CountryPicker
                  countryCode={countryCode}
                  withFilter withFlag withCallingCode
                  onSelect={(c) => { setCountryCode(c.cca2); setCallingCode(c.callingCode[0]); }}
                />
                <Text style={styles.callingCodeText}>+{callingCode}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <GlassInput
                  icon="call-outline"
                  placeholder="Téléphone"
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text.replace(/[^0-9]/g, '') })}
                />
              </View>
            </View>

            <GlassInput
              icon="mail-outline"
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(t) => setFormData({ ...formData, email: t })}
            />

            <GlassInput
              icon="lock-closed-outline"
              placeholder="Mot de passe"
              secureTextEntry
              value={formData.password}
              onChangeText={(t) => setFormData({ ...formData, password: t })}
            />

            <GoldButton
              title="CRÉER MON COMPTE"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.registerButton}
              icon="person-add-outline"
            />
          </GlassCard>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginFooter}>
            <Text style={styles.loginRedirect}>
              Déjà membre ? <Text style={{ color: THEME.COLORS.champagneGold, fontWeight: 'bold' }}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.COLORS.deepAsphalt },
  scrollContent: { flexGrow: 1, paddingHorizontal: THEME.SPACING.xl, paddingTop: THEME.SPACING.sm, paddingBottom: THEME.SPACING.lg },
  mainTitle: { color: THEME.COLORS.champagneGold, textAlign: 'center', fontSize: THEME.FONTS.sizes.h3, fontWeight: 'bold', marginBottom: THEME.SPACING.md, letterSpacing: 2 },
  card: { padding: THEME.SPACING.lg },
  roleSelectionBox: { marginBottom: THEME.SPACING.md },
  choiceContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  choiceItem: { flexDirection: 'row', alignItems: 'center' },
  choiceText: { color: THEME.COLORS.moonlightWhite, marginLeft: THEME.SPACING.xs },
  phoneRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  countryPickerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.COLORS.glassLight, paddingHorizontal: 10, borderRadius: 12, height: 52, borderWidth: 1, borderColor: THEME.COLORS.glassBorder },
  callingCodeText: { color: '#FFF', marginLeft: 5, fontWeight: 'bold' },
  registerButton: { marginTop: THEME.SPACING.md },
  loginFooter: { marginTop: THEME.SPACING.lg, alignItems: 'center' },
  loginRedirect: { color: THEME.COLORS.textTertiary }
});