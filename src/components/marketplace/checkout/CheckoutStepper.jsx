// src/components/marketplace/checkout/CheckoutStepper.jsx
// COMPOSANT STEPPER - Progression 3 étapes du Checkout
// STANDARD: Industriel / Bank Grade

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../../theme/theme';

/**
 * @param {Object} props
 * @param {number} props.currentStep - 1 (Livraison), 2 (Paiement), 3 (Confirmation)
 * @param {() => void} props.onBack - Action retour
 */
export default function CheckoutStepper({ currentStep = 1, onBack }) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const steps = [
    { id: 1, label: 'Livraison' },
    { id: 2, label: 'Paiement' },
    { id: 3, label: 'Confirmation' },
  ];

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top + (Platform.OS === 'android' ? 12 : 6), 24) }]}>
      {/* Barre supérieure avec bouton Retour et Titre centré */}
      <View style={styles.topNavRow}>
        <TouchableOpacity 
          style={[
            styles.backBtn, 
            { 
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'
            }
          ]} 
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={20} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
          Validation
        </Text>

        <View style={styles.backBtnPlaceholder} />
      </View>

      {/* Stepper avec ligne de progression épaissie */}
      <View style={styles.stepperWrapper}>
        <View style={[styles.stepperLineBg, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' }]}>
          <View 
            style={[
              styles.stepperLineProgress, 
              { 
                width: currentStep === 1 ? '16%' : currentStep === 2 ? '50%' : '100%',
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
                      backgroundColor: isActive || isCompleted ? THEME.COLORS.champagneGold : (isDark ? '#2A2A2A' : '#E5E7EB'),
                      borderColor: isActive ? (isDark ? '#000000' : '#FFFFFF') : 'transparent',
                    }
                  ]}
                >
                  {isCompleted && (
                    <Ionicons name="checkmark" size={10} color="#000000" />
                  )}
                  {isActive && !isCompleted && (
                    <View style={styles.activeDotInner} />
                  )}
                </View>
                <Text 
                  style={[
                    styles.stepLabel,
                    {
                      color: isActive 
                        ? (isDark ? '#FFFFFF' : '#1A1A1A') 
                        : (isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.4)'),
                      fontWeight: isActive ? '800' : '600',
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
    paddingBottom: 16,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  backBtnPlaceholder: {
    width: 42,
    height: 42,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  stepperWrapper: {
    position: 'relative',
    marginTop: 4,
    paddingHorizontal: 8,
  },
  stepperLineBg: {
    position: 'absolute',
    top: 7,
    left: 24,
    right: 24,
    height: 3.5,
    borderRadius: 2,
  },
  stepperLineProgress: {
    height: 3.5,
    borderRadius: 2,
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
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000000',
  },
  stepLabel: {
    fontSize: 12,
    letterSpacing: 0.1,
  },
});
