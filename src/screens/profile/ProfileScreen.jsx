// src/screens/profile/ProfileScreen.jsx
// ECRAN PROFIL - Orchestrateur Modulaire UI & UX Soumission Photo Explicite
// CSCSM Level: Bank Grade / Conforme règle < 270 lignes

import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';

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

import {
  useDeleteAccountMutation,
  useGetUserProfileQuery,
  useUpdatePasswordMutation,
  useUpdateUserProfileMutation,
  useUploadProfilePictureMutation,
  useVerifyIdentityMutation,
} from '../../store/api/usersApiSlice';
import { logout, selectCurrentUser, updateUserInfo } from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const COUNTRY_CODE = '+225';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const { data: profileData, isLoading: isFetching, refetch } = useGetUserProfileQuery();

  const userRole = currentUser?.role || 'rider';
  const serverRole = profileData?.data?.role || userRole;
  const isDriver = serverRole === 'driver';
  const isSeller = serverRole === 'seller';

  const [updateProfile, { isLoading: isUpdating }] = useUpdateUserProfileMutation();
  const [uploadPhoto, { isLoading: isUploading }] = useUploadProfilePictureMutation();
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();
  const [updatePassword, { isLoading: isUpdatingPassword }] = useUpdatePasswordMutation();
  const [verifyIdentity, { isLoading: isSubmittingVerification }] = useVerifyIdentityMutation();

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isSourceModalVisible, setIsSourceModalVisible] = useState(false);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState(null);
  const [activeImageTarget, setActiveImageTarget] = useState('avatar');

  const initialPhone = currentUser?.phone ? currentUser.phone.replace(COUNTRY_CODE, '').trim() : '';
  const [form, setForm] = useState({
    name: currentUser?.name || '',
    phone: initialPhone,
    vehicleModel: currentUser?.vehicle?.model || '',
    vehiclePlate: currentUser?.vehicle?.plate || '',
    vehicleType: currentUser?.vehicle?.type || 'tvs',
    idCardFront: null,
    idCardBack: null,
  });

  useEffect(() => {
    if (profileData?.data) {
      const p = profileData.data;
      let localPhone = p.phone || '';
      if (localPhone.startsWith(COUNTRY_CODE)) {
        localPhone = localPhone.replace(COUNTRY_CODE, '').trim();
      }
      setForm((prev) => ({
        ...prev,
        name: p.name || '',
        phone: localPhone,
        vehicleModel: p.vehicle?.model || '',
        vehiclePlate: p.vehicle?.plate || '',
        vehicleType: p.vehicle?.type || prev.vehicleType || 'tvs',
      }));
    }
  }, [profileData]);

  const openImagePickerFor = (target) => {
    setActiveImageTarget(target);
    setIsSourceModalVisible(true);
  };

  const handleImageSelected = (uri) => {
    if (!uri) return;
    if (activeImageTarget === 'avatar') {
      setPreviewImageUri(uri);
      setIsPreviewModalVisible(true);
    } else if (activeImageTarget === 'idCardFront') {
      setForm((prev) => ({ ...prev, idCardFront: uri }));
      dispatch(showSuccessToast({ title: 'Recto sélectionné', message: 'La face avant de la pièce est prête.' }));
    } else if (activeImageTarget === 'idCardBack') {
      setForm((prev) => ({ ...prev, idCardBack: uri }));
      dispatch(showSuccessToast({ title: 'Verso sélectionné', message: 'La face arrière de la pièce est prête.' }));
    }
  };

  const handlePickCamera = async () => {
    setIsSourceModalVisible(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      dispatch(showErrorToast({ title: 'Permission refusée', message: 'L\'accès à l\'appareil photo est requis.' }));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.85 });
    if (!result.canceled && result.assets?.length > 0) {
      handleImageSelected(result.assets[0].uri);
    }
  };

  const handlePickGallery = async () => {
    setIsSourceModalVisible(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      dispatch(showErrorToast({ title: 'Permission refusée', message: 'L\'accès aux photos est requis.' }));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.length > 0) {
      handleImageSelected(result.assets[0].uri);
    }
  };

  const handleConfirmPhotoUpload = async () => {
    if (!previewImageUri) return;
    const filename = previewImageUri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    const formData = new FormData();
    formData.append('profilePicture', { uri: previewImageUri, name: filename, type });

    try {
      const res = await uploadPhoto(formData).unwrap();
      dispatch(updateUserInfo({ profilePicture: res.data.profilePicture }));
      refetch();
      setIsPreviewModalVisible(false);
      setPreviewImageUri(null);
      dispatch(showSuccessToast({ title: 'Succès', message: 'Votre photo de profil a été mise à jour avec succès.' }));
    } catch (error) {
      dispatch(showErrorToast({ title: 'Erreur', message: 'Échec de l\'enregistrement de votre photo.' }));
    }
  };

  const handleSubmitVerification = async () => {
    if (!form.idCardFront || !form.idCardBack || !form.vehicleType) {
      dispatch(showErrorToast({ title: 'Champs requis', message: 'Veuillez sélectionner le recto et le verso de votre pièce d\'identité.' }));
      return;
    }
    const formData = new FormData();
    formData.append('vehicleType', form.vehicleType);
    if (form.vehicleModel) formData.append('vehicleModel', form.vehicleModel.trim());
    if (form.vehiclePlate) formData.append('vehiclePlate', form.vehiclePlate.trim());

    const frontFilename = form.idCardFront.split('/').pop() || 'id_front.jpg';
    const frontMatch = /\.(\w+)$/.exec(frontFilename);
    formData.append('idCardFront', { uri: form.idCardFront, name: frontFilename, type: frontMatch ? `image/${frontMatch[1]}` : 'image/jpeg' });

    const backFilename = form.idCardBack.split('/').pop() || 'id_back.jpg';
    const backMatch = /\.(\w+)$/.exec(backFilename);
    formData.append('idCardBack', { uri: form.idCardBack, name: backFilename, type: backMatch ? `image/${backMatch[1]}` : 'image/jpeg' });

    try {
      await verifyIdentity(formData).unwrap();
      dispatch(updateUserInfo({
        verificationStatus: 'pending',
        vehicle: { ...currentUser?.vehicle, type: form.vehicleType, model: form.vehicleModel?.trim() || '', plate: form.vehiclePlate?.trim() || '' },
      }));
      refetch();
      dispatch(showSuccessToast({ title: 'Dossier soumis', message: 'Vos documents ont été envoyés pour validation avec succès.' }));
    } catch (error) {
      dispatch(showErrorToast({ title: 'Échec de l\'envoi', message: error?.data?.message || 'Erreur lors de la soumission.' }));
    }
  };

  const handleSave = async () => {
    try {
      const cleanPhone = `${COUNTRY_CODE}${form.phone.replace(/\s/g, '')}`;
      const payload = { name: form.name, phone: cleanPhone };
      if (isDriver) payload.vehicle = { model: form.vehicleModel, plate: form.vehiclePlate };
      const res = await updateProfile(payload).unwrap();
      dispatch(updateUserInfo(res.data));
      dispatch(showSuccessToast({ title: 'Profil à jour', message: 'Vos informations personnelles ont été enregistrées.' }));
    } catch (error) {
      dispatch(showErrorToast({ title: 'Sauvegarde impossible', message: error?.data?.message || 'Erreur lors de la sauvegarde.' }));
    }
  };

  const handleChangePasswordSubmit = async ({ currentPassword, newPassword }) => {
    try {
      await updatePassword({ currentPassword, newPassword }).unwrap();
      dispatch(showSuccessToast({ title: 'Succès', message: 'Votre mot de passe a été modifié avec succès.' }));
      setIsPasswordModalVisible(false);
      return true;
    } catch (error) {
      dispatch(showErrorToast({ title: 'Erreur', message: error?.data?.message || 'Erreur lors du changement de mot de passe.' }));
      return false;
    }
  };

  const confirmDeleteAccount = async () => {
    try {
      await deleteAccount().unwrap();
      setIsDeleteModalVisible(false);
      dispatch(showSuccessToast({ title: 'Au revoir', message: 'Votre compte a été définitivement supprimé.' }));
      dispatch(logout());
    } catch (error) {
      setIsDeleteModalVisible(false);
      dispatch(showErrorToast({ title: 'Erreur', message: 'Une erreur est survenue lors de la suppression.' }));
    }
  };

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