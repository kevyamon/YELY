// src/components/subscription/ProofUploadForm.jsx
// COMPOSANT OBSOLETE - Remplacé par l'automatisation de paiement GeniusPay
// STANDARD: Clean Architecture / Code Propre (Sans Emojis)

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import THEME from '../../theme/theme';

const ProofUploadForm = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Ce composant a ete remplace par la passerelle de paiement en direct.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    color: THEME.COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center'
  }
});

export default ProofUploadForm;