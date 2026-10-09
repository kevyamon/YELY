// src/screens/profile/useProfileController.js
// HOOK DE GESTION DU PROFIL & SÉLECTION D'IMAGES SÉCURISÉE
// CSCSM Level: Bank Grade / Conforme règle < 270 lignes

import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
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

const COUNTRY_CODE = '+225';

export const useProfileController = () => {
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
      dispatch(showSuccessToast({ title: 'Recto sélectionné', message: 'La face avant de votre pièce est prête.' }));
    } else if (activeImageTarget === 'idCardBack') {
      setForm((prev) => ({ ...prev, idCardBack: uri }));
      dispatch(showSuccessToast({ title: 'Verso sélectionné', message: 'La face arrière de votre pièce est prête.' }));
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
      dispatch(showSuccessToast({ title: 'Profil à jour', message: 'Vos informations ont été enregistrées avec succès.' }));
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

  return {
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
  };
};
