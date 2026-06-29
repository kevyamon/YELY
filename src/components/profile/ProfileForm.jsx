// src/components/profile/ProfileForm.jsx
// COMPOSANT MODULAIRE - Formulaire Utilisateur & Vérification d'Identité Chauffeur
// CSCSM Level: Bank Grade

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../theme/theme';
import GlassCard from '../ui/GlassCard';
import GlassInput from '../ui/GlassInput';

const COUNTRY_CODE = '+225';

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
  isSubmittingVerification
}) => {
  const isLocked = verificationStatus === 'approved' || verificationStatus === 'pending';

  const renderVerificationBanner = () => {
    switch (verificationStatus) {
      case 'approved':
        return (
          <View style={[styles.banner, styles.bannerApproved]}>
            <Ionicons name="shield-checkmark" size={20} color="#FFF" />
            <Text style={styles.bannerText}>Identité vérifiée</Text>
          </View>
        );
      case 'pending':
        return (
          <View style={[styles.banner, styles.bannerPending]}>
            <Ionicons name="time" size={20} color="#000" />
            <Text style={[styles.bannerText, { color: '#000' }]}>Vérification en cours de traitement...</Text>
          </View>
        );
      case 'rejected':
        return (
          <View style={[styles.banner, styles.bannerRejected]}>
            <Ionicons name="alert-circle" size={20} color="#FFF" />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerText}>Vérification rejetée</Text>
              {rejectionReason ? (
                <Text style={styles.bannerSubtext}>Motif : {rejectionReason}</Text>
              ) : null}
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
        
        <Text style={styles.label}>{isSeller ? "Nom de la boutique" : "Nom complet"}</Text>
        <GlassInput 
          value={form.name}
          onChangeText={(txt) => setForm({...form, name: txt})}
          placeholder={isSeller ? "Le nom de votre boutique" : "Votre nom"}
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
          <Text style={styles.sectionTitle}>Vérification Chauffeur & Véhicule</Text>
            
            {renderVerificationBanner()}

            <Text style={styles.label}>Modèle du Véhicule (Marque, Couleur, etc.)</Text>
            <GlassInput 
              value={form.vehicleModel}
              onChangeText={(txt) => setForm({...form, vehicleModel: txt})}
              placeholder="Ex: TVS King Rouge"
            />

            <Text style={styles.label}>Numéro de Plaque d'Immatriculation</Text>
            <GlassInput 
              value={form.vehiclePlate}
              onChangeText={(txt) => setForm({...form, vehiclePlate: txt})}
              placeholder="Ex: AA-123-BB ou N° Châssis"
            />

            <Text style={styles.label}>Type de Tricycle</Text>
            <View style={styles.typeSelectorContainer}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  form.vehicleType === 'tvs' && styles.typeOptionActive,
                  isLocked && styles.typeOptionDisabled
                ]}
                onPress={() => !isLocked && setForm({ ...form, vehicleType: 'tvs' })}
                disabled={isLocked}
                activeOpacity={0.8}
              >
                <Image 
                  source={{ uri: 'https://res.cloudinary.com/dskdkrwhq/image/upload/v1782412187/dbfe2987-242f-4055-9e4d-2bff6b35adce.png' }} 
                  style={[
                    styles.typeOptionImage,
                    form.vehicleType === 'tvs' && styles.typeOptionImageActive,
                    isLocked && styles.typeOptionImageDisabled
                  ]} 
                  accessibilityLabel="Tricycle TVS 4 places"
                />
                <Text style={[styles.typeTitle, form.vehicleType === 'tvs' && styles.typeTitleActive]}>
                  TVS
                </Text>
                <Text style={styles.typeDesc}>4 places max. Plus confortable, requis pour trajets Privés.</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeOption,
                  form.vehicleType === 'apsonic' && styles.typeOptionActive,
                  isLocked && styles.typeOptionDisabled
                ]}
                onPress={() => !isLocked && setForm({ ...form, vehicleType: 'apsonic' })}
                disabled={isLocked}
                activeOpacity={0.8}
              >
                <Image 
                  source={{ uri: 'https://res.cloudinary.com/dskdkrwhq/image/upload/v1782412162/54ef1daa-dd2e-48ad-8046-261a4753da1c.png' }} 
                  style={[
                    styles.typeOptionImage,
                    form.vehicleType === 'apsonic' && styles.typeOptionImageActive,
                    isLocked && styles.typeOptionImageDisabled
                  ]} 
                  accessibilityLabel="Tricycle Apsonic 6 places"
                />
                <Text style={[styles.typeTitle, form.vehicleType === 'apsonic' && styles.typeTitleActive]}>
                  Apsonic
                </Text>
                <Text style={styles.typeDesc}>6 places max. Requis pour le transport de groupe ou affaires.</Text>
              </TouchableOpacity>
            </View>

            {verificationStatus === 'approved' ? (
              <View style={styles.rgpdInfoContainer}>
                <Ionicons name="shield-checkmark" size={24} color={THEME.COLORS.success} />
                <Text style={styles.rgpdInfoText}>
                  Vos pièces d'identité ont été validées puis supprimées définitivement de l'espace de stockage temporaire conformément aux exigences RGPD.
                </Text>
              </View>
            ) : verificationStatus === 'pending' ? (
              <View style={styles.rgpdInfoContainer}>
                <Ionicons name="shield-half" size={24} color={THEME.COLORS.warning} />
                <Text style={styles.rgpdInfoText}>
                  Vos pièces d'identité ont bien été soumises et sont en cours d'examen. Dès validation par l'administration, elles seront définitivement effacées de l'espace de stockage temporaire.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.label}>Pièce d'identité (Recto & Verso)</Text>
                <Text style={styles.instructionText}>
                  Prenez en photo le recto et le verso de votre pièce d'identité (CNI, Passeport ou Permis) hors de l'application avec votre appareil photo natif, puis sélectionnez-les ci-dessous.
                </Text>

                <View style={styles.documentRow}>
                  <View style={styles.documentCol}>
                    <Text style={styles.documentSideLabel}>Recto (Devant)</Text>
                    <TouchableOpacity
                      style={[styles.documentBox, form.idCardFront && styles.documentBoxHasImage]}
                      onPress={onPickFront}
                      activeOpacity={0.7}
                    >
                      {form.idCardFront ? (
                        <Image source={{ uri: form.idCardFront }} style={styles.documentImage} />
                      ) : (
                        <View style={styles.documentPlaceholder}>
                          <Ionicons name="image-outline" size={32} color={THEME.COLORS.textTertiary} />
                          <Text style={styles.documentBoxText}>Sélectionner</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.documentCol}>
                    <Text style={styles.documentSideLabel}>Verso (Derrière)</Text>
                    <TouchableOpacity
                      style={[styles.documentBox, form.idCardBack && styles.documentBoxHasImage]}
                      onPress={onPickBack}
                      activeOpacity={0.7}
                    >
                      {form.idCardBack ? (
                        <Image source={{ uri: form.idCardBack }} style={styles.documentImage} />
                      ) : (
                        <View style={styles.documentPlaceholder}>
                          <Ionicons name="image-outline" size={32} color={THEME.COLORS.textTertiary} />
                          <Text style={styles.documentBoxText}>Sélectionner</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.rgpdCard}>
                  <Ionicons name="shield-outline" size={20} color={THEME.COLORS.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={styles.rgpdText}>
                    <Text style={{ fontWeight: 'bold' }}>Respect de la vie privée (RGPD) : </Text>
                    Les images de votre pièce d'identité servent exclusivement à vérifier votre identité. Elles seront définitivement supprimées de l'espace de stockage temporaire dès que votre compte sera approuvé ou rejeté.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitVerifBtn,
                    (!form.idCardFront || !form.idCardBack || !form.vehicleType) && styles.submitVerifBtnDisabled
                  ]}
                  onPress={onSubmitVerification}
                  disabled={isSubmittingVerification || !form.idCardFront || !form.idCardBack || !form.vehicleType}
                  activeOpacity={0.8}
                >
                  {isSubmittingVerification ? (
                    <ActivityIndicator size="small" color={THEME.COLORS.textInverse} />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={20} color={THEME.COLORS.textInverse} style={{ marginRight: 8 }} />
                      <Text style={styles.submitVerifBtnText}>SOUMETTRE LES PIÈCES D'IDENTITÉ</Text>
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
  },

  // Banner styles
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  bannerApproved: {
    backgroundColor: THEME.COLORS.success + '22',
    borderColor: THEME.COLORS.success,
  },
  bannerPending: {
    backgroundColor: '#FFCC0022',
    borderColor: '#FFCC00',
  },
  bannerRejected: {
    backgroundColor: THEME.COLORS.danger + '22',
    borderColor: THEME.COLORS.danger,
  },
  bannerNone: {
    backgroundColor: THEME.COLORS.overlay,
    borderColor: THEME.COLORS.border,
  },
  bannerText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 10,
  },
  bannerSubtext: {
    color: THEME.COLORS.textSecondary,
    fontSize: 12,
    marginLeft: 10,
    marginTop: 4,
  },

  // Tricycle Type Selector
  typeSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  typeOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  typeOptionActive: {
    borderColor: THEME.COLORS.primary,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  typeOptionDisabled: {
    opacity: 0.6,
  },
  typeIconContainer: {
    marginBottom: 8,
  },
  typeTitle: {
    color: THEME.COLORS.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  typeTitleActive: {
    color: THEME.COLORS.primary,
  },
  typeDesc: {
    color: THEME.COLORS.textTertiary,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },

  // ID Cards
  instructionText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  documentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  documentCol: {
    flex: 1,
    marginHorizontal: 5,
  },
  documentSideLabel: {
    color: THEME.COLORS.textTertiary,
    fontSize: 11,
    marginBottom: 6,
    textAlign: 'center',
  },
  documentBox: {
    height: 110,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.01)',
    overflow: 'hidden',
  },
  documentBoxHasImage: {
    borderStyle: 'solid',
    borderColor: THEME.COLORS.border,
  },
  documentPlaceholder: {
    alignItems: 'center',
  },
  documentBoxText: {
    color: THEME.COLORS.textTertiary,
    fontSize: 12,
    marginTop: 6,
  },
  documentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // RGPD note card - Aéré sans fond ni bordure pour ne pas ressembler à un bouton
  rgpdCard: {
    flexDirection: 'row',
    paddingVertical: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  rgpdText: {
    flex: 1,
    color: THEME.COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  rgpdInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginVertical: 10,
  },
  rgpdInfoText: {
    flex: 1,
    color: THEME.COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 12,
  },
  typeOptionImage: {
    width: 66,
    height: 66,
    borderRadius: 33, // Parfaitement rond
    marginBottom: 10,
    resizeMode: 'cover',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionImageActive: {
    borderColor: THEME.COLORS.primary,
  },
  typeOptionImageDisabled: {
    opacity: 0.6,
  },

  // Submit button
  submitVerifBtn: {
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.primary,
    borderRadius: 999,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 10,
  },
  submitVerifBtnDisabled: {
    backgroundColor: THEME.COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.5,
  },
  submitVerifBtnText: {
    color: THEME.COLORS.textInverse,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ProfileForm;