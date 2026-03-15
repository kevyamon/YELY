// src/components/auth/PasswordStrengthInput.jsx
// COMPOSANT MODULAIRE - Saisie de mot de passe intelligente
// STANDARD: Industriel / Bank Grade (Expo Crypto + UI Contextuelle)

import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import THEME from '../../theme/theme';
import GlassInput from '../ui/GlassInput';

const PasswordStrengthInput = ({ password, setPassword, onStrengthChange }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [stats, setStats] = useState({
    length: false, upper: false, number: false, special: false, score: 0
  });

  useEffect(() => {
    const s = {
      length: password.length >= 12, // Alignement strict avec le backend
      upper: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)
    };
    const validCount = Object.values(s).filter(Boolean).length;
    const currentStats = { ...s, score: validCount / 4 };
    
    setStats(currentStats);
    if (onStrengthChange) onStrengthChange(currentStats.score);
  }, [password]);

  const generateSecurePassword = async () => {
    const length = 16;
    const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowers = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{};:,.<>/?";
    const allChars = uppers + lowers + numbers + symbols;

    // Fonction d'extraction securisee via l'entropie materielle
    const getSecureChar = async (charset) => {
      const randomByte = await Crypto.getRandomBytesAsync(1);
      return charset[randomByte[0] % charset.length];
    };

    // Garantie absolue de la presence des criteres obligatoires
    let generated = [
      await getSecureChar(uppers),
      await getSecureChar(lowers),
      await getSecureChar(numbers),
      await getSecureChar(symbols)
    ];

    // Remplissage du reste du mot de passe
    const remainingBytes = await Crypto.getRandomBytesAsync(length - 4);
    for (let i = 0; i < length - 4; i++) {
      generated.push(allChars[remainingBytes[i] % allChars.length]);
    }

    // Melange cryptographique (Fisher-Yates)
    for (let i = generated.length - 1; i > 0; i--) {
      const randomByte = await Crypto.getRandomBytesAsync(1);
      const j = randomByte[0] % (i + 1);
      [generated[i], generated[j]] = [generated[j], generated[i]];
    }

    setPassword(generated.join(''));
    setShowPassword(true);
    setIsFocused(false); 
  };

  const handleBlur = () => {
    // Delai pour permettre de cliquer sur le bouton de suggestion avant sa disparition
    setTimeout(() => {
      setIsFocused(false);
    }, 200);
  };

  const getProgressColor = (score) => {
    if (score === 1) return THEME.COLORS.success;
    if (score > 0.5) return THEME.COLORS.warning;
    return THEME.COLORS.danger;
  };

  const PasswordRequirement = ({ met, text }) => (
    <View style={styles.reqRow}>
      <Ionicons 
        name={met ? "checkmark-circle" : "ellipse-outline"} 
        size={14} 
        color={met ? THEME.COLORS.success : THEME.COLORS.textTertiary} 
      />
      <Text style={[styles.reqText, { color: met ? THEME.COLORS.success : THEME.COLORS.textTertiary }]}>
        {text}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <GlassInput
          icon="lock-closed-outline"
          placeholder="Mot de passe"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
        />
        <TouchableOpacity 
          style={styles.eyeIcon} 
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons 
            name={showPassword ? "eye-off-outline" : "eye-outline"} 
            size={20} 
            color={THEME.COLORS.textTertiary} 
          />
        </TouchableOpacity>

        {/* Mini-Modale de suggestion intelligente */}
        {isFocused && password.length === 0 && (
          <View style={styles.suggestionPopover}>
            <Text style={styles.suggestionTitle}>Bloque par l'inspiration ?</Text>
            <TouchableOpacity style={styles.suggestBtn} onPress={generateSecurePassword}>
              <Ionicons name="sparkles" size={16} color={THEME.COLORS.primary} />
              <Text style={styles.suggestText}>Generer un mot de passe ultra-securise</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {password.length > 0 && (
        <View style={styles.gaugeContainer}>
          <ProgressBar 
            progress={stats.score} 
            color={getProgressColor(stats.score)} 
            style={styles.progressBar} 
          />
          <View style={styles.requirementsBox}>
            <PasswordRequirement met={stats.length} text="12 caracteres min." />
            <PasswordRequirement met={stats.upper} text="1 Majuscule" />
            <PasswordRequirement met={stats.number} text="1 Chiffre" />
            <PasswordRequirement met={stats.special} text="1 Symbole" />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    marginBottom: THEME.SPACING.lg 
  },
  inputWrapper: { 
    position: 'relative',
    zIndex: 10
  },
  eyeIcon: { 
    position: 'absolute', 
    right: THEME.SPACING.lg, 
    top: THEME.SPACING.lg 
  },
  suggestionPopover: {
    position: 'absolute',
    top: THEME.DIMENSIONS.input.height + 5,
    left: 0,
    right: 0,
    backgroundColor: THEME.COLORS.glassModal,
    borderRadius: THEME.BORDERS.radius.lg,
    padding: THEME.SPACING.md,
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.border,
    ...THEME.SHADOWS.medium,
    zIndex: 20,
  },
  suggestionTitle: {
    color: THEME.COLORS.textSecondary,
    fontSize: THEME.FONTS.sizes.caption,
    marginBottom: THEME.SPACING.sm,
    textAlign: 'center'
  },
  suggestBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: THEME.SPACING.sm,
    backgroundColor: THEME.COLORS.overlay,
    borderRadius: THEME.BORDERS.radius.sm,
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.primary,
  },
  suggestText: { 
    color: THEME.COLORS.primary, 
    fontSize: THEME.FONTS.sizes.bodySmall, 
    fontWeight: THEME.FONTS.weights.bold, 
    marginLeft: THEME.SPACING.sm,
  },
  gaugeContainer: { 
    marginTop: THEME.SPACING.sm 
  },
  progressBar: { 
    borderRadius: THEME.BORDERS.radius.sm, 
    height: 6, 
    backgroundColor: THEME.COLORS.overlay 
  },
  requirementsBox: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginTop: THEME.SPACING.sm, 
    gap: THEME.SPACING.sm 
  },
  reqRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginRight: THEME.SPACING.xs 
  },
  reqText: { 
    fontSize: THEME.FONTS.sizes.caption, 
    marginLeft: THEME.SPACING.xs 
  },
});

export default PasswordStrengthInput;