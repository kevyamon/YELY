// src/components/marketplace/OrderTimeline.jsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import THEME from '../../theme/theme';

const STATUS_CONFIG = {
  pending: { label: 'Commande reçue', icon: 'clock-outline', color: THEME.COLORS.textTertiary },
  confirmed: { label: 'En préparation', icon: 'stove', color: THEME.COLORS.warning },
  searching: { label: 'Recherche livreur', icon: 'magnify', color: THEME.COLORS.primary },
  picked_up: { label: 'En route', icon: 'moped', color: THEME.COLORS.primary },
  arrived: { label: 'Arrivé', icon: 'map-marker-check', color: THEME.COLORS.success },
  delivered: { label: 'Livré', icon: 'check-all', color: THEME.COLORS.success },
  cancelled: { label: 'Annulée', icon: 'close-circle', color: THEME.COLORS.danger },
  rejected: { label: 'Refusée', icon: 'alert-circle', color: THEME.COLORS.danger },
};

const ORDERED_STATUSES = ['pending', 'confirmed', 'searching', 'picked_up', 'delivered'];

const OrderTimeline = ({ currentStatus, history = [], driverName }) => {
  // Déterminer l'index actuel dans la timeline simplifiée
  const currentIndex = ORDERED_STATUSES.indexOf(currentStatus);
  
  // Si annulé ou rejeté, on gère à part
  const isErrorStatus = ['cancelled', 'rejected'].includes(currentStatus);

  return (
    <View style={styles.container}>
      {ORDERED_STATUSES.map((status, index) => {
        const config = STATUS_CONFIG[status];
        const isCompleted = !isErrorStatus && index <= currentIndex;
        const isLast = index === ORDERED_STATUSES.length - 1;
        const isActive = status === currentStatus;

        // Trouver la date dans l'historique
        const historyEntry = history.find(h => h.status === status);
        const timeStr = historyEntry ? new Date(historyEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        return (
          <View key={status} style={styles.stepContainer}>
            <View style={styles.leftColumn}>
              <View style={[
                styles.iconCircle, 
                isCompleted ? { backgroundColor: config.color } : styles.inactiveCircle,
                isActive && styles.activePulse
              ]}>
                <MaterialCommunityIcons 
                  name={config.icon} 
                  size={20} 
                  color={isCompleted ? '#000' : THEME.COLORS.textTertiary} 
                />
              </View>
              {!isLast && <View style={[styles.line, isCompleted && { backgroundColor: config.color }]} />}
            </View>
            
            <View style={styles.rightColumn}>
              <Text style={[styles.statusLabel, isCompleted && styles.completedLabel, isActive && styles.activeLabel]}>
                {config.label}
              </Text>
              {isActive && status === 'picked_up' && driverName && (
                <Text style={styles.driverInfo}>Livreur : {driverName}</Text>
              )}
              {timeStr ? <Text style={styles.timeText}>{timeStr}</Text> : null}
            </View>
          </View>
        );
      })}

      {isErrorStatus && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name={STATUS_CONFIG[currentStatus].icon} size={24} color={THEME.COLORS.danger} />
          <Text style={styles.errorText}>{STATUS_CONFIG[currentStatus].label}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    height: 70,
  },
  leftColumn: {
    alignItems: 'center',
    width: 40,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  inactiveCircle: {
    backgroundColor: THEME.COLORS.glassSurface,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  activePulse: {
    borderWidth: 3,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: THEME.COLORS.border,
    marginVertical: 4,
  },
  rightColumn: {
    marginLeft: 15,
    paddingTop: 6,
  },
  statusLabel: {
    fontSize: 15,
    color: THEME.COLORS.textTertiary,
    fontWeight: '600',
  },
  completedLabel: {
    color: THEME.COLORS.textSecondary,
  },
  activeLabel: {
    color: THEME.COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 12,
    color: THEME.COLORS.textTertiary,
    marginTop: 2,
  },
  driverInfo: {
    fontSize: 12,
    color: THEME.COLORS.primary,
    fontWeight: 'bold',
    marginTop: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  errorText: {
    color: THEME.COLORS.danger,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default OrderTimeline;
