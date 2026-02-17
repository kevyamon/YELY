// src/components/drawer/DrawerFooter.jsx
// FOOTER MENU - Sobre et Droit

import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

import THEME from '../../theme/theme';

const DrawerFooter = ({ onLogout, isLoggingOut }) => {
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
          <ActivityIndicator size="small" color={THEME.COLORS.danger} />
        ) : (
          <Ionicons name="log-out-outline" size={20} color={THEME.COLORS.danger} />
        )}
        <Text style={styles.logoutText}>
          {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
        </Text>
      </TouchableOpacity>

      {/* VERSION APP */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Yély v1.0.0 • by Groupe Express</Text>
      </View>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: THEME.SPACING.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(231, 76, 60, 0.08)', // Rouge très léger
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.2)',
    marginBottom: 20,
  },
  logoutText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: THEME.COLORS.danger,
    fontStyle: 'normal', // ⚠️ Sécurité anti-italique
  },
  versionContainer: {
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: THEME.COLORS.textTertiary,
    fontStyle: 'normal', // ⚠️ Sécurité anti-italique
  },
});

export default DrawerFooter;