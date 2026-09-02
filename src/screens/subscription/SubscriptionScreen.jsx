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

import {
  useGetConfigQuery,
  useGetSubscriptionStatusQuery,
  useInitializePaymentMutation,
  useLazyVerifyPaymentQuery
} from '../../store/api/subscriptionApiSlice';
import {
  selectCurrentUser,
  selectPromoMode,
  setSubscriptionModalDismissed,
  updatePromoMode,
  updateSubscriptionStatus
} from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';

import PlanSelection from '../../components/subscription/PlanSelection';
import SubscriptionDashboard from '../../components/subscription/SubscriptionDashboard';
import GlobalSkeleton, { SkeletonBone } from '../../components/ui/GlobalSkeleton';

import socketService from '../../services/socketService';
import THEME from '../../theme/theme';

const STEPS = {
  DASHBOARD: 'DASHBOARD',
  CHOOSE_PLAN: 'CHOOSE_PLAN'
};

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

  const handleClose = () => {
    dispatch(setSubscriptionModalDismissed(true));
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(userRole === 'seller' ? 'SellerHome' : 'DriverHome');
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

  // Synchronisation en temps reel via Sockets
  useEffect(() => {
    const handleSubscriptionActivated = (payload) => {
      dispatch(updateSubscriptionStatus({ isActive: true, isPending: false, expiresAt: payload?.expiresAt }));
      dispatch(showSuccessToast({ title: "Succes", message: "Votre Passe Yely a ete active avec succes." }));
      refetchConfig();
      refetchStatus();
      setCurrentStep(STEPS.DASHBOARD);
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
  }, [dispatch, refetchConfig, refetchStatus]);

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
        window.location.href = paymentUrl;
      } else {
        const result = await WebBrowser.openAuthSessionAsync(paymentUrl, 'yely://subscription');
        
        // Auto-Verification immediate a la fermeture du navigateur securise
        if (reference) {
          try {
            const verifyRes = await verifyPaymentTrigger(reference).unwrap();
            const verifyData = verifyRes?.data || verifyRes;
            if (verifyData?.isActive || verifyData?.status === 'COMPLETED') {
              dispatch(updateSubscriptionStatus({ isActive: true, isPending: false }));
              dispatch(showSuccessToast({ title: "Paiement Confirme", message: "Votre abonnement est desormais actif." }));
              setCurrentStep(STEPS.DASHBOARD);
            }
          } catch (vErr) {
            console.warn('[VERIFY SYNC] Interrogation retour:', vErr.message);
          }
        }

        refetchStatus();
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
            <SubscriptionDashboard
              statusData={statusData?.data}
              onRenew={handleProlong}
              onSelectOtherPlan={handleProlong}
            />
          ) : (
            <PlanSelection
              configData={configData?.data}
              onSelectPlan={handleInitiatePayment}
              isLoading={isInitiating}
            />
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