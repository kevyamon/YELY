// src/screens/auth/LoginPage.jsx
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
import { useDispatch, useSelector } from 'react-redux';

import GlassInput from '../../components/ui/GlassInput';
import GoldButton from '../../components/ui/GoldButton';
import PwaIOSWarningModal from '../../components/ui/PwaIOSWarningModal';

import { useLoginMutation } from '../../store/api/usersApiSlice';
import { setCredentials } from '../../store/slices/authSlice';
import { clearError, showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const LoginPage = ({ navigation }) => {
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const { error } = useSelector((state) => state.ui);

  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [countryCode, setCountryCode] = useState('CI');
  const [callingCode, setCallingCode] = useState('225');
  const [isEmailMode, setIsEmailMode] = useState(false);
  
  const [showPwaModal, setShowPwaModal] = useState(false);

  useEffect(() => {
    const isEmail = /[a-zA-Z@]/.test(formData.identifier);
    if (isEmail !== isEmailMode) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsEmailMode(isEmail);
    }
  }, [formData.identifier]);

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
      dispatch(showErrorToast({ title: "Informations manquantes", message: "Veuillez saisir votre identifiant et votre mot de passe." }));
      return;
    }

    try {
      let finalIdentifier = formData.identifier.trim();
      if (!isEmailMode) {
        const cleanPhone = finalIdentifier.replace(/\s/g, '');
        finalIdentifier = `+${callingCode}${cleanPhone}`;
      }

      const res = await login({ 
        ...formData, 
        identifier: finalIdentifier,
        clientPlatform: Platform.OS 
      }).unwrap();
      
      const { user, accessToken, refreshToken } = res.data;

      dispatch(setCredentials({ user, accessToken, refreshToken }));
      
      dispatch(showSuccessToast({
        title: "Connexion reussie",
        message: `Ravis de vous revoir, ${user.name.split(' ')[0]} !`
      }));

    } catch (err) {
      const errorMessage = err?.data?.message || "Vos identifiants sont incorrects. Veuillez reessayer.";
      
      if (errorMessage === 'DEVICE_NOT_SUPPORTED') {
        setShowPwaModal(true);
        return;
      }

      dispatch(showErrorToast({ title: "Connexion impossible", message: errorMessage }));
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
            <TouchableOpacity 
              onPress={() => navigation.navigate('Landing')} 
              style={styles.iconButton}
            >
              <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerContainer}>
            <Text style={styles.welcomeText}>Bon retour</Text>
            <Text style={styles.subText}>Accedez a votre espace securise.</Text>
          </View>

          <View style={styles.formContainer}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>IDENTIFIANT</Text>
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
                 <View style={styles.flexItem}>
                    <GlassInput
                      icon={isEmailMode ? "mail-outline" : "call-outline"}
                      placeholder="Tel ou Email"
                      autoCapitalize="none"
                      value={formData.identifier}
                      onChangeText={handleIdentifierChange}
                    />
                 </View>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MOT DE PASSE</Text>
              <GlassInput
                icon="lock-closed-outline"
                placeholder="Votre mot de passe"
                secureTextEntry
                value={formData.password}
                onChangeText={handlePasswordChange}
              />
            </View>

            <View style={styles.actionArea}>
              <GoldButton
                title="Se connecter"
                onPress={handleLogin}
                loading={isLoading}
                style={styles.loginButton}
                icon="log-in-outline"
              />

              <View style={styles.linksRow}>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.linkTextDimmed}>Mot de passe oublie ?</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.linkTextHighlight}>Creer un compte</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
      
      <PwaIOSWarningModal 
        forceShow={showPwaModal} 
        onClose={() => setShowPwaModal(false)} 
        isDriver={true} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.COLORS.background },
  keyboardContainer: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: THEME.SPACING.xl, paddingBottom: THEME.SPACING.xxl },
  topNavigation: { height: 64, justifyContent: 'center' },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerContainer: { marginBottom: THEME.SPACING.xxxl, marginTop: THEME.SPACING.xl },
  welcomeText: { color: THEME.COLORS.primary, fontSize: THEME.FONTS.sizes.hero, fontWeight: THEME.FONTS.weights.bold, lineHeight: 40 },
  subText: { color: THEME.COLORS.textSecondary, fontSize: THEME.FONTS.sizes.body, marginTop: THEME.SPACING.md },
  formContainer: { flex: 1, justifyContent: 'center' },
  inputGroup: { marginBottom: THEME.SPACING.xxl },
  inputLabel: { color: THEME.COLORS.textSecondary, fontSize: THEME.FONTS.sizes.caption, fontWeight: THEME.FONTS.weights.bold, marginBottom: THEME.SPACING.sm, marginLeft: THEME.SPACING.sm, letterSpacing: 1 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  countryPickerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.COLORS.surface, paddingHorizontal: 10, borderRadius: THEME.BORDERS.radius.lg, height: 52, borderWidth: 1, borderColor: THEME.COLORS.border },
  callingCodeText: { color: THEME.COLORS.textPrimary, marginLeft: 5, fontWeight: THEME.FONTS.weights.bold },
  flexItem: { flex: 1 },
  actionArea: { paddingTop: THEME.SPACING.lg, gap: THEME.SPACING.xl },
  loginButton: { height: 60, borderRadius: THEME.BORDERS.radius.pill },
  linksRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: THEME.SPACING.xs },
  linkTextDimmed: { color: THEME.COLORS.textSecondary, fontSize: THEME.FONTS.sizes.bodySmall, fontWeight: THEME.FONTS.weights.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  linkTextHighlight: { color: THEME.COLORS.primary, fontSize: THEME.FONTS.sizes.bodySmall, fontWeight: THEME.FONTS.weights.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  errorBox: { backgroundColor: 'rgba(192, 57, 43, 0.1)', padding: THEME.SPACING.md, borderRadius: THEME.BORDERS.radius.md, marginBottom: THEME.SPACING.lg, borderWidth: 1, borderColor: THEME.COLORS.danger },
  errorText: { color: THEME.COLORS.danger, fontSize: THEME.FONTS.sizes.bodySmall, textAlign: 'center', fontWeight: THEME.FONTS.weights.bold }
});

export default LoginPage;