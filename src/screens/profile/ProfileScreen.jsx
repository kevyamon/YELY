// src/screens/profile/ProfileScreen.jsx
// ECRAN PROFIL - Orchestrateur Modulaire UI & UX Soumission Photo Explicite
// CSCSM Level: Bank Grade / Conforme règle < 270 lignes

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import GlassCard from '../../components/ui/GlassCard';
import GlobalSkeleton, { SkeletonBone } from '../../components/ui/GlobalSkeleton';
import GoldButton from '../../components/ui/GoldButton';
import ScreenWrapper from '../../components/ui/ScreenWrapper';

import ProfileAvatar from '../../components/profile/ProfileAvatar';
import ProfileForm from '../../components/profile/ProfileForm';
import PasswordChangeModal from '../../components/profile/PasswordChangeModal';
import DeleteAccountModal from '../../components/profile/DeleteAccountModal';
import ImageSourceModal from '../../components/profile/ImageSourceModal';
import PhotoPreviewModal from '../../components/profile/PhotoPreviewModal';
import { useProfileController } from './useProfileController';
import THEME from '../../theme/theme';

const ProfileScreen = ({ navigation }) => {
  const {
    currentUser,
    profileData,
    serverRole,
    isDriver,
    isSeller,
    isFetching,
    isUpdating,
    isUploading,
    isDeleting,
    isUpdatingPassword,
    isSubmittingVerification,
    isDeleteModalVisible,
    setIsDeleteModalVisible,
    isPasswordModalVisible,
    setIsPasswordModalVisible,
    isSourceModalVisible,
    setIsSourceModalVisible,
    isPreviewModalVisible,
    setIsPreviewModalVisible,
    previewImageUri,
    setPreviewImageUri,
    activeImageTarget,
    form,
    setForm,
    openImagePickerFor,
    handlePickCamera,
    handlePickGallery,
    handleConfirmPhotoUpload,
    handleSubmitVerification,
    handleSave,
    handleChangePasswordSubmit,
    confirmDeleteAccount,
  } = useProfileController();

  const userPhoto = profileData?.data?.profilePicture || currentUser?.profilePicture;
  const userEmail = profileData?.data?.email || currentUser?.email;

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
          <Text style={styles.headerTitle}>Mon Profil</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <GlobalSkeleton visible={isFetching && !currentUser}>
          {isFetching && !currentUser ? (
            <View>
              <View style={styles.ghostAvatarContainer}>
                <SkeletonBone width={120} height={120} borderRadius={60} style={{ marginBottom: 15 }} />
                <SkeletonBone width={200} height={16} style={{ marginBottom: 8 }} />
                <SkeletonBone width={100} height={20} borderRadius={10} />
              </View>
              <View style={styles.ghostFormContainer}>
                <SkeletonBone width="100%" height={52} borderRadius={12} style={{ marginBottom: 15 }} />
                <SkeletonBone width="100%" height={52} borderRadius={12} style={{ marginBottom: 30 }} />
                <SkeletonBone width="100%" height={52} borderRadius={26} />
              </View>
            </View>
          ) : (
            <>
              <ProfileAvatar
                userPhoto={userPhoto}
                email={userEmail}
                role={serverRole}
                isUploading={isUploading}
                onPickImage={() => openImagePickerFor('avatar')}
              />

              <ProfileForm
                form={form}
                setForm={setForm}
                isDriver={isDriver}
                isSeller={isSeller}
                verificationStatus={profileData?.data?.verificationStatus || currentUser?.verificationStatus || 'none'}
                rejectionReason={profileData?.data?.rejectionReason || currentUser?.rejectionReason || ''}
                onPickFront={() => openImagePickerFor('idCardFront')}
                onPickBack={() => openImagePickerFor('idCardBack')}
                onSubmitVerification={handleSubmitVerification}
                isSubmittingVerification={isSubmittingVerification}
              />

              <GoldButton title="SAUVEGARDER" onPress={handleSave} isLoading={isUpdating} style={styles.saveBtn} />

              <GlassCard style={[styles.card, { marginTop: 20 }]}>
                <Text style={styles.sectionTitle}>Sécurité</Text>
                <Text style={styles.securityText}>Vous pouvez mettre à jour votre mot de passe pour assurer la sécurité de votre compte.</Text>
                <GoldButton title="MODIFIER LE MOT DE PASSE" onPress={() => setIsPasswordModalVisible(true)} variant="secondary" />
              </GlassCard>

              <TouchableOpacity style={styles.deleteBtn} onPress={() => setIsDeleteModalVisible(true)} disabled={isDeleting}>
                <Ionicons name="trash-outline" size={20} color={THEME.COLORS.danger} />
                <Text style={styles.deleteText}>Supprimer mon compte</Text>
              </TouchableOpacity>
            </>
          )}
        </GlobalSkeleton>
      </ScrollView>

      <PasswordChangeModal
        visible={isPasswordModalVisible}
        onClose={() => setIsPasswordModalVisible(false)}
        onSubmit={handleChangePasswordSubmit}
        isLoading={isUpdatingPassword}
      />

      <DeleteAccountModal
        visible={isDeleteModalVisible}
        onClose={() => setIsDeleteModalVisible(false)}
        onConfirm={confirmDeleteAccount}
        isLoading={isDeleting}
      />

      <ImageSourceModal
        visible={isSourceModalVisible}
        title={activeImageTarget === 'avatar' ? 'Photo de profil' : activeImageTarget === 'idCardFront' ? 'Pièce d\'identité (Recto)' : 'Pièce d\'identité (Verso)'}
        subtitle="Prenez une photo en direct ou choisissez un fichier existant."
        onSelectCamera={handlePickCamera}
        onSelectGallery={handlePickGallery}
        onCancel={() => setIsSourceModalVisible(false)}
      />

      <PhotoPreviewModal
        visible={isPreviewModalVisible}
        imageUri={previewImageUri}
        title="Confirmer la photo de profil"
        subtitle="Vérifiez votre photo avant de l'enregistrer comme photo de profil."
        isCircular={true}
        isLoading={isUploading}
        onConfirm={handleConfirmPhotoUpload}
        onChangePhoto={() => {
          setIsPreviewModalVisible(false);
          setIsSourceModalVisible(true);
        }}
        onCancel={() => {
          setIsPreviewModalVisible(false);
          setPreviewImageUri(null);
        }}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: THEME.COLORS.primary, fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 50 },
  ghostAvatarContainer: { alignItems: 'center', paddingVertical: 20 },
  ghostFormContainer: { marginTop: 10 },
  card: { padding: 20 },
  sectionTitle: { color: THEME.COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  saveBtn: { marginTop: 10 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, padding: 15,
    borderWidth: 1, borderColor: THEME.COLORS.danger, borderRadius: THEME.BORDERS.radius.pill, backgroundColor: 'rgba(231, 76, 60, 0.03)',
  },
  deleteText: { color: THEME.COLORS.danger, fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  securityText: { color: THEME.COLORS.textSecondary, fontSize: 14, marginBottom: 15, marginLeft: 5 },
});

export default ProfileScreen;