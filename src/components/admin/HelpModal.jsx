// src/components/admin/HelpModal.jsx
// COMPOSANT PARTAGE - Modale d'aide contextuelle (Adaptative Light/Dark)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';

const HelpModal = ({ visible, onClose, title, content }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={80} tint="default" style={StyleSheet.absoluteFill} />
        
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Ionicons name="information-circle-outline" size={24} color={THEME.COLORS.primary} />
              <Text style={styles.title}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={THEME.COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            <Text style={styles.contentText}>{content}</Text>
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeButtonText}>J'ai compris</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: THEME.COLORS.glassModal,
    borderRadius: THEME.BORDERS.radius.xl,
    padding: 20,
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    color: THEME.COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    flexShrink: 1,
  },
  scrollArea: {
    marginBottom: 20,
  },
  contentText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 24,
  },
  closeButton: {
    backgroundColor: THEME.COLORS.primary,
    paddingVertical: 14,
    borderRadius: THEME.BORDERS.radius.md,
    alignItems: 'center',
  },
  closeButtonText: {
    color: THEME.COLORS.textInverse,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default HelpModal;