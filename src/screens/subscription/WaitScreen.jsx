// src/screens/subscription/WaitScreen.jsx
// ECRAN DE SYNCHRONISATION - Finalisation et verification du paiement
// STANDARD: Clean Architecture / Bank Grade (Sans Emojis)

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import GlassCard from '../../components/ui/GlassCard';
import GoldButton from '../../components/ui/GoldButton';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import {
  useGetSubscriptionStatusQuery,
  useLazyVerifyPaymentQuery
} from '../../store/api/subscriptionApiSlice';
import {
  logout,
  selectCurrentUser,
  selectPromoMode,
  selectSubscriptionStatus,
  setSubscriptionModalDismissed,
  updateSubscriptionStatus
} from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const WaitScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const [isVerifying, setIsVerifying] = useState(false);

  const subStatus = useSelector(selectSubscriptionStatus);
  const promoMode = useSelector(selectPromoMode);
  const user = useSelector(selectCurrentUser);
  const userRole = user?.role;
  const homeScreen = userRole === 'seller' ? 'SellerHome' : 'DriverHome';

  const hasValidAccess = useMemo(() => Boolean(
    subStatus?.isActive || promoMode?.isActive || user?.subscription?.isActive
  ), [subStatus?.isActive, promoMode?.isActive, user?.subscription?.isActive]);

  const { refetch: refetchStatus } = useGetSubscriptionStatusQuery();
  const [triggerVerify] = useLazyVerifyPaymentQuery();

  const reference = route?.params?.reference || subStatus?.gatewayReference || subStatus?.pendingReference;

  useEffect(() => {
    if (subStatus?.isActive && !subStatus?.isPending) {
      if (navigation?.replace) navigation.replace(homeScreen);
    }
  }, [subStatus?.isActive, subStatus?.isPending, navigation, homeScreen]);

  useEffect(() => {
    if (!hasValidAccess) {
      const bh = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => bh.remove();
    }
  }, [hasValidAccess]);

  useEffect(() => {
    handleManualVerify();
  }, []);

  useEffect(() => {
    return () => {
      dispatch(setSubscriptionModalDismissed(true));
    };
  }, [dispatch]);

  const handleManualVerify = async () => {
    setIsVerifying(true);
    try {
      const activeRef = reference || subStatus?.gatewayReference || subStatus?.pendingReference;
      if (activeRef) {
        const res = await triggerVerify(activeRef).unwrap();
        const resData = res?.data || res;
        if (resData?.isActive || resData?.status === 'COMPLETED') {
          dispatch(updateSubscriptionStatus({ isActive: true, isPending: false, expiresAt: resData?.expiresAt }));
          dispatch(showSuccessToast({ title: "Succès", message: "Abonnement validé et activé." }));
          if (navigation?.replace) navigation.replace(homeScreen);
          return;
        }
      }

      const statusRes = await refetchStatus().unwrap();
      const sData = statusRes?.data || statusRes;
      if (sData?.isActive) {
        dispatch(updateSubscriptionStatus({ isActive: true, isPending: false, expiresAt: sData?.expiresAt }));
        dispatch(showSuccessToast({ title: "Succès", message: "Abonnement actif." }));
        if (navigation?.replace) navigation.replace(homeScreen);
      } else {
        dispatch(showErrorToast({ title: "Information", message: "Paiement toujours en cours de confirmation par l'opérateur." }));
      }
    } catch (err) {
      dispatch(showErrorToast({ title: "Erreur", message: "Impossible de vérifier le statut pour le moment." }));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout({ reason: 'USER_INITIATED' }));
  };

  const handleClose = () => {
    dispatch(setSubscriptionModalDismissed(true));
    if (hasValidAccess) {
      if (navigation?.canGoBack && navigation.canGoBack()) navigation.goBack();
      else if (navigation?.navigate) navigation.navigate(homeScreen);
    }
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
        <GlassCard style={styles.contentCard}>
          {hasValidAccess && (
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={28} color={THEME.COLORS.textSecondary} />
            </TouchableOpacity>
          )}

          <View style={styles.iconContainer}>
            <Ionicons name="sync-outline" size={80} color={THEME.COLORS.champagneGold} />
            <ActivityIndicator
              size="large"
              color={THEME.COLORS.champagneGold}
              style={styles.loader}
            />
          </View>

          <Text style={styles.title}>Synchronisation en cours</Text>

          <Text style={styles.description}>
            Votre demande a été transmise à l'opérateur. Votre compte s'activera automatiquement dès confirmation du débit.
          </Text>

          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark-outline" size={20} color={THEME.COLORS.champagneGold} />
            <Text style={styles.infoText}>
              Activation automatique dès réception de l'accord bancaire.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <GoldButton
              title={isVerifying ? "Vérification en cours..." : "VÉRIFIER MON PAIEMENT"}
              onPress={handleManualVerify}
              disabled={isVerifying}
              style={styles.button}
            />

            <TouchableOpacity style={styles.logoutLink} onPress={handleLogout}>
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  contentCard: {
    alignItems: 'center',
    paddingVertical: 40,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
    zIndex: 10,
  },
  iconContainer: {
    marginBottom: 30,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    position: 'absolute',
    transform: [{ scale: 2.5 }],
    opacity: 0.3,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: THEME.COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 25,
    paddingHorizontal: 15,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 30,
    gap: 10,
  },
  infoText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 15,
  },
  button: {
    width: '100%',
  },
  logoutLink: {
    paddingVertical: 8,
  },
  logoutText: {
    color: '#FF4D4D',
    fontSize: 14,
    fontWeight: '700',
  }
});

export default WaitScreen;