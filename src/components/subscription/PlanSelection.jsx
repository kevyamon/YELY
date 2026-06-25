// src/components/subscription/PlanSelection.jsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Linking, Platform } from 'react-native';
import THEME from '../../theme/theme';
import PricingCard from './PricingCard';

const PLAN_TYPES = { MONTHLY: 'MONTHLY' };

const PlanSelection = ({ config, status, onSelectPlan, onBack, onLogout, userRole }) => {
  const isPioneer = config?.isPioneer || false;
  const isSeller = userRole === 'seller';

  const handlePayWave = async () => {
    const waveLink = config?.monthly?.link;
    if (waveLink) {
      try {
        const supported = await Linking.canOpenURL(waveLink);
        if (supported) {
          await Linking.openURL(waveLink);
        } else {
          // Fallback sur le site web de Wave si l'app n'est pas installee
          await Linking.openURL('https://pay.wave.com/');
        }
      } catch (err) {
        console.warn("Erreur ouverture lien Wave:", err);
      }
    }
    // Transition vers l'etape de preuve
    onSelectPlan({ 
      id: PLAN_TYPES.MONTHLY, 
      link: waveLink, 
      price: config?.monthly?.price || 2000 
    });
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Pass Yély Unique</Text>
      
      {/* SECTION EXPLICATIONS IMMERSIVE */}
      <View style={styles.explainSection}>
        <Text style={styles.explainTitle}>Comment ça marche ?</Text>
        
        <View style={styles.explainItem}>
          <View style={styles.explainNumber}><Text style={styles.explainNumberText}>1</Text></View>
          <Text style={styles.explainText}>Cliquez sur le bouton orange <Text style={styles.boldText}>Wave</Text> ci-dessous.</Text>
        </View>
        <View style={styles.explainItem}>
          <View style={styles.explainNumber}><Text style={styles.explainNumberText}>2</Text></View>
          <Text style={styles.explainText}>Validez le paiement pré-rempli sur votre application Wave.</Text>
        </View>
        <View style={styles.explainItem}>
          <View style={styles.explainNumber}><Text style={styles.explainNumberText}>3</Text></View>
          <Text style={styles.explainText}>Faites une capture d'écran du reçu de paiement.</Text>
        </View>
        <View style={styles.explainItem}>
          <View style={styles.explainNumber}><Text style={styles.explainNumberText}>4</Text></View>
          <Text style={styles.explainText}>Revenez sur Yély pour envoyer votre capture et activer votre compte.</Text>
        </View>
      </View>

      <PricingCard 
        title="Pass 1 Mois"
        price={config?.monthly?.price || 2000}
        originalPrice={config?.monthly?.originalPrice || 2000}
        isPromo={config?.isPromoActive}
        description={isPioneer ? "Tarif Spécial Pionnier activé à vie !" : (isSeller ? "Vendez en illimité sans commissions." : "Roulez en illimité et gardez 100% de vos gains.")}
        onPress={handlePayWave}
      />

      <Text style={styles.paymentMethodTitle}>Sélectionnez votre moyen de paiement :</Text>

      {/* BOUTONS DE PAIEMENT */}
      <View style={styles.paymentContainer}>
        {/* WAVE - ACTIF */}
        <TouchableOpacity style={styles.payButtonWave} onPress={handlePayWave} activeOpacity={0.85}>
          <View style={styles.payButtonLeft}>
            <View style={styles.iconCircleWave}>
              <Ionicons name="card" size={20} color="#FFF" />
            </View>
            <Text style={styles.payButtonTextWave}>Payer avec Wave</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FFF" />
        </TouchableOpacity>

        {/* MTN MOMO - INDISPONIBLE */}
        <View style={[styles.payButtonDisabled, styles.borderMtn]}>
          <View style={styles.payButtonLeft}>
            <View style={styles.iconCircleMtn}>
              <Ionicons name="phone-portrait-outline" size={20} color="#A0AEC0" />
            </View>
            <Text style={styles.payButtonTextDisabled}>MTN Mobile Money</Text>
          </View>
          <View style={styles.badgeBientot}><Text style={styles.badgeText}>Bientôt</Text></View>
        </View>

        {/* ORANGE MONEY - INDISPONIBLE */}
        <View style={[styles.payButtonDisabled, styles.borderOrange]}>
          <View style={styles.payButtonLeft}>
            <View style={styles.iconCircleOrange}>
              <Ionicons name="wallet-outline" size={20} color="#A0AEC0" />
            </View>
            <Text style={styles.payButtonTextDisabled}>Orange Money</Text>
          </View>
          <View style={styles.badgeBientot}><Text style={styles.badgeText}>Bientôt</Text></View>
        </View>
      </View>

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
  title: { fontSize: 24, fontWeight: '900', color: THEME.COLORS.textPrimary || '#FFFFFF', marginBottom: 15, textAlign: 'center' },
  
  explainSection: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20
  },
  explainTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.COLORS.champagneGold || '#D4AF37',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  explainItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  explainNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: THEME.COLORS.champagneGold || '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  explainNumberText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold'
  },
  explainText: {
    fontSize: 13,
    color: THEME.COLORS.textSecondary || '#A0AEC0',
    flex: 1,
    lineHeight: 18
  },
  boldText: {
    fontWeight: 'bold',
    color: THEME.COLORS.textPrimary
  },

  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.COLORS.textSecondary || '#A0AEC0',
    marginBottom: 12,
    marginTop: 10
  },
  paymentContainer: {
    gap: 10
  },
  payButtonWave: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF9900', // Orange Wave
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...THEME.SHADOWS.md
  },
  payButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconCircleWave: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  payButtonTextWave: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800'
  },
  
  payButtonDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    opacity: 0.5
  },
  borderMtn: {
    borderColor: 'rgba(255, 204, 0, 0.15)'
  },
  borderOrange: {
    borderColor: 'rgba(255, 102, 0, 0.15)'
  },
  iconCircleMtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,204,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconCircleOrange: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,102,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  payButtonTextDisabled: {
    color: THEME.COLORS.textTertiary || '#718096',
    fontSize: 15,
    fontWeight: '700'
  },
  badgeBientot: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  badgeText: {
    color: THEME.COLORS.textTertiary || '#718096',
    fontSize: 11,
    fontWeight: 'bold'
  },

  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 25, padding: 10 },
  logoutText: { color: THEME.COLORS.textSecondary, fontSize: 13, marginLeft: 8, textDecorationLine: 'underline' }
});

export default PlanSelection;