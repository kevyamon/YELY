// src/components/subscription/SubscriptionDashboard.jsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import THEME from '../../theme/theme';
import GlassCard from '../ui/GlassCard';
import GoldButton from '../ui/GoldButton';

const SubscriptionDashboard = ({ status, onProlong, onExpired }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  
  // Ref pour stabiliser la fonction d'expiration
  const onExpiredRef = useRef(onExpired);

  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  // LOGIQUE DU COMPTEUR TEMPS RÉEL
  useEffect(() => {
    if (!status?.expiresAt || !status?.isActive) return;

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
        clearInterval(intervalId);
        if (onExpiredRef.current) onExpiredRef.current();
      }
    };

    calculateTimeLeft();
    const intervalId = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(intervalId);
  }, [status?.expiresAt, status?.isActive]);

  const padZero = (num) => String(num || 0).padStart(2, '0');

  // LOGIQUE DE LA DATE STATIQUE
  const formatExpirationDate = (dateString) => {
    if (!dateString) return 'Calcul en cours...';
    
    const date = new Date(dateString);
    const mois = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    
    return `${date.getDate()} ${mois[date.getMonth()]} ${date.getFullYear()} à ${String(date.getHours()).padStart(2, '0')}h${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <View style={styles.stepContainer}>
      
      <GlassCard style={styles.dashboardCard}>
        {status.isPending ? (
          <View style={styles.pendingContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="time-outline" size={70} color={THEME.COLORS.champagneGold} />
              <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} style={styles.loader} />
            </View>
            <Text style={styles.title}>Traitement en cours</Text>
            <Text style={styles.dashTextDesc}>
              Votre capture d'écran a bien été reçue par nos services. Un administrateur vérifie actuellement votre paiement.
            </Text>
            <View style={styles.infoBox}>
              <Ionicons name="shield-checkmark-outline" size={20} color={THEME.COLORS.textSecondary} />
              <Text style={styles.infoText}>Activation estimée : moins de 15 minutes.</Text>
            </View>
          </View>
        ) : (
          <View style={styles.activeContainer}>
            <View style={styles.iconContainerActive}>
              <Ionicons name="checkmark-circle" size={50} color="#2ecc71" />
            </View>
            <Text style={styles.title}>Accès Actif</Text>
            
            {/* LE COMPTE A REBOURS */}
            <View style={styles.countdownRow}>
              <View style={styles.timeBlock}>
                <Text style={styles.timeValue}>{padZero(timeLeft?.days)}</Text>
                <Text style={styles.timeLabel}>Jours</Text>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeBlock}>
                <Text style={styles.timeValue}>{padZero(timeLeft?.hours)}</Text>
                <Text style={styles.timeLabel}>Hrs</Text>
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

            {/* LA DATE EXACTE */}
            <View style={styles.dateBox}>
              <Ionicons name="calendar-outline" size={24} color={THEME.COLORS.champagneGold} style={styles.calendarIcon} />
              <View style={styles.dateTextContainer}>
                <Text style={styles.dateLabel}>Expire le :</Text>
                <Text style={styles.dateValue}>{formatExpirationDate(status.expiresAt)}</Text>
              </View>
            </View>
            
          </View>
        )}
      </GlassCard>

      {!status.isPending && (
        <GoldButton title="Prolonger mon accès" onPress={onProlong} style={{ marginTop: 20 }} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  stepContainer: { width: '100%', alignItems: 'center' },
  dashboardCard: { width: '100%', padding: 25, alignItems: 'center', marginVertical: 10 },
  
  // Pending
  pendingContainer: { alignItems: 'center', width: '100%' },
  iconContainer: { marginBottom: 25, alignItems: 'center', justifyContent: 'center' },
  loader: { position: 'absolute', transform: [{ scale: 2.2 }], opacity: 0.4 },
  title: { fontSize: 24, fontWeight: '900', color: THEME.COLORS.textPrimary, marginBottom: 15, textAlign: 'center' },
  dashTextDesc: { color: THEME.COLORS.textSecondary, textAlign: 'center', marginBottom: 25, fontSize: 15, lineHeight: 22 },
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 15, borderRadius: 12, width: '100%', justifyContent: 'center', gap: 10 },
  infoText: { color: THEME.COLORS.textSecondary, fontSize: 14, fontStyle: 'italic' },

  // Active
  activeContainer: { alignItems: 'center', width: '100%' },
  iconContainerActive: { marginBottom: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(46, 204, 113, 0.1)', padding: 12, borderRadius: 50 },
  
  // Compteur Animé
  countdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginVertical: 15 },
  timeBlock: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, minWidth: 60, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  timeValue: { fontSize: 22, fontWeight: 'bold', color: THEME.COLORS.champagneGold },
  timeLabel: { fontSize: 10, color: THEME.COLORS.textSecondary, marginTop: 4, textTransform: 'uppercase', fontWeight: 'bold' },
  timeSeparator: { fontSize: 24, fontWeight: 'bold', color: THEME.COLORS.textSecondary, marginHorizontal: 6, paddingBottom: 15 },

  // Date Statique
  dateBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 16, width: '100%', marginTop: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  calendarIcon: { marginRight: 15 },
  dateTextContainer: { flex: 1 },
  dateLabel: { fontSize: 11, color: THEME.COLORS.textSecondary, marginBottom: 4, textTransform: 'uppercase', fontWeight: '600', letterSpacing: 0.5 },
  dateValue: { fontSize: 15, fontWeight: 'bold', color: THEME.COLORS.textPrimary }
});

export default SubscriptionDashboard;