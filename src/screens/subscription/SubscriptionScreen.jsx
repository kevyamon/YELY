// src/screens/subscription/SubscriptionScreen.jsx
// ECRAN D'ABONNEMENT - Orchestrateur (Automatise GeniusPay, Auto-Verification & Temps Reel)
// STANDARD: Clean Architecture / Bank Grade (Modularise < 325 lignes, Sans Emojis)

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { apiSlice } from '../../store/slices/apiSlice';
import {
  useGetConfigQuery, useGetSubscriptionStatusQuery,
  useInitializePaymentMutation, useLazyVerifyPaymentQuery
} from '../../store/api/subscriptionApiSlice';
import {
  selectCurrentUser, selectPromoMode,
  setSubscriptionModalDismissed, updatePromoMode, updateSubscriptionStatus
} from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';

import PlanSelection from '../../components/subscription/PlanSelection';
import SubscriptionDashboard from '../../components/subscription/SubscriptionDashboard';
import GlobalSkeleton, { SkeletonBone } from '../../components/ui/GlobalSkeleton';

import socketService from '../../services/socketService';
import THEME from '../../theme/theme';

const STEPS = { DASHBOARD: 'DASHBOARD', CHOOSE_PLAN: 'CHOOSE_PLAN' };

const SubscriptionScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const promoMode = useSelector(selectPromoMode);
  const user = useSelector(selectCurrentUser);
  const userRole = user?.role;

  const { data: configData, isLoading: isConfigLoading, refetch: refetchConfig } = useGetConfigQuery();
  const { data: statusData, isLoading: isStatusLoading, refetch: refetchStatus } = useGetSubscriptionStatusQuery();
  const [initializePayment, { isLoading: isInitiating }] = useInitializePaymentMutation();
  const [verifyPaymentTrigger] = useLazyVerifyPaymentQuery();

  const [currentStep, setCurrentStep] = useState(null);

  const redirectToHome = useCallback(() => {
    dispatch(setSubscriptionModalDismissed(true));
    dispatch(apiSlice.util.invalidateTags(['Subscription', 'User']));
    setTimeout(() => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        const target = userRole === 'seller' ? 'SellerHome' : 'DriverHome';
        navigation.navigate(target);
      }
    }, 300);
  }, [dispatch, navigation, userRole]);

  const handleClose = () => {
    dispatch(setSubscriptionModalDismissed(true));
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      redirectToHome();
    }
  };

  useEffect(() => {
    if (configData?.data) {
      dispatch(updatePromoMode({
        isGlobalFreeAccess: configData.data.isGlobalFreeAccess,
        promoMessage: configData.data.promoMessage
      }));
    }
  }, [configData, dispatch]);

  // Synchronisation dynamique du statut recu du serveur vers Redux
  useEffect(() => {
    if (statusData?.data) {
      const isSubActive = Boolean(
        statusData.data.isActive || 
        (statusData.data.expiresAt && new Date(statusData.data.expiresAt) > new Date())
      );

      dispatch(updateSubscriptionStatus({
        isActive: isSubActive,
        isPending: Boolean(statusData.data.isPending),
        expiresAt: statusData.data.expiresAt
      }));
    }
  }, [statusData, dispatch]);

  // Synchronisation en temps reel via Sockets & Redirection instantanee
  useEffect(() => {
    const handleSubscriptionActivated = (payload) => {
      dispatch(updateSubscriptionStatus({ isActive: true, isPending: false, expiresAt: payload?.expiresAt }));
      dispatch(showSuccessToast({ title: "Paiement Confirme", message: "Votre abonnement est desormais actif." }));
      dispatch(apiSlice.util.invalidateTags(['Subscription', 'User']));
      refetchConfig();
      refetchStatus();
      redirectToHome();
    };

    const handlePromoUpdate = () => {
      refetchConfig();
      refetchStatus();
    };

    socketService.on('subscription_updated', handleSubscriptionActivated);
    socketService.on('promo_updated', handlePromoUpdate);
    socketService.on('PROMO_MODE_CHANGED', handlePromoUpdate);

    return () => {
      socketService.off('subscription_updated', handleSubscriptionActivated);
      socketService.off('promo_updated', handlePromoUpdate);
      socketService.off('PROMO_MODE_CHANGED', handlePromoUpdate);
    };
  }, [dispatch, refetchConfig, refetchStatus, redirectToHome]);

  // Reprise et verification automatique au retour sur PWA (Web)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const queryRef = urlParams.get('reference');
    const storedRef = sessionStorage.getItem('yely_pending_payment_ref');
    const refToVerify = queryRef || storedRef;

    if (refToVerify) {
      sessionStorage.removeItem('yely_pending_payment_ref');
      if (queryRef && window.history?.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      verifyPaymentTrigger(refToVerify)
        .unwrap()
        .then((res) => {
          const verifyData = res?.data || res;
          if (verifyData?.isActive || verifyData?.status === 'COMPLETED') {
            dispatch(updateSubscriptionStatus({ isActive: true, isPending: false, expiresAt: verifyData?.expiresAt }));
            dispatch(showSuccessToast({ title: "Paiement Confirme", message: "Votre abonnement est desormais actif." }));
            dispatch(apiSlice.util.invalidateTags(['Subscription', 'User']));
            refetchStatus();
            refetchConfig();
            redirectToHome();
          }
        })
        .catch((err) => {
          console.warn('[PWA VERIFY SYNC] Verification:', err?.message);
          refetchStatus();
        });
    }
  }, [verifyPaymentTrigger, dispatch, redirectToHome, refetchStatus, refetchConfig]);

  useEffect(() => {
    return () => {
      dispatch(setSubscriptionModalDismissed(true));
    };
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      refetchConfig();
      refetchStatus();
    }, [refetchConfig, refetchStatus])
  );

  useEffect(() => {
    if (isStatusLoading || isConfigLoading) return;

    if (statusData?.data) {
      const isSubActive = Boolean(
        statusData.data.isActive || 
        (statusData.data.expiresAt && new Date(statusData.data.expiresAt) > new Date())
      );

      if (isSubActive || promoMode?.isActive) {
        setCurrentStep(STEPS.DASHBOARD);
      } else {
        setCurrentStep(STEPS.CHOOSE_PLAN);
      }
    } else {
      setCurrentStep(STEPS.CHOOSE_PLAN);
    }
  }, [statusData, isStatusLoading, isConfigLoading, promoMode?.isActive]);

  const handleInitiatePayment = async () => {
    try {
      const platform = Platform.OS === 'web' ? 'pwa' : 'mobile';
      const response = await initializePayment({ planId: 'MONTHLY', platform }).unwrap();
      const payload = response?.data || response;
      const paymentUrl = payload?.paymentUrl;
      const reference = payload?.reference;

      if (!paymentUrl) {
        throw new Error("Lien de paiement non disponible.");
      }

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && reference) {
          sessionStorage.setItem('yely_pending_payment_ref', reference);
        }
        window.location.href = paymentUrl;
      } else {
        const returnUrl = 'https://yely-amber.vercel.app';
        await WebBrowser.openAuthSessionAsync(paymentUrl, returnUrl);
        
        // Auto-Verification immediate a la fermeture du navigateur securise
        if (reference) {
          try {
            const verifyRes = await verifyPaymentTrigger(reference).unwrap();
            const verifyData = verifyRes?.data || verifyRes;
            if (verifyData?.isActive || verifyData?.status === 'COMPLETED') {
              dispatch(updateSubscriptionStatus({ isActive: true, isPending: false, expiresAt: verifyData?.expiresAt }));
              dispatch(showSuccessToast({ title: "Paiement Confirme", message: "Votre abonnement est desormais actif." }));
              dispatch(apiSlice.util.invalidateTags(['Subscription', 'User']));
              redirectToHome();
              return;
            }
          } catch (vErr) {
            console.warn('[VERIFY SYNC] Interrogation retour:', vErr.message);
          }
        }

        try {
          const statusRes = await refetchStatus().unwrap();
          const sData = statusRes?.data || statusRes;
          if (sData?.isActive) {
            dispatch(updateSubscriptionStatus({ isActive: true, isPending: false, expiresAt: sData?.expiresAt }));
            dispatch(showSuccessToast({ title: "Paiement Confirme", message: "Votre abonnement est desormais actif." }));
            dispatch(apiSlice.util.invalidateTags(['Subscription', 'User']));
            redirectToHome();
            return;
          }
        } catch (sErr) {
          // Ignorer si échec réseau passager
        }

        refetchConfig();
      }
    } catch (err) {
      const msg = err?.data?.message || err?.message || "Erreur lors de l'ouverture du paiement.";
      dispatch(showErrorToast({ title: "Erreur", message: msg }));
    }
  };

  const handleProlong = () => {
    setCurrentStep(STEPS.CHOOSE_PLAN);
  };

  const headerTopPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  ) + 12;

  const canGoBack = currentStep === STEPS.CHOOSE_PLAN && statusData?.data && (statusData.data.isActive || promoMode?.isActive);

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: headerTopPadding }]}>
      {canGoBack ? (
        <TouchableOpacity onPress={() => setCurrentStep(STEPS.DASHBOARD)} style={styles.headerIconBtn} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.textPrimary} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={handleClose} style={styles.headerIconBtn} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}>
          <Ionicons name="close" size={24} color={THEME.COLORS.textPrimary} />
        </TouchableOpacity>
      )}

      <Text style={styles.headerTitle}>Passe Yely</Text>
      <View style={styles.headerIconBtn} />
    </View>
  );

  if (isConfigLoading || isStatusLoading || !currentStep) {
    return (
      <View style={[styles.safeArea, { paddingTop: headerTopPadding }]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <SkeletonBone width={40} height={40} borderRadius={20} />
            <SkeletonBone width={120} height={24} />
            <SkeletonBone width={40} height={40} borderRadius={20} />
          </View>
          <View style={styles.content}>
            <GlobalSkeleton visible={true} style={{ flex: 1, justifyContent: 'center' }}>
              <SkeletonBone width="100%" height={240} borderRadius={24} style={{ marginBottom: 30 }} />
              <SkeletonBone width="70%" height={20} style={{ alignSelf: 'center', marginBottom: 15 }} />
              <SkeletonBone width="50%" height={16} style={{ alignSelf: 'center', marginBottom: 40 }} />
              <SkeletonBone width="100%" height={56} borderRadius={28} />
            </GlobalSkeleton>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.content}>
          {currentStep === STEPS.DASHBOARD ? (
            <SubscriptionDashboard statusData={statusData?.data} onRenew={handleProlong} onSelectOtherPlan={handleProlong} />
          ) : (
            <PlanSelection configData={configData?.data} onSelectPlan={handleInitiatePayment} isLoading={isInitiating} />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.COLORS.background },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  headerIconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: THEME.COLORS.textPrimary },
  content: { flex: 1 }
});

export default SubscriptionScreen;