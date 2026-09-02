// src/screens/admin/SystemConfig.jsx
// ECRAN DE CONFIGURATION SYSTEME - Mode Maintenance & Controle des Versions
// STANDARD: Industriel / Bank Grade / NASA Resilience (Modularise < 325 lignes, Sans Emojis)

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';

import GlassInput from '../../components/ui/GlassInput';
import GoldButton from '../../components/ui/GoldButton';

import {
  useGetSystemConfigQuery,
  useToggleMaintenanceModeMutation,
  useUpdateAppVersionMutation
} from '../../store/api/adminApiSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const GlassCard = ({ children, style }) => (
  <View style={[styles.glassContainer, style]}>
    <BlurView intensity={60} tint="default" style={StyleSheet.absoluteFill} />
    <View style={styles.glassContent}>{children}</View>
  </View>
);

const SystemConfig = ({ navigation }) => {
  const dispatch = useDispatch();

  const { data: configData, isLoading: isConfigLoading, refetch } = useGetSystemConfigQuery();
  const [toggleMaintenance, { isLoading: isTogglingMaintenance }] = useToggleMaintenanceModeMutation();
  const [updateVersion, { isLoading: isUpdatingVersion }] = useUpdateAppVersionMutation();

  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  const [versionForm, setVersionForm] = useState({
    latestVersion: '1.7.0',
    latestVersionCode: '22',
    minVersionCode: '22',
    mandatoryUpdate: true,
    isOta: false,
    updateUrl: 'https://play.google.com/store/apps/details?id=com.yely.app'
  });

  useEffect(() => {
    if (configData && configData.data) {
      const d = configData.data;
      setIsMaintenanceMode(Boolean(d.isMaintenanceMode));
      setMaintenanceMessage(d.maintenanceMessage || "Maintenance technique en cours. Retour tres rapide !");
      setVersionForm({
        latestVersion: d.latestVersion || '1.7.0',
        latestVersionCode: String(d.latestVersionCode || '22'),
        minVersionCode: String(d.minVersionCode || '22'),
        mandatoryUpdate: d.mandatoryUpdate !== undefined ? d.mandatoryUpdate : true,
        isOta: d.isOta !== undefined ? d.isOta : false,
        updateUrl: d.updateUrl || 'https://play.google.com/store/apps/details?id=com.yely.app'
      });
    }
  }, [configData]);

  const handleSaveMaintenance = async () => {
    try {
      await toggleMaintenance({
        isMaintenanceMode,
        maintenanceMessage: maintenanceMessage.trim()
      }).unwrap();

      dispatch(showSuccessToast({
        title: "Statut applique",
        message: isMaintenanceMode ? "Mode maintenance active et diffuse." : "Mode maintenance leve avec succes."
      }));
      refetch();
    } catch (error) {
      dispatch(showErrorToast({
        title: "Erreur de maintenance",
        message: error.data?.message || "Impossible de mettre a jour l'etat de maintenance."
      }));
    }
  };

  const handleSaveVersion = async () => {
    if (!versionForm.latestVersion.trim() || !versionForm.updateUrl.trim()) {
      dispatch(showErrorToast({
        title: "Champs incomplets",
        message: "La version et le lien de mise a jour sont obligatoires."
      }));
      return;
    }

    try {
      await updateVersion({
        latestVersion: versionForm.latestVersion.trim(),
        latestVersionCode: parseInt(versionForm.latestVersionCode, 10) || 22,
        minVersionCode: parseInt(versionForm.minVersionCode, 10) || 22,
        mandatoryUpdate: versionForm.mandatoryUpdate,
        isOta: versionForm.isOta,
        updateUrl: versionForm.updateUrl.trim()
      }).unwrap();

      dispatch(showSuccessToast({
        title: "Version diffusee",
        message: "Tous les appareils connectes ont recu la directive de version."
      }));
      refetch();
    } catch (error) {
      dispatch(showErrorToast({
        title: "Erreur de diffusion",
        message: error.data?.message || "Une erreur est survenue lors de la mise a jour."
      }));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuration & Securite</Text>
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
          {/* SECTION 1 : MODE MAINTENANCE D'URGENCE (KILL SWITCH) */}
          <Text style={styles.sectionTitle}>Mode Maintenance (Kill Switch)</Text>
          <GlassCard style={styles.actionCard}>
            <View style={styles.rowBetween}>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>Activer la maintenance</Text>
                <Text style={styles.cardDescription}>
                  {isMaintenanceMode
                    ? "Service coupe pour le public. Seuls les admins ont acces."
                    : "L'application fonctionne normalement pour tous."}
                </Text>
              </View>
              <Switch
                trackColor={{ false: THEME.COLORS.overlay, true: THEME.COLORS.danger }}
                thumbColor={THEME.COLORS.background}
                onValueChange={setIsMaintenanceMode}
                value={isMaintenanceMode}
              />
            </View>

            <GlassInput
              label="Message diffuse aux utilisateurs"
              value={maintenanceMessage}
              onChangeText={setMaintenanceMessage}
              placeholder="Ex: Maintenance technique en cours. Retour tres rapide !"
              multiline
              containerStyle={styles.inputSpacing}
            />

            <GoldButton 
              title={isMaintenanceMode ? "Appliquer la coupure de service" : "Enregistrer l'etat normal"}
              onPress={handleSaveMaintenance} 
              isLoading={isTogglingMaintenance}
            />
          </GlassCard>

          {/* SECTION 2 : CONTROLE DES VERSIONS & PLAY STORE */}
          <Text style={[styles.sectionTitle, { marginTop: 25 }]}>Controle des Versions & Play Store</Text>
          <GlassCard style={styles.actionCard}>
            <GlassInput
              label="Version commerciale (ex: 1.7.0)"
              value={versionForm.latestVersion}
              onChangeText={(val) => setVersionForm({ ...versionForm, latestVersion: val })}
              placeholder="1.7.0"
              containerStyle={styles.inputSpacing}
            />

            <View style={styles.dualInputs}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <GlassInput
                  label="VersionCode"
                  value={versionForm.latestVersionCode}
                  onChangeText={(val) => setVersionForm({ ...versionForm, latestVersionCode: val })}
                  placeholder="22"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <GlassInput
                  label="Min VersionCode"
                  value={versionForm.minVersionCode}
                  onChangeText={(val) => setVersionForm({ ...versionForm, minVersionCode: val })}
                  placeholder="22"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <GlassInput
              label="Lien Play Store / Telechargement"
              value={versionForm.updateUrl}
              onChangeText={(val) => setVersionForm({ ...versionForm, updateUrl: val })}
              placeholder="https://play.google.com/store/apps/details?id=com.yely.app"
              keyboardType="url"
              autoCapitalize="none"
              containerStyle={styles.inputSpacing}
            />

            <View style={styles.rowBetween}>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>Mise a jour obligatoire</Text>
                <Text style={styles.cardDescription}>Bloque les versions obsoletes jusqu'au telechargement.</Text>
              </View>
              <Switch
                trackColor={{ false: THEME.COLORS.overlay, true: THEME.COLORS.primary }}
                thumbColor={THEME.COLORS.background}
                onValueChange={(val) => setVersionForm(prev => ({ ...prev, mandatoryUpdate: val }))}
                value={versionForm.mandatoryUpdate}
              />
            </View>

            <View style={[styles.rowBetween, { borderTopWidth: 0, marginTop: 10 }]}>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>Mode OTA (Patch JS direct)</Text>
                <Text style={styles.cardDescription}>Telecharge le patch en direct sans passer par le store.</Text>
              </View>
              <Switch
                trackColor={{ false: THEME.COLORS.overlay, true: THEME.COLORS.primary }}
                thumbColor={THEME.COLORS.background}
                onValueChange={(val) => setVersionForm(prev => ({ ...prev, isOta: val }))}
                value={versionForm.isOta}
              />
            </View>

            <GoldButton 
              title="Diffuser la configuration de version" 
              onPress={handleSaveVersion} 
              isLoading={isUpdatingVersion}
            />
          </GlassCard>

        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: THEME.COLORS.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: THEME.SPACING.md, color: THEME.COLORS.primary, fontSize: 16, fontWeight: '500' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: THEME.COLORS.textPrimary, marginBottom: 12 },
  glassContainer: { overflow: 'hidden', borderRadius: THEME.BORDERS?.radius?.xl || 20, borderWidth: 1, borderColor: THEME.COLORS.border, backgroundColor: THEME.COLORS.overlay, marginBottom: 15 },
  glassContent: { padding: 18 },
  actionCard: { padding: 0 },
  inputSpacing: { marginBottom: 16 },
  dualInputs: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: THEME.COLORS.border },
  textContainer: { flex: 1, paddingRight: 15 },
  cardTitle: { color: THEME.COLORS.textPrimary, fontSize: 15, fontWeight: 'bold' },
  cardDescription: { color: THEME.COLORS.textSecondary, fontSize: 12, marginTop: 3 },
});

export default SystemConfig;