// src/components/marketplace/checkout/DeliveryStep.jsx
// ETAPE 1 - Details de Livraison & Coordonnees Client
// STANDARD: Industriel / Bank Grade (Strict <= 325 lignes, Zero Emojis)

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import THEME from '../../../theme/theme';
import EditableField from './EditableField';

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
  const nameInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [focusedField, setFocusedField] = useState(null);

  const cardBg = isDark ? '#141414' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB';
  const inputBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const placeholderColor = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.4)';
  const noteCardBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#FAFAFA';

  return (
    <View style={styles.container}>
      {/* En-tete avec titre et badge 3D location */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={[styles.title, { color: textColor }]}>Détails de livraison</Text>
          <Text style={[styles.subtitle, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
            Vérifiez vos informations pour une livraison sans souci.
          </Text>
        </View>

        <Image
          source={require('../../../../assets/images/location3D.png')}
          style={{ width: 76, height: 76 }}
          resizeMode="contain"
        />
      </View>

      {/* Champs d'information client */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        {/* Nom complet */}
        <EditableField
          label="Nom complet"
          icon="person-outline"
          inputRef={nameInputRef}
          value={name}
          onChangeText={setName}
          placeholder="Votre nom"
          isFocused={focusedField === 'name'}
          onFocus={() => setFocusedField('name')}
          onBlur={() => setFocusedField(null)}
          inputBg={inputBg}
          inputBorder={inputBorder}
          textColor={textColor}
          placeholderColor={placeholderColor}
          isDark={isDark}
        />

        {/* Telephone */}
        <EditableField
          label="Téléphone"
          icon="call-outline"
          inputRef={phoneInputRef}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+225 00 00 00 00 00"
          isFocused={focusedField === 'phone'}
          onFocus={() => setFocusedField('phone')}
          onBlur={() => setFocusedField(null)}
          inputBg={inputBg}
          inputBorder={inputBorder}
          textColor={textColor}
          placeholderColor={placeholderColor}
          isDark={isDark}
        />

        {/* Selecteur Mode de livraison */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <View style={[styles.labelIconBg, { backgroundColor: isDark ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.12)' }]}>
              <MaterialCommunityIcons name="bicycle" size={16} color={THEME.COLORS.champagneGold} />
            </View>
            <Text style={[styles.fieldLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>Mode de livraison</Text>
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
              <Ionicons name="locate" size={16} color={deliveryMode === 'current' ? '#000000' : (isDark ? '#AAA' : '#666')} style={{ marginRight: 6 }} />
              <Text style={[styles.toggleTabText, { color: deliveryMode === 'current' ? '#000000' : (isDark ? '#AAA' : '#666') }]}>Ma position</Text>
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
              <Ionicons name="map" size={16} color={deliveryMode === 'other' ? '#000000' : (isDark ? '#AAA' : '#666')} style={{ marginRight: 6 }} />
              <Text style={[styles.toggleTabText, { color: deliveryMode === 'other' ? '#000000' : (isDark ? '#AAA' : '#666') }]}>Ailleurs</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Carte Position selectionnee */}
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

        {/* Note au vendeur */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <View style={[styles.labelIconBg, { backgroundColor: isDark ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.12)' }]}>
              <Ionicons name="chatbubble-outline" size={15} color={THEME.COLORS.champagneGold} />
            </View>
            <Text style={[styles.fieldLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>Note (optionnel)</Text>
          </View>
          <View
            style={[
              styles.noteWrapper,
              {
                backgroundColor: noteCardBg,
                borderColor: focusedField === 'note' ? THEME.COLORS.champagneGold : inputBorder,
                borderWidth: focusedField === 'note' ? 1.5 : 1,
              },
            ]}
          >
            <TextInput
              style={[styles.noteInput, { color: textColor }]}
              value={note}
              onChangeText={(text) => text.length <= 120 && setNote(text)}
              placeholder="Ajoutez une instruction pour le vendeur..."
              placeholderTextColor={placeholderColor}
              multiline
              maxLength={120}
              underlineColorAndroid="transparent"
              cursorColor={THEME.COLORS.champagneGold}
              selectionColor={isDark ? 'rgba(212,175,55,0.35)' : 'rgba(212,175,55,0.25)'}
              onFocus={() => setFocusedField('note')}
              onBlur={() => setFocusedField(null)}
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
  container: { width: '100%', paddingHorizontal: 20, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerTextGroup: { flex: 1, paddingRight: 14 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: 0.2, marginBottom: 4 },
  subtitle: { fontSize: 13, lineHeight: 18 },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    marginBottom: 24,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  inputGroup: { width: '100%', marginBottom: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  labelIconBg: { width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  fieldLabel: { fontSize: 11.5, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleTab: { flex: 1, flexDirection: 'row', height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  toggleTabText: { fontSize: 13, fontWeight: '700' },
  locationCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 16 },
  locationHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  locationCardTitle: { fontSize: 12, fontWeight: '700' },
  locationBodyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locationAddressText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18, marginRight: 10 },
  locateActionBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },
  noteWrapper: { width: '100%', borderRadius: 14, padding: 12, minHeight: 80, justifyContent: 'space-between', overflow: 'hidden' },
  noteInput: { fontSize: 13, fontWeight: '500', minHeight: 46, textAlignVertical: 'top', borderWidth: 0, outlineStyle: 'none', padding: 0 },
  charCounter: { alignSelf: 'flex-end', fontSize: 10.5, fontWeight: '600' },
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
  nextBtnText: { fontSize: 16, fontWeight: '800', color: '#000000', marginRight: 10 },
  nextArrowCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0, 0, 0, 0.1)', justifyContent: 'center', alignItems: 'center' },
});
