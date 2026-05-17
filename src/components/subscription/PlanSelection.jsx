// src/components/subscription/PlanSelection.jsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';
import PricingCard from './PricingCard';

const PLAN_TYPES = { MONTHLY: 'MONTHLY' };

const PlanSelection = ({ config, status, onSelectPlan, onBack, onLogout, userRole }) => {
  const isPioneer = config?.isPioneer || false;
  const isSeller = userRole === 'seller';

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Forfait Unique Yély</Text>
      <Text style={styles.subtitle}>
        {isPioneer 
          ? "Tarif Spécial Pionnier activé à vie sur votre compte !" 
          : (isSeller 
              ? "Activez votre forfait mensuel pour vendre vos produits sur Yély." 
              : "Activez votre forfait mensuel pour commencer à rouler.")
        }
      </Text>

      <PricingCard 
        title="Pass 1 Mois"
        price={config?.monthly?.price || 2000}
        originalPrice={config?.monthly?.originalPrice || 2000}
        isPromo={config?.isPromoActive}
        description={isPioneer ? "Paiement Wave - Caisse Pionnier" : "Paiement Wave - Caisse Partenaire"}
        onPress={() => onSelectPlan({ id: PLAN_TYPES.MONTHLY, link: config?.monthly?.link, price: config?.monthly?.price })}
      />

      {status?.isActive ? (
         <TouchableOpacity style={styles.logoutBtn} onPress={onBack}>
            <Ionicons name="arrow-back-outline" size={20} color={THEME.COLORS.champagneGold || '#D4AF37'} />
            <Text style={[styles.logoutText, { color: THEME.COLORS.champagneGold || '#D4AF37', textDecorationLine: 'none' }]}>
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
  subtitle: { fontSize: 16, color: THEME.COLORS.textSecondary || '#A0AEC0', marginBottom: 30, textAlign: 'center', paddingHorizontal: 10 },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30, padding: 15 },
  logoutText: { color: THEME.COLORS.textSecondary, fontSize: 14, marginLeft: 8, textDecorationLine: 'underline' }
});

export default PlanSelection;