import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import GlassModal from './GlassModal';
import GoldButton from './GoldButton';
import THEME from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const ConfirmModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirmer", 
  cancelText = "Annuler",
  type = "primary", // "primary" or "danger"
  isLoading = false 
}) => {
  return (
    <GlassModal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.iconBg, { backgroundColor: type === 'danger' ? THEME.COLORS.danger + '20' : THEME.COLORS.primary + '20' }]}>
          <Ionicons 
            name={type === 'danger' ? "alert-circle" : "help-circle"} 
            size={40} 
            color={type === 'danger' ? THEME.COLORS.danger : THEME.COLORS.primary} 
          />
        </View>
        
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        
        <View style={styles.actions}>
          <GoldButton 
            title={confirmText} 
            onPress={onConfirm} 
            loading={isLoading}
            style={[styles.btn, { backgroundColor: type === 'danger' ? THEME.COLORS.danger : THEME.COLORS.primary }]} 
          />
          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelText}>{cancelText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GlassModal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 10,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: THEME.COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  actions: {
    width: '100%',
    gap: 15,
  },
  btn: {
    width: '100%',
    height: 55,
  },
  cancelBtn: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    color: THEME.COLORS.textTertiary,
    fontSize: 16,
    fontWeight: '600',
  }
});

export default ConfirmModal;
