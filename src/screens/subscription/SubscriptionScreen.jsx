// src/screens/subscription/SubscriptionScreen.jsx
// ECRAN D'ABONNEMENT - Orchestrateur (Modulaire & Temps Reel)
// STANDARD: Clean Architecture / Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { useGetConfigQuery, useGetSubscriptionStatusQuery, useSubmitProofMutation } from '../../store/api/subscriptionApiSlice';
import { logout, selectPromoMode, updatePromoMode, updateSubscriptionStatus } from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';

import PlanSelection from '../../components/subscription/PlanSelection';
import ProofUploadForm from '../../components/subscription/ProofUploadForm';
import SubscriptionDashboard from '../../components/subscription/SubscriptionDashboard';
import GlobalSkeleton, { SkeletonBone } from '../../components/ui/GlobalSkeleton';

import socketService from '../../services/socketService';
import THEME from '../../theme/theme';

const STEPS = {
  DASHBOARD: 'DASHBOARD',
  CHOOSE_PLAN: 'CHOOSE_PLAN',
  UPLOAD_PROOF: 'UPLOAD_PROOF'
};

const formatImageForUpload = (imageAsset, prefix = 'proof') => {
  let localUri = imageAsset.uri;
  
  if (Platform.OS === 'android' && !localUri.includes('file://') && !localUri.startsWith('content://')) {
    localUri = `file://${localUri}`;
  } else if (Platform.OS === 'ios') {
    localUri = localUri.replace('file://', '');
  }

  const filename = imageAsset.fileName || `${prefix}_${Date.now()}.jpg`;
  const type = imageAsset.mimeType || 'image/jpeg';

  return {
    uri: localUri,
    name: filename,
    type: type,
  };
};

const SubscriptionScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const promoMode = useSelector(selectPromoMode);
  
  const { data: configData, isLoading: isConfigLoading, refetch: refetchConfig } = useGetConfigQuery();
  const { data: statusData, isLoading: isStatusLoading, refetch: refetchStatus } = useGetSubscriptionStatusQuery();
  const [submitProof, { isLoading: isSubmitting }] = useSubmitProofMutation();

  const [currentStep, setCurrentStep] = useState(null); 
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [senderPhone, setSenderPhone] = useState('');
  const [proofImage, setProofImage] = useState(null);

  useEffect(() => {
    if (configData?.data) {
      dispatch(updatePromoMode({
        isGlobalFreeAccess: configData.data.isGlobalFreeAccess,
        promoMessage: configData.data.promoMessage
      }));
    }
  }, [configData, dispatch]);

  useEffect(() => {
    const handlePromoUpdate = () => {
      refetchConfig();
      refetchStatus();
    };
    
    socketService.on('promo_updated', handlePromoUpdate);
    socketService.on('PROMO_MODE_CHANGED', handlePromoUpdate);
    
    return () => {
      socketService.off('promo_updated', handlePromoUpdate);
      socketService.off('PROMO_MODE_CHANGED', handlePromoUpdate);
    };
  }, [refetchConfig, refetchStatus]);

  useFocusEffect(
    useCallback(() => {
      refetchConfig();
      refetchStatus();
    }, [refetchConfig, refetchStatus])
  );

  useEffect(() => {
    if (statusData?.data && !isStatusLoading) {
      if (statusData.data.isActive || statusData.data.isPending || promoMode?.isActive) {
        setCurrentStep(STEPS.DASHBOARD);
      } else {
        setCurrentStep(STEPS.CHOOSE_PLAN);
      }
    }
  }, [statusData, isStatusLoading, promoMode?.isActive]);

  const handleProlong = useCallback(() => {
    setCurrentStep(STEPS.CHOOSE_PLAN);
  }, []);

  const handleSelectPlan = async (planType, paymentLink, price) => {
    if (!paymentLink) {
      dispatch(showErrorToast({ title: "Erreur", message: "Le lien de paiement n'est pas configure." }));
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
      dispatch(showErrorToast({ title: "Permission requise", message: "Acces a la galerie requis." }));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
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
      dispatch(showErrorToast({ title: "Format invalide", message: "Entrez un numero valide." }));
      return;
    }
    if (!proofImage) {
      dispatch(showErrorToast({ title: "Capture manquante", message: "Joignez la capture d'ecran." }));
      return;
    }

    const formData = new FormData();
    formData.append('planId', selectedPlan);
    formData.append('senderPhone', senderPhone.replace(/[\s-]/g, ''));
    
    const formattedProof = formatImageForUpload(proofImage, 'proof');
    formData.append('proofImage', formattedProof);

    try {
      await submitProof(formData).unwrap();
      dispatch(updateSubscriptionStatus({ isPending: true }));
      dispatch(showSuccessToast({ title: "Transmission reussie", message: "Verification en cours." }));
      setCurrentStep(STEPS.DASHBOARD); 
    } catch (error) {
      if (error?.status === 'FETCH_ERROR' || error?.status === 'TIMEOUT_ERROR') {
        dispatch(showSuccessToast({ 
          title: "Envoi en cours", 
          message: "Le fichier est lourd, traitement en arriere-plan..." 
        }));
        setCurrentStep(STEPS.DASHBOARD);
      } else {
        dispatch(showErrorToast({ title: "Echec", message: error?.data?.message || "Erreur reseau inattendue." }));
      }
    }
  };

  const renderHeader = () => {
    const isActive = statusData?.data?.isActive;
    const isNavigationAllowed = isActive || promoMode?.isActive;

    return (
      <View style={styles.header}>
        {isNavigationAllowed ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="close" size={28} color={THEME.COLORS.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        
        <Text style={styles.headerTitle}>Pass Yely</Text>

        <TouchableOpacity onPress={() => dispatch(logout())} style={styles.headerButton}>
          <Ionicons name="log-out-outline" size={26} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    );
  };

  if (isConfigLoading || isStatusLoading || !currentStep) {
    return (
      <SafeAreaView style={styles.safeArea}>
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {renderHeader()}

        <View style={styles.content}>
          {currentStep === STEPS.DASHBOARD && (
            <SubscriptionDashboard 
              status={statusData.data} 
              onProlong={handleProlong} 
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

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.COLORS.background },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  headerButton: { padding: 8, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)' },
  headerSpacer: { width: 42 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  content: { flex: 1, paddingHorizontal: 20, paddingBottom: 20, justifyContent: 'center' }
});

export default SubscriptionScreen;