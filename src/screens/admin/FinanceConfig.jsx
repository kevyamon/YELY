// src/screens/admin/FinanceConfig.jsx
// ECRAN FINANCE - SuperAdmin Only
// UI: Liquid Glassmorphism
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useGetFinanceDataQuery, useTogglePromoMutation, useUpdateWaveLinksMutation } from '../../store/api/adminApiSlice';
import THEME from '../../theme/theme';

const GlassCard = ({ children, style }) => (
  <View style={[styles.glassContainer, style]}>
    <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
    <View style={styles.glassContent}>
      {children}
    </View>
  </View>
);

const FinanceConfig = ({ navigation }) => {
  const { data: financeResponse, isLoading } = useGetFinanceDataQuery({ period: 'all' });
  const [togglePromo, { isLoading: isToggling }] = useTogglePromoMutation();
  const [updateLinks, { isLoading: isUpdatingLinks }] = useUpdateWaveLinksMutation();

  const [isPromoActive, setIsPromoActive] = useState(false);
  const [weeklyLink, setWeeklyLink] = useState('');
  const [monthlyLink, setMonthlyLink] = useState('');

  const financeData = financeResponse?.data || [];
  const totalRevenue = financeData.reduce((acc, curr) => acc + curr.totalAmount, 0);

  const handleTogglePromo = async (value) => {
    setIsPromoActive(value);
    try {
      await togglePromo({ isActive: value }).unwrap();
    } catch (error) {
      setIsPromoActive(!value);
      console.error('[FINANCE] Erreur bascule promo', error);
    }
  };

  const handleUpdateLinks = async () => {
    try {
      await updateLinks({ weeklyLink, monthlyLink }).unwrap();
      alert('Liens Wave mis a jour avec succes.');
    } catch (error) {
      alert('Erreur lors de la mise a jour des liens.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.champagneGold} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finance & Config</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <GlassCard style={styles.revenueCard}>
          <Ionicons name="wallet-outline" size={32} color={THEME.COLORS.champagneGold} style={styles.iconMargin} />
          <Text style={styles.revenueLabel}>Chiffre d'Affaires Global</Text>
          {isLoading ? (
            <ActivityIndicator color={THEME.COLORS.champagneGold} style={{ marginTop: 10 }} />
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
              trackColor={{ false: '#3e3e3e', true: THEME.COLORS.champagneGold }}
              thumbColor={'#f4f3f4'}
              onValueChange={handleTogglePromo}
              value={isPromoActive}
              disabled={isToggling}
            />
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>Passerelles de Paiement (Wave)</Text>
        <GlassCard style={styles.actionCard}>
          <Text style={styles.inputLabel}>Lien Hebdomadaire (1200 FCFA)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://pay.wave.com/..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={weeklyLink}
            onChangeText={setWeeklyLink}
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Lien Mensuel (6000 FCFA)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://pay.wave.com/..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={monthlyLink}
            onChangeText={setMonthlyLink}
            autoCapitalize="none"
          />

          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleUpdateLinks}
            disabled={isUpdatingLinks}
          >
            {isUpdatingLinks ? (
              <ActivityIndicator color="#121212" />
            ) : (
              <Text style={styles.submitButtonText}>Enregistrer les liens</Text>
            )}
          </TouchableOpacity>
        </GlassCard>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.COLORS.champagneGold },
  scrollContent: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: THEME.COLORS.textPrimary, marginBottom: 15, marginTop: 20 },
  glassContainer: { overflow: 'hidden', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', backgroundColor: 'rgba(255, 255, 255, 0.05)', marginBottom: 15 },
  glassContent: { padding: 20 },
  revenueCard: { alignItems: 'center', paddingVertical: 30 },
  iconMargin: { marginBottom: 10 },
  revenueLabel: { color: THEME.COLORS.textSecondary, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  revenueAmount: { color: THEME.COLORS.champagneGold, fontSize: 36, fontWeight: 'bold', marginTop: 10 },
  actionCard: { padding: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: THEME.COLORS.textPrimary, fontSize: 16, fontWeight: 'bold' },
  cardDescription: { color: THEME.COLORS.textSecondary, fontSize: 12, marginTop: 4, maxWidth: '80%' },
  inputLabel: { color: THEME.COLORS.textPrimary, fontSize: 14, marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: 'rgba(0,0,0,0.3)', color: '#FFF', borderRadius: 10, padding: 15, fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 10 },
  submitButton: { backgroundColor: THEME.COLORS.champagneGold, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  submitButtonText: { color: '#121212', fontWeight: 'bold', fontSize: 16 }
});

export default FinanceConfig;