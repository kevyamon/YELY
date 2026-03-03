// src/screens/subscription/SubscriptionScreen.jsx
// ÉCRAN D'ABONNEMENT - Logique Métier "Mur de Preuve"
// STANDARD: Industriel / Architecture Modulaire

import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { useGetConfigQuery, useSubmitProofMutation } from '../../store/api/subscriptionApiSlice';
import { updateSubscriptionStatus } from '../../store/slices/authSlice';

import ScreenWrapper from '../../components/ui/ScreenWrapper';
import THEME from '../../theme/theme';

// Import des modules d'interface
import PricingCard from '../../components/subscription/PricingCard';
import ProofUploadForm from '../../components/subscription/ProofUploadForm';

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
  
  const { data: configData, isLoading: isConfigLoading, isError: isConfigError } = useGetConfigQuery();
  const [submitProof, { isLoading: isSubmitting }] = useSubmitProofMutation();

  const [currentStep, setCurrentStep] = useState(STEPS.CHOOSE_PLAN);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [senderPhone, setSenderPhone] = useState('');
  const [proofImage, setProofImage] = useState(null);

  const handleSelectPlan = async (planType, paymentLink) => {
    if (!paymentLink) {
      Alert.alert("Erreur", "Le lien de paiement n'est pas configuré pour ce forfait.");
      return;
    }

    try {
      const supported = await Linking.canOpenURL(paymentLink);
      if (supported) {
        await Linking.openURL(paymentLink);
      } else {
        await Linking.openURL(paymentLink); 
      }
      
      setSelectedPlan(planType);
      setCurrentStep(STEPS.UPLOAD_PROOF);
    } catch (error) {
      console.error("[LINKING ERROR]: Impossible d'ouvrir le lien Wave", error);
      Alert.alert("Erreur", "Impossible d'ouvrir l'application de paiement.");
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission requise", "L'accès à la galerie est requis pour transmettre la preuve.");
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
    const phoneRegex = /^\+?[0-9\s]{8,20}$/;
    if (!senderPhone || !phoneRegex.test(senderPhone)) {
      Alert.alert("Format invalide", "Veuillez entrer un numéro de téléphone valide.");
      return;
    }
    if (!proofImage) {
      Alert.alert("Capture manquante", "Veuillez joindre la capture d'écran.");
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
      Alert.alert("Succès", response.message || "Un administrateur vérifie votre paiement.");
    } catch (error) {
      console.error("[SUBMIT ERROR]:", error);
      Alert.alert("Échec de l'envoi", error?.data?.message || "Erreur de transmission réseau.");
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
      <View style={styles.container}>
        
        {currentStep === STEPS.CHOOSE_PLAN && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Renouveler mon accès</Text>
            <Text style={styles.subtitle}>Sélectionnez votre forfait pour continuer.</Text>

            <PricingCard 
              title="Pass 1 Semaine"
              price={config.weekly.price}
              crossedPrice="1000"
              isPromo={config.isPromoActive}
              description="Paiement par Wave (Caisse Principale)"
              onPress={() => handleSelectPlan(PLAN_TYPES.WEEKLY, config.weekly.link)}
            />

            <PricingCard 
              title="Pass 1 Mois"
              price={config.monthly.price}
              crossedPrice="6000"
              isPromo={config.isPromoActive}
              description="Paiement par Wave (Caisse Partenaire)"
              onPress={() => handleSelectPlan(PLAN_TYPES.MONTHLY, config.monthly.link)}
            />
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
    padding: 20,
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
});

export default SubscriptionScreen;