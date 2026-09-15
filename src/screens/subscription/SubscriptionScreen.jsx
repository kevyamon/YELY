// src/screens/subscription/SubscriptionScreen.jsx
// ECRAN D'ABONNEMENT - Orchestrateur (GeniusPay, Anti-Rebond & Redirection Home)
// CSCSM Level: Bank Grade (Modularisé < 325 lignes, Sans Emojis)

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import PlanSelection from '../../components/subscription/PlanSelection';
import SubscriptionDashboard from '../../components/subscription/SubscriptionDashboard';
import GlobalSkeleton, { SkeletonBone } from '../../components/ui/GlobalSkeleton';
import socketService from '../../services/socketService';
import {
  useGetConfigQuery,
  useGetSubscriptionStatusQuery,
  useInitializePaymentMutation,
  useLazyVerifyPaymentQuery
} from '../../store/api/subscriptionApiSlice';
import { apiSlice } from '../../store/slices/apiSlice';
import { 
  logout, 
  selectCurrentUser, 
  selectPromoMode, 
  setSubscriptionModalDismissed, 
  updatePromoMode, 
  updateSubscriptionStatus 
} from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const STEPS = { DASHBOARD: 'DASHBOARD', CHOOSE_PLAN: 'CHOOSE_PLAN' };
let globalLastPaymentToastTime = 0;

