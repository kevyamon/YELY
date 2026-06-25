// src/components/subscription/PlanSelection.jsx
// Sélection de plan — Design épuré, sans titre redondant, sans bouton déconnexion

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';
import PricingCard from './PricingCard';

const PLAN_TYPES = { MONTHLY: 'MONTHLY' };

// Étapes de la procédure de paiement Wave
const STEPS_CONFIG = [
  {
    icon: 'card-outline',
    label: 'Cliquez sur',
    highlight: 'Payer avec Wave',
  },
  {
    icon: 'checkmark-done-outline',
    label: 'Validez le paiement dans l\'application',
    highlight: 'Wave',
  },
  {
    icon: 'camera-outline',
    label: 'Faites une',
    highlight: 'capture d\'écran du reçu',
  },
  {
    icon: 'cloud-upload-outline',
    label: 'Revenez sur Yély et',
    highlight: 'soumettez la capture',
  },
];

const PlanSelection = ({ config, status, onSelectPlan, onBack, userRole }) => {
  const isPioneer = config?.isPioneer || false;
  const isSeller = userRole === 'seller';

  const handlePayWave = async () => {
    const waveLink = config?.monthly?.link;
    if (waveLink) {
      try {
        const supported = await Linking.canOpenURL(waveLink);
        await Linking.openURL(supported ? waveLink : 'https://pay.wave.com/');
      } catch (err) {
        console.warn('Erreur ouverture lien Wave:', err);
      }
    }
    onSelectPlan({
      id: PLAN_TYPES.MONTHLY,
      link: waveLink,
      price: config?.monthly?.price || 2000,
    });
  };

  const description = isPioneer
    ? 'Tarif Spécial Pionnier activé à vie !'
    : isSeller
    ? 'Vendez en illimité sans commissions.'
    : 'Roulez en illimité et gardez 100% de vos gains.';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Carte de prix */}
      <PricingCard
        title="Passe 1 Mois"
        price={config?.monthly?.price || 2000}
        originalPrice={config?.monthly?.originalPrice || 2000}
        isPromo={config?.isPromoActive}
        description={description}
        onPress={handlePayWave}
      />

      {/* Section "Comment ça marche" — Timeline */}
      <View style={styles.howSection}>
        <Text style={styles.howTitle}>Comment ça marche ?</Text>
        <View style={styles.timeline}>
          {STEPS_CONFIG.map((step, index) => (
            <View key={index} style={styles.timelineRow}>
              {/* Connecteur + Numéro */}
              <View style={styles.timelineLeft}>
                <View style={styles.stepBullet}>
                  <Text style={styles.stepBulletText}>{index + 1}</Text>
                </View>
                {index < STEPS_CONFIG.length - 1 && <View style={styles.stepLine} />}
              </View>
              {/* Contenu */}
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

      {/* Boutons de paiement */}
      <Text style={styles.paymentMethodTitle}>Moyen de paiement :</Text>

      <View style={styles.paymentContainer}>
        {/* Wave — Actif */}
        <TouchableOpacity style={styles.payButtonWave} onPress={handlePayWave} activeOpacity={0.85}>
          <View style={styles.payButtonLeft}>
            <View style={styles.iconCircleWave}>
              <Ionicons name="card" size={18} color="#FFF" />
            </View>
            <Text style={styles.payButtonTextWave}>Payer avec Wave</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FFF" />
        </TouchableOpacity>

        {/* MTN — Bientôt */}
        <View style={[styles.payButtonDisabled, styles.borderMtn]}>
          <View style={styles.payButtonLeft}>
            <View style={styles.iconCircleMtn}>
              <Ionicons name="phone-portrait-outline" size={18} color="#A0AEC0" />
            </View>
            <Text style={styles.payButtonTextDisabled}>MTN Mobile Money</Text>
          </View>
          <View style={styles.badgeBientot}>
            <Text style={styles.badgeText}>Bientôt</Text>
          </View>
        </View>

        {/* Orange Money — Bientôt */}
        <View style={[styles.payButtonDisabled, styles.borderOrange]}>
          <View style={styles.payButtonLeft}>
            <View style={styles.iconCircleOrange}>
              <Ionicons name="wallet-outline" size={18} color="#A0AEC0" />
            </View>
            <Text style={styles.payButtonTextDisabled}>Orange Money</Text>
          </View>
          <View style={styles.badgeBientot}>
            <Text style={styles.badgeText}>Bientôt</Text>
          </View>
        </View>
      </View>

      {/* Lien discret "retour" si abonnement actif (ex: renouveler) */}
      {status?.isActive && (
        <TouchableOpacity style={styles.backLink} onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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

  // Section "Comment ça marche"
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
    color: '#000',
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

  // Titre méthode de paiement
  paymentMethodTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.COLORS.textSecondary || '#A0AEC0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  paymentContainer: { gap: 10 },

  // Bouton Wave
  payButtonWave: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF9900',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    ...THEME.SHADOWS.md,
  },
  payButtonLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircleWave: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButtonTextWave: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  // Boutons désactivés
  payButtonDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderWidth: 1,
    opacity: 0.45,
  },
  borderMtn: { borderColor: 'rgba(255, 204, 0, 0.15)' },
  borderOrange: { borderColor: 'rgba(255, 102, 0, 0.15)' },
  iconCircleMtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,204,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleOrange: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,102,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButtonTextDisabled: {
    color: THEME.COLORS.textTertiary || '#718096',
    fontSize: 14,
    fontWeight: '700',
  },
  badgeBientot: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    color: THEME.COLORS.textTertiary || '#718096',
    fontSize: 11,
    fontWeight: '700',
  },

  // Lien retour discret
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    marginTop: 4,
  },
  backLinkText: {
    color: THEME.COLORS.textTertiary || '#718096',
    fontSize: 13,
  },
});

export default PlanSelection;