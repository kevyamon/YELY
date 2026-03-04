// src/screens/subscription/SubscriptionScreen.jsx
// ECRAN D'ABONNEMENT - Orchestrateur (Modulaire & Temps Réel)
// STANDARD: Clean Architecture / Bank Grade

import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import { useGetConfigQuery, useGetSubscriptionStatusQuery, useSubmitProofMutation } from '../../store/api/subscriptionApiSlice';
import { logout, updateSubscriptionStatus, updateUserInfo } from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';

// IMPORT DES SOUS-COMPOSANTS
import PlanSelection from '../../components/subscription/PlanSelection';
import ProofUploadForm from '../../components/subscription/ProofUploadForm';
import SubscriptionDashboard from '../../components/subscription/SubscriptionDashboard';

import ScreenWrapper from '../../components/ui/ScreenWrapper';
import socketService from '../../services/socketService';
import THEME from '../../theme/theme';

const STEPS = {
  DASHBOARD: 'DASHBOARD',
  CHOOSE_PLAN: 'CHOOSE_PLAN',
  UPLOAD_PROOF: 'UPLOAD_PROOF'
};

const SubscriptionScreen = () => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  
  const { data: configData, isLoading: isConfigLoading, refetch: refetchConfig } = useGetConfigQuery();
  const { data: statusData, isLoading: isStatusLoading, refetch: refetchStatus } = useGetSubscriptionStatusQuery();
  const [submitProof, { isLoading: isSubmitting }] = useSubmitProofMutation();

  const [currentStep, setCurrentStep] = useState(null); 
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [senderPhone, setSenderPhone] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  // ECOUTE TEMPS REEL DE LA PROMO (Sockets)
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;
    const handlePromoUpdate = () => refetchConfig();
    socket.on('promo_updated', handlePromoUpdate);
    return () => socket.off('promo_updated', handlePromoUpdate);
  }, [refetchConfig]);

  useFocusEffect(
    useCallback(() => {
      refetchConfig();
      refetchStatus();
    }, [refetchConfig, refetchStatus])
  );

  useEffect(() => {
    if (statusData?.data && !isStatusLoading) {
      if (statusData.data.isActive || statusData.data.isPending) {
        setCurrentStep(STEPS.DASHBOARD);
      } else {
        setCurrentStep(STEPS.CHOOSE_PLAN);
      }
    }
  }, [statusData, isStatusLoading]);

  useEffect(() => {
    let interval;
    if (statusData?.data?.expiresAt && statusData.data.isActive) {
      interval = setInterval(() => {
        const difference = new Date(statusData.data.expiresAt) - new Date();
        if (difference > 0) {
          setTimeLeft({
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60)
          });
        } else {
          setTimeLeft(null);
          clearInterval(interval);
          setCurrentStep(STEPS.CHOOSE_PLAN); 
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [statusData]);

  const handleSelectPlan = async (planType, paymentLink, price) => {
    if (!paymentLink) {
      dispatch(showErrorToast({ title: "Erreur", message: "Le lien de paiement n'est pas configuré." }));
      return;
    }
    try {
      const separator = paymentLink.includes('?') ? '&' : '?';
      const finalLink = `${paymentLink}${separator}amount=${price}`;
      await Linking.openURL(finalLink);
      
      setSelectedPlan(planType);
      setCurrentStep(STEPS.UPLOAD_PROOF);
    } catch (error) {
      dispatch(showErrorToast({ title: "Application requise", message: "Veuillez installer Wave." }));
      const storeUrl = Platform.OS === 'ios' 
        ? 'https://apps.apple.com/app/wave-mobile-money/id1486476483' 
        : 'https://play.google.com/store/apps/details?id=com.wave.personal';
      setTimeout(() => Linking.openURL(storeUrl).catch(() => {}), 1500);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      dispatch(showErrorToast({ title: "Permission requise", message: "Accès à la galerie requis." }));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8, 
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProofImage(result.assets[0]);
    }
  };

  const handleSubmitProof = async () => {
    const phoneRegex = /^\+?[0-9\s]{8,20}$/;
    if (!senderPhone || !phoneRegex.test(senderPhone)) {
      dispatch(showErrorToast({ title: "Format invalide", message: "Entrez un numéro valide." }));
      return;
    }
    if (!proofImage) {
      dispatch(showErrorToast({ title: "Capture manquante", message: "Joignez la capture d'écran." }));
      return;
    }

    const formData = new FormData();
    formData.append('planId', selectedPlan);
    formData.append('senderPhone', senderPhone.replace(/[\s-]/g, ''));
    
    const filename = proofImage.uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    formData.append('proofImage', {
      uri: proofImage.uri,
      name: filename || 'proof_image.jpg',
      type: match ? `image/${match[1]}` : `image/jpeg`
    });

    try {
      await submitProof(formData).unwrap();
      dispatch(updateSubscriptionStatus({ isPending: true }));
      dispatch(updateUserInfo({ subscriptionStatus: 'pending' }));
      dispatch(showSuccessToast({ title: "Transmission réussie", message: "Vérification en cours." }));
      setCurrentStep(STEPS.DASHBOARD); 
    } catch (error) {
      dispatch(showErrorToast({ title: "Échec", message: error?.data?.message || "Erreur réseau." }));
    }
  };

  if (isConfigLoading || isStatusLoading || !currentStep) {
    return (
      <ScreenWrapper style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
        <Text style={styles.loadingText}>Synchronisation du profil...</Text>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={[styles.container, { paddingTop: Math.max(insets.top + 20, 20) }]}>
        
        {currentStep === STEPS.DASHBOARD && (
          <SubscriptionDashboard 
            status={statusData.data} 
            timeLeft={timeLeft} 
            onProlong={() => setCurrentStep(STEPS.CHOOSE_PLAN)} 
          />
        )}

        {currentStep === STEPS.CHOOSE_PLAN && (
          <PlanSelection 
            config={configData.data} 
            status={statusData.data}
            onSelectPlan={handleSelectPlan}
            onBack={() => setCurrentStep(STEPS.DASHBOARD)}
            onLogout={() => dispatch(logout())}
          />
        )}

        {currentStep === STEPS.UPLOAD_PROOF && (
          <ProofUploadForm 
            senderPhone={senderPhone}
            setSenderPhone={setSenderPhone}
            proofImage={proofImage}
            onPickImage={pickImage}
            onSubmit={handleSubmitProof}
            onCancel={() => setCurrentStep(STEPS.CHOOSE_PLAN)}
            isSubmitting={isSubmitting}
          />
        )}

      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: THEME.COLORS.textPrimary || '#FFFFFF', marginTop: 15, fontSize: 16 },
  container: { flex: 1, paddingHorizontal: 20, paddingBottom: 20, justifyContent: 'center' }
});

export default SubscriptionScreen;