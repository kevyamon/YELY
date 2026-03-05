// src/components/auth/PhoneInputGroup.jsx
// COMPOSANT MODULAIRE - Saisie Téléphonique avec Sélecteur de Pays
// STANDARD: Industriel / Bank Grade

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import THEME from '../../theme/theme';
import GlassInput from '../ui/GlassInput';

const PhoneInputGroup = ({ 
  phone, 
  setPhone, 
  countryCode, 
  setCountryCode, 
  callingCode, 
  setCallingCode 
}) => {
  return (
    <View style={styles.phoneRow}>
      <View style={styles.countryPickerContainer}>
        <CountryPicker
          countryCode={countryCode}
          withFilter 
          withFlag 
          withCallingCode
          onSelect={(c) => { 
            setCountryCode(c.cca2); 
            setCallingCode(c.callingCode[0]); 
          }}
        />
        <Text style={styles.callingCodeText}>+{callingCode}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <GlassInput
          icon="call-outline"
          placeholder="Téléphone"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  phoneRow: { 
    flexDirection: 'row', 
    gap: 8, 
    alignItems: 'flex-start',
    marginBottom: 5
  },
  countryPickerContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: THEME.COLORS.glassLight, 
    paddingHorizontal: 10, 
    borderRadius: 12, 
    height: 52, 
    borderWidth: 1, 
    borderColor: THEME.COLORS.glassBorder 
  },
  callingCodeText: { 
    color: THEME.COLORS.champagneGold, 
    marginLeft: 5, 
    fontWeight: 'bold' 
  },
});

export default PhoneInputGroup;