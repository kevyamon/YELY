// src/components/ui/ForceUpdateModal.jsx
// MODALE DE MISE A JOUR BLOQUANTE - Intelligence PWA / Native / OTA
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';
import React, { useEffect, useState } from 'react';
import { Linking, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const REMINDER_KEY = 'yely_update_reminder_timestamp';
const REMINDER_DELAY_MS = 2 * 60 * 60 * 1000; 

const ForceUpdateModal = ({ visible, latestVersion, mandatoryUpdate, updateUrl, isOta }) => {
  const [showModal, setShowModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusText, setStatusText] = useState('');
  const dispatch = useDispatch();

  useEffect(() => {
    const checkReminder = async () => {
      if (!visible) {
        setShowModal(false);
        return;
      }

      if (mandatoryUpdate && !isOta) {
        setShowModal(true); 
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
  }, [visible, mandatoryUpdate, isOta]);

  const handleUpdate = async () => {
    // LOGIQUE OTA FLUIDE & TRANSPARENTE
    if (isOta && Platform.OS !== 'web') {
      setIsUpdating(true);
      setStatusText("Vérification des mises à jour...");
      
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          setStatusText("Nouvelle version détectée !\nTéléchargement en cours... (Veuillez patienter)");
          await Updates.fetchUpdateAsync();
          setStatusText("Mise à jour installée !\nRedémarrage imminent...");
          
          await SecureStore.setItemAsync(REMINDER_KEY, Date.now().toString());
          
          setTimeout(async () => {
            await Updates.reloadAsync();
          }, 1500);
        } else {
          setStatusText("Votre application est déjà à jour !");
          setTimeout(() => {
            setIsUpdating(false);
            setShowModal(false);
          }, 2000);
        }
      } catch (error) {
        console.warn("[OTA] Echec de la mise a jour:", error);
        setStatusText("Échec du téléchargement.\nL'application va se fermer pour appliquer la mise à jour.");
        setTimeout(() => {
          setIsUpdating(false);
          setShowModal(false);
        }, 4000);
      }
      return;
    }

    // LOGIQUE CLASSIQUE PWA / REDIRECTION STORE
    if (Platform.OS === 'web') {
      window.location.reload(true);
    } else {
      if (updateUrl) {
        let finalUrl = updateUrl.trim();
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
          finalUrl = `https://${finalUrl}`;
        }
        try {
          const supported = await Linking.canOpenURL(finalUrl);
          if (supported) {
            await Linking.openURL(finalUrl);
          } else {
            await Linking.openURL(finalUrl); 
          }
        } catch (error) {
          console.warn("Erreur lors de l'ouverture du lien de mise a jour:", error);
        }
      }
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
          {isUpdating ? (
            <View style={styles.loaderContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="cloud-download" size={50} color={THEME.COLORS.background} />
              </View>
              <Text style={styles.title}>Mise à jour en cours</Text>
              <Text style={styles.statusText}>{statusText}</Text>
              <View style={styles.loadingSpinnerWrapper}>
                <Text style={styles.pulseDot}>⚡</Text>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.iconContainer}>
                <Ionicons name="cloud-download-outline" size={50} color={THEME.COLORS.background} />
              </View>
              
              <Text style={styles.title}>Mise a jour requise</Text>
              <Text style={styles.version}>Version {latestVersion} disponible</Text>
              
              <Text style={styles.message}>
                Une nouvelle version de Yely est disponible. {isOta ? "Une installation rapide sans quitter l'app est prete." : (Platform.OS === 'web' ? 'Rechargez la page' : 'Telechargez-la')} pour profiter des dernieres fonctionnalites.
              </Text>

              <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
                <Text style={styles.updateButtonText}>
                  {isOta ? 'Installer la mise à jour (OTA)' : (Platform.OS === 'web' ? 'Recharger l\'application' : 'Mettre a jour maintenant')}
                </Text>
              </TouchableOpacity>

              {!mandatoryUpdate && !isOta && (
                <TouchableOpacity style={styles.laterButton} onPress={handleRemindLater}>
                  <Text style={styles.laterButtonText}>Me rappeler dans 2h</Text>
                </TouchableOpacity>
              )}
            </>
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
  teamText: { marginTop: 20, fontSize: 10, color: THEME.COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 1 },
  statusText: { fontSize: 14, color: THEME.COLORS.primary, fontWeight: 'bold', marginTop: 10, textAlign: 'center', lineHeight: 22 },
  loaderContainer: { alignItems: 'center', width: '100%' },
  loadingSpinnerWrapper: { marginTop: 25, marginBottom: 15, alignItems: 'center', justifyContent: 'center' },
  pulseDot: { fontSize: 32, transform: [{ scale: 1.2 }] }
});

export default ForceUpdateModal;