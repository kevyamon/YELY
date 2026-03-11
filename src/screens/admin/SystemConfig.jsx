// src/screens/admin/SystemConfig.jsx
// ECRAN DE CONFIGURATION SYSTEME - Controle des Versions et Maintenance
// CSCSM Level: Bank Grade

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';

import GlassCard from '../../components/ui/GlassCard';
import GlassInput from '../../components/ui/GlassInput';
import GoldButton from '../../components/ui/GoldButton';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import SmartHeader from '../../components/ui/SmartHeader';

import { useGetSystemConfigQuery, useUpdateAppVersionMutation } from '../../store/api/adminApiSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const SystemConfig = ({ navigation }) => {
  const dispatch = useDispatch();

  const { data: configData, isLoading: isConfigLoading } = useGetSystemConfigQuery();
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
        message: "Tous les appareils connectes ont recu l'instruction."
      }));
    } catch (error) {
      dispatch(showErrorToast({
        title: "Erreur de diffusion",
        message: error.data?.message || "Une erreur est survenue lors de la mise a jour."
      }));
    }
  };

  const toggleMandatory = () => {
    setForm(prev => ({ ...prev, mandatoryUpdate: !prev.mandatoryUpdate }));
  };

  return (
    <ScreenWrapper>
      <SmartHeader 
        title="Configuration Systeme" 
        showBack={true} 
        onBack={() => navigation.goBack()} 
      />
      
      {isConfigLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
          <Text style={styles.loadingText}>Chargement de la configuration...</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Attention : Modifier la version exigee deploiera instantanement une modale de blocage sur tous les appareils possedant une version inferieure.
            </Text>
          </View>

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
                <Text style={styles.switchSubLabel}>Bloque l'acces si l'app n'est pas a jour.</Text>
              </View>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={toggleMandatory}
                style={[
                  styles.customToggleBtn, 
                  form.mandatoryUpdate ? styles.toggleActive : styles.toggleInactive
                ]}
              >
                <Text style={[
                  styles.toggleText, 
                  form.mandatoryUpdate ? styles.toggleTextActive : styles.toggleTextInactive
                ]}>
                  {form.mandatoryUpdate ? "OUI" : "NON"}
                </Text>
              </TouchableOpacity>
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
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: THEME.SPACING.md,
    color: THEME.COLORS.champagneGold,
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContent: {
    padding: THEME.SPACING.lg,
    paddingBottom: 100,
  },
  warningBox: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: THEME.SPACING.md,
    borderRadius: THEME.BORDERS.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
    marginBottom: THEME.SPACING.xl,
  },
  warningText: {
    color: THEME.COLORS.danger,
    fontSize: 13,
    lineHeight: 18,
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
  customToggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: THEME.BORDERS.radius.lg,
    borderWidth: 1,
  },
  toggleActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: THEME.COLORS.primary,
  },
  toggleInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: THEME.COLORS.textSecondary,
  },
  toggleText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  toggleTextActive: {
    color: THEME.COLORS.primary,
  },
  toggleTextInactive: {
    color: THEME.COLORS.textSecondary,
  },
  buttonContainer: {
    marginTop: THEME.SPACING.sm,
  }
});

export default SystemConfig;