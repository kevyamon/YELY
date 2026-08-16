// src/components/ride/LocationDisclosureModal.jsx
// MODALE OFFICIELLE DE DIVULGATION VISIBLE (GOOGLE PLAY BACKGROUND LOCATION DISCLOSURE)
// STANDARD: Google Play Policy 2026 / Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';
import GoldButton from '../ui/GoldButton';

const LocationDisclosureModal = ({ visible, onAccept, onDecline }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          
          {/* ICON BADGE */}
          <View style={styles.iconCircle}>
            <Ionicons name="location" size={36} color={THEME.COLORS.primary} />
          </View>

          {/* TITLE */}
          <Text style={styles.title}>Autorisation de Localisation</Text>
          <Text style={styles.subtitle}>Information relative à votre position</Text>

          {/* PROMINENT DISCLOSURE (TEXTE OBLIGATOIRE GOOGLE PLAY) */}
          <View style={styles.disclosureBox}>
            <Text style={styles.disclosureText}>
              Yély collecte et utilise les données de localisation pour permettre l'attribution des courses des passagers à proximité et le suivi de votre approche en temps réel, <Text style={styles.boldText}>même lorsque l'application est fermée ou non utilisée</Text>.
            </Text>
          </View>

          {/* BENEFITS LIST */}
          <View style={styles.pointsList}>
            <View style={styles.pointRow}>
              <Ionicons name="car-sport" size={20} color={THEME.COLORS.primary} style={styles.pointIcon} />
              <Text style={styles.pointText}>
                <Text style={styles.pointBold}>Attribution des courses :</Text> Recevez des demandes de trajet en continu lorsque vous êtes en service.
              </Text>
            </View>

            <View style={styles.pointRow}>
              <Ionicons name="navigate-circle" size={20} color={THEME.COLORS.primary} style={styles.pointIcon} />
              <Text style={styles.pointText}>
                <Text style={styles.pointBold}>Guidage en temps réel :</Text> Permettez aux clients de suivre l'arrivée de votre véhicule.
              </Text>
            </View>

            <View style={styles.pointRow}>
              <Ionicons name="shield-checkmark" size={20} color={THEME.COLORS.success} style={styles.pointIcon} />
              <Text style={styles.pointText}>
                <Text style={styles.pointBold}>Vie privée protégée :</Text> Aucune donnée n'est partagée avec des tiers ni utilisée pour de la publicité.
              </Text>
            </View>
          </View>

          {/* ACTIONS */}
          <View style={styles.actions}>
            <GoldButton
              title="CONTINUER ET AUTORISER"
              onPress={onAccept}
              style={styles.acceptButton}
            />

            <TouchableOpacity 
              style={styles.declineButton} 
              onPress={onDecline}
              activeOpacity={0.7}
            >
              <Text style={styles.declineText}>Plus tard</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: THEME.COLORS.background,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: THEME.COLORS.primary,
    padding: THEME.SPACING.xl,
    alignItems: 'center',
    ...THEME.SHADOWS.gold,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: THEME.COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: THEME.SPACING.md,
  },
  disclosureBox: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderRadius: 14,
    padding: THEME.SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    marginBottom: THEME.SPACING.md,
  },
  disclosureText: {
    fontSize: 13,
    color: THEME.COLORS.textPrimary,
    lineHeight: 19,
    textAlign: 'center',
  },
  boldText: {
    fontWeight: '800',
    color: THEME.COLORS.primary,
  },
  pointsList: {
    width: '100%',
    marginBottom: THEME.SPACING.lg,
    gap: 10,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pointIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  pointText: {
    flex: 1,
    fontSize: 12,
    color: THEME.COLORS.textSecondary,
    lineHeight: 17,
  },
  pointBold: {
    fontWeight: '700',
    color: THEME.COLORS.textPrimary,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
  },
  acceptButton: {
    width: '100%',
    marginBottom: THEME.SPACING.xs,
  },
  declineButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  declineText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.COLORS.textSecondary,
  },
});

export default LocationDisclosureModal;
