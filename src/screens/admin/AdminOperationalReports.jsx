// src/screens/admin/AdminOperationalReports.jsx
// ÉCRAN GÉNÉRATEUR DE RAPPORTS FISCAUX & OPÉRATIONNELS - Cockpit Admin
// STANDARD: Industriel / Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ENV from '../../config/env';
import GoldButton from '../../components/ui/GoldButton';
import SecureStorageAdapter from '../../store/secureStoreAdapter';
import { selectToken } from '../../store/slices/authSlice';
import { showErrorToast } from '../../store/slices/uiSlice';
import THEME, { BORDERS, COLORS, FONTS, SHADOWS, SPACING } from '../../theme/theme';

export default function AdminOperationalReports() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const reduxToken = useSelector(selectToken);

  const currentYear = new Date().getFullYear();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [isLoading, setIsLoading] = useState(false);

  const periods = [
    { id: 'month', title: 'Mensuel', subtitle: 'Mois civil complet', icon: 'calendar-outline' },
    { id: 'quarter', title: 'Trimestriel', subtitle: 'Trimestre d\'activité (3 mois)', icon: 'pie-chart-outline' },
    { id: 'semester', title: 'Semestriel', subtitle: 'Bilan de mi-année (6 mois)', icon: 'trending-up-outline' },
    { id: 'year', title: 'Annuel', subtitle: 'Bilan fiscal annuel complet (12 mois)', icon: 'business-outline' },
  ];

  const years = [currentYear.toString(), (currentYear - 1).toString(), (currentYear - 2).toString()];

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      let finalToken = reduxToken;
      if (!finalToken) {
        finalToken = await SecureStorageAdapter.getItem('token') || await SecureStorageAdapter.getItem('accessToken');
      }

      if (!finalToken) {
        dispatch(showErrorToast({ title: "Session expirée", message: "Veuillez vous reconnecter pour générer un rapport." }));
        return;
      }

      const dateParam = `${selectedYear}-06-01`; // Date de référence pour l'année
      const reportUrl = `${ENV.API_URL}/admin/reports/operational?period=${selectedPeriod}&date=${dateParam}&token=${encodeURIComponent(finalToken)}`;

      if (Platform.OS === 'web') {
        window.open(reportUrl, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(reportUrl);
      }
    } catch (err) {
      console.error("[Report Error]:", err);
      dispatch(showErrorToast({ title: "Erreur", message: "Impossible d'ouvrir le rapport." }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Rapports Fiscaux</Text>
          <Text style={styles.headerSubtitle}>Générateur d'activité & conformité</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* BANNIÈRE INFORMATIVE */}
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} style={styles.infoIcon} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Rapport Officiel Certifié</Text>
            <Text style={styles.infoDesc}>
              Ce document agrège l'ensemble des courses VTC, livraisons e-commerce et abonnements pour la période choisie. Il est optimisé pour l'enregistrement PDF et la déclaration fiscale.
            </Text>
          </View>
        </View>

        {/* CHOIX DE L'ANNÉE */}
        <Text style={styles.sectionLabel}>1. Année fiscale</Text>
        <View style={styles.yearsRow}>
          {years.map((y) => (
            <TouchableOpacity
              key={y}
              style={[styles.yearChip, selectedYear === y && styles.yearChipActive]}
              onPress={() => setSelectedYear(y)}
              activeOpacity={0.7}
            >
              <Text style={[styles.yearText, selectedYear === y && styles.yearTextActive]}>
                {y}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CHOIX DE LA PÉRIODE */}
        <Text style={styles.sectionLabel}>2. Périodicité du bilan</Text>
        <View style={styles.periodsGrid}>
          {periods.map((p) => {
            const isSelected = selectedPeriod === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.periodCard, isSelected && styles.periodCardActive]}
                onPress={() => setSelectedPeriod(p.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.periodIconCircle, isSelected && styles.periodIconCircleActive]}>
                  <Ionicons name={p.icon} size={22} color={isSelected ? COLORS.textInverse : COLORS.primary} />
                </View>
                <Text style={[styles.periodTitle, isSelected && styles.periodTitleActive]}>{p.title}</Text>
                <Text style={styles.periodSubtitle}>{p.subtitle}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ACTION BUTTON */}
        <View style={styles.actionSection}>
          <GoldButton
            title={isLoading ? "Génération en cours..." : "GÉNÉRER LE RAPPORT (PDF / IMPRESSION)"}
            onPress={handleGenerateReport}
            loading={isLoading}
            style={styles.generateBtn}
          />
          <Text style={styles.helperText}>
            Le document s'ouvrira avec une option directe d'impression et d'enregistrement au format PDF.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.glassSurface,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTS.sizes.h4,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderRadius: BORDERS.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONTS.sizes.body,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  yearsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  yearChip: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDERS.radius.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.glassSurface,
  },
  yearChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
    ...SHADOWS.gold,
  },
  yearText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  yearTextActive: {
    color: COLORS.textInverse,
  },
  periodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  periodCard: {
    width: '47.5%',
    backgroundColor: COLORS.glassSurface,
    borderRadius: BORDERS.radius.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
    textAlign: 'center',
  },
  periodCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    ...SHADOWS.gold,
  },
  periodIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  periodIconCircleActive: {
    backgroundColor: COLORS.primary,
  },
  periodTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  periodTitleActive: {
    color: COLORS.primary,
  },
  periodSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 15,
  },
  actionSection: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  generateBtn: {
    width: '100%',
    marginBottom: SPACING.sm,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
