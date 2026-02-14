// src/screens/auth/RegisterPage.jsx
// PAGE INSCRIPTION - LOGIQUE PASSIVE

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import { ProgressBar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import GlassCard from '../../components/ui/GlassCard';
import GlassInput from '../../components/ui/GlassInput';
import GoldButton from '../../components/ui/GoldButton';

import { useRegisterMutation } from '../../store/api/usersApiSlice';
import { setCredentials } from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';
import { ERROR_MESSAGES, VALIDATORS } from '../../utils/validators';

export default function RegisterPage({ navigation, route }) {
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  
  // Récupération du rôle envoyé depuis le Landing (Rider par défaut)
  const [role, setRole] = useState(route.params?.role?.toLowerCase() || 'rider');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  const [countryCode, setCountryCode] = useState('CI');
  const [callingCode, setCallingCode] = useState('225');

  // Logique Jauge Password
  const [passwordStats, setPasswordStats] = useState({
    length: false, upper: false, number: false, special: false, score: 0
  });

  useEffect(() => {
    const pass = formData.password;
    const stats = {
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      number: /\d/.test(pass),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)
    };
    const validCount = Object.values(stats).filter(Boolean).length;
    setPasswordStats({ ...stats, score: validCount / 4 });
  }, [formData.password]);

  const validateForm = () => {
    const { name, email, password, phone } = formData;
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      dispatch(showErrorToast({ title: "Incomplet", message: "Tous les champs sont requis." }));
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
    if (passwordStats.score < 1) { 
       dispatch(showErrorToast({ title: "Mot de passe faible", message: "Respectez les critères." }));
       return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      const fullPhone = `+${callingCode}${formData.phone.replace(/^0+/, '')}`;
      
      // 1. APPEL API
      const res = await register({ ...formData, phone: fullPhone, role }).unwrap();
      const { user, accessToken, refreshToken } = res.data;

      // 2. SAUVEGARDE REDUX
      // Le changement de 'user' déclenchera AppDrawer > useEffect > navigation.reset
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      
      dispatch(showSuccessToast({ title: "Bienvenue !", message: "Compte créé avec succès." }));

      // ⛔️ PAS DE NAVIGATION MANUELLE

    } catch (err) {
      console.error('[REGISTER_ERROR]', err);
      const errorMessage = err?.data?.message || "Erreur lors de l'inscription.";
      dispatch(showErrorToast({ title: "Échec inscription", message: errorMessage }));
    }
  };

  const PasswordRequirement = ({ met, text }) => (
    <View style={styles.reqRow}>
      <Ionicons 
        name={met ? "checkmark-circle" : "ellipse-outline"} 
        size={14} 
        color={met ? "#10B981" : THEME.COLORS.textTertiary} 
      />
      <Text style={[styles.reqText, { color: met ? "#10B981" : THEME.COLORS.textTertiary }]}>{text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('Landing')} 
            style={styles.backButton}
          >
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

            <View style={{ marginBottom: 15 }}>
              <GlassInput
                icon="lock-closed-outline"
                placeholder="Mot de passe"
                secureTextEntry
                value={formData.password}
                onChangeText={(t) => setFormData({ ...formData, password: t })}
              />
              
              {formData.password.length > 0 && (
                <View style={styles.gaugeContainer}>
                  <ProgressBar 
                    progress={passwordStats.score} 
                    color={passwordStats.score === 1 ? "#10B981" : (passwordStats.score > 0.5 ? "orange" : "red")} 
                    style={{ borderRadius: 5, height: 6, backgroundColor: 'rgba(255,255,255,0.1)' }} 
                  />
                  <View style={styles.requirementsBox}>
                    <PasswordRequirement met={passwordStats.length} text="8 chars min." />
                    <PasswordRequirement met={passwordStats.upper} text="1 Majuscule" />
                    <PasswordRequirement met={passwordStats.number} text="1 Chiffre" />
                    <PasswordRequirement met={passwordStats.special} text="1 Symbole" />
                  </View>
                </View>
              )}
            </View>

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
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: THEME.SPACING.md, marginTop: THEME.SPACING.xs, alignSelf: 'flex-start' },
  backText: { color: THEME.COLORS.champagneGold, marginLeft: 8, fontSize: 16, fontWeight: '600' },
  mainTitle: { color: THEME.COLORS.champagneGold, textAlign: 'center', fontSize: THEME.FONTS.sizes.h3, fontWeight: 'bold', marginBottom: THEME.SPACING.md, letterSpacing: 2 },
  card: { padding: THEME.SPACING.lg },
  roleContainer: { flexDirection: 'row', gap: 15, marginBottom: THEME.SPACING.lg },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: THEME.COLORS.glassBorder, backgroundColor: THEME.COLORS.glassLight },
  roleBtnActive: { backgroundColor: "#10B981", borderColor: "#10B981" },
  roleText: { marginLeft: 8, fontWeight: '600', color: THEME.COLORS.textSecondary },
  roleTextActive: { color: '#FFF' },
  phoneRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  countryPickerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.COLORS.glassLight, paddingHorizontal: 10, borderRadius: 12, height: 52, borderWidth: 1, borderColor: THEME.COLORS.glassBorder },
  callingCodeText: { color: '#FFF', marginLeft: 5, fontWeight: 'bold' },
  gaugeContainer: { marginTop: -10, marginBottom: 5 },
  requirementsBox: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 10 },
  reqRow: { flexDirection: 'row', alignItems: 'center', marginRight: 5 },
  reqText: { fontSize: 11, marginLeft: 4 },
  registerButton: { marginTop: THEME.SPACING.sm },
  loginFooter: { marginTop: THEME.SPACING.lg, alignItems: 'center' },
  loginRedirect: { color: THEME.COLORS.textTertiary }
});