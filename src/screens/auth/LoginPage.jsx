// src/screens/auth/LoginPage.jsx

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity, // Pour l'animation fluide
  UIManager,
  View
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import GlassCard from '../../components/ui/GlassCard';
import GlassInput from '../../components/ui/GlassInput';
import GoldButton from '../../components/ui/GoldButton';

import { useLoginMutation } from '../../store/api/usersApiSlice';
import { setCredentials } from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

// Active l'animation sur Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function LoginPage({ navigation }) {
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [formData, setFormData] = useState({
    identifier: '', 
    password: ''
  });

  const [countryCode, setCountryCode] = useState('CI');
  const [callingCode, setCallingCode] = useState('225');
  const [isEmailMode, setIsEmailMode] = useState(false);

  // 🧠 DÉTECTION INTELLIGENTE : EMAIL vs TÉLÉPHONE
  useEffect(() => {
    // Si contient une lettre ou un @, c'est un email -> Mode Plein Écran
    const isEmail = /[a-zA-Z@]/.test(formData.identifier);
    
    if (isEmail !== isEmailMode) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); // Animation fluide
      setIsEmailMode(isEmail);
    }
  }, [formData.identifier]);

  const handleLogin = async () => {
    if (!formData.identifier.trim() || !formData.password.trim()) {
      dispatch(showErrorToast({ title: "Champs requis", message: "Veuillez entrer vos identifiants." }));
      return;
    }

    try {
      let finalIdentifier = formData.identifier.trim();

      // Si ce n'est PAS un email (donc un téléphone), on ajoute l'indicatif
      if (!isEmailMode) {
        const cleanPhone = finalIdentifier.replace(/\s/g, '').replace(/^0+/, '');
        finalIdentifier = `+${callingCode}${cleanPhone}`;
      }

      const res = await login({ ...formData, identifier: finalIdentifier }).unwrap();
      const { user, accessToken, refreshToken } = res.data;

      dispatch(setCredentials({ user, accessToken, refreshToken }));
      dispatch(showSuccessToast({
        title: "Bon retour !",
        message: `Ravi de vous revoir, ${user.name.split(' ')[0]}.`
      }));

    } catch (err) {
      console.error('[LOGIN_ERROR]', err);
      const errorMessage = err?.data?.message || "Identifiants incorrects.";
      dispatch(showErrorToast({ title: "Erreur de connexion", message: errorMessage }));
    }
  };

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

          <View style={styles.headerContainer}>
            <Image 
              source={require('../../../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.welcomeText}>CONNEXION</Text>
          </View>

          <GlassCard style={styles.card}>
            
            {/* INPUT DYNAMIQUE : Le drapeau disparaît si on tape un email */}
            <View style={styles.inputRow}>
               
               {!isEmailMode && (
                 <View style={styles.countryPickerContainer}>
                   <CountryPicker
                     countryCode={countryCode}
                     withFilter withFlag withCallingCode
                     onSelect={(c) => { setCountryCode(c.cca2); setCallingCode(c.callingCode[0]); }}
                   />
                   <Text style={styles.callingCodeText}>+{callingCode}</Text>
                 </View>
               )}

               <View style={{ flex: 1 }}>
                  <GlassInput
                    icon={isEmailMode ? "mail-outline" : "call-outline"} // Icône changeante aussi !
                    placeholder="Tél ou Email"
                    autoCapitalize="none"
                    value={formData.identifier}
                    onChangeText={(t) => setFormData({ ...formData, identifier: t })}
                  />
               </View>
            </View>
            
            <Text style={styles.hintText}>
              {isEmailMode ? "Mode Email détecté" : "Saisissez votre numéro"}
            </Text>

            <GlassInput
              icon="lock-closed-outline"
              placeholder="Mot de passe"
              secureTextEntry
              value={formData.password}
              onChangeText={(t) => setFormData({ ...formData, password: t })}
            />

            <GoldButton
              title="SE CONNECTER"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
              icon="log-in-outline"
            />
          </GlassCard>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.footer}>
            <Text style={styles.footerText}>
              Nouveau sur Yély ? <Text style={{ color: THEME.COLORS.champagneGold, fontWeight: 'bold' }}>Créer un compte</Text>
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
  
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.SPACING.md,
    marginTop: THEME.SPACING.xs,
    alignSelf: 'flex-start'
  },
  backText: {
    color: THEME.COLORS.champagneGold,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600'
  },

  headerContainer: { alignItems: 'center', marginBottom: THEME.SPACING.xl },
  logo: { width: 120, height: 120, marginBottom: THEME.SPACING.md },
  welcomeText: { color: THEME.COLORS.champagneGold, fontSize: THEME.FONTS.sizes.h3, fontWeight: 'bold', letterSpacing: 2 },
  card: { padding: THEME.SPACING.lg },
  
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  countryPickerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.COLORS.glassLight, paddingHorizontal: 10, borderRadius: 12, height: 52, borderWidth: 1, borderColor: THEME.COLORS.glassBorder },
  callingCodeText: { color: '#FFF', marginLeft: 5, fontWeight: 'bold' },
  hintText: { color: THEME.COLORS.textTertiary, fontSize: 10, marginTop: -10, marginBottom: 10, marginLeft: 5, fontStyle: 'italic', textAlign: 'right' },

  loginButton: { marginTop: THEME.SPACING.md },
  footer: { marginTop: THEME.SPACING.xl, alignItems: 'center' },
  footerText: { color: THEME.COLORS.textTertiary }
});