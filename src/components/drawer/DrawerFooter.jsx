// src/components/drawer/DrawerFooter.jsx
// FOOTER MENU - Version dynamique & UX Affirmée (Bouton plein)

import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

import THEME from '../../theme/theme';

const DrawerFooter = ({ onLogout, isLoggingOut }) => {
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <View style={styles.container}>
      
      {/* BOUTON DÉCONNEXION */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={onLogout}
        disabled={isLoggingOut}
        activeOpacity={0.8}
      >
        {isLoggingOut ? (
          <ActivityIndicator size="small" color={THEME.COLORS.champagneGold} />
        ) : (
          <Ionicons name="log-out" size={22} color={THEME.COLORS.champagneGold} />
        )}
        <Text style={styles.logoutText}>
          {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
        </Text>
      </TouchableOpacity>

      {/* VERSION APP DYNAMIQUE */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>YÉLY v{appVersion}</Text>
      </View>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: THEME.SPACING.lg,
    paddingTop: THEME.SPACING.md,
    paddingBottom: THEME.SPACING.xl, 
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14, 
    backgroundColor: THEME.COLORS.danger || '#E74C3C', // Fond totalement rouge
    marginBottom: 20,
    shadowColor: THEME.COLORS.danger || '#E74C3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  logoutText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.COLORS.champagneGold, // Texte jaune (Or Yély)
    letterSpacing: 0.5,
  },
  versionContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.05)', 
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 40,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.COLORS.champagneGold, 
    letterSpacing: 2,
  },
});

export default DrawerFooter;