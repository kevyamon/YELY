// src/components/auth/PasswordStrengthInput.jsx
// COMPOSANT MODULAIRE - Saisie de mot de passe intelligente
// STANDARD: Industriel / Bank Grade (UX Optimisée)

import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import THEME from '../../theme/theme';
import GlassInput from '../ui/GlassInput';

const PasswordStrengthInput = ({ password, setPassword, onStrengthChange }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [stats, setStats] = useState({
    length: false, number: false, special: false, score: 0
  });

  useEffect(() => {
    // CORRECTION : On passe a 3 regles claires
    const s = {
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)
    };
    const validCount = Object.values(s).filter(Boolean).length;
    const currentStats = { ...s, score: validCount / 3 }; // Divise par 3 criteres
    
    setStats(currentStats);
    if (onStrengthChange) onStrengthChange(currentStats.score);
  }, [password]);

  const generateSecurePassword = async () => {
    const length = 12; // Un mot de passe genere automatiquement reste un peu plus long par securite
    const lowers = "abcdefghijklmnopqrstuvwxyz";
    const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{};:,.<>/?";
    const allChars = lowers + uppers + numbers + symbols;

    const getSecureChar = async (charset) => {
      const randomByte = await Crypto.getRandomBytesAsync(1);
      return charset[randomByte[0] % charset.length];
    };

    let generated = [
      await getSecureChar(lowers),
      await getSecureChar(numbers),
      await getSecureChar(symbols)
    ];

    const remainingBytes = await Crypto.getRandomBytesAsync(length - 3);
    for (let i = 0; i < length - 3; i++) {
      generated.push(allChars[remainingBytes[i] % allChars.length]);
    }

    // Melange aleatoire
    for (let i = generated.length - 1; i > 0; i--) {
      const randomByte = await Crypto.getRandomBytesAsync(1);
      const j = randomByte[0] % (i + 1);
      [generated[i], generated[j]] = [generated[j], generated[i]];
    }

    setPassword(generated.join(''));
    setShowPassword(true); // On affiche le mot de passe pour que l'utilisateur le voie
  };

  const getProgressColor = (score) => {
    if (score === 1) return THEME.COLORS.success;
    if (score > 0.6) return THEME.COLORS.warning;
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
        />
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.iconBtn} 
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons 
              name={showPassword ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color={THEME.COLORS.textTertiary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* NOUVEAU BOUTON : Visible, explicite et design */}
      <TouchableOpacity 
        style={styles.generateBtn} 
        onPress={generateSecurePassword}
        activeOpacity={0.8}
      >
        <Ionicons name="sparkles" size={16} color={THEME.COLORS.background} />
        <Text style={styles.generateBtnText}>Generer un mot de passe fort</Text>
      </TouchableOpacity>

      {password.length > 0 && (
        <View style={styles.gaugeContainer}>
          <ProgressBar 
            progress={stats.score} 
            color={getProgressColor(stats.score)} 
            style={styles.progressBar} 
          />
          <View style={styles.requirementsBox}>
            <PasswordRequirement met={stats.length} text="8 car. min." />
            <PasswordRequirement met={stats.number} text="1 Chiffre" />
            <PasswordRequirement met={stats.special} text="1 Symbole" />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: THEME.SPACING.md },
  inputWrapper: { position: 'relative', justifyContent: 'center' },
  actionButtons: { 
    position: 'absolute', 
    right: THEME.SPACING.md, 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  iconBtn: { padding: 4 },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.champagneGold,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 4,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  generateBtnText: {
    color: THEME.COLORS.background,
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 6,
  },
  gaugeContainer: { marginTop: THEME.SPACING.sm, paddingHorizontal: 4 },
  progressBar: { borderRadius: THEME.BORDERS.radius.sm, height: 4, backgroundColor: THEME.COLORS.overlay },
  requirementsBox: { flexDirection: 'row', flexWrap: 'wrap', marginTop: THEME.SPACING.sm, gap: THEME.SPACING.sm },
  reqRow: { flexDirection: 'row', alignItems: 'center', marginRight: THEME.SPACING.xs },
  reqText: { fontSize: THEME.FONTS.sizes.caption, marginLeft: THEME.SPACING.xs },
});

export default PasswordStrengthInput;