// src/components/profile/ProfileForm.jsx
// FORMULAIRE PROFIL & SOUMISSION PIÈCES D'IDENTITÉ CHAUFFEUR
// CSCSM Level: Bank Grade / Conforme règle < 270 lignes

import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../ui/GlassCard';
import GlassInput from '../ui/GlassInput';
import THEME from '../../theme/theme';

const COUNTRY_CODE = '+225';
const TVS_IMAGE = 'https://res.cloudinary.com/dskdkrwhq/image/upload/v1782412187/dbfe2987-242f-4055-9e4d-2bff6b35adce.png';
const APSONIC_IMAGE = 'https://res.cloudinary.com/dskdkrwhq/image/upload/v1782412162/54ef1daa-dd2e-48ad-8046-261a4753da1c.png';

const ProfileForm = ({
  form,
  setForm,
  isDriver,
  isSeller,
  verificationStatus = 'none',
  rejectionReason = '',
  onPickFront,
  onPickBack,
  onSubmitVerification,
  isSubmittingVerification,
}) => {
  const isLocked = verificationStatus === 'approved' || verificationStatus === 'pending';

  const renderVerificationBanner = () => {
    switch (verificationStatus) {
      case 'approved':
        return (
          <View style={[styles.banner, styles.bannerApproved]}>
            <Ionicons name="shield-checkmark" size={20} color={THEME.COLORS.success} />
            <Text style={styles.bannerText}>Identité vérifiée et validée</Text>
          </View>
        );
      case 'pending':
        return (
          <View style={[styles.banner, styles.bannerPending]}>
            <Ionicons name="time" size={20} color={THEME.COLORS.champagneGold} />
            <Text style={[styles.bannerText, { color: THEME.COLORS.champagneGold }]}>
              Vérification en cours de traitement...
            </Text>
          </View>
        );
      case 'rejected':
        return (
          <View style={[styles.banner, styles.bannerRejected]}>
            <Ionicons name="alert-circle" size={20} color={THEME.COLORS.danger} />
            <View style={styles.flexOne}>
              <Text style={styles.bannerText}>Vérification rejetée</Text>
              {rejectionReason ? <Text style={styles.bannerSubtext}>Motif : {rejectionReason}</Text> : null}
            </View>
          </View>
        );
      default:
        return (
          <View style={[styles.banner, styles.bannerNone]}>
            <Ionicons name="help-circle" size={20} color={THEME.COLORS.primary} />
            <Text style={[styles.bannerText, { color: THEME.COLORS.textPrimary }]}>Identité non vérifiée</Text>
          </View>
        );
    }
  };

  return (
    <>
      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>Informations Personnelles</Text>
        <Text style={styles.label}>{isSeller ? 'Nom de la boutique' : 'Nom complet'}</Text>
        <GlassInput
          value={form.name}
          onChangeText={(txt) => setForm({ ...form, name: txt })}
          placeholder={isSeller ? 'Le nom de votre boutique' : 'Votre nom'}
        />

        <View style={styles.phoneLabelContainer}>
          <Text style={styles.label}>Téléphone</Text>
          <View style={styles.countryBadge}>
            <Text style={styles.countryBadgeText}>{COUNTRY_CODE}</Text>
          </View>
        </View>
        <GlassInput
          value={form.phone}
          onChangeText={(txt) => setForm({ ...form, phone: txt })}
          placeholder="Numéro de téléphone"
          keyboardType="phone-pad"
          maxLength={14}
        />
      </GlassCard>

      {isDriver && (
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Vérification Chauffeur & Véhicule</Text>
          {renderVerificationBanner()}

          <Text style={styles.label}>Modèle du Véhicule (Marque, Couleur, etc.)</Text>
          <GlassInput
            value={form.vehicleModel}
            onChangeText={(txt) => setForm({ ...form, vehicleModel: txt })}
            placeholder="Ex : TVS King Rouge"
            editable={!isLocked}
          />

          <Text style={styles.label}>Numéro de Plaque d'Immatriculation</Text>
          <GlassInput
            value={form.vehiclePlate}
            onChangeText={(txt) => setForm({ ...form, vehiclePlate: txt })}
            placeholder="Immatriculation ou N° Châssis"
            editable={!isLocked}
          />

          <Text style={styles.label}>Type de Tricycle</Text>
          <View style={styles.typeSelectorContainer}>
            <TouchableOpacity
              style={[styles.typeOption, form.vehicleType === 'tvs' && styles.typeOptionActive, isLocked && styles.typeOptionDisabled]}
              onPress={() => !isLocked && setForm({ ...form, vehicleType: 'tvs' })}
              disabled={isLocked}
              activeOpacity={0.8}
            >
              <Image source={{ uri: TVS_IMAGE }} style={styles.typeOptionImage} />
              <Text style={[styles.typeTitle, form.vehicleType === 'tvs' && styles.typeTitleActive]}>TVS</Text>
              <Text style={styles.typeDesc}>4 places max. Confort supérieur.</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeOption, form.vehicleType === 'apsonic' && styles.typeOptionActive, isLocked && styles.typeOptionDisabled]}
              onPress={() => !isLocked && setForm({ ...form, vehicleType: 'apsonic' })}
              disabled={isLocked}
              activeOpacity={0.8}
            >
              <Image source={{ uri: APSONIC_IMAGE }} style={styles.typeOptionImage} />
              <Text style={[styles.typeTitle, form.vehicleType === 'apsonic' && styles.typeTitleActive]}>Apsonic</Text>
              <Text style={styles.typeDesc}>6 places max. Transport de groupe.</Text>
            </TouchableOpacity>
          </View>

          {verificationStatus === 'approved' ? (
            <View style={styles.rgpdInfoContainer}>
              <Ionicons name="shield-checkmark" size={24} color={THEME.COLORS.success} />
              <Text style={styles.rgpdInfoText}>
                Vos pièces d'identité ont été validées puis supprimées définitivement conformément aux exigences RGPD.
              </Text>
            </View>
          ) : verificationStatus === 'pending' ? (
            <View style={styles.rgpdInfoContainer}>
              <Ionicons name="time-outline" size={24} color={THEME.COLORS.champagneGold} />
              <Text style={styles.rgpdInfoText}>
                Vos pièces d'identité ont bien été soumises et sont en cours d'examen par l'administration.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Pièce d'identité (Recto & Verso)</Text>
              <Text style={styles.instructionText}>
                Appuyez sur chaque cadre pour prendre une photo en direct ou sélectionner votre pièce (CNI, Permis ou Passeport).
              </Text>

              <View style={styles.documentRow}>
                <View style={styles.documentCol}>
                  <Text style={styles.documentSideLabel}>Face Avant (Recto)</Text>
                  <TouchableOpacity
                    style={[styles.documentBox, form.idCardFront && styles.documentBoxHasImage]}
                    onPress={onPickFront}
                    activeOpacity={0.7}
                  >
                    {form.idCardFront ? (
                      <>
                        <Image source={{ uri: form.idCardFront }} style={styles.documentImage} />
                        <View style={styles.docBadge}>
                          <Ionicons name="checkmark" size={14} color={THEME.COLORS.textInverse} />
                        </View>
                      </>
                    ) : (
                      <View style={styles.documentPlaceholder}>
                        <Ionicons name="camera-outline" size={28} color={THEME.COLORS.champagneGold} />
                        <Text style={styles.documentBoxText}>Choisir Recto</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.documentCol}>
                  <Text style={styles.documentSideLabel}>Face Arrière (Verso)</Text>
                  <TouchableOpacity
                    style={[styles.documentBox, form.idCardBack && styles.documentBoxHasImage]}
                    onPress={onPickBack}
                    activeOpacity={0.7}
                  >
                    {form.idCardBack ? (
                      <>
                        <Image source={{ uri: form.idCardBack }} style={styles.documentImage} />
                        <View style={styles.docBadge}>
                          <Ionicons name="checkmark" size={14} color={THEME.COLORS.textInverse} />
                        </View>
                      </>
                    ) : (
                      <View style={styles.documentPlaceholder}>
                        <Ionicons name="camera-outline" size={28} color={THEME.COLORS.champagneGold} />
                        <Text style={styles.documentBoxText}>Choisir Verso</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitVerifBtn, (!form.idCardFront || !form.idCardBack || !form.vehicleType) && styles.submitVerifBtnDisabled]}
                onPress={onSubmitVerification}
                disabled={isSubmittingVerification || !form.idCardFront || !form.idCardBack || !form.vehicleType}
                activeOpacity={0.85}
              >
                {isSubmittingVerification ? (
                  <ActivityIndicator size="small" color={THEME.COLORS.textInverse} />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark-outline" size={20} color={THEME.COLORS.textInverse} style={styles.btnIcon} />
                    <Text style={styles.submitVerifBtnText}>VALIDER ET SOUMETTRE MON DOSSIER</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </GlassCard>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  card: { padding: 20, marginBottom: 20 },
  sectionTitle: { color: THEME.COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  label: { color: THEME.COLORS.textSecondary, fontSize: 12, marginBottom: 5, marginLeft: 5, fontWeight: '600' },
  phoneLabelContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, marginLeft: 5 },
  countryBadge: { backgroundColor: THEME.COLORS.overlay, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8, borderWidth: 1, borderColor: THEME.COLORS.border },
  countryBadgeText: { color: THEME.COLORS.textPrimary, fontSize: 10, fontWeight: 'bold' },
  banner: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 20, borderWidth: 1 },
  bannerApproved: { backgroundColor: 'rgba(39, 174, 96, 0.15)', borderColor: THEME.COLORS.success },
  bannerPending: { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: THEME.COLORS.champagneGold },
  bannerRejected: { backgroundColor: 'rgba(192, 57, 43, 0.15)', borderColor: THEME.COLORS.danger },
  bannerNone: { backgroundColor: THEME.COLORS.overlay, borderColor: THEME.COLORS.border },
  bannerText: { color: THEME.COLORS.textPrimary, fontWeight: 'bold', fontSize: 14, marginLeft: 10 },
  bannerSubtext: { color: THEME.COLORS.textSecondary, fontSize: 12, marginLeft: 10, marginTop: 4 },
  flexOne: { flex: 1 },
  typeSelectorContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  typeOption: { flex: 1, borderWidth: 1, borderColor: THEME.COLORS.border, borderRadius: 12, padding: 12, alignItems: 'center', marginHorizontal: 5, backgroundColor: 'rgba(255,255,255,0.02)' },
  typeOptionActive: { borderColor: THEME.COLORS.primary, backgroundColor: 'rgba(212, 175, 55, 0.08)' },
  typeOptionDisabled: { opacity: 0.6 },
  typeTitle: { color: THEME.COLORS.textSecondary, fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  typeTitleActive: { color: THEME.COLORS.primary },
  typeDesc: { color: THEME.COLORS.textTertiary, fontSize: 10, textAlign: 'center', lineHeight: 14 },
  typeOptionImage: { width: 64, height: 64, borderRadius: 32, marginBottom: 8, resizeMode: 'cover' },
  instructionText: { color: THEME.COLORS.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 15, paddingHorizontal: 5 },
  documentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  documentCol: { flex: 1, marginHorizontal: 5 },
  documentSideLabel: { color: THEME.COLORS.textTertiary, fontSize: 11, marginBottom: 6, textAlign: 'center' },
  documentBox: { height: 115, borderRadius: 12, borderWidth: 1, borderColor: THEME.COLORS.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.01)', overflow: 'hidden' },
  documentBoxHasImage: { borderStyle: 'solid', borderColor: THEME.COLORS.champagneGold, borderWidth: 1.5 },
  documentPlaceholder: { alignItems: 'center' },
  documentBoxText: { color: THEME.COLORS.textSecondary, fontSize: 12, marginTop: 6, fontWeight: '500' },
  documentImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  docBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: THEME.COLORS.success, borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  rgpdInfoContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, marginVertical: 10 },
  rgpdInfoText: { flex: 1, color: THEME.COLORS.textSecondary, fontSize: 12, lineHeight: 18, marginLeft: 12 },
  submitVerifBtn: { flexDirection: 'row', backgroundColor: THEME.COLORS.primary, borderRadius: THEME.BORDERS.radius.pill, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 10, ...THEME.SHADOWS.goldSoft },
  submitVerifBtnDisabled: { backgroundColor: THEME.COLORS.border, opacity: 0.5 },
  submitVerifBtnText: { color: THEME.COLORS.textInverse, fontSize: 13, fontWeight: 'bold', letterSpacing: 0.4 },
  btnIcon: { marginRight: 8 },
});

export default React.memo(ProfileForm);