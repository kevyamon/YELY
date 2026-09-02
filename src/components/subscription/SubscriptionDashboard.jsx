// src/components/subscription/SubscriptionDashboard.jsx
// COMPOSANT TABLEAU DE BORD ABONNEMENT - Compteur temps reel & Etat VIP
// STANDARD: Clean Architecture / Bank Grade (Modularise < 325 lignes, Sans Emojis)

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { selectPromoMode, selectSubscriptionStatus } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';
import GlassCard from '../ui/GlassCard';
import GoldButton from '../ui/GoldButton';

const SubscriptionDashboard = ({ statusData, onRenew, onSelectOtherPlan }) => {
  const navigation = useNavigation();
  const [timeLeft, setTimeLeft] = useState(null);
  
  const promoMode = useSelector(selectPromoMode);
  const subStatus = useSelector(selectSubscriptionStatus);

  const status = statusData || subStatus || {};

  // Redirection automatique en cas de paiement echoue
  useEffect(() => {
    if (subStatus?.isRejected) {
      navigation.navigate('PaymentFailure');
    }
  }, [subStatus?.isRejected, navigation]);

  // Compteur en temps reel de validite
  useEffect(() => {
    if (!status?.expiresAt || !status?.isActive || promoMode?.isActive) {
      return; 
    }

    const calculateTimeLeft = () => {
      const difference = new Date(status.expiresAt).getTime() - Date.now();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const intervalId = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(intervalId);
  }, [status?.expiresAt, status?.isActive, promoMode?.isActive]);

  const padZero = (num) => String(num || 0).padStart(2, '0');
  
  const formatExpirationDate = (dateString) => {
    if (!dateString) return 'Calcul en cours...';
    const date = new Date(dateString);
    const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${date.getDate()} ${mois[date.getMonth()]} ${date.getFullYear()} à ${String(date.getHours()).padStart(2, '0')}h${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <View style={styles.stepContainer}>
      <GlassCard style={styles.dashboardCard}>
        
        {/* CAS 1 : MODE VIP GRATUIT (Acces gratuit actif sans debit de forfait) */}
        {promoMode?.isActive && !status.isActive && !status.isPending ? (
          <View style={styles.activeContainer}>
            <View style={[styles.iconContainerActive, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
              <Ionicons name="gift" size={50} color={THEME.COLORS.champagneGold} />
            </View>
            <Text style={[styles.title, { color: THEME.COLORS.champagneGold }]}>Accès VIP Offert</Text>
            <Text style={styles.promoDesc}>
              {promoMode.message}
            </Text>
          </View>
        ) 
        
        // CAS 2 : PAIEMENT EN COURS DE CONFIRMATION
        : status.isPending ? (
          <View style={styles.pendingContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="time-outline" size={60} color={THEME.COLORS.champagneGold} />
              <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} style={styles.loader} />
            </View>
            <Text style={styles.title}>Paiement en cours</Text>
            <Text style={styles.dashTextDesc}>
              Votre transaction Mobile Money est en cours de confirmation par la passerelle.
            </Text>
            <View style={styles.infoBox}>
              <Ionicons name="shield-checkmark-outline" size={18} color={THEME.COLORS.champagneGold} />
              <Text style={styles.infoText}>Activation automatique immédiate.</Text>
            </View>
          </View>
        ) 
        
        // CAS 3 : ABONNEMENT ACTIF
        : (
          <View style={styles.activeContainer}>
            
            {/* SOUS-CAS 3A : ABONNEMENT ACTIF MAIS GELE PAR LE VIP */}
            {promoMode?.isActive ? (
              <>
                <View style={[styles.iconContainerActive, { backgroundColor: 'rgba(52, 152, 219, 0.15)' }]}>
                  <Ionicons name="snow-outline" size={50} color="#3498db" />
                </View>
                <Text style={styles.title}>Abonnement Gelé</Text>
                <Text style={styles.dashTextDesc}>
                  Le mode VIP est activé sur le réseau. Le décompte de votre abonnement est mis en pause.
                </Text>
                <Text style={[styles.dashTextDesc, { fontWeight: 'bold', color: THEME.COLORS.champagneGold }]}>
                  Il reprendra et sera prolongé automatiquement à la fin de la promotion.
                </Text>
              </>
            ) : (
              /* SOUS-CAS 3B : ABONNEMENT ACTIF NORMAL (DECOMPTE EN DIRECT) */
              <>
                <View style={styles.iconContainerActive}>
                  <Ionicons name="checkmark-circle" size={50} color="#2ecc71" />
                </View>
                <Text style={styles.title}>Passe Yély Actif</Text>
                
                <View style={styles.countdownRow}>
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeValue}>{padZero(timeLeft?.days)}</Text>
                    <Text style={styles.timeLabel}>Jours</Text>
                  </View>
                  <Text style={styles.timeSeparator}>:</Text>
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeValue}>{padZero(timeLeft?.hours)}</Text>
                    <Text style={styles.timeLabel}>Heures</Text>
                  </View>
                  <Text style={styles.timeSeparator}>:</Text>
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeValue}>{padZero(timeLeft?.minutes)}</Text>
                    <Text style={styles.timeLabel}>Min</Text>
                  </View>
                  <Text style={styles.timeSeparator}>:</Text>
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeValue}>{padZero(timeLeft?.seconds)}</Text>
                    <Text style={styles.timeLabel}>Sec</Text>
                  </View>
                </View>
 
                <View style={styles.dateBox}>
                  <Text style={styles.dateLabel}>Date d'expiration :</Text>
                  <Text style={styles.dateValue}>{formatExpirationDate(status.expiresAt)}</Text>
                </View>
              </>
            )}
            
            <View style={styles.actionSection}>
              <GoldButton
                title="Prolonger mon abonnement"
                onPress={onRenew}
                icon="add-circle-outline"
              />
            </View>
          </View>
        )}
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  stepContainer: { flex: 1, paddingHorizontal: 4 },
  dashboardCard: { padding: 22, alignItems: 'center' },
  activeContainer: { alignItems: 'center', width: '100%' },
  pendingContainer: { alignItems: 'center', width: '100%' },
  iconContainerActive: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(46, 204, 113, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  iconContainer: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(212, 175, 55, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, position: 'relative' },
  loader: { position: 'absolute' },
  title: { fontSize: 22, fontWeight: 'bold', color: THEME.COLORS.textPrimary || '#FFFFFF', marginBottom: 10, textAlign: 'center' },
  promoDesc: { fontSize: 14, color: THEME.COLORS.textSecondary || '#A0AEC0', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  dashTextDesc: { fontSize: 14, color: THEME.COLORS.textSecondary || '#A0AEC0', textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: 12, padding: 12, marginTop: 10, gap: 8 },
  infoText: { fontSize: 12, color: THEME.COLORS.textSecondary || '#A0AEC0', fontWeight: '600' },
  countdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 18 },
  timeBlock: { alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, minWidth: 54 },
  timeValue: { fontSize: 20, fontWeight: '800', color: THEME.COLORS.champagneGold || '#D4AF37' },
  timeLabel: { fontSize: 10, color: THEME.COLORS.textTertiary || '#718096', textTransform: 'uppercase', marginTop: 2, fontWeight: '600' },
  timeSeparator: { fontSize: 20, fontWeight: 'bold', color: THEME.COLORS.champagneGold || '#D4AF37', marginHorizontal: 4 },
  dateBox: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, padding: 12, width: '100%', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: THEME.COLORS.border || 'rgba(255, 255, 255, 0.06)' },
  dateLabel: { fontSize: 12, color: THEME.COLORS.textTertiary || '#718096', marginBottom: 4 },
  dateValue: { fontSize: 13, fontWeight: '700', color: THEME.COLORS.textPrimary || '#FFFFFF' },
  actionSection: { width: '100%', marginTop: 8 }
});

export default SubscriptionDashboard;