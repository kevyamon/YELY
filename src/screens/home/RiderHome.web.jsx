// src/screens/home/RiderHome.web.jsx
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import THEME from '../../theme/theme';

const RiderHome = () => {
  return (
    <View style={styles.container}>
      <View style={styles.webPlaceholder}>
        <View style={styles.iconContainer}>
            <Ionicons name="map-outline" size={80} color={THEME.COLORS.champagneGold} />
        </View>
        <Text style={styles.webText}>Mode Développeur Web</Text>
        <Text style={styles.webSubText}>
          La carte interactive (Google Maps Native) est réservée aux mobiles.
        </Text>
        <View style={styles.infoBox}>
            <Text style={styles.infoText}>
                ⚠️ Pour tester la géolocalisation et les courses, utilise ton téléphone avec l'app Expo Go.
            </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.deepAsphalt, justifyContent: 'center', alignItems: 'center' },
  webPlaceholder: { padding: 40, alignItems: 'center', maxWidth: 500 },
  iconContainer: { marginBottom: 20, opacity: 0.8 },
  webText: { color: THEME.COLORS.champagneGold, fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  webSubText: { color: THEME.COLORS.textSecondary, textAlign: 'center', fontSize: 16, lineHeight: 24 },
  infoBox: { marginTop: 30, padding: 20, backgroundColor: 'rgba(212, 175, 55, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)' },
  infoText: { color: THEME.COLORS.moonlightWhite, textAlign: 'center', fontSize: 14 }
});

export default RiderHome;