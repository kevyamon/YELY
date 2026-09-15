// src/screens/home/DriverHome.web.jsx
// RESTRICTION ESPACE CHAUFFEUR WEB - Réservé Exclusivement à l'App Android
// CSCSM Level: Bank Grade (Modularisé < 325 lignes, Sans Emojis, Zero-Fail)

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectCurrentUser } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';

const DriverHome = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons
            name="cellphone-android"
            size={48}
            color={THEME.COLORS.champagneGold}
          />
        </View>

        <Text style={styles.title}>Espace Chauffeur Yély</Text>
        
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>Application Mobile Requise</Text>
        </View>

        <Text style={styles.message}>
          Bonjour {user?.name ? user.name.split(' ')[0] : 'Chauffeur'}, le compte chauffeur est strictement réservé à l'application mobile Android pour assurer le suivi GPS temps réel en continu et la réception instantanée des courses.
        </Text>

        <Text style={styles.subMessage}>
          Veuillez ouvrir votre application Yély sur votre smartphone Android pour passer en ligne et démarrer votre service.
        </Text>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#121418" style={styles.buttonIcon} />
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    padding: 32,
    alignItems: 'center',
    maxWidth: 440,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1.5,
    borderColor: THEME.COLORS.champagneGold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.COLORS.champagneGold,
    letterSpacing: 0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  badgeContainer: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginBottom: 20,
  },
  badgeText: {
    color: THEME.COLORS.champagneGold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  message: {
    fontSize: 15,
    color: THEME.COLORS.textPrimary || '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 14,
  },
  subMessage: {
    fontSize: 13,
    color: THEME.COLORS.textSecondary || '#A0A0A0',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 28,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.champagneGold,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    width: '100%',
  },
  buttonIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: '#121418',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default DriverHome;