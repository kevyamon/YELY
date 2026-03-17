// src/screens/subscription/PaymentFailure.jsx
// ECRAN DE REJET - Gestion des refus d'abonnement
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import GlassCard from '../../components/ui/GlassCard';
import GoldButton from '../../components/ui/GoldButton';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { logout, selectPromoMode, selectSubscriptionStatus, updateSubscriptionStatus } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';

const PaymentFailureScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const subStatus = useSelector(selectSubscriptionStatus);
  const promoMode = useSelector(selectPromoMode);

  const canGoToDashboard = subStatus?.isActive || promoMode?.isActive;

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleRetry = () => {
    navigation.navigate('Subscription');
  };

  const handleDashboard = () => {
    dispatch(updateSubscriptionStatus({ isRejected: false, isPending: false }));
    navigation.navigate('DriverHome');
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <GlassCard style={styles.card}>
          
          {canGoToDashboard && (
            <TouchableOpacity style={styles.closeButton} onPress={handleDashboard}>
              <Ionicons name="close" size={28} color={THEME.COLORS.textSecondary} />
            </TouchableOpacity>
          )}

          <Ionicons name="close-circle" size={80} color={THEME.COLORS.error} style={{ marginTop: 20 }} />
          <Text style={styles.title}>Paiement Refuse</Text>
          
          <Text style={styles.reasonTitle}>Motif du refus :</Text>
          <Text style={styles.reasonText}>
            {subStatus?.rejectionReason || "La capture d'ecran fournie est invalide ou illisible. Veuillez soumettre une preuve conforme."}
          </Text>

          <View style={styles.actions}>
            <GoldButton 
              title="Reprendre le processus" 
              onPress={handleRetry} 
              style={styles.btn} 
            />
            
            {canGoToDashboard && (
              <GoldButton 
                title="Revenir au Tableau de bord" 
                onPress={handleDashboard} 
                style={[styles.btn, styles.dashboardBtn]} 
                textStyle={{ color: THEME.COLORS.textPrimary }} 
              />
            )}

            <GoldButton 
              title="Se deconnecter" 
              onPress={handleLogout} 
              style={[styles.btn, styles.logoutBtn]} 
              textStyle={{ color: THEME.COLORS.error }} 
            />
          </View>
        </GlassCard>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: THEME.COLORS.error,
    marginTop: 15,
    marginBottom: 25,
    textAlign: 'center',
  },
  reasonTitle: {
    fontSize: 16,
    color: THEME.COLORS.textSecondary,
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 18,
    color: THEME.COLORS.textPrimary,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 35,
    lineHeight: 26,
  },
  actions: {
    width: '100%',
    gap: 15,
  },
  btn: {
    width: '100%',
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    borderColor: THEME.COLORS.error,
    borderWidth: 1,
  },
  dashboardBtn: {
    backgroundColor: 'transparent',
    borderColor: THEME.COLORS.textSecondary,
    borderWidth: 1,
  }
});

export default PaymentFailureScreen;