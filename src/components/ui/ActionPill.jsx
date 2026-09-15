// src/components/ui/ActionPill.jsx
// COMPOSANT RÉUTILISABLE - Bouton d'action "Pilule" (Taxi / Boutique / Annuler)
// CSCSM Level: Bank Grade (Strictement modulaire < 325 lignes, Sans Emojis)

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import THEME from '../../theme/theme';

const TYPE_CONFIGS = {
  taxi: {
    text: 'Taxi',
    icon: 'car-sport',
    mode: 'primary',
  },
  shopping: {
    text: 'Boutique',
    icon: 'cart',
    mode: 'primary',
  },
  cancel_destination: {
    text: 'Annuler',
    icon: 'close-circle',
    mode: 'cancel',
  },
};

const ActionPill = ({ 
  mode, 
  onPress, 
  text, 
  icon, 
  type, 
  disabled = false,
  activeRideStatus 
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: scale.value }] };
  });

  const config = (type && TYPE_CONFIGS[type]) || {};
  const resolvedMode = mode || config.mode || 'primary';
  const resolvedText = text || config.text || '';
  const resolvedIcon = icon || config.icon || null;
  const isCancel = resolvedMode === 'cancel';

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable
        style={[
          styles.button, 
          isCancel ? styles.buttonCancel : styles.buttonPrimary,
          disabled && styles.buttonDisabled
        ]}
        onPressIn={() => {
          if (!disabled) scale.value = withSpring(0.94);
        }}
        onPressOut={() => {
          if (!disabled) scale.value = withSpring(1);
        }}
        onPress={onPress}
        disabled={disabled}
      >
        {resolvedIcon && (
          <Ionicons 
            name={resolvedIcon} 
            size={isCancel ? 18 : 20} 
            color={isCancel ? THEME.COLORS.danger : '#121418'} 
          />
        )}
        {resolvedText ? (
          <Text 
            style={[
              styles.text, 
              isCancel ? styles.textCancel : styles.textPrimary
            ]}
            numberOfLines={1}
          >
            {resolvedText}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'stretch',
    marginTop: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    width: '100%',
    height: 44,
    paddingHorizontal: 12,
  },
  buttonPrimary: {
    backgroundColor: THEME.COLORS.champagneGold,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonCancel: {
    backgroundColor: 'rgba(231, 76, 60, 0.12)',
    borderColor: THEME.COLORS.danger,
    borderWidth: 1.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonDisabled: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  text: {
    marginLeft: 8,
    letterSpacing: 0.4,
  },
  textPrimary: {
    color: '#121418',
    fontSize: 14,
    fontWeight: '800',
  },
  textCancel: {
    color: THEME.COLORS.danger,
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ActionPill;