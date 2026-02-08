import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Alert,
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

// Composants UI Premium
import GlassCard from '../../components/ui/GlassCard';
import GlassInput from '../../components/ui/GlassInput';
import GoldButton from '../../components/ui/GoldButton';

// Redux & Thème
import { useRegisterMutation } from '../../store/api/usersApiSlice';
import { setCredentials } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';

export default function RegisterPage({ navigation, route }) {
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  
  // Initialisation du rôle (Passager par défaut)
  const [role, setRole] = useState(route.params?.role || 'RIDER');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const [countryCode, setCountryCode] = useState('CI');
  const [callingCode, setCallingCode] = useState('225');

  // 🛡️ Logique de validation côté client
  const validateForm = () => {
    const { name, email, password, phone } = formData;
    
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      Alert.alert("Champs requis", "Veuillez remplir toutes les informations pour créer votre compte.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Format invalide", "Veuillez entrer une adresse e-mail valide.");
      return false;
    }

    if (password.length < 6) {
      Alert.alert("Mot de passe trop court", "Votre mot de passe doit contenir au moins 6 caractères.");
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      const fullPhone = `+${callingCode}${formData.phone}`;
      const res = await register({ ...formData, phone: fullPhone, role }).unwrap();
      
      dispatch(setCredentials({ ...res }));
      
      Alert.alert("Bienvenue !", "Votre compte a été créé avec succès.");
      
    } catch (err) {
      console.log("[Auth] Échec de l'inscription");
      
      const errorMessage = err?.data?.message || "Impossible de rejoindre Yély pour le moment. Vérifiez votre connexion.";
      Alert.alert("Erreur", errorMessage);
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
          <Text style={styles.mainTitle}>
            INSCRIPTION {role === 'RIDER' ? 'PASSAGER' : 'CHAUFFEUR'}
          </Text>
          
          <GlassCard style={styles.card}>
            <View style={styles.roleSelectionBox}>
              <Text style={styles.roleLabel}>Sélectionnez votre profil :</Text>
              
              <View style={styles.choiceContainer}>
                <TouchableOpacity style={styles.choiceItem} onPress={() => setRole('RIDER')}>
                  <Checkbox.Android 
                    status={role === 'RIDER' ? 'checked' : 'unchecked'} 
                    color={THEME.COLORS.champagneGold} 
                  />
                  <Text style={styles.choiceText}>Passager</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.choiceItem} onPress={() => setRole('DRIVER')}>
                  <Checkbox.Android 
                    status={role === 'DRIVER' ? 'checked' : 'unchecked'} 
                    color={THEME.COLORS.champagneGold} 
                  />
                  <Text style={styles.choiceText}>Chauffeur</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color={THEME.COLORS.champagneGold} />
                <Text style={styles.infoText}>
                  {role === 'RIDER' 
                    ? "Commandez vos courses avec élégance." 
                    : "Augmentez vos revenus dès maintenant."}
                </Text>
              </View>
            </View>

            <GlassInput
              icon="person-outline"
              placeholder="Nom complet"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <View style={styles.phoneRow}>
              <View style={styles.countryPickerContainer}>
                <CountryPicker
                  countryCode={countryCode}
                  withFilter
                  withFlag
                  withCallingCode
                  onSelect={(country) => {
                    setCountryCode(country.cca2);
                    setCallingCode(country.callingCode[0]);
                  }}
                />
                <Text style={styles.callingCodeText}>+{callingCode}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <GlassInput
                  icon="call-outline"
                  placeholder="Téléphone"
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(text) => {
                    // Force uniquement les chiffres pour éviter les lettres sur ordinateur
                    const numericValue = text.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, phone: numericValue });
                  }}
                />
              </View>
            </View>

            <GlassInput
              icon="mail-outline"
              placeholder="Adresse e-mail"
              keyboardType="email-address"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
            />

            <GlassInput
              icon="lock-closed-outline"
              placeholder="Mot de passe"
              secureTextEntry
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
            />

            <GoldButton
              title="CRÉER MON COMPTE"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.registerButton}
              icon="person-add-outline"
            />
          </GlassCard>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')}
            style={styles.loginFooter}
          >
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
    backgroundColor: THEME.COLORS.deepAsphalt,
  },
  scrollContent: { 
    flexGrow: 1, 
    paddingHorizontal: THEME.SPACING.xl,
    paddingTop: THEME.SPACING.sm, 
    paddingBottom: THEME.SPACING.lg, 
  },
  mainTitle: { 
    color: THEME.COLORS.champagneGold, 
    textAlign: 'center', 
    fontSize: THEME.FONTS.sizes.h3,
    fontWeight: THEME.FONTS.weights.bold, 
    marginBottom: THEME.SPACING.md, 
    letterSpacing: 2,
    marginTop: THEME.SPACING.xs,
  },
  card: { 
    padding: THEME.SPACING.lg, 
  },
  roleSelectionBox: { 
    marginBottom: THEME.SPACING.lg, 
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
  choiceItem: { flexDirection: 'row', alignItems: 'center' },
  choiceText: { color: THEME.COLORS.moonlightWhite, marginLeft: THEME.SPACING.xs },
  infoBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(212, 175, 55, 0.08)', 
    padding: THEME.SPACING.sm, 
    borderRadius: THEME.BORDERS.radius.md,
    borderLeftWidth: 3,
    borderLeftColor: THEME.COLORS.champagneGold,
    marginTop: THEME.SPACING.xs,
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
  callingCodeText: { color: '#FFF', marginLeft: 5, fontWeight: 'bold' },
  registerButton: { marginTop: THEME.SPACING.md },
  loginFooter: {
    marginTop: THEME.SPACING.lg,
    paddingBottom: THEME.SPACING.md,
    alignItems: 'center',
  },
  loginRedirect: { 
    color: THEME.COLORS.textTertiary, 
    fontSize: THEME.FONTS.sizes.bodySmall,
  }
});