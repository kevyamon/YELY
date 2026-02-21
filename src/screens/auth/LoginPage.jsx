// src/screens/auth/LoginPage.jsx
// PAGE CONNEXION - Design Épuré & Auto-Nettoyage des erreurs

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux'; // 🚀 CORRECTION : Ajout de useSelector

import GlassCard from '../../components/ui/GlassCard';
import GlassInput from '../../components/ui/GlassInput';
import GoldButton from '../../components/ui/GoldButton';

import { useLoginMutation } from '../../store/api/usersApiSlice';
import { setCredentials } from '../../store/slices/authSlice';
import { clearError, showErrorToast, showSuccessToast } from '../../store/slices/uiSlice'; // 🚀 CORRECTION : Ajout de clearError
import THEME from '../../theme/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const LoginPage = ({ navigation }) => {
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const { error } = useSelector((state) => state.ui); // 🚀 CORRECTION : On récupère l'erreur globale

  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [countryCode, setCountryCode] = useState('CI');
  const [callingCode, setCallingCode] = useState('225');
  const [isEmailMode, setIsEmailMode] = useState(false);

  useEffect(() => {
    const isEmail = /[a-zA-Z@]/.test(formData.identifier);
    if (isEmail !== isEmailMode) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsEmailMode(isEmail);
    }
  }, [formData.identifier]);

  // 🚀 LOGIQUE MÉTIER : Dès qu'on touche au texte, on nettoie l'erreur rouge
  const handleIdentifierChange = (t) => {
    setFormData({ ...formData, identifier: t });
    if (error) dispatch(clearError());
  };

  const handlePasswordChange = (t) => {
    setFormData({ ...formData, password: t });
    if (error) dispatch(clearError());
  };

  const handleLogin = async () => {
    if (!formData.identifier.trim() || !formData.password.trim()) {
      dispatch(showErrorToast({ title: "Champs requis", message: "Entrez vos identifiants." }));
      return;
    }

    try {
      let finalIdentifier = formData.identifier.trim();
      if (!isEmailMode) {
        const cleanPhone = finalIdentifier.replace(/\s/g, '').replace(/^0+/, '');
        finalIdentifier = `+${callingCode}${cleanPhone}`;
      }

      const res = await login({ ...formData, identifier: finalIdentifier }).unwrap();
      
      const { user, accessToken } = res.data;

      dispatch(setCredentials({ user, accessToken }));

      dispatch(showSuccessToast({
        title: "Connexion réussie",
        message: `Bienvenue, ${user.name.split(' ')[0]}.`
      }));

    } catch (err) {
      const errorMessage = err?.data?.message || "Identifiants incorrects.";
      dispatch(showErrorToast({ title: "Erreur", message: errorMessage }));
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
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('Landing')} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={THEME.COLORS.champagneGold} />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.welcomeText}>CONNEXION</Text>
            <Text style={styles.subText}>Accédez à votre espace Yély</Text>
          </View>

          <GlassCard style={styles.card}>
            {/* 🚀 AFFICHAGE DE L'ERREUR SI ELLE EXISTE */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputRow}>
               {!isEmailMode && (
                 <View style={styles.countryPickerContainer}>
                   <CountryPicker
                     countryCode={countryCode}
                     withFilter withFlag withCallingCode
                     onSelect={(c) => { 
                       setCountryCode(c.cca2); 
                       setCallingCode(c.callingCode[0]); 
                     }}
                   />
                   <Text style={styles.callingCodeText}>+{callingCode}</Text>
                 </View>
               )}
               <View style={{ flex: 1 }}>
                  <GlassInput
                    icon={isEmailMode ? "mail-outline" : "call-outline"}
                    placeholder="Tél ou Email"
                    autoCapitalize="none"
                    value={formData.identifier}
                    onChangeText={handleIdentifierChange} // 🚀 CORRECTION BRANCHÉE
                  />
               </View>
            </View>
            
            <GlassInput
              icon="lock-closed-outline"
              placeholder="Mot de passe"
              secureTextEntry
              value={formData.password}
              onChangeText={handlePasswordChange} // 🚀 CORRECTION BRANCHÉE
            />

            <GoldButton
              title="SE CONNECTER"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
              icon="log-in-outline"
            />
          </GlassCard>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Register')} 
            style={styles.footer}
          >
            <Text style={styles.footerText}>
              Pas encore de compte ? <Text style={styles.linkText}>Créer un compte</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.COLORS.deepAsphalt },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: THEME.SPACING.xl },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: THEME.SPACING.xl },
  backText: { color: THEME.COLORS.champagneGold, marginLeft: 8, fontSize: 16, fontWeight: '600' },
  headerContainer: { marginBottom: THEME.SPACING.xl, marginTop: THEME.SPACING.lg },
  welcomeText: { color: THEME.COLORS.champagneGold, fontSize: 32, fontWeight: 'bold', letterSpacing: 1 },
  subText: { color: THEME.COLORS.textSecondary, fontSize: 16, marginTop: 8 },
  card: { padding: THEME.SPACING.lg },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  countryPickerContainer: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.COLORS.glassLight, 
    paddingHorizontal: 10, borderRadius: 12, height: 52, borderWidth: 1, borderColor: THEME.COLORS.glassBorder 
  },
  callingCodeText: { color: THEME.COLORS.champagneGold, marginLeft: 5, fontWeight: 'bold' },
  loginButton: { marginTop: THEME.SPACING.md },
  footer: { marginTop: THEME.SPACING.xl, alignItems: 'center' },
  footerText: { color: THEME.COLORS.textTertiary },
  linkText: { color: THEME.COLORS.champagneGold, fontWeight: 'bold' },
  errorBox: { backgroundColor: 'rgba(231, 76, 60, 0.1)', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: THEME.COLORS.error },
  errorText: { color: THEME.COLORS.error, fontSize: 13, textAlign: 'center', fontWeight: 'bold' }
});

export default LoginPage;