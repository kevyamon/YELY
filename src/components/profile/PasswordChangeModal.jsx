// src/components/profile/PasswordChangeModal.jsx
// MODALE DE CHANGEMENT DE MOT DE PASSE SÉCURISÉ
// CSCSM Level: Bank Grade / Conforme règle < 270 lignes

import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassInput from '../ui/GlassInput';
import GlassModal from '../ui/GlassModal';
import THEME from '../../theme/theme';

const PasswordChangeModal = ({
  visible = false,
  onClose = () => {},
  onSubmit = async () => {},
  isLoading = false,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleClose = () => {
    if (isLoading) return;
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    onClose();
  };

  const handleValidate = async () => {
    const success = await onSubmit({
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
    if (success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  const isFormValid =
    currentPassword.trim().length > 0 &&
    newPassword.trim().length >= 8 &&
    confirmNewPassword.trim().length >= 8 &&
    newPassword === confirmNewPassword;

  return (
    <GlassModal visible={visible} onClose={handleClose} position="center">
      <View style={styles.iconContainer}>
        <Ionicons
          name="key-outline"
          size={44}
          color={THEME.COLORS.champagneGold}
        />
      </View>
      <Text style={styles.title}>Modifier mon mot de passe</Text>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Mot de passe actuel</Text>
        <GlassInput
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Saisissez votre mot de passe actuel"
          secureTextEntry={true}
          editable={!isLoading}
        />

        <Text style={styles.label}>Nouveau mot de passe</Text>
        <GlassInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Minimum 8 caractères"
          secureTextEntry={true}
          editable={!isLoading}
        />

        <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
        <GlassInput
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
          placeholder="Confirmez votre nouveau mot de passe"
          secureTextEntry={true}
          editable={!isLoading}
        />
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={handleClose}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelBtnText}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            (!isFormValid || isLoading) && styles.confirmBtnDisabled,
          ]}
          onPress={handleValidate}
          disabled={!isFormValid || isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator
              color={THEME.COLORS.deepAsphalt || '#121418'}
              size="small"
            />
          ) : (
            <Text style={styles.confirmBtnText}>Valider</Text>
          )}
        </TouchableOpacity>
      </View>
    </GlassModal>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: THEME.COLORS.champagneGold,
    fontSize: THEME.FONTS.sizes.h4,
    fontWeight: THEME.FONTS.weights.bold,
    textAlign: 'center',
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    color: THEME.COLORS.textSecondary,
    fontSize: THEME.FONTS.sizes.caption,
    marginBottom: 6,
    marginLeft: 4,
    fontWeight: THEME.FONTS.weights.semiBold,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: THEME.BORDERS.radius.pill,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.overlay,
  },
  cancelBtnText: {
    color: THEME.COLORS.textPrimary,
    fontWeight: THEME.FONTS.weights.bold,
    fontSize: THEME.FONTS.sizes.bodySmall,
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: THEME.BORDERS.radius.pill,
    backgroundColor: THEME.COLORS.champagneGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    color: THEME.COLORS.deepAsphalt || '#121418',
    fontWeight: THEME.FONTS.weights.bold,
    fontSize: THEME.FONTS.sizes.bodySmall,
  },
});

export default React.memo(PasswordChangeModal);
