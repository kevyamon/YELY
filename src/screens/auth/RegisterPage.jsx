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
      dispatch(showErrorToast({
        title: "Champs requis",
        message: "Veuillez remplir toutes les informations pour continuer."
      }));
      return false;
    }

    // Regex Email Strict + Disposable check
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com', 'yopmail.com']; // Liste basique

    if (!emailRegex.test(email)) {
      dispatch(showErrorToast({
        title: "Email invalide",
        message: "Format d'email incorrect."
      }));
      return false;
    }

    const domain = email.split('@')[1];
    if (disposableDomains.includes(domain)) {
      dispatch(showErrorToast({
        title: "Email interdit",
        message: "Les emails temporaires ne sont pas acceptés."
      }));
      return false;
    }

    // Regex Password Bank Grade
    // Min 8, 1 Maj, 1 Min, 1 Chiffre, 1 Special
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/;

    if (password.length < 8 || !passwordRegex.test(password)) {
      dispatch(showErrorToast({
        title: "Mot de passe trop faible",
        message: "8 caractères min, majuscule, minuscule, chiffre et symbole requis."
      }));
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      const fullPhone = `+${callingCode}${formData.phone}`;
      const res = await register({ ...formData, phone: fullPhone, role }).unwrap();

      dispatch(setCredentials({
        user: res.data.user,
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      }));

      dispatch(showSuccessToast({
        title: "Bienvenue !",
        message: "Votre compte Yély a été créé avec succès."
      }));
    } catch (err) {
      console.error('[REGISTER] Erreur:', err);
      const errorMessage =
        err?.data?.message ||
        err?.data?.errors?.[0] ||
        err?.error ||
        "Impossible de rejoindre Yély. Vérifiez votre connexion.";

      dispatch(showErrorToast({
        title: "Erreur d'inscription",
        message: errorMessage
      }));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.mainTitle}>INSCRIPTION {role === 'rider' ? 'PASSAGER' : 'CHAUFFEUR'}</Text>

          <GlassCard style={styles.card}>
            <View style={styles.roleSelectionBox}>
              <Text style={styles.roleLabel}>Sélectionnez votre profil :</Text>
              <View style={styles.choiceContainer}>
                <TouchableOpacity style={styles.choiceItem} onPress={() => setRole('rider')}>
                  <Checkbox.Android
                    status={role === 'rider' ? 'checked' : 'unchecked'}
                    color={THEME.COLORS.champagneGold}
                  />
                  <Text style={styles.choiceText}>Passager</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.choiceItem} onPress={() => setRole('driver')}>
                  <Checkbox.Android
                    status={role === 'driver' ? 'checked' : 'unchecked'}
                    color={THEME.COLORS.champagneGold}
                  />
                  <Text style={styles.choiceText}>Chauffeur</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color={THEME.COLORS.champagneGold} />
                <Text style={styles.infoText}>
                  {role === 'rider'
                    ? "Commandez vos courses avec élégance."
                    : "Augmentez vos revenus dès maintenant."}
                </Text>
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
                  withFilter
                  withFlag
                  withCallingCode
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
              placeholder="Adresse e-mail"
              keyboardType="email-address"
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
  safeArea: {
    flex: 1,
    backgroundColor: THEME.COLORS.deepAsphalt
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: THEME.SPACING.xl,
    paddingTop: THEME.SPACING.sm,
    paddingBottom: THEME.SPACING.lg
  },
  mainTitle: {
    color: THEME.COLORS.champagneGold,
    textAlign: 'center',
    fontSize: THEME.FONTS.sizes.h3,
    fontWeight: THEME.FONTS.weights.bold,
    marginBottom: THEME.SPACING.md,
    letterSpacing: 2
  },
  card: {
    padding: THEME.SPACING.lg
  },
  roleSelectionBox: {
    marginBottom: THEME.SPACING.lg
  },
  roleLabel: {
    color: THEME.COLORS.textSecondary,
    fontSize: THEME.FONTS.sizes.caption,
    marginBottom: THEME.SPACING.sm
  },
  choiceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: THEME.SPACING.sm
  },
  choiceItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  choiceText: {
    color: THEME.COLORS.moonlightWhite,
    marginLeft: THEME.SPACING.xs
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    padding: THEME.SPACING.sm,
    borderRadius: THEME.BORDERS.radius.md,
    borderLeftWidth: 3,
    borderLeftColor: THEME.COLORS.champagneGold,
    marginTop: THEME.SPACING.xs
  },
  infoText: {
    color: THEME.COLORS.textSecondary,
    fontSize: THEME.FONTS.sizes.caption,
    marginLeft: THEME.SPACING.sm,
    flex: 1
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start'
  },
  countryPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassLight,
    paddingHorizontal: THEME.SPACING.md,
    borderRadius: THEME.BORDERS.radius.lg,
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.glassBorder,
    height: 52
  },
  callingCodeText: {
    color: '#FFF',
    marginLeft: 5,
    fontWeight: 'bold'
  },
  registerButton: {
    marginTop: THEME.SPACING.md
  },
  loginFooter: {
    marginTop: THEME.SPACING.lg,
    paddingBottom: THEME.SPACING.md,
    alignItems: 'center'
  },
  loginRedirect: {
    color: THEME.COLORS.textTertiary,
    fontSize: THEME.FONTS.sizes.bodySmall
  }
});