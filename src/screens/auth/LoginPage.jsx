// src/screens/auth/LoginPage.jsx

import { useState } from 'react';
import {
  Image,
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
import GoldButton from '../../components/ui/GoldButton';

import { useLoginMutation } from '../../store/api/usersApiSlice';
import { setCredentials } from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

export default function LoginPage({ navigation }) {
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [formData, setFormData] = useState({
    identifier: '', // Email ou Téléphone
    password: ''
  });

  const handleLogin = async () => {
    if (!formData.identifier.trim() || !formData.password.trim()) {
      dispatch(showErrorToast({ title: "Champs requis", message: "Veuillez entrer vos identifiants." }));
      return;
    }

    try {
      const res = await login(formData).unwrap();

      // Extraction propre depuis res.data (Standard Backend)
      const { user, accessToken, refreshToken } = res.data;

      dispatch(setCredentials({ user, accessToken, refreshToken }));

      dispatch(showSuccessToast({
        title: "Bon retour !",
        message: `Ravi de vous revoir, ${user.name.split(' ')[0]}.`
      }));

    } catch (err) {
      console.error('[LOGIN_ERROR]', err);
      const errorMessage = err?.data?.message || "Identifiants incorrects.";
      
      dispatch(showErrorToast({
        title: "Erreur de connexion",
        message: errorMessage
      }));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.headerContainer}>
            <Image 
              source={require('../../../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.welcomeText}>CONNEXION</Text>
          </View>

          <GlassCard style={styles.card}>
            <GlassInput
              icon="person-outline"
              placeholder="Email ou Téléphone"
              autoCapitalize="none"
              value={formData.identifier}
              onChangeText={(t) => setFormData({ ...formData, identifier: t })}
            />

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
  headerContainer: { alignItems: 'center', marginBottom: THEME.SPACING.xl },
  logo: { width: 120, height: 120, marginBottom: THEME.SPACING.md },
  welcomeText: { color: THEME.COLORS.champagneGold, fontSize: THEME.FONTS.sizes.h3, fontWeight: 'bold', letterSpacing: 2 },
  card: { padding: THEME.SPACING.lg },
  loginButton: { marginTop: THEME.SPACING.md },
  footer: { marginTop: THEME.SPACING.xl, alignItems: 'center' },
  footerText: { color: THEME.COLORS.textTertiary }
});