// src/components/subscription/PlanSelection.jsx
// Selection de plan et declenchement du paiement automatique securise
// STANDARD: Clean Architecture / Bank Grade (Modularise < 325 lignes, Sans Emojis)

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import THEME from '../../theme/theme';
import PricingCard from './PricingCard';

const STEPS_CONFIG = [
  {
    icon: 'card-outline',
    label: 'Cliquez sur',
    highlight: 'Payer mon abonnement',
  },
  {
    icon: 'phone-portrait-outline',
    label: 'Choisissez votre opérateur',
    highlight: 'Wave, Orange, MTN ou Moov',
  },
  {
    icon: 'shield-checkmark-outline',
    label: 'Validez la transaction',
    highlight: 'sur votre application Mobile Money',
  },
  {
    icon: 'checkmark-circle-outline',
    label: 'Activation immédiate',
    highlight: 'sans attente ni validation manuelle',
  },
];

const PlanSelection = ({
  configData,
  onSelectPlan,
  isLoading = false,
  onBack,
  userRole
}) => {
  const isPioneer = configData?.isPioneer || false;
  const isSeller = userRole === 'seller';

  const description = isPioneer
    ? 'Tarif Spécial Pionnier activé à vie.'
    : isSeller
    ? 'Vendez en illimité sans commissions.'
    : 'Roulez en illimité et gardez 100% de vos gains.';

  const handlePayPress = () => {
    if (isLoading) return;
    onSelectPlan();
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <PricingCard
        title="Passe 1 Mois"
        price={configData?.monthly?.price || 2000}
        originalPrice={configData?.monthly?.originalPrice || 2000}
        isPromo={configData?.isPromoActive}
        description={description}
        onPress={handlePayPress}
      />

      <View style={styles.howSection}>
        <Text style={styles.howTitle}>Procédure de paiement sécurisée</Text>
        <View style={styles.timeline}>
          {STEPS_CONFIG.map((step, index) => (
            <View key={index} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={styles.stepBullet}>
                  <Text style={styles.stepBulletText}>{index + 1}</Text>
                </View>
                {index < STEPS_CONFIG.length - 1 && <View style={styles.stepLine} />}
              </View>
              <View style={styles.stepContent}>
                <View style={styles.stepIconWrap}>
                  <Ionicons name={step.icon} size={16} color={THEME.COLORS.champagneGold || '#D4AF37'} />
                </View>
                <Text style={styles.stepText}>
                  {step.label}{' '}
                  <Text style={styles.stepHighlight}>{step.highlight}</Text>
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.paymentMethodTitle}>Passerelle de paiement sécurisée :</Text>

      <TouchableOpacity
        style={[styles.payButtonMain, isLoading && styles.payButtonDisabled]}
        onPress={handlePayPress}
        activeOpacity={0.85}
        disabled={isLoading}
      >
        <View style={styles.payButtonLeft}>
          <View style={styles.iconCircleGold}>
            <Ionicons name="lock-closed" size={18} color="#121418" />
          </View>
          <View style={styles.buttonTextContainer}>
            <Text style={styles.payButtonTextMain}>
              {isLoading ? 'Connexion sécurisée en cours...' : 'Payer mon abonnement'}
            </Text>
            <Text style={styles.payButtonSubtext}>
              Paiement chiffré et activé automatiquement
            </Text>
          </View>
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color="#121418" />
        ) : (
          <Ionicons name="arrow-forward" size={20} color="#121418" />
        )}
      </TouchableOpacity>

      {onBack && (
        <TouchableOpacity
          style={styles.backLink}
          onPress={onBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back-outline" size={16} color={THEME.COLORS.textTertiary || '#718096'} />
          <Text style={styles.backLinkText}>Retour au tableau de bord</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { width: '100%' },
  container: { paddingBottom: 24, gap: 16 },
  howSection: {
    backgroundColor: THEME.COLORS.surface || 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.COLORS.border || 'rgba(255,255,255,0.07)',
  },
  howTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.COLORS.champagneGold || '#D4AF37',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  timeline: { gap: 0 },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 48,
  },
  timelineLeft: {
    width: 28,
    alignItems: 'center',
    marginRight: 12,
  },
  stepBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: THEME.COLORS.champagneGold || '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBulletText: {
    color: '#121418',
    fontSize: 11,
    fontWeight: '800',
  },
  stepLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: (THEME.COLORS.champagneGold || '#D4AF37') + '30',
    marginTop: 4,
    marginBottom: 4,
    minHeight: 18,
  },
  stepContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 16,
    gap: 8,
  },
  stepIconWrap: {
    marginTop: 2,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: THEME.COLORS.textSecondary || '#A0AEC0',
    lineHeight: 20,
  },
  stepHighlight: {
    fontWeight: '700',
    color: THEME.COLORS.textPrimary || '#FFFFFF',
  },
  paymentMethodTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.COLORS.textSecondary || '#A0AEC0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  payButtonMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.COLORS.champagneGold || '#D4AF37',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...THEME.SHADOWS.md,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircleGold: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonTextContainer: {
    flex: 1,
  },
  payButtonTextMain: {
    fontSize: 15,
    fontWeight: '800',
    color: '#121418',
    letterSpacing: 0.2,
  },
  payButtonSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(18, 20, 24, 0.75)',
    marginTop: 2,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginTop: 4,
  },
  backLinkText: {
    fontSize: 13,
    color: THEME.COLORS.textTertiary || '#718096',
    fontWeight: '600',
  },
});

export default PlanSelection;