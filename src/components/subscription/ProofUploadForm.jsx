// src/components/subscription/ProofUploadForm.jsx
// COMPOSANT UI - Formulaire de soumission de preuve
// STANDARD: Industriel / Theme Dynamique Strict

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
        Envoie la capture du paiement pour activer ton compte immediatement.
      </Text>

      <GlassCard style={styles.formCard}>
        <Text style={styles.label}>Numero qui a fait le depot</Text>
        <GlassInput 
          placeholder="Ex: 0102030405"
          keyboardType="phone-pad"
          value={senderPhone}
          onChangeText={setSenderPhone}
          editable={!isSubmitting}
        />

        <Text style={styles.label}>La Preuve (Capture d'ecran)</Text>
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
    color: THEME.COLORS.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  familiarSubtitle: {
    fontSize: 16,
    color: THEME.COLORS.textSecondary,
    marginBottom: 30,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  formCard: {
    padding: 20,
  },
  label: {
    color: THEME.COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 15,
  },
  imagePickerArea: {
    width: '100%',
    height: 180,
    borderRadius: THEME.BORDERS.radius.md,
    borderWidth: 2,
    borderColor: THEME.COLORS.champagneGold,
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: THEME.COLORS.overlay,
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
    color: THEME.COLORS.champagneGold,
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
    color: THEME.COLORS.textSecondary,
    fontSize: 16,
  }
});

export default ProofUploadForm;