// src/components/profile/ProfileForm.jsx
// COMPOSANT MODULAIRE - Formulaire Utilisateur (UX Indicatif Amelioree)
// CSCSM Level: Bank Grade

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import THEME from '../../theme/theme';
import GlassCard from '../ui/GlassCard';
import GlassInput from '../ui/GlassInput';

const COUNTRY_CODE = '+225';

const ProfileForm = ({ form, setForm, isDriver }) => {
  return (
    <>
      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>Informations Personnelles</Text>
        
        <Text style={styles.label}>Nom complet</Text>
        <GlassInput 
          value={form.name}
          onChangeText={(txt) => setForm({...form, name: txt})}
          placeholder="Votre nom"
        />

        {/* NOUVELLE UX POUR LE TÉLÉPHONE : Propre et native */}
        <View style={styles.phoneLabelContainer}>
          <Text style={styles.label}>Téléphone</Text>
          <View style={styles.countryBadge}>
            <Text style={styles.countryBadgeText}>{COUNTRY_CODE}</Text>
          </View>
        </View>
        <GlassInput 
          value={form.phone}
          onChangeText={(txt) => setForm({...form, phone: txt})}
          placeholder="Ex: 01 02 03 04 05"
          keyboardType="phone-pad"
          maxLength={14} // Autorise les espaces
        />
      </GlassCard>

      {isDriver && (
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Véhicule</Text>
          
          <Text style={styles.label}>Modèle</Text>
          <GlassInput 
            value={form.vehicleModel}
            onChangeText={(txt) => setForm({...form, vehicleModel: txt})}
            placeholder="Ex: Toyota Corolla"
          />

          <Text style={styles.label}>Plaque d'immatriculation</Text>
          <GlassInput 
            value={form.vehiclePlate}
            onChangeText={(txt) => setForm({...form, vehiclePlate: txt})}
            placeholder="Ex: 1234 AB 01"
            autoCapitalize="characters"
          />
        </GlassCard>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  card: { padding: 20, marginBottom: 20 },
  sectionTitle: { color: THEME.COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  label: { color: THEME.COLORS.textSecondary, fontSize: 12, marginBottom: 5, marginLeft: 5 },
  
  phoneLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    marginLeft: 5,
  },
  countryBadge: {
    backgroundColor: THEME.COLORS.overlay,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  countryBadgeText: {
    color: THEME.COLORS.textPrimary,
    fontSize: 10,
    fontWeight: 'bold',
  }
});

export default ProfileForm;