// src/components/marketplace/checkout/CheckoutStepper.jsx
// COMPOSANT STEPPER - Progression 3 étapes du Checkout
// STANDARD: Industriel / Bank Grade

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../../theme/theme';

/**
 * @param {Object} props
 * @param {number} props.currentStep - 1 (Livraison), 2 (Paiement), 3 (Confirmation)
 * @param {() => void} props.onBack - Action retour
 */
export default function CheckoutStepper({ currentStep = 1, onBack }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const steps = [
    { id: 1, label: 'Livraison' },
    { id: 2, label: 'Paiement' },
    { id: 3, label: 'Confirmation' },
  ];

  return (
    <View style={styles.headerContainer}>
      {/* Bouton Retour */}
      <TouchableOpacity 
        style={[
          styles.backBtn, 
          { 
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'
          }
        ]} 
        onPress={onBack}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={20} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
      </TouchableOpacity>

      {/* Titre Validation */}
      <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
        Validation
      </Text>

      {/* Stepper avec indicateurs */}
      <View style={styles.stepperWrapper}>
        <View style={styles.stepperLineBg}>
          <View 
            style={[
              styles.stepperLineProgress, 
              { 
                width: currentStep === 1 ? '15%' : currentStep === 2 ? '50%' : '100%',
                backgroundColor: THEME.COLORS.champagneGold 
              }
            ]} 
          />
        </View>

        <View style={styles.stepsRow}>
          {steps.map((step) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;

            return (
              <View key={step.id} style={styles.stepItem}>
                <View 
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor: isActive || isCompleted ? THEME.COLORS.champagneGold : (isDark ? '#333333' : '#E0E0E0'),
                      borderColor: isActive ? (isDark ? '#000000' : '#FFFFFF') : 'transparent',
                    }
                  ]}
                >
                  {isCompleted && (
                    <Ionicons name="checkmark" size={10} color="#000000" />
                  )}
                </View>
                <Text 
                  style={[
                    styles.stepLabel,
                    {
                      color: isActive 
                        ? (isDark ? '#FFFFFF' : '#1A1A1A') 
                        : (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'),
                      fontWeight: isActive ? '700' : '500',
                    }
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: -32,
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  stepperWrapper: {
    position: 'relative',
    marginTop: 6,
    paddingHorizontal: 12,
  },
  stepperLineBg: {
    position: 'absolute',
    top: 5,
    left: 28,
    right: 28,
    height: 2,
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
    borderRadius: 1,
  },
  stepperLineProgress: {
    height: 2,
    borderRadius: 1,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepLabel: {
    fontSize: 12,
    letterSpacing: 0.1,
  },
});
