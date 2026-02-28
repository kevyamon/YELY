// src/components/ride/RatingModal.jsx
// MODALE DE NOTATION - Autonome et Nettoyage d'Etat Integre

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { useRateRideMutation } from '../../store/api/ridesApiSlice';
import { clearCurrentRide } from '../../store/slices/rideSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const RatingModal = ({ visible, rideId, driverName, onClose }) => {
  const dispatch = useDispatch();
  const [rateRide, { isLoading }] = useRateRideMutation();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleStarPress = (selectedRating) => {
    setRating(selectedRating);
  };

  const handleCleanupAndClose = () => {
    // Purge explicite de la course du store pour liberer l'interface client
    dispatch(clearCurrentRide());
    if (onClose) onClose();
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      dispatch(showErrorToast({ title: "Validation requise", message: "Veuillez attribuer une note avant de valider." }));
      return;
    }

    try {
      await rateRide({ rideId, rating, comment: comment.trim() }).unwrap();
      dispatch(showSuccessToast({ title: "Merci", message: "Votre avis a ete enregistre avec succes." }));
      handleCleanupAndClose();
    } catch (error) {
      dispatch(showErrorToast({ title: "Erreur systeme", message: error?.data?.message || "Impossible d'enregistrer la note." }));
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          style={styles.modalBackdrop} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCard}>
            
            <View style={styles.header}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark" size={32} color={THEME.COLORS.success} />
              </View>
              <Text style={styles.titleText}>Course Terminee</Text>
              <Text style={styles.subtitleText}>
                Comment s'est passe votre trajet avec {driverName || 'le chauffeur'} ?
              </Text>
            </View>

            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity 
                  key={star} 
                  onPress={() => handleStarPress(star)}
                  activeOpacity={0.7}
                  style={styles.starButton}
                >
                  <Ionicons 
                    name={star <= rating ? "star" : "star-outline"} 
                    size={40} 
                    color={star <= rating ? THEME.COLORS.champagneGold : THEME.COLORS.textTertiary} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Laissez un commentaire (optionnel)"
                placeholderTextColor={THEME.COLORS.textTertiary}
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={200}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, (rating === 0 || isLoading) && styles.submitButtonDisabled]} 
              onPress={handleSubmit}
              disabled={rating === 0 || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={THEME.COLORS.background} />
              ) : (
                <Text style={styles.submitButtonText}>VALIDER MON AVIS</Text>
              )}
            </TouchableOpacity>

            {!isLoading && (
              <TouchableOpacity style={styles.skipButton} onPress={handleCleanupAndClose}>
                <Text style={styles.skipButtonText}>Passer</Text>
              </TouchableOpacity>
            )}

          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: THEME.COLORS.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: THEME.SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: THEME.SPACING.lg,
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.SPACING.md,
    borderWidth: 2,
    borderColor: THEME.COLORS.success,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
    marginBottom: THEME.SPACING.xs,
  },
  subtitleText: {
    fontSize: 15,
    color: THEME.COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: THEME.SPACING.sm,
    marginBottom: THEME.SPACING.xl,
  },
  starButton: {
    padding: THEME.SPACING.xs,
  },
  inputContainer: {
    width: '100%',
    backgroundColor: THEME.COLORS.glassLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    padding: THEME.SPACING.md,
    marginBottom: THEME.SPACING.xl,
  },
  textInput: {
    color: THEME.COLORS.textPrimary,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    width: '100%',
    backgroundColor: THEME.COLORS.textPrimary,
    paddingVertical: 18,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.SPACING.md,
  },
  submitButtonDisabled: {
    backgroundColor: THEME.COLORS.glassDark,
    opacity: 0.6,
  },
  submitButtonText: {
    color: THEME.COLORS.background,
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1,
  },
  skipButton: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  skipButtonText: {
    color: THEME.COLORS.textTertiary,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default RatingModal;