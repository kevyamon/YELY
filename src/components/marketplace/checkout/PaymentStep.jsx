// src/components/marketplace/checkout/PaymentStep.jsx
// ÉTAPE 2 - Sélection du Mode de Paiement
// STANDARD: Industriel / Bank Grade

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import THEME from '../../../theme/theme';

export default function PaymentStep({ onNext }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const cardBg = isDark ? '#141414' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const activeBorder = THEME.COLORS.champagneGold;

  return (
    <View style={styles.container}>
      {/* En-tête avec titre et badge 3D */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={[styles.title, { color: textColor }]}>
            Mode de paiement
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
            Sélectionnez votre moyen de règlement sécurisé.
          </Text>
        </View>

        <View style={[styles.badge3DContainer, { backgroundColor: isDark ? 'rgba(212,175,55,0.12)' : 'rgba(212,175,55,0.14)' }]}>
          <MaterialCommunityIcons name="wallet-outline" size={28} color={THEME.COLORS.champagneGold} />
        </View>
      </View>

      {/* Mode Actif : Cash à la livraison */}
      <View style={[styles.methodCardActive, { backgroundColor: cardBg, borderColor: activeBorder }]}>
        <View style={styles.methodHeaderRow}>
          <View style={styles.methodLeftRow}>
            <View style={[styles.methodIconBg, { backgroundColor: THEME.COLORS.champagneGold }]}>
              <MaterialCommunityIcons name="cash-fast" size={22} color="#000000" />
            </View>
            <View style={styles.methodTitleGroup}>
              <Text style={[styles.methodTitle, { color: textColor }]}>
                Paiement à la livraison
              </Text>
              <Text style={[styles.methodBadge, { color: THEME.COLORS.champagneGold }]}>
                ESPÈCES (CASH)
              </Text>
            </View>
          </View>

          {/* Radio Button sélectionné */}
          <View style={[styles.radioCircleActive, { borderColor: THEME.COLORS.champagneGold }]}>
            <View style={[styles.radioInnerDot, { backgroundColor: THEME.COLORS.champagneGold }]} />
          </View>
        </View>

        <Text style={[styles.methodDesc, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }]}>
          Réglez le montant exact en espèces en mains propres au livreur Yély à la remise de vos colis.
        </Text>
      </View>

      {/* Carte d'information sur les futurs paiements digitaux */}
      <View style={[styles.upcomingCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB', borderColor: cardBorder }]}>
        <View style={styles.upcomingHeaderRow}>
          <Ionicons name="phone-portrait-outline" size={17} color={THEME.COLORS.champagneGold} />
          <Text style={[styles.upcomingTitle, { color: textColor }]}>
            Paiements mobiles & digitaux
          </Text>
          <View style={styles.upcomingBadge}>
            <Text style={styles.upcomingBadgeText}>Bientôt</Text>
          </View>
        </View>

        <Text style={[styles.upcomingDesc, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }]}>
          Les paiements via Wave, Orange Money et Cartes Bancaires seront intégrés prochainement sur Yély.
        </Text>

        <View style={styles.digitalLogosRow}>
          <View style={[styles.digitalPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF' }]}>
            <Text style={[styles.digitalPillText, { color: textColor }]}>Wave</Text>
          </View>
          <View style={[styles.digitalPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF' }]}>
            <Text style={[styles.digitalPillText, { color: textColor }]}>Orange Money</Text>
          </View>
          <View style={[styles.digitalPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF' }]}>
            <Text style={[styles.digitalPillText, { color: textColor }]}>MTN MoMo</Text>
          </View>
        </View>
      </View>

      {/* Bouton Continuer */}
      <TouchableOpacity style={styles.continueBtn} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.continueBtnText}>Continuer</Text>
        <View style={styles.arrowCircle}>
          <Ionicons name="arrow-forward" size={16} color="#000000" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  badge3DContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodCardActive: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 16,
    elevation: 3,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  methodHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  methodLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodTitleGroup: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  methodBadge: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  radioCircleActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  methodDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
  },
  upcomingCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 28,
  },
  upcomingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  upcomingTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  upcomingBadge: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  upcomingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.COLORS.champagneGold,
    textTransform: 'uppercase',
  },
  upcomingDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  digitalLogosRow: {
    flexDirection: 'row',
    gap: 8,
  },
  digitalPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  digitalPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  continueBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 16,
    backgroundColor: THEME.COLORS.champagneGold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    marginRight: 10,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
