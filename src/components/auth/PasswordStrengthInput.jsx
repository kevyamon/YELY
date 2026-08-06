// src/components/auth/PasswordStrengthInput.jsx
// CHAMP MOT DE PASSE MINIMALISTE - Zero Icone Etoile / Epure VIP
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import THEME from '../../theme/theme';
import GlassInput from '../ui/GlassInput';

const PasswordStrengthInput = ({ password, setPassword, onStrengthChange }) => {
  const [stats, setStats] = useState({
    length: false, number: false, special: false, score: 0
  });

  useEffect(() => {
    const s = {
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    const validCount = Object.values(s).filter(Boolean).length;
    const currentStats = { ...s, score: validCount / 3 };
    
    setStats(currentStats);
    if (onStrengthChange) onStrengthChange(currentStats.score);
  }, [password]);

  const generateSecurePassword = async () => {
    const length = 12;
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
      await getSecureChar(uppers),
      await getSecureChar(numbers),
      await getSecureChar(symbols)
    ];

    const remainingBytes = await Crypto.getRandomBytesAsync(length - 4);
    for (let i = 0; i < length - 4; i++) {
      generated.push(allChars[remainingBytes[i] % allChars.length]);
    }

    for (let i = generated.length - 1; i > 0; i--) {
      const randomByte = await Crypto.getRandomBytesAsync(1);
      const j = randomByte[0] % (i + 1);
      [generated[i], generated[j]] = [generated[j], generated[i]];
    }

    setPassword(generated.join(''));
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
        size={12} 
        color={met ? THEME.COLORS.success : THEME.COLORS.textTertiary} 
      />
      <Text style={[styles.reqText, { color: met ? THEME.COLORS.success : THEME.COLORS.textTertiary }]}>
        {text}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <GlassInput
        icon="lock-closed-outline"
        placeholder="Mot de passe"
        secureTextEntry={true}
        value={password}
        onChangeText={setPassword}
      />
      
      <TouchableOpacity 
        style={styles.generateBtn} 
        onPress={generateSecurePassword}
        activeOpacity={0.7}
      >
        <Ionicons name="key-outline" size={13} color={THEME.COLORS.primary} />
        <Text style={styles.generateText}>Générer un mot de passe fort</Text>
      </TouchableOpacity>

      {password.length > 0 && (
        <View style={styles.gaugeContainer}>
          <ProgressBar 
            progress={stats.score} 
            color={getProgressColor(stats.score)} 
            style={styles.progressBar} 
          />
          <View style={styles.requirementsBox}>
            <PasswordRequirement met={stats.length} text="8 caractères min." />
            <PasswordRequirement met={stats.number} text="1 chiffre" />
            <PasswordRequirement met={stats.special} text="1 symbole" />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    marginBottom: THEME.SPACING.xs 
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 4,
    alignSelf: 'flex-start',
  },
  generateText: {
    color: THEME.COLORS.primary,
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '600',
  },
  gaugeContainer: { 
    marginTop: THEME.SPACING.sm, 
    paddingHorizontal: 4 
  },
  progressBar: { 
    borderRadius: 2, 
    height: 3, 
    backgroundColor: 'rgba(255, 255, 255, 0.08)' 
  },
  requirementsBox: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginTop: 6, 
  },
  reqRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginRight: 12,
    marginBottom: 4,
  },
  reqText: { 
    fontSize: 11, 
    marginLeft: 4,
    fontWeight: '500' 
  },
});

export default PasswordStrengthInput;