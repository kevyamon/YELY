// src/screens/subscription/SubscriptionScreen.jsx
// ÉCRAN D'ABONNEMENT - "Le Mur de Preuve" (Scénario Moussa)
// STANDARD: Industriel / UX Fluide

import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useDispatch } from 'react-redux';

// Hooks RTK Query et Redux
import { useGetConfigQuery, useSubmitProofMutation } from '../../store/api/subscriptionApiSlice';
import { updateSubscriptionStatus } from '../../store/slices/authSlice';

// Composants UI (Adaptation basée sur ton architecture)
import GlassCard from '../../components/ui/GlassCard';
import GlassInput from '../../components/ui/GlassInput';
import GoldButton from '../../components/ui/GoldButton';
import ScreenWrapper from '../../components/ui/ScreenWrapper';

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
  
  // Requêtes API
  const { data: configData, isLoading: isConfigLoading, isError: isConfigError } = useGetConfigQuery();
  const [submitProof, { isLoading: isSubmitting }] = useSubmitProofMutation();

  // État local
  const [currentStep, setCurrentStep] = useState(STEPS.CHOOSE_PLAN);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [senderPhone, setSenderPhone] = useState('');
  const [proofImage, setProofImage] = useState(null);

  /**
   * ÉTAPE 1 : Sélection du forfait et redirection Wave
   */
  const handleSelectPlan = async (planType, paymentLink) => {
    if (!paymentLink) {
      Alert.alert("Erreur", "Le lien de paiement n'est pas configuré pour ce forfait.");
      return;
    }

    try {
      // Ouvre l'application Wave ou le navigateur
      const supported = await Linking.canOpenURL(paymentLink);
      if (supported) {
        await Linking.openURL(paymentLink);
      } else {
        await Linking.openURL(paymentLink); // Fallback forçage
      }
      
      // Bascule l'UI sur le formulaire de preuve
      setSelectedPlan(planType);
      setCurrentStep(STEPS.UPLOAD_PROOF);
    } catch (error) {
      console.error("[LINKING ERROR]: Impossible d'ouvrir le lien Wave", error);
      Alert.alert("Erreur", "Impossible d'ouvrir l'application de paiement.");
    }
  };

  /**
   * ÉTAPE 2 : Sélection de l'image (Galerie)
   */
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission requise", "Nous avons besoin d'accéder à vos photos pour la capture d'écran.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8, // Compression pour économiser la data et le stockage
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProofImage(result.assets[0]);
    }
  };

  /**
   * ÉTAPE 3 : Soumission au Backend Sécurisé
   */
  const handleSubmitProof = async () => {
    // Validation stricte Front-end avant envoi
    const phoneRegex = /^\+?[0-9\s]{8,20}$/;
    if (!senderPhone || !phoneRegex.test(senderPhone)) {
      Alert.alert("Format invalide", "Veuillez entrer un numéro de téléphone valide.");
      return;
    }
    if (!proofImage) {
      Alert.alert("Capture manquante", "Veuillez joindre la capture d'écran de votre paiement.");
      return;
    }

    // Préparation du FormData (Format exigé pour les fichiers natifs)
    const formData = new FormData();
    formData.append('planId', selectedPlan);
    formData.append('senderPhone', senderPhone.replace(/[\s-]/g, ''));
    
    // Extraction propre de l'extension et du type MIME
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
      
      // Succès : Mise à jour de l'état global Redux pour bloquer l'interface
      dispatch(updateSubscriptionStatus({ isPending: true }));
      Alert.alert("C'est reçu !", response.message || "Un administrateur vérifie votre paiement.");
      
    } catch (error) {
      console.error("[SUBMIT ERROR]:", error);
      Alert.alert("Échec de l'envoi", error?.data?.message || "Une erreur est survenue lors de l'envoi.");
    }
  };

  // RENDU : Écran de chargement initial
  if (isConfigLoading) {
    return (
      <ScreenWrapper style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Connexion à la caisse...</Text>
      </ScreenWrapper>
    );
  }

  if (isConfigError || !configData?.data) {
    return (
      <ScreenWrapper style={styles.centerContainer}>
        <Text style={styles.errorText}>Impossible de charger les tarifs actuels.</Text>
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
            <Text style={styles.subtitle}>Sélectionnez votre forfait pour continuer à recevoir des courses.</Text>

            {/* FORFAIT SEMAINE */}
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={() => handleSelectPlan(PLAN_TYPES.WEEKLY, config.weekly.link)}
              style={styles.cardWrapper}
            >
              <GlassCard style={styles.pricingCard}>
                <Text style={styles.planTitle}>Pass 1 Semaine</Text>
                <View style={styles.priceRow}>
                  {config.isPromoActive && <Text style={styles.crossedPrice}>1000 FCFA</Text>}
                  <Text style={[styles.planPrice, config.isPromoActive && styles.promoPrice]}>
                    {config.weekly.price} FCFA
                  </Text>
                </View>
                <Text style={styles.planDesc}>Paiement par Wave (Caisse Principale)</Text>
              </GlassCard>
            </TouchableOpacity>

            {/* FORFAIT MOIS */}
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={() => handleSelectPlan(PLAN_TYPES.MONTHLY, config.monthly.link)}
              style={styles.cardWrapper}
            >
              <GlassCard style={styles.pricingCard}>
                <Text style={styles.planTitle}>Pass 1 Mois</Text>
                <View style={styles.priceRow}>
                  {config.isPromoActive && <Text style={styles.crossedPrice}>6000 FCFA</Text>}
                  <Text style={[styles.planPrice, config.isPromoActive && styles.promoPrice]}>
                    {config.monthly.price} FCFA
                  </Text>
                </View>
                <Text style={styles.planDesc}>Paiement par Wave (Caisse Partenaire)</Text>
                {config.isPromoActive && (
                  <View style={styles.promoBadge}>
                    <Text style={styles.promoBadgeText}>PROMO FLASH</Text>
                  </View>
                )}
              </GlassCard>
            </TouchableOpacity>
          </View>
        )}

        {currentStep === STEPS.UPLOAD_PROOF && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Confirmation d'activation</Text>
            <Text style={styles.familiarSubtitle}>
              Envoie la capture du paiement pour activer ton compte immédiatement.
            </Text>

            <GlassCard style={styles.formCard}>
              <Text style={styles.label}>Numéro qui a fait le dépôt</Text>
              <GlassInput 
                placeholder="Ex: 0102030405"
                keyboardType="phone-pad"
                value={senderPhone}
                onChangeText={setSenderPhone}
                editable={!isSubmitting}
              />

              <Text style={styles.label}>La Preuve (Capture d'écran)</Text>
              <TouchableOpacity 
                style={styles.imagePickerArea} 
                onPress={pickImage}
                disabled={isSubmitting}
              >
                {proofImage ? (
                  <Image source={{ uri: proofImage.uri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Text style={styles.placeholderText}>+ Ajouter la photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <GoldButton 
                title={isSubmitting ? "Envoi en cours..." : "ENVOYER MA CAPTURE"}
                onPress={handleSubmitProof}
                disabled={isSubmitting || !proofImage || !senderPhone}
                style={styles.submitBtn}
              />
              
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setCurrentStep(STEPS.CHOOSE_PLAN)}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
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
    color: '#FFF',
    marginTop: 15,
    fontSize: 16,
  },
  errorText: {
    color: '#FF6B6B',
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
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#A0AEC0',
    marginBottom: 30,
    textAlign: 'center',
  },
  familiarSubtitle: {
    fontSize: 16,
    color: '#E2E8F0',
    marginBottom: 30,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  cardWrapper: {
    marginBottom: 20,
  },
  pricingCard: {
    padding: 25,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  planTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  crossedPrice: {
    fontSize: 18,
    color: '#A0AEC0',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  planPrice: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFD700', // Gold par défaut
  },
  promoPrice: {
    color: '#FF4757', // Rouge impactant si promo
    fontSize: 30,
  },
  planDesc: {
    fontSize: 14,
    color: '#CBD5E0',
    textAlign: 'center',
  },
  promoBadge: {
    position: 'absolute',
    top: 15,
    right: -30,
    backgroundColor: '#FF4757',
    paddingVertical: 5,
    paddingHorizontal: 30,
    transform: [{ rotate: '45deg' }],
  },
  promoBadgeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  formCard: {
    padding: 20,
  },
  label: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 15,
  },
  imagePickerArea: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: 10,
  },
  cancelBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#A0AEC0',
    fontSize: 16,
  }
});

export default SubscriptionScreen;