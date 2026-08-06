// src/components/drawer/DrawerFooter.jsx
// FOOTER MENU - Minimalist VIP Logout & Clean Version Badge
// CSCSM Level: Masterpiece UI

import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Text } from 'react-native-paper';

import THEME from '../../theme/theme';

const DrawerFooter = ({ onLogout, isLoggingOut }) => {
  const appVersion = Constants.expoConfig?.version || '1.1.0';
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <View style={styles.container}>
      
      {/* BOUTON DÉCONNEXION MINIMALISTE VIP */}
      <TouchableOpacity
        style={[
          styles.logoutButton,
          isDarkMode ? styles.logoutButtonDark : styles.logoutButtonLight
        ]}
        onPress={onLogout}
        disabled={isLoggingOut}
        activeOpacity={0.8}
      >
        {isLoggingOut ? (
          <ActivityIndicator size="small" color="#E74C3C" />
        ) : (
          <Ionicons name="log-out-outline" size={20} color="#E74C3C" />
        )}
        <Text style={styles.logoutText}>
          {isLoggingOut ? 'Déconnexion en cours...' : 'Se déconnecter'}
        </Text>
      </TouchableOpacity>

      {/* VERSION APP ELEGANTE */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>YÉLY v{appVersion}</Text>
      </View>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: THEME.SPACING.lg,
    paddingTop: THEME.SPACING.sm,
    paddingBottom: THEME.SPACING.lg, 
    backgroundColor: 'transparent',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14, 
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
    marginBottom: 16,
  },
  logoutButtonLight: {
    backgroundColor: 'rgba(231, 76, 60, 0.06)',
  },
  logoutButtonDark: {
    backgroundColor: 'rgba(231, 76, 60, 0.12)',
  },
  logoutText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#E74C3C', 
    letterSpacing: 0.3,
  },
  versionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.COLORS.textTertiary, 
    letterSpacing: 1.5,
    opacity: 0.7,
  },
});

export default DrawerFooter;