// src/components/ride/RatingModal.jsx
// MODALE DE NOTATION - Autonome (Redux) & Compatible Web
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { useRateRideMutation } from '../../store/api/ridesApiSlice';
import { clearRideToRate, selectRideToRate } from '../../store/slices/rideSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const RatingModal = () => {
  const dispatch = useDispatch();
  const rideToRate = useSelector(selectRideToRate);
  const [rateRide, { isLoading }] = useRateRideMutation();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const isVisible = !!rideToRate;
  const rideId = rideToRate?._id || rideToRate?.rideId;
  const driverName = rideToRate?.driverName || rideToRate?.driver?.name || 'le chauffeur';

  useEffect(() => {
    if (isVisible) {
      setRating(0);
      setComment('');
    }
  }, [isVisible]);

  const handleClose = () => {
    dispatch(clearRideToRate());
  };

  const handleStarPress = (selectedRating) => {
    setRating(selectedRating);
  };

  const handleSubmit = async () => {
    if (!rideId) {
      handleClose();
      return;
    }

    if (rating === 0) {
      dispatch(showErrorToast({ title: "Validation requise", message: "Veuillez attribuer une note avant de valider." }));
      return;
    }

    try {
      await rateRide({ rideId, rating, comment: comment.trim() }).unwrap();
      dispatch(showSuccessToast({ title: "Merci", message: "Votre avis a ete enregistre avec succes." }));
      handleClose();
    } catch (error) {
      dispatch(showErrorToast({ title: "Erreur systeme", message: error?.data?.message || "Impossible d'enregistrer la note." }));
      if (error?.status === 404) {
        handleClose();
      }
    }
  };

  return (
    <Modal visible={isVisible} transparent={true} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView 
        style={styles.modalBackdrop} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFillObject} 
          activeOpacity={1} 
          onPress={Platform.OS !== 'web' ? Keyboard.dismiss : undefined} 
        />
        
        <View style={styles.modalCard}>
          
          <View style={styles.header}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark" size={32} color={THEME.COLORS.success} />
            </View>
            <Text style={styles.titleText}>Course Terminee</Text>
            <Text style={styles.subtitleText}>
              Comment s'est passe votre trajet avec {driverName} ?
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
            <TouchableOpacity style={styles.skipButton} onPress={handleClose}>
              <Text style={styles.skipButtonText}>Passer</Text>
            </TouchableOpacity>
          )}

        </View>
      </KeyboardAvoidingView>
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
    zIndex: 2,
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
    zIndex: 3,
  },
  textInput: {
    color: THEME.COLORS.textPrimary,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    outlineStyle: 'none',
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