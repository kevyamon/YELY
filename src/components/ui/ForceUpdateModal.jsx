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
import { setAppUpdate, showSuccessToast } from '../../store/slices/uiSlice';
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
            dispatch(setAppUpdate({ isAvailable: false }));
          }, 2000);
        }
      } catch (error) {
        console.warn("[OTA] Echec de la mise a jour:", error);
        setStatusText("Échec du téléchargement.\nL'application va se fermer pour appliquer la mise à jour.");
        setTimeout(() => {
          setIsUpdating(false);
          setShowModal(false);
          dispatch(setAppUpdate({ isAvailable: false }));
        }, 4000);
      }
      return;
    }

    // LOGIQUE CLASSIQUE PWA / REDIRECTION STORE
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        setIsUpdating(true);
        setStatusText("Application de la nouvelle version...");
        dispatch(setAppUpdate({ isAvailable: false }));
        setShowModal(false);
        
        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const r of registrations) {
              if (r.waiting) r.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          } catch (e) {}
        }
        setTimeout(() => {
          window.location.reload();
        }, 300);
      }
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
          console.warn("Erreur lors de l'ouverture du lien de mise à jour:", error);
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
      dispatch(setAppUpdate({ isAvailable: false }));
      setShowModal(false);
    } catch (e) {
      dispatch(setAppUpdate({ isAvailable: false }));
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
                <Ionicons name="cloud-download" size={48} color="#000000" />
              </View>
              <Text style={styles.title}>Mise à jour en cours</Text>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          ) : (
            <>
              <View style={styles.iconContainer}>
                <Ionicons name="cloud-download-outline" size={48} color="#000000" />
              </View>
              
              <Text style={styles.title}>Mise à jour requise</Text>
              <Text style={styles.version}>Version {latestVersion} disponible</Text>
              
              <Text style={styles.message}>
                Une nouvelle version de Yély est disponible. {isOta ? "Une installation rapide sans quitter l'app est prête." : (Platform.OS === 'web' ? "Une nouvelle version optimisée est prête." : "Téléchargez-la")} pour profiter des dernières fonctionnalités.
              </Text>

              <TouchableOpacity style={styles.updateButton} onPress={handleUpdate} activeOpacity={0.8}>
                <Text style={styles.updateButtonText}>
                  {isOta ? 'Installer la mise à jour (OTA)' : (Platform.OS === 'web' ? 'Recharger l\'application' : 'Mettre à jour maintenant')}
                </Text>
              </TouchableOpacity>

              {!mandatoryUpdate && !isOta && (
                <TouchableOpacity style={styles.laterButton} onPress={handleRemindLater} activeOpacity={0.7}>
                  <Text style={styles.laterButtonText}>Me rappeler plus tard</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          
          <Text style={styles.teamText}>Équipe Technique Yély</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.75)' },
  card: { width: '85%', maxWidth: 380, backgroundColor: THEME.COLORS.background, borderRadius: 24, padding: 26, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(212, 175, 55, 0.3)', elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20 },
  iconContainer: { width: 76, height: 76, borderRadius: 38, backgroundColor: THEME.COLORS.champagneGold, justifyContent: 'center', alignItems: 'center', marginBottom: 16, marginTop: -50, borderWidth: 4, borderColor: THEME.COLORS.background },
  title: { fontSize: 21, fontWeight: '800', color: THEME.COLORS.textPrimary, marginBottom: 4, textAlign: 'center' },
  version: { fontSize: 13, color: THEME.COLORS.champagneGold, fontWeight: '700', marginBottom: 14 },
  message: { fontSize: 14, color: THEME.COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  updateButton: { width: '100%', backgroundColor: THEME.COLORS.champagneGold, paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginBottom: 12 },
  updateButtonText: { color: '#000000', fontSize: 15, fontWeight: '800' },
  laterButton: { paddingVertical: 8 },
  laterButtonText: { color: THEME.COLORS.textTertiary, fontSize: 13, fontWeight: '600' },
  teamText: { marginTop: 18, fontSize: 11, color: THEME.COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 1 },
  statusText: { fontSize: 13, color: THEME.COLORS.champagneGold, fontWeight: '700', marginTop: 10, textAlign: 'center', lineHeight: 20 },
  loaderContainer: { alignItems: 'center', width: '100%' },
});

export default ForceUpdateModal;