const SubscriptionScreen = ({ navigation, route }) => {
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
  const [isRedirecting, setIsRedirecting] = useState(false);

  const hasValidAccess = useMemo(() => Boolean(
    statusData?.data?.isActive ||
    promoMode?.isActive ||
    user?.subscription?.isActive ||
    (statusData?.data?.expiresAt && new Date(statusData.data.expiresAt) > new Date())
  ), [statusData?.data?.isActive, statusData?.data?.expiresAt, promoMode?.isActive, user?.subscription?.isActive]);

  useEffect(() => {
    if (!hasValidAccess) {
      const bh = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => bh.remove();
    }
  }, [hasValidAccess]);

  const redirectToHome = useCallback(() => {
    dispatch(setSubscriptionModalDismissed(true));
    dispatch(apiSlice.util.invalidateTags(['Subscription', 'User']));
    setTimeout(() => {
      if (navigation?.canGoBack && navigation.canGoBack()) {
        navigation.goBack();
      } else {
        const target = userRole === 'seller' ? 'SellerHome' : 'DriverHome';
        if (navigation?.navigate) navigation.navigate(target);
      }
    }, 200);
  }, [dispatch, navigation, userRole]);

  const notifyPaymentSuccessOnce = useCallback((message = "Votre abonnement est désormais actif.") => {
    const now = Date.now();
    if (now - globalLastPaymentToastTime > 25000) {
      globalLastPaymentToastTime = now;
      dispatch(showSuccessToast({ title: "Paiement Validé", message }));
    }
  }, [dispatch]);

  const handleClose = () => {
    dispatch(setSubscriptionModalDismissed(true));
    if (navigation?.canGoBack && navigation.canGoBack()) navigation.goBack();
    else redirectToHome();
  };

  const handleLogout = () => dispatch(logout({ reason: 'USER_INITIATED' }));

  useEffect(() => {
    if (configData?.data) {
      dispatch(updatePromoMode({
        isGlobalFreeAccess: configData.data.isGlobalFreeAccess,
        promoMessage: configData.data.promoMessage
      }));
    }
  }, [configData, dispatch]);

  useEffect(() => {
    if (statusData?.data) {
      const isSubActive = Boolean(
        statusData.data.isActive || (statusData.data.expiresAt && new Date(statusData.data.expiresAt) > new Date())
      );
      dispatch(updateSubscriptionStatus({
        isActive: isSubActive,
        isPending: Boolean(statusData.data.isPending),
        pendingReference: statusData.data.pendingReference || null,
        gatewayReference: statusData.data.gatewayReference || null,
        expiresAt: statusData.data.expiresAt
      }));
    }
  }, [statusData, dispatch]);

  useEffect(() => {
    const handleSubActivated = (payload) => {
      dispatch(updateSubscriptionStatus({ isActive: true, isPending: false, expiresAt: payload?.expiresAt }));
      dispatch(apiSlice.util.invalidateTags(['Subscription', 'User']));
      refetchConfig();
      refetchStatus();
      notifyPaymentSuccessOnce();
      redirectToHome();
    };
    const handlePromoUpdate = () => { refetchConfig(); refetchStatus(); };

    socketService.on('subscription_updated', handleSubActivated);
    socketService.on('promo_updated', handlePromoUpdate);
    socketService.on('PROMO_MODE_CHANGED', handlePromoUpdate);
    return () => {
      socketService.off('subscription_updated', handleSubActivated);
      socketService.off('promo_updated', handlePromoUpdate);
      socketService.off('PROMO_MODE_CHANGED', handlePromoUpdate);
    };
  }, [dispatch, refetchConfig, refetchStatus, redirectToHome, notifyPaymentSuccessOnce]);

  useEffect(() => {
    const params = route?.params;
    const isSuccess = params?.status === 'success' || params?.payment === 'success';
    const ref = params?.reference || params?.transaction_id;

    if (isSuccess || ref) {
      dispatch(updateSubscriptionStatus({ isActive: true, isPending: false }));
      dispatch(apiSlice.util.invalidateTags(['Subscription', 'User']));
      notifyPaymentSuccessOnce();
      if (ref) verifyPaymentTrigger(ref).unwrap().catch(() => {});
      redirectToHome();
      return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryRef = urlParams.get('reference') || urlParams.get('transaction_id');
      const refToVerify = queryRef || sessionStorage.getItem('yely_gateway_ref') || sessionStorage.getItem('yely_pending_payment_ref');

      if (refToVerify) {
        sessionStorage.removeItem('yely_pending_payment_ref');
        sessionStorage.removeItem('yely_gateway_ref');
        if (queryRef && window.history?.replaceState) window.history.replaceState({}, document.title, window.location.pathname);

        verifyPaymentTrigger(refToVerify).unwrap().then((res) => {
          const vData = res?.data || res;
          if (vData?.isActive || vData?.status === 'COMPLETED') {
            dispatch(updateSubscriptionStatus({ isActive: true, isPending: false, expiresAt: vData?.expiresAt }));
            dispatch(apiSlice.util.invalidateTags(['Subscription', 'User']));
            notifyPaymentSuccessOnce();
            refetchStatus();
            refetchConfig();
            redirectToHome();
          }
        }).catch(() => { refetchStatus(); });
      }
    }
  }, [route?.params, verifyPaymentTrigger, dispatch, redirectToHome, refetchStatus, refetchConfig, notifyPaymentSuccessOnce]);

  useEffect(() => () => { dispatch(setSubscriptionModalDismissed(true)); }, [dispatch]);
  useFocusEffect(useCallback(() => { refetchConfig(); refetchStatus(); }, [refetchConfig, refetchStatus]));

  useEffect(() => {
    if (isStatusLoading || isConfigLoading) return;
    if (statusData?.data) {
      const isSubActive = Boolean(
        statusData.data.isActive || (statusData.data.expiresAt && new Date(statusData.data.expiresAt) > new Date())
      );
      setCurrentStep(isSubActive || promoMode?.isActive ? STEPS.DASHBOARD : STEPS.CHOOSE_PLAN);
    } else {
      setCurrentStep(STEPS.CHOOSE_PLAN);
    }
  }, [statusData, isStatusLoading, isConfigLoading, promoMode?.isActive]);

  const handleInitiatePayment = async () => {
    if (isInitiating || isRedirecting) return;
    try {
      setIsRedirecting(true);
      const platform = Platform.OS === 'web' ? 'pwa' : 'mobile';
      const response = await initializePayment({ planId: 'MONTHLY', platform }).unwrap();
      const payload = response?.data || response;
      if (!payload?.paymentUrl) throw new Error("Lien de paiement indisponible.");

      if (Platform.OS === 'web') {
        if (payload.reference) sessionStorage.setItem('yely_pending_payment_ref', payload.reference);
        if (payload.gatewayReference) sessionStorage.setItem('yely_gateway_ref', payload.gatewayReference);
        window.location.href = payload.paymentUrl;
      } else {
        const returnUrl = Linking.createURL('home') || 'yely://home?payment=success';
        let bRes = null;
        try { bRes = await WebBrowser.openAuthSessionAsync(payload.paymentUrl, returnUrl); }
        catch (_) { await WebBrowser.openBrowserAsync(payload.paymentUrl); }
        
        setIsRedirecting(false);

        let rRef = null;
        if (bRes?.type === 'success' && bRes?.url) {
          try {
            const u = new URL(bRes.url);
            rRef = u.searchParams.get('reference') || u.searchParams.get('transaction_id') || u.searchParams.get('id');
          } catch (_) {}
        }

        const candidateRef = rRef || payload.gatewayReference || payload.reference;
        if (candidateRef) {
          try {
            const vRes = await verifyPaymentTrigger(candidateRef).unwrap();
            const vData = vRes?.data || vRes;
            if (vData?.isActive || vData?.status === 'COMPLETED') {
              dispatch(updateSubscriptionStatus({ isActive: true, isPending: false, expiresAt: vData?.expiresAt }));
              notifyPaymentSuccessOnce();
              dispatch(apiSlice.util.invalidateTags(['Subscription', 'User']));
              redirectToHome();
              return;
            }
          } catch (_) {}
        }
        refetchConfig();
      }
    } catch (err) {
      setIsRedirecting(false);
      dispatch(showErrorToast({ title: "Erreur", message: err?.data?.message || err?.message || "Erreur paiement." }));
    }
  };

  const headerTopPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0) + 12;
  const canGoBack = currentStep === STEPS.CHOOSE_PLAN && statusData?.data && (statusData.data.isActive || promoMode?.isActive);

  if (isConfigLoading || isStatusLoading || !currentStep) {
    return (
      <View style={[styles.safeArea, { paddingTop: headerTopPadding }]}>
        <View style={styles.container}>
          <View style={styles.header}><SkeletonBone width={40} height={40} borderRadius={20} /><SkeletonBone width={120} height={24} /><SkeletonBone width={40} height={40} borderRadius={20} /></View>
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
        <View style={[styles.header, { paddingTop: headerTopPadding }]}>
          {hasValidAccess ? (
            canGoBack ? (
              <TouchableOpacity onPress={() => setCurrentStep(STEPS.DASHBOARD)} style={styles.headerIconBtn} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}>
                <Ionicons name="arrow-back" size={24} color={THEME.COLORS.textPrimary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleClose} style={styles.headerIconBtn} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}>
                <Ionicons name="close" size={24} color={THEME.COLORS.textPrimary} />
              </TouchableOpacity>
            )
          ) : (
            <TouchableOpacity onPress={handleLogout} style={styles.headerLogoutBtn} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}>
              <Ionicons name="log-out-outline" size={18} color="#FF4D4D" />
              <Text style={styles.headerLogoutText}>Quitter</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Passe Yely</Text>
          <View style={styles.headerIconBtnPlaceholder} />
        </View>
        <View style={styles.content}>
          {currentStep === STEPS.DASHBOARD ? (
            <SubscriptionDashboard statusData={statusData?.data} onRenew={() => setCurrentStep(STEPS.CHOOSE_PLAN)} onSelectOtherPlan={() => setCurrentStep(STEPS.CHOOSE_PLAN)} />
          ) : (
            <PlanSelection configData={configData?.data} userRole={userRole} onSelectPlan={handleInitiatePayment} isLoading={isInitiating || isRedirecting} />
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
  headerIconBtnPlaceholder: { width: 40, height: 40 },
  headerLogoutBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255, 77, 77, 0.12)', gap: 4 },
  headerLogoutText: { color: '#FF4D4D', fontSize: 13, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: THEME.COLORS.textPrimary },
  content: { flex: 1 }
});

export default SubscriptionScreen;