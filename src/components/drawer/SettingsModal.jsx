// src/components/drawer/SettingsModal.jsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import THEME from '../../theme/theme';
import EmergencyResetButton from '../ui/EmergencyResetButton';

const SettingsModal = ({ visible, onClose, onNavigate }) => {
  const handleProfileNavigate = () => {
    onClose();
    onNavigate('Profile');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="settings" size={24} color={THEME.COLORS.champagneGold} />
              <Text style={styles.title}>Paramètres</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={THEME.COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            
            <Text style={styles.sectionTitle}>Compte</Text>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleProfileNavigate}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="person-outline" size={20} color={THEME.COLORS.champagneGold} />
              </View>
              <Text style={styles.actionText}>Mon Profil</Text>
              <Ionicons name="chevron-forward" size={20} color={THEME.COLORS.border} />
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Système</Text>
            <View style={styles.emergencyContainer}>
              <EmergencyResetButton />
              <Text style={styles.helperText}>
                Action irréversible. À utiliser uniquement pour purger une course bloquée en mémoire ou forcer la suppression des données locales de trajet.
              </Text>
            </View>

          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    backgroundColor: THEME.COLORS.background,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.border,
    backgroundColor: THEME.COLORS.glassSurface,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.COLORS.textPrimary,
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  body: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: THEME.COLORS.textPrimary,
  },
  emergencyContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
    alignItems: 'center',
  },
  helperText: {
    marginTop: 12,
    fontSize: 12,
    color: THEME.COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  }
});

export default SettingsModal;