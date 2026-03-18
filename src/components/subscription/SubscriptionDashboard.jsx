// src/components/subscription/SubscriptionDashboard.jsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { selectPromoMode, selectSubscriptionStatus } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';
import GlassCard from '../ui/GlassCard';
import GoldButton from '../ui/GoldButton';

const SubscriptionDashboard = ({ status, onProlong, onExpired }) => {
  const navigation = useNavigation();
  const [timeLeft, setTimeLeft] = useState(null);
  
  const promoMode = useSelector(selectPromoMode);
  const subStatus = useSelector(selectSubscriptionStatus); // AJOUT

  const onExpiredRef = useRef(onExpired);

  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  // AJOUT : Écoute du refus pour rediriger automatiquement même depuis le Dashboard
  useEffect(() => {
    if (subStatus?.isRejected) {
      navigation.navigate('PaymentFailure');
    }
  }, [subStatus?.isRejected, navigation]);

  // COMPTEUR TEMPS REEL (Seulement si actif ET non gele par le VIP)
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
        clearInterval(intervalId);
        if (onExpiredRef.current) onExpiredRef.current();
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
    const mois = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
    return `${date.getDate()} ${mois[date.getMonth()]} ${date.getFullYear()} a ${String(date.getHours()).padStart(2, '0')}h${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <View style={styles.stepContainer}>
      <GlassCard style={styles.dashboardCard}>
        
        {/* CAS 1 : MODE VIP GRATUIT (Et le gars n'a pas d'abonnement actif) */}
        {promoMode?.isActive && !status.isActive && !status.isPending ? (
          <View style={styles.activeContainer}>
            <View style={[styles.iconContainerActive, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
              <Ionicons name="gift" size={50} color={THEME.COLORS.champagneGold} />
            </View>
            <Text style={[styles.title, { color: THEME.COLORS.champagneGold }]}>Acces VIP Offert</Text>
            <Text style={styles.promoDesc}>
              {promoMode.message}
            </Text>
          </View>
        ) 
        
        // CAS 2 : PAIEMENT EN COURS DE VERIFICATION
        : status.isPending ? (
          <View style={styles.pendingContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="time-outline" size={70} color={THEME.COLORS.champagneGold} />
              <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} style={styles.loader} />
            </View>
            <Text style={styles.title}>Traitement en cours</Text>
            <Text style={styles.dashTextDesc}>
              Votre capture d'ecran a bien ete recue. Un administrateur verifie actuellement votre paiement.
            </Text>
            <View style={styles.infoBox}>
              <Ionicons name="shield-checkmark-outline" size={20} color={THEME.COLORS.textSecondary} />
              <Text style={styles.infoText}>Activation estimee : moins de 15 minutes.</Text>
            </View>
          </View>
        ) 
        
        // CAS 3 : ABONNEMENT CLASSIQUE ACTIF
        : (
          <View style={styles.activeContainer}>
            
            {/* SOUS-CAS 3A : ABONNEMENT ACTIF MAIS GELE PAR LE VIP */}
            {promoMode?.isActive ? (
              <>
                <View style={[styles.iconContainerActive, { backgroundColor: 'rgba(52, 152, 219, 0.15)' }]}>
                  <Ionicons name="snow-outline" size={50} color="#3498db" />
                </View>
                <Text style={styles.title}>Abonnement Gele</Text>
                <Text style={styles.dashTextDesc}>
                  Le mode VIP est active sur le reseau. Le temps de votre abonnement est mis en pause et n'est plus decompté.
                </Text>
                <Text style={[styles.dashTextDesc, { fontWeight: 'bold', color: THEME.COLORS.champagneGold }]}>
                  Il reprendra et sera prolonge automatiquement a la fin de la promotion.
                </Text>
              </>
            ) : (
              /* SOUS-CAS 3B : ABONNEMENT ACTIF NORMAL (DECOMPTE) */
              <>
                <View style={styles.iconContainerActive}>
                  <Ionicons name="checkmark-circle" size={50} color="#2ecc71" />
                </View>
                <Text style={styles.title}>Pass Yely Actif</Text>
                
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

                <View style={styles.dateBox}>
                  <Ionicons name="calendar-outline" size={24} color={THEME.COLORS.champagneGold} style={styles.calendarIcon} />
                  <View style={styles.dateTextContainer}>
                    <Text style={styles.dateLabel}>Expire le :</Text>
                    <Text style={styles.dateValue}>{formatExpirationDate(status.expiresAt)}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        )}
      </GlassCard>

      {!status.isPending && (
        <GoldButton 
          title={promoMode?.isActive && !status.isActive ? "Anticiper un Pass" : "Prolonger mon Pass"} 
          onPress={onProlong} 
          style={{ marginTop: 20 }} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  stepContainer: { width: '100%', alignItems: 'center' },
  dashboardCard: { width: '100%', padding: 25, alignItems: 'center', marginVertical: 10 },
  
  pendingContainer: { alignItems: 'center', width: '100%' },
  iconContainer: { marginBottom: 25, alignItems: 'center', justifyContent: 'center' },
  loader: { position: 'absolute', transform: [{ scale: 2.2 }], opacity: 0.4 },
  title: { fontSize: 24, fontWeight: '900', color: THEME.COLORS.textPrimary, marginBottom: 15, textAlign: 'center' },
  dashTextDesc: { color: THEME.COLORS.textSecondary, textAlign: 'center', marginBottom: 25, fontSize: 15, lineHeight: 22 },
  promoDesc: { color: THEME.COLORS.textPrimary, textAlign: 'center', marginBottom: 15, fontSize: 17, lineHeight: 24, fontWeight: '600' },
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 15, borderRadius: 12, width: '100%', justifyContent: 'center', gap: 10 },
  infoText: { color: THEME.COLORS.textSecondary, fontSize: 14, fontStyle: 'italic' },

  activeContainer: { alignItems: 'center', width: '100%' },
  iconContainerActive: { marginBottom: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(46, 204, 113, 0.1)', padding: 12, borderRadius: 50 },
  
  countdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginVertical: 15, paddingHorizontal: 5 },
  timeBlock: { flex: 1, maxWidth: 80, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 12, paddingHorizontal: 2, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  timeValue: { fontSize: 20, fontWeight: 'bold', color: THEME.COLORS.champagneGold },
  timeLabel: { fontSize: 10, color: THEME.COLORS.textSecondary, marginTop: 4, textTransform: 'uppercase', fontWeight: 'bold' },
  timeSeparator: { fontSize: 20, fontWeight: 'bold', color: THEME.COLORS.textSecondary, marginHorizontal: 4, paddingBottom: 15 },

  dateBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 16, width: '100%', marginTop: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  calendarIcon: { marginRight: 15 },
  dateTextContainer: { flex: 1 },
  dateLabel: { fontSize: 11, color: THEME.COLORS.textSecondary, marginBottom: 4, textTransform: 'uppercase', fontWeight: '600', letterSpacing: 0.5 },
  dateValue: { fontSize: 15, fontWeight: 'bold', color: THEME.COLORS.textPrimary }
});

export default SubscriptionDashboard;