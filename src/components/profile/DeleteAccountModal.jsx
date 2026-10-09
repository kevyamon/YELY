// src/components/profile/DeleteAccountModal.jsx
// MODALE DE SUPPRESSION DÉFINITIVE DE COMPTE (ZONE DE DANGER)
// CSCSM Level: Bank Grade / Conforme règle < 270 lignes

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassModal from '../ui/GlassModal';
import THEME from '../../theme/theme';

const DeleteAccountModal = ({
  visible = false,
  onClose = () => {},
  onConfirm = () => {},
  isLoading = false,
}) => {
  return (
    <GlassModal visible={visible} onClose={onClose} position="center">
      <View style={styles.iconContainer}>
        <Ionicons name="warning" size={48} color={THEME.COLORS.danger} />
      </View>
      <Text style={styles.title}>Zone de danger</Text>
      <Text style={styles.text}>
        Êtes-vous sûr de vouloir supprimer définitivement votre compte Yély ? Cette action est irréversible et effacera vos données.
      </Text>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onClose}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelBtnText}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={onConfirm}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color={THEME.COLORS.pureWhite} size="small" />
          ) : (
            <Text style={styles.confirmBtnText}>Supprimer</Text>
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
    color: THEME.COLORS.danger,
    fontSize: THEME.FONTS.sizes.h4,
    fontWeight: THEME.FONTS.weights.bold,
    textAlign: 'center',
    marginBottom: 10,
  },
  text: {
    color: THEME.COLORS.textSecondary,
    fontSize: THEME.FONTS.sizes.bodySmall,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
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
    backgroundColor: THEME.COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: THEME.COLORS.pureWhite,
    fontWeight: THEME.FONTS.weights.bold,
    fontSize: THEME.FONTS.sizes.bodySmall,
  },
});

export default React.memo(DeleteAccountModal);
