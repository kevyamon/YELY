// src/screens/admin/SystemConfig.jsx
// ECRAN DE CONFIGURATION SYSTEME - Controle des Versions et Maintenance
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';

import GlassInput from '../../components/ui/GlassInput';
import GoldButton from '../../components/ui/GoldButton';

import { useGetSystemConfigQuery, useUpdateAppVersionMutation } from '../../store/api/adminApiSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const GlassCard = ({ children, style }) => (
  <View style={[styles.glassContainer, style]}>
    <BlurView intensity={60} tint="default" style={StyleSheet.absoluteFill} />
    <View style={styles.glassContent}>
      {children}
    </View>
  </View>
);

const SystemConfig = ({ navigation }) => {
  const dispatch = useDispatch();

  const { data: configData, isLoading: isConfigLoading } = useGetSystemConfigQuery();
  const [updateVersion, { isLoading: isUpdating }] = useUpdateAppVersionMutation();

  const [form, setForm] = useState({
    latestVersion: '1.0.0',
    mandatoryUpdate: true,
    isOta: false, // AJOUT : Etat par defaut OTA
    updateUrl: 'https://download-yely.onrender.com'
  });

  useEffect(() => {
    if (configData && configData.data) {
      setForm({
        latestVersion: configData.data.latestVersion || '1.0.0',
        mandatoryUpdate: configData.data.mandatoryUpdate !== undefined ? configData.data.mandatoryUpdate : true,
        isOta: configData.data.isOta !== undefined ? configData.data.isOta : false, // AJOUT : Recuperation OTA
        updateUrl: configData.data.updateUrl || 'https://download-yely.onrender.com'
      });
    }
  }, [configData]);

  const handleSave = async () => {
    if (!form.latestVersion.trim() || !form.updateUrl.trim()) {
      dispatch(showErrorToast({
        title: "Champs incomplets",
        message: "La version et le lien de mise a jour sont obligatoires."
      }));
      return;
    }

    try {
      await updateVersion(form).unwrap();
      dispatch(showSuccessToast({
        title: "Mise a jour diffusee",
        message: "Tous les appareils connectes ont recu l'instruction."
      }));
    } catch (error) {
      dispatch(showErrorToast({
        title: "Erreur de diffusion",
        message: error.data?.message || "Une erreur est survenue lors de la mise a jour."
      }));
    }
  };

  const toggleMandatory = (value) => {
    setForm(prev => ({ ...prev, mandatoryUpdate: value }));
  };

  // AJOUT : Fonction de bascule OTA
  const toggleOta = (value) => {
    setForm(prev => ({ ...prev, isOta: value }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuration Systeme</Text>
      </View>
      
      {isConfigLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.COLORS.primary} />
          <Text style={styles.loadingText}>Chargement de la configuration...</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={20} color={THEME.COLORS.danger} style={styles.warningIcon} />
            <Text style={styles.warningText}>
              Attention : Modifier la version exigee deploiera instantanement une modale de blocage sur tous les appareils possedant une version inferieure.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Controle des Versions</Text>
          <GlassCard style={styles.actionCard}>
            
            <GlassInput
              label="Version exigee (ex: 1.2.0)"
              value={form.latestVersion}
              onChangeText={(val) => setForm({ ...form, latestVersion: val })}
              placeholder="1.2.0"
              keyboardType="default"
              containerStyle={styles.inputSpacing}
            />

            <GlassInput
              label="Lien de telechargement (APK ou Store)"
              value={form.updateUrl}
              onChangeText={(val) => setForm({ ...form, updateUrl: val })}
              placeholder="https://votre-lien.com"
              keyboardType="url"
              autoCapitalize="none"
              containerStyle={styles.inputSpacing}
            />

            <View style={styles.rowBetween}>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>Mise a jour obligatoire</Text>
                <Text style={styles.cardDescription}>Bloque l'acces si l'app n'est pas a jour.</Text>
              </View>
              <Switch
                trackColor={{ false: THEME.COLORS.overlay, true: THEME.COLORS.primary }}
                thumbColor={THEME.COLORS.background}
                onValueChange={toggleMandatory}
                value={form.mandatoryUpdate}
              />
            </View>

            {/* AJOUT : Ligne pour le mode OTA */}
            <View style={[styles.rowBetween, { borderTopWidth: 0, marginTop: 10 }]}>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>Mode OTA (Silencieux)</Text>
                <Text style={styles.cardDescription}>Telecharge le code en arriere-plan sans sortir de l'app.</Text>
              </View>
              <Switch
                trackColor={{ false: THEME.COLORS.overlay, true: THEME.COLORS.primary }}
                thumbColor={THEME.COLORS.background}
                onValueChange={toggleOta}
                value={form.isOta}
              />
            </View>

          </GlassCard>

          <View style={styles.buttonContainer}>
            <GoldButton 
              title="Diffuser la configuration" 
              onPress={handleSave} 
              isLoading={isUpdating}
            />
          </View>

        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.COLORS.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', },
  loadingText: { marginTop: THEME.SPACING.md, color: THEME.COLORS.primary, fontSize: 16, fontWeight: '500', },
  scrollContent: { padding: 20, paddingBottom: 100, },
  warningBox: { flexDirection: 'row', backgroundColor: 'rgba(231, 76, 60, 0.1)', padding: THEME.SPACING.md, borderRadius: THEME.BORDERS.radius.md, borderWidth: 1, borderColor: 'rgba(231, 76, 60, 0.3)', marginBottom: THEME.SPACING.xl, alignItems: 'center', },
  warningIcon: { marginRight: 10, },
  warningText: { flex: 1, color: THEME.COLORS.danger, fontSize: 13, lineHeight: 18, },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: THEME.COLORS.textPrimary, marginBottom: 15 },
  glassContainer: { overflow: 'hidden', borderRadius: THEME.BORDERS?.radius?.xl || 20, borderWidth: THEME.BORDERS?.width?.thin || 1, borderColor: THEME.COLORS.border, backgroundColor: THEME.COLORS.overlay, marginBottom: 15 },
  glassContent: { padding: 20 },
  actionCard: { padding: 0 },
  inputSpacing: { marginBottom: 20, },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: THEME.COLORS.border, },
  textContainer: { flex: 1, paddingRight: 15 },
  cardTitle: { color: THEME.COLORS.textPrimary, fontSize: 16, fontWeight: 'bold' },
  cardDescription: { color: THEME.COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  buttonContainer: { marginTop: THEME.SPACING.lg, }
});

export default SystemConfig;