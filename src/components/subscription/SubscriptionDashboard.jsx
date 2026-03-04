// src/components/subscription/SubscriptionDashboard.jsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import THEME from '../../theme/theme';
import GlassCard from '../ui/GlassCard';
import GoldButton from '../ui/GoldButton';

const SubscriptionDashboard = ({ status, timeLeft, onProlong }) => {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Mon Abonnement</Text>
      
      <GlassCard style={styles.dashboardCard}>
        {status.isPending ? (
          <>
            <View style={[styles.statusBadge, styles.badgePending]}>
              <Text style={styles.statusBadgeText}>VÉRIFICATION EN COURS</Text>
            </View>
            <Text style={styles.dashTextDesc}>
              Votre preuve de paiement a été soumise avec succès. Un administrateur valide votre accès.
            </Text>
          </>
        ) : (
          <>
            <View style={[styles.statusBadge, styles.badgeActive]}>
              <Text style={styles.statusBadgeText}>ACCÈS ACTIF</Text>
            </View>
            <Text style={styles.dashTextDesc}>Temps d'accès restant avant expiration :</Text>
            
            <View style={styles.countdownRow}>
              <View style={styles.timeBlock}>
                <Text style={styles.timeValue}>{timeLeft?.days || '0'}</Text>
                <Text style={styles.timeLabel}>Jours</Text>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeBlock}>
                <Text style={styles.timeValue}>{timeLeft?.hours || '0'}</Text>
                <Text style={styles.timeLabel}>Hrs</Text>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeBlock}>
                <Text style={styles.timeValue}>{timeLeft?.minutes || '0'}</Text>
                <Text style={styles.timeLabel}>Min</Text>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeBlock}>
                <Text style={styles.timeValue}>{timeLeft?.seconds || '0'}</Text>
                <Text style={styles.timeLabel}>Sec</Text>
              </View>
            </View>
          </>
        )}
      </GlassCard>

      {!status.isPending && (
        <GoldButton 
          title="Prolonger mon accès" 
          onPress={onProlong} 
          style={{ marginTop: 20 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  stepContainer: { width: '100%' },
  title: { fontSize: 28, fontWeight: 'bold', color: THEME.COLORS.textPrimary || '#FFFFFF', marginBottom: 10, textAlign: 'center' },
  dashboardCard: { width: '100%', padding: 20, alignItems: 'center', marginVertical: 20 },
  statusBadge: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginBottom: 20 },
  badgeActive: { backgroundColor: 'rgba(46, 204, 113, 0.15)', borderWidth: 1, borderColor: '#2ecc71' },
  badgePending: { backgroundColor: 'rgba(241, 196, 15, 0.15)', borderWidth: 1, borderColor: '#f1c40f' },
  statusBadgeText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  dashTextDesc: { color: THEME.COLORS.textSecondary, textAlign: 'center', marginBottom: 20, fontSize: 15 },
  countdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  timeBlock: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', paddingVertical: 15, paddingHorizontal: 12, borderRadius: 12, minWidth: 65 },
  timeValue: { fontSize: 24, fontWeight: 'bold', color: THEME.COLORS.champagneGold },
  timeLabel: { fontSize: 11, color: THEME.COLORS.textSecondary, marginTop: 4, textTransform: 'uppercase' },
  timeSeparator: { fontSize: 24, fontWeight: 'bold', color: THEME.COLORS.textSecondary, marginHorizontal: 8, paddingBottom: 15 },
});

export default SubscriptionDashboard;