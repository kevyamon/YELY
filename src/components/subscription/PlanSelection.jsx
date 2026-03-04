// src/components/subscription/PlanSelection.jsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';
import PricingCard from './PricingCard';

const PLAN_TYPES = { WEEKLY: 'WEEKLY', MONTHLY: 'MONTHLY' };

const PlanSelection = ({ config, status, onSelectPlan, onBack, onLogout }) => {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Forfaits Disponibles</Text>
      <Text style={styles.subtitle}>Sélectionnez votre forfait pour continuer.</Text>

      <PricingCard 
        title="Pass 1 Semaine"
        price={config.weekly.price}
        originalPrice={config.weekly.originalPrice}
        isPromo={config.isPromoActive}
        description="Paiement par Wave (Caisse Principale)"
        onPress={() => onSelectPlan(PLAN_TYPES.WEEKLY, config.weekly.link, config.weekly.price)}
      />

      <PricingCard 
        title="Pass 1 Mois"
        price={config.monthly.price}
        originalPrice={config.monthly.originalPrice}
        isPromo={config.isPromoActive}
        description="Paiement par Wave (Caisse Partenaire)"
        onPress={() => onSelectPlan(PLAN_TYPES.MONTHLY, config.monthly.link, config.monthly.price)}
      />

      {status?.isActive ? (
         <TouchableOpacity style={styles.logoutBtn} onPress={onBack}>
            <Ionicons name="arrow-back-outline" size={20} color={THEME.COLORS.champagneGold} />
            <Text style={[styles.logoutText, { color: THEME.COLORS.champagneGold, textDecorationLine: 'none' }]}>
              Retour au Tableau de Bord
            </Text>
         </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={20} color={THEME.COLORS.textSecondary} />
          <Text style={styles.logoutText}>Se déconnecter de ce compte</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  stepContainer: { width: '100%' },
  title: { fontSize: 28, fontWeight: 'bold', color: THEME.COLORS.textPrimary || '#FFFFFF', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: THEME.COLORS.textSecondary || '#A0AEC0', marginBottom: 30, textAlign: 'center' },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30, padding: 15 },
  logoutText: { color: THEME.COLORS.textSecondary, fontSize: 14, marginLeft: 8, textDecorationLine: 'underline' }
});

export default PlanSelection;