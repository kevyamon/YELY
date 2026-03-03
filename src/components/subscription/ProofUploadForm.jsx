// src/components/subscription/ProofUploadForm.jsx
// COMPOSANT UI - Formulaire de soumission de preuve
// STANDARD: Industriel / Theme Dynamique

import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';
import GlassCard from '../ui/GlassCard';
import GlassInput from '../ui/GlassInput';
import GoldButton from '../ui/GoldButton';

const ProofUploadForm = ({
  senderPhone,
  setSenderPhone,
  proofImage,
  onPickImage,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  return (
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
          onPress={onPickImage}
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
          onPress={onSubmit}
          disabled={isSubmitting || !proofImage || !senderPhone}
          style={styles.submitBtn}
        />
        
        <TouchableOpacity 
          style={styles.cancelBtn} 
          onPress={onCancel}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelBtnText}>Annuler</Text>
        </TouchableOpacity>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
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
  familiarSubtitle: {
    fontSize: 16,
    color: THEME.COLORS.textSecondary || '#E2E8F0',
    marginBottom: 30,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  formCard: {
    padding: 20,
  },
  label: {
    color: THEME.COLORS.textPrimary || '#FFFFFF',
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
    borderColor: THEME.COLORS.champagneGold ? `${THEME.COLORS.champagneGold}40` : 'rgba(255, 215, 0, 0.3)',
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: THEME.COLORS.glassDark ? `${THEME.COLORS.glassDark}80` : 'rgba(255, 255, 255, 0.05)',
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
    color: THEME.COLORS.champagneGold || '#FFD700',
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
    color: THEME.COLORS.textSecondary || '#A0AEC0',
    fontSize: 16,
  }
});

export default ProofUploadForm;