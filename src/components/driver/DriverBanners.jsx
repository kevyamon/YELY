// src/components/driver/DriverBanners.jsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const VerificationBanner = ({ user, navigation }) => {
  const status = user?.verificationStatus || 'none';
  if (status === 'approved') return null;

  let bannerStyle = styles.bannerPending;
  let iconName = "warning-outline";
  let text = "Pièces d'identité requises. [Vérifier]";
  let textColor = "#000";

  if (status === 'none') {
    bannerStyle = styles.bannerPending;
    iconName = "warning-outline";
    text = "Pièces d'identité requises. [Vérifier]";
    textColor = "#000";
  } else if (status === 'rejected') {
    bannerStyle = styles.bannerBlocked;
    iconName = "alert-circle-outline";
    text = `Vérification rejetée : ${user?.rejectionReason || "Documents non conformes"}. [Vérifier]`;
    textColor = "#FFF";
  } else if (status === 'pending') {
    bannerStyle = styles.bannerPending;
    iconName = "time-outline";
    text = "Vérification en cours de traitement...";
    textColor = "#000";
  }

  return (
    <TouchableOpacity 
      style={[styles.bannerContainer, bannerStyle, { marginTop: 5 }]} 
      onPress={() => navigation.navigate('Profile')}
      activeOpacity={0.9}
    >
      <Ionicons name={iconName} size={20} color={textColor} />
      <Text style={[styles.bannerText, { color: textColor }]} numberOfLines={1}>
        {text}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={textColor} />
    </TouchableOpacity>
  );
};

export const SubscriptionBanner = ({ isActive, promoMode, isPending, subStatusRedux, navigation, dispatch }) => {
  if (isActive || promoMode?.isActive) return null; 
  
  return (
    <TouchableOpacity 
      style={[
        styles.bannerContainer, 
        isPending ? styles.bannerPending : styles.bannerBlocked
      ]} 
      onPress={() => {
        const { setSubscriptionModalDismissed } = require('../../store/slices/authSlice');
        dispatch(setSubscriptionModalDismissed(false));
        if (isPending) {
          navigation.navigate('WaitSubscription');
        } else if (subStatusRedux?.isRejected) {
          navigation.navigate('PaymentFailure');
        } else {
          navigation.navigate('Subscription');
        }
      }}
      activeOpacity={0.9}
    >
      <Ionicons 
        name={isPending ? "time-outline" : "warning-outline"} 
        size={20} 
        color={isPending ? "#000" : "#FFF"} 
      />
      <Text style={[styles.bannerText, isPending && { color: '#000' }]} numberOfLines={1}>
        {isPending 
          ? "Paiement en attente de validation... [Détails]" 
          : "Abonnement expiré. Vos fonctions de conduite sont désactivées. [S'abonner]"
        }
      </Text>
      <Ionicons 
        name="chevron-forward" 
        size={16} 
        color={isPending ? "#000" : "#FFF"} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  bannerPending: {
    backgroundColor: '#FFCC00',
    borderColor: 'rgba(0,0,0,0.05)',
  },
  bannerBlocked: {
    backgroundColor: '#E74C3C',
  },
  bannerText: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginHorizontal: 10,
  }
});
