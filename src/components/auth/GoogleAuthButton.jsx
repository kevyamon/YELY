// src/components/auth/GoogleAuthButton.jsx
// COMPOSANT BOUTON AUTHENTIFICATION GOOGLE NATIVE
// STANDARD: Industriel / Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';

const GoogleAuthButton = ({
  onPress,
  loading = false,
  disabled = false,
  title = "Continuer avec Google",
  style
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        (disabled || loading) && styles.disabledButton,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={THEME.COLORS.textPrimary || '#FFFFFF'} />
      ) : (
        <View style={styles.contentContainer}>
          <Ionicons
            name="logo-google"
            size={20}
            color={THEME.COLORS.textPrimary || '#FFFFFF'}
            style={styles.icon}
          />
          <Text style={styles.buttonText}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: THEME.BORDERS?.radius?.pill || 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.SPACING?.lg || 20,
    width: '100%',
    marginVertical: THEME.SPACING?.xs || 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: THEME.SPACING?.sm || 10,
  },
  buttonText: {
    color: THEME.COLORS?.textPrimary || '#FFFFFF',
    fontSize: THEME.FONTS?.sizes?.body || 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default GoogleAuthButton;
