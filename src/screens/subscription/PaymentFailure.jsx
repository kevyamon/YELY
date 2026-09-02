// src/screens/subscription/PaymentFailure.jsx
// ECRAN DE REJET / ANNULATION - Gestion des echecs de paiement Mobile Money
// STANDARD: Clean Architecture / Bank Grade (Sans Emojis)

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import GlassCard from '../../components/ui/GlassCard';
import GoldButton from '../../components/ui/GoldButton';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import {
  logout,
  selectCurrentUser,
  selectPromoMode,
  selectSubscriptionStatus,
  setSubscriptionModalDismissed,
  updateSubscriptionStatus
} from '../../store/slices/authSlice';
import THEME from '../../theme/theme';

const PaymentFailureScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const subStatus = useSelector(selectSubscriptionStatus);
  const promoMode = useSelector(selectPromoMode);
  const user = useSelector(selectCurrentUser);
  const userRole = user?.role;

  const canGoToDashboard = subStatus?.isActive || promoMode?.isActive;
  const homeScreen = userRole === 'seller' ? 'SellerHome' : 'DriverHome';
  const customReason = route?.params?.reason || subStatus?.rejectionReason;

  useEffect(() => {
    return () => {
      dispatch(setSubscriptionModalDismissed(true));
    };
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleRetry = () => {
    dispatch(updateSubscriptionStatus({ isRejected: false, isPending: false }));
    navigation.navigate('Subscription');
  };

  const handleDashboard = () => {
    dispatch(setSubscriptionModalDismissed(true));
    dispatch(updateSubscriptionStatus({ isRejected: false, isPending: false }));
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(homeScreen);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <GlassCard style={styles.card}>
          <TouchableOpacity style={styles.closeButton} onPress={handleDashboard}>
            <Ionicons name="close" size={28} color={THEME.COLORS.textSecondary} />
          </TouchableOpacity>

          <Ionicons name="close-circle" size={80} color="#FF4D4D" style={{ marginTop: 20 }} />
          <Text style={styles.title}>Paiement Non Abouti</Text>

          <Text style={styles.reasonTitle}>Statut de la transaction :</Text>
          <Text style={styles.reasonText}>
            {customReason || "La transaction a ete annulee ou refusee par votre operateur. Aucun montant n'a ete debite."}
          </Text>

          <View style={styles.actions}>
            <GoldButton
              title="Nouvelle tentative de paiement"
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
              textStyle={{ color: '#FF4D4D', fontWeight: 'bold' }}
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
    color: '#FF4D4D',
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
    fontSize: 16,
    color: THEME.COLORS.textPrimary,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 35,
    lineHeight: 24,
    paddingHorizontal: 10,
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
    borderColor: '#FF4D4D',
    borderWidth: 1.5,
  },
  dashboardBtn: {
    backgroundColor: 'transparent',
    borderColor: THEME.COLORS.textSecondary,
    borderWidth: 1.5,
  }
});

export default PaymentFailureScreen;