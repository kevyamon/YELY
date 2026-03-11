// src/screens/admin/SystemConfig.jsx
// ECRAN DE CONFIGURATION SYSTEME - Controle des Versions et Maintenance
// CSCSM Level: Bank Grade

import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';

import GlassCard from '../../components/ui/GlassCard';
import GlassInput from '../../components/ui/GlassInput';
import GlobalSkeleton from '../../components/ui/GlobalSkeleton';
import GoldButton from '../../components/ui/GoldButton';
import ScreenHeader from '../../components/ui/ScreenHeader';

import { useGetSystemConfigQuery, useUpdateAppVersionMutation } from '../../store/api/adminApiSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const SystemConfig = ({ navigation }) => {
  const dispatch = useDispatch();

  const { data: configData, isLoading: isConfigLoading, refetch } = useGetSystemConfigQuery();
  const [updateVersion, { isLoading: isUpdating }] = useUpdateAppVersionMutation();

  const [form, setForm] = useState({
    latestVersion: '1.0.0',
    mandatoryUpdate: true,
    updateUrl: 'https://download-yely.onrender.com'
  });

  useEffect(() => {
    if (configData && configData.data) {
      setForm({
        latestVersion: configData.data.latestVersion || '1.0.0',
        mandatoryUpdate: configData.data.mandatoryUpdate !== undefined ? configData.data.mandatoryUpdate : true,
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
        message: "Tous les appareils connectes ont recu l'instruction de mise a jour."
      }));
    } catch (error) {
      dispatch(showErrorToast({
        title: "Erreur de diffusion",
        message: error.data?.message || "Une erreur est survenue lors de la mise a jour du systeme."
      }));
    }
  };

  if (isConfigLoading) {
    return <GlobalSkeleton visible={true} fullScreen={true} />;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Configuration Systeme" onBack={() => navigation.goBack()} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.warningText}>
          Attention : Modifier la version exigee deploiera instantanement une modale de blocage sur tous les appareils possedant une version inferieure.
        </Text>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Controle des Versions</Text>
          
          <GlassInput
            label="Version exigee (ex: 1.2.0)"
            value={form.latestVersion}
            onChangeText={(val) => setForm({ ...form, latestVersion: val })}
            placeholder="1.2.0"
            keyboardType="default"
          />

          <GlassInput
            label="Lien de telechargement (APK ou Store)"
            value={form.updateUrl}
            onChangeText={(val) => setForm({ ...form, updateUrl: val })}
            placeholder="https://votre-lien.com"
            keyboardType="url"
            autoCapitalize="none"
          />

          <View style={styles.switchContainer}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.switchLabel}>Mise a jour obligatoire</Text>
              <Text style={styles.switchSubLabel}>Bloque totalement l'acces a l'application si la version n'est pas a jour.</Text>
            </View>
            <Switch
              value={form.mandatoryUpdate}
              onValueChange={(val) => setForm({ ...form, mandatoryUpdate: val })}
              trackColor={{ false: THEME.COLORS.textSecondary, true: THEME.COLORS.primary }}
              thumbColor={THEME.COLORS.pureWhite}
            />
          </View>

        </GlassCard>

        <View style={styles.buttonContainer}>
          <GoldButton 
            title="Diffuser la configuration" 
            onPress={handleSave} 
            loading={isUpdating}
          />
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.background,
  },
  scrollContent: {
    padding: THEME.SPACING.lg,
    paddingBottom: 100,
  },
  warningText: {
    color: THEME.COLORS.danger,
    fontSize: 13,
    marginBottom: THEME.SPACING.lg,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: THEME.SPACING.md,
    borderRadius: THEME.BORDERS.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  card: {
    padding: THEME.SPACING.lg,
    marginBottom: THEME.SPACING.xl,
  },
  sectionTitle: {
    color: THEME.COLORS.champagneGold,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: THEME.SPACING.lg,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: THEME.SPACING.md,
    paddingTop: THEME.SPACING.md,
    borderTopWidth: THEME.BORDERS.width.thin,
    borderTopColor: THEME.COLORS.glassBorder,
  },
  switchLabelContainer: {
    flex: 1,
    paddingRight: THEME.SPACING.md,
  },
  switchLabel: {
    color: THEME.COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  switchSubLabel: {
    color: THEME.COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: THEME.SPACING.md,
  }
});

export default SystemConfig;