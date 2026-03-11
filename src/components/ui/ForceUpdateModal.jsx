// src/components/ui/ForceUpdateModal.jsx
// MODALE DE MISE A JOUR BLOQUANTE - Intelligence PWA / Native
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Linking, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';

const REMINDER_KEY = 'yely_update_reminder_timestamp';
const REMINDER_DELAY_MS = 2 * 60 * 60 * 1000; // 2 heures

const ForceUpdateModal = ({ visible, latestVersion, mandatoryUpdate, updateUrl }) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkReminder = async () => {
      if (!visible) {
        setShowModal(false);
        return;
      }

      if (mandatoryUpdate) {
        setShowModal(true); // Si obligatoire, on ignore le rappel, on bloque
        return;
      }

      try {
        if (Platform.OS !== 'web') {
          const lastReminder = await SecureStore.getItemAsync(REMINDER_KEY);
          if (lastReminder) {
            const timePassed = Date.now() - parseInt(lastReminder, 10);
            if (timePassed < REMINDER_DELAY_MS) {
              setShowModal(false);
              return;
            }
          }
        } else {
          const lastReminder = localStorage.getItem(REMINDER_KEY);
          if (lastReminder) {
            const timePassed = Date.now() - parseInt(lastReminder, 10);
            if (timePassed < REMINDER_DELAY_MS) {
              setShowModal(false);
              return;
            }
          }
        }
        setShowModal(true);
      } catch (e) {
        setShowModal(true);
      }
    };

    checkReminder();
  }, [visible, mandatoryUpdate]);

  const handleUpdate = () => {
    if (Platform.OS === 'web') {
      window.location.reload(true);
    } else {
      if (updateUrl) Linking.openURL(updateUrl);
    }
  };

  const handleRemindLater = async () => {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(REMINDER_KEY, Date.now().toString());
      } else {
        localStorage.setItem(REMINDER_KEY, Date.now().toString());
      }
      setShowModal(false);
    } catch (e) {
      setShowModal(false);
    }
  };

  if (!showModal) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={showModal} onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="cloud-download-outline" size={50} color={THEME.COLORS.background} />
          </View>
          
          <Text style={styles.title}>Mise à jour requise</Text>
          <Text style={styles.version}>Version {latestVersion} disponible</Text>
          
          <Text style={styles.message}>
            Une nouvelle version de Yely est disponible. {Platform.OS === 'web' ? 'Rechargez la page' : 'Téléchargez-la'} pour profiter des dernieres fonctionnalites et ameliorations de stabilite par la YelyDev Team.
          </Text>

          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
            <Text style={styles.updateButtonText}>
              {Platform.OS === 'web' ? 'Recharger l\'application' : 'Mettre à jour maintenant'}
            </Text>
          </TouchableOpacity>

          {!mandatoryUpdate && (
            <TouchableOpacity style={styles.laterButton} onPress={handleRemindLater}>
              <Text style={styles.laterButtonText}>Me rappeler dans 2h</Text>
            </TouchableOpacity>
          )}
          
          <Text style={styles.teamText}>DevTeam</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  card: { width: '85%', backgroundColor: THEME.COLORS.background, borderRadius: 24, padding: 30, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: THEME.COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 20, marginTop: -60, borderWidth: 4, borderColor: THEME.COLORS.background },
  title: { fontSize: 22, fontWeight: 'bold', color: THEME.COLORS.textPrimary, marginBottom: 5, textAlign: 'center' },
  version: { fontSize: 14, color: THEME.COLORS.primary, fontWeight: 'bold', marginBottom: 15 },
  message: { fontSize: 15, color: THEME.COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  updateButton: { width: '100%', backgroundColor: THEME.COLORS.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  updateButtonText: { color: THEME.COLORS.background, fontSize: 16, fontWeight: 'bold' },
  laterButton: { paddingVertical: 10 },
  laterButtonText: { color: THEME.COLORS.textTertiary, fontSize: 14, fontWeight: '500' },
  teamText: { marginTop: 20, fontSize: 10, color: THEME.COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 1 }
});

export default ForceUpdateModal;