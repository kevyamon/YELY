// src/components/marketplace/checkout/DeliveryStep.jsx
// ÉTAPE 1 - Détails de Livraison & Coordonnées Client
// STANDARD: Industriel / Bank Grade

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import THEME from '../../../theme/theme';

export default function DeliveryStep({
  name,
  setName,
  phone,
  setPhone,
  deliveryMode,
  setDeliveryMode,
  address,
  setAddress,
  note,
  setNote,
  isLocating,
  onLocatePress,
  onSelectOtherAddress,
  onNext,
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const cardBg = isDark ? '#141414' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB';
  const inputBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const placeholderColor = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.4)';
  const noteCardBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#FAFAFA';

  return (
    <View style={styles.container}>
      {/* En-tête avec titre et badge 3D */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={[styles.title, { color: textColor }]}>
            Détails de livraison
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
            Vérifiez vos informations pour une livraison sans souci.
          </Text>
        </View>

        <View style={[styles.badge3DContainer, { backgroundColor: isDark ? 'rgba(212,175,55,0.12)' : 'rgba(212,175,55,0.14)' }]}>
          <MaterialCommunityIcons name="map-marker-radius" size={28} color={THEME.COLORS.champagneGold} />
          <View style={styles.parcelIconOverlay}>
            <Ionicons name="cube" size={14} color="#000000" />
          </View>
        </View>
      </View>

      {/* Champs d'information client */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        {/* Nom complet */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <View style={[styles.labelIconBg, { backgroundColor: isDark ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.12)' }]}>
              <Ionicons name="person-outline" size={16} color={THEME.COLORS.champagneGold} />
            </View>
            <Text style={[styles.fieldLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
              Nom complet
            </Text>
          </View>
          <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: inputBorder }]}>
            <TextInput
              style={[styles.input, { color: textColor }]}
              value={name}
              onChangeText={setName}
              placeholder="Votre nom"
              placeholderTextColor={placeholderColor}
            />
            <Ionicons name="pencil-outline" size={16} color={THEME.COLORS.champagneGold} />
          </View>
        </View>

        {/* Téléphone */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <View style={[styles.labelIconBg, { backgroundColor: isDark ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.12)' }]}>
              <Ionicons name="call-outline" size={16} color={THEME.COLORS.champagneGold} />
            </View>
            <Text style={[styles.fieldLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
              Téléphone
            </Text>
          </View>
          <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: inputBorder }]}>
            <TextInput
              style={[styles.input, { color: textColor }]}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+225 00 00 00 00 00"
              placeholderTextColor={placeholderColor}
            />
            <Ionicons name="pencil-outline" size={16} color={THEME.COLORS.champagneGold} />
          </View>
        </View>

        {/* Sélecteur Mode de livraison */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <View style={[styles.labelIconBg, { backgroundColor: isDark ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.12)' }]}>
              <MaterialCommunityIcons name="bicycle" size={16} color={THEME.COLORS.champagneGold} />
            </View>
            <Text style={[styles.fieldLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
              Mode de livraison
            </Text>
          </View>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleTab,
                deliveryMode === 'current'
                  ? { backgroundColor: THEME.COLORS.champagneGold }
                  : { backgroundColor: inputBg, borderColor: inputBorder, borderWidth: 1 },
              ]}
              onPress={() => setDeliveryMode('current')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="locate"
                size={16}
                color={deliveryMode === 'current' ? '#000000' : (isDark ? '#AAAAAA' : '#666666')}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.toggleTabText,
                  { color: deliveryMode === 'current' ? '#000000' : (isDark ? '#AAAAAA' : '#666666') },
                ]}
              >
                Ma position
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleTab,
                deliveryMode === 'other'
                  ? { backgroundColor: THEME.COLORS.champagneGold }
                  : { backgroundColor: inputBg, borderColor: inputBorder, borderWidth: 1 },
              ]}
              onPress={onSelectOtherAddress}
              activeOpacity={0.8}
            >
              <Ionicons
                name="map"
                size={16}
                color={deliveryMode === 'other' ? '#000000' : (isDark ? '#AAAAAA' : '#666666')}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.toggleTabText,
                  { color: deliveryMode === 'other' ? '#000000' : (isDark ? '#AAAAAA' : '#666666') },
                ]}
              >
                Ailleurs
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Carte Position sélectionnée */}
        <View style={[styles.locationCard, { backgroundColor: isDark ? 'rgba(212,175,55,0.06)' : '#FFFDF5', borderColor: isDark ? 'rgba(212,175,55,0.3)' : '#F5E6BE' }]}>
          <View style={styles.locationHeaderRow}>
            <Ionicons name="location-sharp" size={16} color={THEME.COLORS.champagneGold} />
            <Text style={[styles.locationCardTitle, { color: THEME.COLORS.champagneGold }]}>
              {deliveryMode === 'current' ? 'Votre position actuelle' : 'Adresse de destination'}
            </Text>
          </View>

          <View style={styles.locationBodyRow}>
            <Text style={[styles.locationAddressText, { color: textColor }]} numberOfLines={2}>
              {address || 'Recherche de localisation GPS...'}
            </Text>

            {deliveryMode === 'current' && (
              <TouchableOpacity
                style={[styles.locateActionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF' }]}
                onPress={onLocatePress}
                disabled={isLocating}
                activeOpacity={0.75}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color={THEME.COLORS.champagneGold} />
                ) : (
                  <Ionicons name="locate" size={18} color={THEME.COLORS.champagneGold} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Note au vendeur avec contraste parfait */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <View style={[styles.labelIconBg, { backgroundColor: isDark ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.12)' }]}>
              <Ionicons name="chatbubble-outline" size={15} color={THEME.COLORS.champagneGold} />
            </View>
            <Text style={[styles.fieldLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
              Note (optionnel)
            </Text>
          </View>
          <View style={[styles.noteWrapper, { backgroundColor: noteCardBg, borderColor: inputBorder }]}>
            <TextInput
              style={[styles.noteInput, { color: textColor }]}
              value={note}
              onChangeText={(text) => text.length <= 120 && setNote(text)}
              placeholder="Ajoutez une instruction pour le vendeur..."
              placeholderTextColor={placeholderColor}
              multiline
              maxLength={120}
            />
            <Text style={[styles.charCounter, { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)' }]}>
              {note.length}/120
            </Text>
          </View>
        </View>
      </View>

      {/* Bouton Suivant */}
      <TouchableOpacity style={styles.nextBtn} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.nextBtnText}>Suivant</Text>
        <View style={styles.nextArrowCircle}>
          <Ionicons name="arrow-forward" size={16} color="#000000" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  badge3DContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  parcelIconOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: THEME.COLORS.champagneGold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelIconBg: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleTab: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  locationCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  locationCardTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  locationBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationAddressText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginRight: 10,
  },
  locateActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  noteWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    minHeight: 80,
    justifyContent: 'space-between',
  },
  noteInput: {
    fontSize: 13,
    fontWeight: '500',
    minHeight: 46,
    textAlignVertical: 'top',
  },
  charCounter: {
    alignSelf: 'flex-end',
    fontSize: 10.5,
    fontWeight: '600',
  },
  nextBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 16,
    backgroundColor: THEME.COLORS.champagneGold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    marginRight: 10,
  },
  nextArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
