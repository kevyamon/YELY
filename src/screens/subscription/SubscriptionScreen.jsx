// src/screens/subscription/SubscriptionScreen.jsx
// ECRAN D'ABONNEMENT - Logique Metier "Mur de Preuve"
// STANDARD: Industriel / Architecture Modulaire

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import { useGetConfigQuery, useSubmitProofMutation } from '../../store/api/subscriptionApiSlice';
import { logout, updateSubscriptionStatus, updateUserInfo } from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';

import PricingCard from '../../components/subscription/PricingCard';
import ProofUploadForm from '../../components/subscription/ProofUploadForm';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import THEME from '../../theme/theme';

const STEPS = {
  CHOOSE_PLAN: 'CHOOSE_PLAN',
  UPLOAD_PROOF: 'UPLOAD_PROOF'
};

const PLAN_TYPES = {
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY'
};

const SubscriptionScreen = () => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  
  // On récupère la fonction refetch pour forcer l'actualisation
  const { data: configData, isLoading: isConfigLoading, isError: isConfigError, refetch } = useGetConfigQuery();
  const [submitProof, { isLoading: isSubmitting }] = useSubmitProofMutation();

  const [currentStep, setCurrentStep] = useState(STEPS.CHOOSE_PLAN);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [senderPhone, setSenderPhone] = useState('');
  const [proofImage, setProofImage] = useState(null);

  // CORRECTION SENIOR : Le useFocusEffect doit être ici pour relancer la requête (refetch) à chaque fois que la page apparaît !
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // AJOUT SENIOR: On récupère le "price" en 3ème paramètre
  const handleSelectPlan = async (planType, paymentLink, price) => {
    if (!paymentLink) {
      dispatch(showErrorToast({ 
        title: "Erreur de configuration", 
        message: "Le lien de paiement n'est pas configuré." 
      }));
      return;
    }

    try {
      // 1. On injecte le montant directement dans l'URL pour Wave
      const separator = paymentLink.includes('?') ? '&' : '?';
      const finalLink = `${paymentLink}${separator}amount=${price}`;

      // 2. On ouvre directement l'application, sans passer par canOpenURL (qui bloque sur Android 11+)
      await Linking.openURL(finalLink);
      
      setSelectedPlan(planType);
      setCurrentStep(STEPS.UPLOAD_PROOF);
    } catch (error) {
      console.error("[LINKING ERROR]:", error);
      
      dispatch(showErrorToast({ 
        title: "Application requise", 
        message: "Veuillez installer Wave pour effectuer le paiement." 
      }));

      const storeUrl = Platform.OS === 'ios' 
        ? 'https://apps.apple.com/app/wave-mobile-money/id1486476483' 
        : 'https://play.google.com/store/apps/details?id=com.wave.personal';
      
      setTimeout(() => {
        Linking.openURL(storeUrl).catch(() => console.log("Echec ouverture Store"));
      }, 1500);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      dispatch(showErrorToast({ 
        title: "Permission requise", 
        message: "L'accès à la galerie est requis pour transmettre la preuve." 
      }));
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
      dispatch(showErrorToast({ 
        title: "Format invalide", 
        message: "Veuillez entrer un numéro de téléphone valide." 
      }));
      return;
    }
    if (!proofImage) {
      dispatch(showErrorToast({ 
        title: "Capture manquante", 
        message: "Veuillez joindre la capture d'écran." 
      }));
      return;
    }

    const formData = new FormData();
    formData.append('planId', selectedPlan);
    formData.append('senderPhone', senderPhone.replace(/[\s-]/g, ''));
    
    const filename = proofImage.uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append('proofImage', {
      uri: proofImage.uri,
      name: filename || 'proof_image.jpg',
      type: type
    });

    try {
      const response = await submitProof(formData).unwrap();
      dispatch(updateSubscriptionStatus({ isPending: true }));
      dispatch(updateUserInfo({ subscriptionStatus: 'pending' }));
      dispatch(showSuccessToast({ 
        title: "Transmission réussie", 
        message: response.message || "Un administrateur vérifie votre paiement." 
      }));
    } catch (error) {
      console.error("[SUBMIT ERROR]:", error);
      dispatch(showErrorToast({ 
        title: "Échec de l'envoi", 
        message: error?.data?.message || "Erreur de transmission réseau." 
      }));
    }
  };

  if (isConfigLoading) {
    return (
      <ScreenWrapper style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
        <Text style={styles.loadingText}>Connexion sécurisée en cours...</Text>
      </ScreenWrapper>
    );
  }

  if (isConfigError || !configData?.data) {
    return (
      <ScreenWrapper style={styles.centerContainer}>
        <Text style={styles.errorText}>Impossible de charger les données tarifaires.</Text>
      </ScreenWrapper>
    );
  }

  const config = configData.data;

  return (
    <ScreenWrapper>
      <View style={[styles.container, { paddingTop: Math.max(insets.top + 20, 20) }]}>
        
        {currentStep === STEPS.CHOOSE_PLAN && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Renouveler mon accès</Text>
            <Text style={styles.subtitle}>Sélectionnez votre forfait pour continuer.</Text>

            {/* AJOUT SENIOR: On passe le prix de l'abonnement à la fonction */}
            <PricingCard 
              title="Pass 1 Semaine"
              price={config.weekly.price}
              crossedPrice="1000"
              isPromo={config.isPromoActive}
              description="Paiement par Wave (Caisse Principale)"
              onPress={() => handleSelectPlan(PLAN_TYPES.WEEKLY, config.weekly.link, config.weekly.price)}
            />

            {/* AJOUT SENIOR: On passe le prix de l'abonnement à la fonction */}
            <PricingCard 
              title="Pass 1 Mois"
              price={config.monthly.price}
              crossedPrice="6000"
              isPromo={config.isPromoActive}
              description="Paiement par Wave (Caisse Partenaire)"
              onPress={() => handleSelectPlan(PLAN_TYPES.MONTHLY, config.monthly.link, config.monthly.price)}
            />

            <TouchableOpacity 
              style={styles.logoutBtn} 
              onPress={() => dispatch(logout())}
            >
              <Ionicons name="log-out-outline" size={20} color={THEME.COLORS.textSecondary} />
              <Text style={styles.logoutText}>Se déconnecter de ce compte</Text>
            </TouchableOpacity>
          </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: THEME.COLORS.textPrimary || '#FFFFFF',
    marginTop: 15,
    fontSize: 16,
  },
  errorText: {
    color: THEME.COLORS.error || '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  stepContainer: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.COLORS.textPrimary || '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: THEME.COLORS.textSecondary || '#A0AEC0',
    marginBottom: 30,
    textAlign: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    padding: 15,
  },
  logoutText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 14,
    marginLeft: 8,
    textDecorationLine: 'underline',
  }
});

export default SubscriptionScreen;