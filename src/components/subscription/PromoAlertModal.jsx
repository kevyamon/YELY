// src/components/subscription/PromoAlertModal.jsx
// MODALE D'ALERTE VIP - Affichage Global (Surcouche AppNavigator)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import THEME from '../../theme/theme';
import GoldButton from '../ui/GoldButton';

const PromoAlertModal = ({ visible, isActive, message, onClose }) => {
  if (!visible) return null;

  const isActivation = isActive;

  return (
    <View style={styles.overlay}>
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          
          <View style={[styles.iconContainer, isActivation ? styles.iconActive : styles.iconInactive]}>
            <Ionicons
              name={isActivation ? "gift" : "information-circle"}
              size={60}
              color={isActivation ? THEME.COLORS.champagneGold : "#e74c3c"}
            />
          </View>
          
          <Text style={[styles.title, !isActivation && styles.titleInactive]}>
            {isActivation ? "Acces VIP Offert" : "Fin de la Promotion"}
          </Text>
          
          <Text style={styles.message}>
            {message || (isActivation ? "Roulez sans abonnement !" : "Le mode gratuit est termine.")}
          </Text>

          {isActivation && (
            <Text style={styles.subMessage}>
              Si vous aviez un abonnement actif, son temps est actuellement gele et sera prolongé.
            </Text>
          )}
          
          <GoldButton 
            title={isActivation ? "Super, merci !" : "Compris"} 
            onPress={onClose} 
            style={styles.button}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    backgroundColor: THEME.COLORS.glassDark,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
  },
  iconActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: THEME.COLORS.champagneGold,
  },
  iconInactive: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderColor: '#e74c3c',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: THEME.COLORS.champagneGold,
    marginBottom: 15,
    textAlign: 'center',
  },
  titleInactive: {
    color: '#e74c3c',
  },
  message: {
    fontSize: 17,
    color: THEME.COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 10,
    fontWeight: '600'
  },
  subMessage: {
    fontSize: 13,
    color: THEME.COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 25,
    fontStyle: 'italic'
  },
  button: {
    width: '100%',
    marginTop: 15
  }
});

export default PromoAlertModal;