// src/screens/subscription/SubscriptionScreen.jsx
// ECRAN D'ABONNEMENT - Orchestrateur (Modulaire & Temps Reel)
// STANDARD: Clean Architecture / Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { useGetConfigQuery, useGetSubscriptionStatusQuery, useSubmitProofMutation } from '../../store/api/subscriptionApiSlice';
import { logout, selectPromoMode, updatePromoMode, updateSubscriptionStatus, selectCurrentUser } from '../../store/slices/authSlice';
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
  const user = useSelector(selectCurrentUser);
  const userRole = user?.role;
  
  const { data: configData, isLoading: isConfigLoading, isError: isConfigError, refetch: refetchConfig } = useGetConfigQuery();
  const { data: statusData, isLoading: isStatusLoading, isError: isStatusError, refetch: refetchStatus } = useGetSubscriptionStatusQuery();
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
    if (isStatusLoading || isConfigLoading) return;

    if (statusData?.data) {
      if (statusData.data.isActive || statusData.data.isPending || promoMode?.isActive) {
        setCurrentStep(STEPS.DASHBOARD);
      } else {
        setCurrentStep(STEPS.CHOOSE_PLAN);
      }
    } else {
      setCurrentStep(STEPS.CHOOSE_PLAN);
    }
  }, [statusData, isStatusLoading, isConfigLoading, promoMode?.isActive]);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setCurrentStep(STEPS.UPLOAD_PROOF);
  };

  const handleProlong = () => {
    setCurrentStep(STEPS.CHOOSE_PLAN);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      dispatch(showErrorToast({ message: "Permission d'accès aux photos requise." }));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProofImage(result.assets[0]);
    }
  };

  const handleSubmitProof = async () => {
    if (!senderPhone || !proofImage) {
      dispatch(showErrorToast({ message: "Veuillez remplir le numéro expéditeur et choisir une image." }));
      return;
    }

    try {
      const formattedFile = formatImageForUpload(proofImage);
      
      const formData = new FormData();
      formData.append('planId', selectedPlan.id);
      formData.append('senderPhone', senderPhone);
      formData.append('file', formattedFile);

      await submitProof(formData).unwrap();
      
      dispatch(updateSubscriptionStatus({ isPending: true, isRejected: false }));
      dispatch(showSuccessToast({ message: "Preuve soumise avec succès." }));
      
      setProofImage(null);
      setSenderPhone('');
      
      navigation.replace('WaitSubscription');

    } catch (err) {
      dispatch(showErrorToast({ message: err?.data?.message || "Erreur lors de la soumission de la preuve." }));
    }
  };

  const renderHeader = () => {
    const isBackVisible = currentStep !== STEPS.DASHBOARD && 
                          statusData?.data && 
                          (statusData.data.isActive || promoMode?.isActive);

    return (
      <View style={styles.header}>
        {isBackVisible ? (
          <TouchableOpacity onPress={() => setCurrentStep(STEPS.DASHBOARD)} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={THEME.COLORS.textPrimary} />
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
              userRole={userRole}
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