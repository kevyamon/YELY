// src/screens/subscription/SubscriptionScreen.jsx
// ECRAN D'ABONNEMENT - Orchestrateur (Automatisé GeniusPay & Temps Réel)
// STANDARD: Clean Architecture / Bank Grade (Modularisé < 325 lignes)

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
  useInitializePaymentMutation
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

  // Synchronisation en temps réel via Sockets
  useEffect(() => {
    const handleSubscriptionActivated = (payload) => {
      dispatch(updateSubscriptionStatus({ isActive: true, isPending: false }));
      dispatch(showSuccessToast({ title: "Succès", message: "Votre Passe Yély a été activé avec succès." }));
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
      if (statusData.data.isActive || promoMode?.isActive) {
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
      const paymentUrl = response?.data?.paymentUrl || response?.paymentUrl;

      if (!paymentUrl) {
        throw new Error("Lien de paiement non disponible.");
      }

      if (Platform.OS === 'web') {
        window.location.href = paymentUrl;
      } else {
        // Mode Mobile : Ouverture dans le navigateur sécurisé intégré avec retour Deep Link
        const result = await WebBrowser.openAuthSessionAsync(paymentUrl, 'yely://subscription');
        if (result.type === 'success' || result.type === 'dismiss') {
          refetchStatus();
          refetchConfig();
        }
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

      <Text style={styles.headerTitle}>Passe Yély</Text>
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
      <View style={styles.container}>
        {renderHeader()}

        <View style={styles.content}>
          {currentStep === STEPS.DASHBOARD && (
            <SubscriptionDashboard
              status={statusData?.data}
              onProlong={handleProlong}
            />
          )}

          {currentStep === STEPS.CHOOSE_PLAN && (
            <PlanSelection
              config={configData?.data}
              status={statusData?.data}
              onInitiatePayment={handleInitiatePayment}
              isInitiating={isInitiating}
              onBack={() => setCurrentStep(STEPS.DASHBOARD)}
              userRole={userRole}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  content: { flex: 1, paddingHorizontal: 20, paddingBottom: 20, justifyContent: 'center' }
});

export default SubscriptionScreen;