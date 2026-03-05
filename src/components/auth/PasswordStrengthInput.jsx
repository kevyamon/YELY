// src/components/auth/PasswordStrengthInput.jsx
// COMPOSANT MODULAIRE - Saisie de mot de passe intelligente
// STANDARD: Industriel / Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import THEME from '../../theme/theme';
import GlassInput from '../ui/GlassInput';

const PasswordStrengthInput = ({ password, setPassword, onStrengthChange }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [stats, setStats] = useState({
    length: false, upper: false, number: false, special: false, score: 0
  });

  const words = ['Soleil', 'Famille', 'Mafere', 'Espoir', 'Succes', 'Force', 'Paix', 'Beni', 'Abidjan', 'Avenir'];
  const symbols = ['!', '@', '#', '$', '*', '&'];

  useEffect(() => {
    const s = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)
    };
    const validCount = Object.values(s).filter(Boolean).length;
    const currentStats = { ...s, score: validCount / 4 };
    setStats(currentStats);
    if (onStrengthChange) onStrengthChange(currentStats.score);
  }, [password]);

  const suggestPassword = () => {
    const word = words[Math.floor(Math.random() * words.length)];
    const num = Math.floor(Math.random() * 90) + 10;
    const sym = symbols[Math.floor(Math.random() * symbols.length)];
    const suggestion = `${word}${num}${sym}`;
    setPassword(suggestion);
    setShowPassword(true);
  };

  const PasswordRequirement = ({ met, text }) => (
    <View style={styles.reqRow}>
      <Ionicons 
        name={met ? "checkmark-circle" : "ellipse-outline"} 
        size={14} 
        color={met ? "#10B981" : THEME.COLORS.textTertiary} 
      />
      <Text style={[styles.reqText, { color: met ? "#10B981" : THEME.COLORS.textTertiary }]}>
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
      </View>

      <TouchableOpacity style={styles.suggestBtn} onPress={suggestPassword}>
        <Ionicons name="sparkles" size={18} color={THEME.COLORS.champagneGold} />
        <Text style={styles.suggestText}>Générer un mot de passe sécurisé</Text>
      </TouchableOpacity>

      {password.length > 0 && (
        <View style={styles.gaugeContainer}>
          <ProgressBar 
            progress={stats.score} 
            color={stats.score === 1 ? "#10B981" : (stats.score > 0.5 ? "orange" : "red")} 
            style={styles.progressBar} 
          />
          <View style={styles.requirementsBox}>
            <PasswordRequirement met={stats.length} text="8 caractères min." />
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
  container: { marginBottom: 15 },
  inputWrapper: { position: 'relative' },
  eyeIcon: { position: 'absolute', right: 15, top: 15 },
  suggestBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 10, 
    marginBottom: 15,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: THEME.COLORS.glassLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.COLORS.champagneGold,
  },
  suggestText: { 
    color: THEME.COLORS.champagneGold, 
    fontSize: 13, 
    fontWeight: 'bold', 
    marginLeft: 10,
  },
  gaugeContainer: { marginTop: 5 },
  progressBar: { borderRadius: 5, height: 6, backgroundColor: 'rgba(255,255,255,0.1)' },
  requirementsBox: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 10 },
  reqRow: { flexDirection: 'row', alignItems: 'center', marginRight: 5 },
  reqText: { fontSize: 11, marginLeft: 4 },
});

export default PasswordStrengthInput;