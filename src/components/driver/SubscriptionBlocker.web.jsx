// src/components/driver/SubscriptionBlocker.web.jsx
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import GlassCard from '../ui/GlassCard';
import GoldButton from '../ui/GoldButton';
import THEME from '../../theme/theme';
import { logout } from '../../store/slices/authSlice';

const SubscriptionBlocker = ({
  isRideActive,
  promoMode,
  isSubscriptionLoading,
  isSubscriptionError,
  isActive,
  isBlocked,
  isPending,
  dispatch,
  navigation
}) => {
  if (isRideActive) return null;

  if (promoMode === null || (isSubscriptionLoading && !isSubscriptionError)) {
    return (
      <View style={styles.blockerOverlay}>
        <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
        <Text style={styles.blockerText}>Vérification des accès...</Text>
      </View>
    );
  }

  if (isActive || promoMode?.isActive) return null;
  if (!isBlocked) return null;

  return (
    <View style={styles.blockerOverlay}>
      <GlassCard style={styles.blockerCard}>
        {isPending ? (
          <>
            <Text style={styles.blockerTitle}>Vérification en cours</Text>
            <Text style={styles.blockerDesc}>Votre paiement a été reçu. Un administrateur valide votre accès.</Text>
            <ActivityIndicator size="small" color={THEME.COLORS.champagneGold} style={styles.loaderSpacing} />
            <GoldButton title="SE DÉCONNECTER" onPress={() => dispatch(logout())} style={styles.fullWidthButton} />
          </>
        ) : (
          <>
            <Text style={styles.blockerTitle}>Accès Expiré</Text>
            <Text style={styles.blockerDesc}>Votre abonnement est arrivé à terme. Vous ne pouvez plus recevoir de requêtes.</Text>
            <GoldButton title="Renouveler mon abonnement" onPress={() => navigation.navigate('Subscription')} style={styles.fullWidthButton} />
          </>
        )}
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  blockerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  blockerCard: {
    width: '100%',
    alignItems: 'center'
  },
  blockerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center'
  },
  blockerDesc: {
    fontSize: 16,
    color: THEME.COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25
  },
  blockerText: {
    color: '#FFFFFF',
    marginTop: 15,
    fontSize: 16
  },
  loaderSpacing: {
    marginTop: 10,
    marginBottom: 25
  },
  fullWidthButton: {
    width: '100%'
  }
});

export default SubscriptionBlocker;
