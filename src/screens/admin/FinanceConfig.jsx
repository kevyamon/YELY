// src/screens/admin/FinanceConfig.jsx
// ECRAN FINANCE - Integration stricte du theme.js (Light/Dark)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useGetFinanceDataQuery, useTogglePromoMutation } from '../../store/api/adminApiSlice';
import THEME from '../../theme/theme';

const GlassCard = ({ children, style }) => (
  <View style={[styles.glassContainer, style]}>
    <BlurView intensity={60} tint="default" style={StyleSheet.absoluteFill} />
    <View style={styles.glassContent}>
      {children}
    </View>
  </View>
);

const FinanceConfig = ({ navigation }) => {
  const { data: financeResponse, isLoading } = useGetFinanceDataQuery({ period: 'all' });
  const [togglePromo, { isLoading: isToggling }] = useTogglePromoMutation();

  const [isPromoActive, setIsPromoActive] = useState(false);

  const financeData = financeResponse?.data || financeResponse || [];
  const totalRevenue = financeData.reduce((acc, curr) => acc + curr.totalAmount, 0);

  const handleTogglePromo = async (value) => {
    setIsPromoActive(value);
    try { 
      await togglePromo({ isActive: value }).unwrap(); 
    } catch (e) { 
      setIsPromoActive(!value); 
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finance & Config</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <GlassCard style={styles.revenueCard}>
          <Ionicons name="wallet-outline" size={32} color={THEME.COLORS.primary} style={styles.iconMargin} />
          <Text style={styles.revenueLabel}>Chiffre d'Affaires Global</Text>
          {isLoading ? (
            <ActivityIndicator color={THEME.COLORS.primary} style={{ marginTop: 10 }} />
          ) : (
            <Text style={styles.revenueAmount}>{totalRevenue.toLocaleString('fr-FR')} FCFA</Text>
          )}
        </GlassCard>

        <Text style={styles.sectionTitle}>Marketing & Promotions</Text>
        <GlassCard style={styles.actionCard}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.cardTitle}>Mode Promotionnel</Text>
              <Text style={styles.cardDescription}>Active les tarifs reduits pour les chauffeurs.</Text>
            </View>
            <Switch
              trackColor={{ false: THEME.COLORS.overlay, true: THEME.COLORS.primary }}
              thumbColor={THEME.COLORS.background}
              onValueChange={handleTogglePromo}
              value={isPromoActive}
              disabled={isToggling}
            />
          </View>
        </GlassCard>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.COLORS.primary },
  scrollContent: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: THEME.COLORS.textPrimary, marginBottom: 15, marginTop: 20 },
  glassContainer: { overflow: 'hidden', borderRadius: THEME.BORDERS.radius.xl, borderWidth: THEME.BORDERS.width.thin, borderColor: THEME.COLORS.border, backgroundColor: THEME.COLORS.overlay, marginBottom: 15 },
  glassContent: { padding: 20 },
  revenueCard: { alignItems: 'center', paddingVertical: 30 },
  iconMargin: { marginBottom: 10 },
  revenueLabel: { color: THEME.COLORS.textSecondary, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  revenueAmount: { color: THEME.COLORS.primary, fontSize: 36, fontWeight: 'bold', marginTop: 10 },
  actionCard: { padding: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: THEME.COLORS.textPrimary, fontSize: 16, fontWeight: 'bold' },
  cardDescription: { color: THEME.COLORS.textSecondary, fontSize: 12, marginTop: 4, maxWidth: '80%' }
});

export default FinanceConfig;