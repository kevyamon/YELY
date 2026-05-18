// src/components/marketplace/OrderStatusTimeline.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import THEME from '../../theme/theme';

const STEPS = [
  { id: 'pending', label: 'Commande passée', icon: 'cart-check' },
  { id: 'confirmed', label: 'Confirmée par le vendeur', icon: 'store-check' },
  { id: 'picked_up', label: 'En cours de livraison', icon: 'moped' },
  { id: 'delivered', label: 'Livrée', icon: 'check-decagram' }
];

const OrderStatusTimeline = ({ currentStatus }) => {
  const isCancelled = currentStatus === 'cancelled' || currentStatus === 'cancelled_no_driver' || currentStatus === 'rejected';

  const getSteps = () => {
    if (isCancelled) {
      const cancelLabel = currentStatus === 'rejected' ? 'Refusée par le vendeur' : 'Commande annulée';
      return [
        { id: 'pending', label: 'Commande passée', icon: 'cart-check' },
        { id: 'cancelled', label: cancelLabel, icon: 'close-circle', isDanger: true }
      ];
    }
    return STEPS;
  };

  const stepsList = getSteps();
  const getStatusIndex = (status) => {
    if (isCancelled) return 1;
    const map = {
      'pending': 0,
      'confirmed': 1,
      'picked_up': 2,
      'delivered': 3
    };
    return map[status] || 0;
  };

  const currentIndex = getStatusIndex(currentStatus);

  return (
    <View style={styles.container}>
      {stepsList.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isLast = index === stepsList.length - 1;
        const isActive = index === currentIndex;

        return (
          <View key={step.id} style={styles.stepContainer}>
            <View style={styles.leftColumn}>
              <View style={[
                styles.dot,
                step.isDanger 
                  ? styles.dotDanger 
                  : (isCompleted ? styles.dotCompleted : styles.dotPending),
                isActive && styles.dotActive
              ]}>
                <MaterialCommunityIcons
                  name={step.icon}
                  size={16}
                  color={isCompleted ? THEME.COLORS.textInverse : THEME.COLORS.textTertiary}
                />
              </View>
              {!isLast && (
                <View style={[
                  styles.line,
                  index < currentIndex ? styles.lineCompleted : styles.linePending
                ]} />
              )}
            </View>

            <View style={styles.rightColumn}>
              <Text style={[
                styles.label,
                step.isDanger 
                  ? styles.labelDanger 
                  : (isCompleted ? styles.labelCompleted : styles.labelPending),
                isActive && styles.labelActive
              ]}>
                {step.label}
              </Text>
              {isActive && !step.isDanger && (
                <Text style={styles.activeSubtitle}>Étape actuelle</Text>
              )}
              {step.isDanger && (
                <Text style={[styles.activeSubtitle, { color: THEME.COLORS.danger }]}>Commande interrompue</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: THEME.SPACING.md,
  },
  stepContainer: {
    flexDirection: 'row',
    height: 60,
  },
  leftColumn: {
    alignItems: 'center',
    marginRight: THEME.SPACING.lg,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  dotCompleted: {
    backgroundColor: THEME.COLORS.primary,
  },
  dotPending: {
    backgroundColor: THEME.COLORS.glassSurface,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  dotActive: {
    ...THEME.SHADOWS.gold,
    borderWidth: 2,
    borderColor: THEME.COLORS.textInverse,
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  lineCompleted: {
    backgroundColor: THEME.COLORS.primary,
  },
  linePending: {
    backgroundColor: THEME.COLORS.border,
  },
  rightColumn: {
    paddingTop: 4,
  },
  label: {
    fontSize: THEME.FONTS.sizes.body,
    fontWeight: THEME.FONTS.weights.medium,
  },
  labelCompleted: {
    color: THEME.COLORS.textPrimary,
  },
  labelPending: {
    color: THEME.COLORS.textTertiary,
  },
  labelActive: {
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.primary,
  },
  activeSubtitle: {
    fontSize: THEME.FONTS.sizes.micro,
    color: THEME.COLORS.primary,
    marginTop: 2,
  },
  dotDanger: {
    backgroundColor: THEME.COLORS.danger,
  },
  labelDanger: {
    color: THEME.COLORS.danger,
    fontWeight: THEME.FONTS.weights.bold,
  },
});

export default OrderStatusTimeline;

