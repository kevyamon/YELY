// src/components/subscription/ProofUploadForm.jsx
// FORMULAIRE DE PREUVE - Standard Industriel
// Message court et fonctionnel pour la confirmation de paiement.

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';
import GlassInput from '../ui/GlassInput';
import GoldButton from '../ui/GoldButton';

const ProofUploadForm = ({ onSubmit, isLoading, planLabel }) => {
  const [phone, setPhone] = useState('');
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert("Permission d'accès aux photos requise.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleSend = () => {
    if (!phone || !image) return;
    onSubmit({ senderPhone: phone, image });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirmation du paiement</Text>
      <Text style={styles.subtitle}>
        Forfait choisi : <Text style={styles.highlight}>{planLabel}</Text>
      </Text>

      <Text style={styles.instruction}>
        Saisissez le numéro utilisé pour le dépôt et joignez la capture d'écran.
      </Text>

      <View style={styles.form}>
        <GlassInput
          label="Numéro du dépôt"
          placeholder="07 00 00 00 00"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          icon="phone-portrait-outline"
        />

        <TouchableOpacity 
          style={[styles.uploadZone, image && styles.uploadZoneActive]} 
          onPress={pickImage}
          activeOpacity={0.7}
        >
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="cloud-upload-outline" size={40} color={THEME.COLORS.textSecondary} />
              <Text style={styles.placeholderText}>Sélectionner la capture</Text>
            </View>
          )}
        </TouchableOpacity>

        <GoldButton
          title="Envoyer ma capture"
          onPress={handleSend}
          loading={isLoading}
          disabled={!phone || !image}
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: THEME.SPACING.lg },
  title: { fontSize: 22, fontWeight: 'bold', color: THEME.COLORS.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 16, color: THEME.COLORS.textSecondary, textAlign: 'center', marginTop: 8 },
  highlight: { color: THEME.COLORS.champagneGold, fontWeight: 'bold' },
  instruction: { fontSize: 14, color: THEME.COLORS.textTertiary, textAlign: 'center', marginTop: 16, marginBottom: 24 },
  form: { gap: 20 },
  uploadZone: {
    height: 180,
    borderRadius: THEME.BORDERS.radius.xl,
    borderWidth: 2,
    borderColor: THEME.COLORS.glassBorder,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.overlay,
    overflow: 'hidden'
  },
  uploadZoneActive: { borderStyle: 'solid', borderColor: THEME.COLORS.champagneGold },
  previewImage: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center' },
  placeholderText: { color: THEME.COLORS.textSecondary, marginTop: 8, fontSize: 14 },
  button: { marginTop: 10 }
});

export default ProofUploadForm;