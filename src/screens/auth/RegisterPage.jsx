import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import { Text } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import GlassCard from '../../components/ui/GlassCard';
import GlassInput from '../../components/ui/GlassInput';
import GoldButton from '../../components/ui/GoldButton';
import { useRegisterMutation } from '../../store/api/usersApiSlice';
import { setCredentials } from '../../store/slices/authSlice';
import { YelyTheme } from '../../theme/theme';

export default function RegisterPage({ navigation, route }) {
  const { role } = route.params || { role: 'RIDER' }; // Récupère le rôle choisi sur la Landing
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();

  // États du formulaire
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  // État pour le sélecteur de pays
  const [countryCode, setCountryCode] = useState('CI');
  const [callingCode, setCallingCode] = useState('225');

  const handleRegister = async () => {
    try {
      const fullPhone = `+${callingCode}${formData.phone}`;
      const res = await register({ ...formData, phone: fullPhone, role }).unwrap();
      dispatch(setCredentials({ ...res }));
      // La navigation vers l'app se fera via le listener du token dans AppNavigator
    } catch (err) {
      console.error('Erreur inscription:', err);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>INSCRIPTION {role}</Text>
      
      <GlassCard style={styles.card}>
        <GlassInput
          icon="account"
          placeholder="Nom complet"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
        />

        <View style={styles.phoneContainer}>
          <TouchableOpacity style={styles.countryPicker}>
            <CountryPicker
              countryCode={countryCode}
              withFilter
              withFlag
              withCallingCode
              withAlphaFilter
              onSelect={(country) => {
                setCountryCode(country.cca2);
                setCallingCode(country.callingCode[0]);
              }}
            />
            <Text style={styles.callingCode}>+{callingCode}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <GlassInput
              icon="phone"
              placeholder="Téléphone"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
            />
          </View>
        </View>

        <GlassInput
          icon="email"
          placeholder="Email"
          keyboardType="email-address"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
        />

        <GlassInput
          icon="lock"
          placeholder="Mot de passe"
          secureTextEntry
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
        />

        <GoldButton
          title="CRÉER MON COMPTE"
          onPress={handleRegister}
          loading={isLoading}
          style={{ marginTop: 20 }}
        />
      </GlassCard>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.footerText}>Déjà un compte ? <Text style={{ color: YelyTheme.colors.primary }}>Se connecter</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: YelyTheme.colors.background, padding: 20, justifyContent: 'center' },
  title: { color: YelyTheme.colors.primary, textAlign: 'center', fontWeight: 'bold', marginBottom: 30, letterSpacing: 2 },
  card: { padding: 20 },
  phoneContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countryPicker: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    padding: 12, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)'
  },
  callingCode: { color: '#FFF', marginLeft: 5, fontWeight: 'bold' },
  footerText: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 30 }
});