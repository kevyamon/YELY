// src/components/marketplace/checkout/EditableField.jsx
// CHAMP EDITABLE SECURISE AVEC FOCUS DORE ET ACTION CRAYON
// STANDARD: Industriel / Bank Grade (Strict <= 325 lignes, Zero Emojis)

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import THEME from '../../../theme/theme';

export default function EditableField({
  label,
  icon,
  inputRef,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  isFocused,
  onFocus,
  onBlur,
  inputBg,
  inputBorder,
  textColor,
  placeholderColor,
  isDark,
}) {
  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelRow}>
        <View style={[styles.labelIconBg, { backgroundColor: isDark ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.12)' }]}>
          <Ionicons name={icon} size={16} color={THEME.COLORS.champagneGold} />
        </View>
        <Text style={[styles.fieldLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>{label}</Text>
      </View>

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: inputBg,
            borderColor: isFocused ? THEME.COLORS.champagneGold : inputBorder,
            borderWidth: isFocused ? 1.5 : 1,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: textColor }]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          underlineColorAndroid="transparent"
          cursorColor={THEME.COLORS.champagneGold}
          selectionColor={isDark ? 'rgba(212,175,55,0.35)' : 'rgba(212,175,55,0.25)'}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        <TouchableOpacity
          style={styles.pencilBtn}
          onPress={() => inputRef.current?.focus()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="pencil" size={16} color={THEME.COLORS.champagneGold} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: { width: '100%', marginBottom: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  labelIconBg: { width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  fieldLabel: { fontSize: 11.5, fontWeight: '600' },
  inputWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '600',
    height: '100%',
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginRight: 6,
    borderWidth: 0,
    outlineStyle: 'none',
  },
  pencilBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
});
