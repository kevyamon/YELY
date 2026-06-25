// src/screens/profile/ProfileScreen.jsx
// ECRAN PROFIL - Orchestrateur Modulaire (Ghost Rendering Inclus)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import GlassCard from '../../components/ui/GlassCard';
import GlassInput from '../../components/ui/GlassInput';
import GlassModal from '../../components/ui/GlassModal';
import GlobalSkeleton, { SkeletonBone } from '../../components/ui/GlobalSkeleton';
import GoldButton from '../../components/ui/GoldButton';
import ScreenWrapper from '../../components/ui/ScreenWrapper';

import ProfileAvatar from '../../components/profile/ProfileAvatar';
import ProfileForm from '../../components/profile/ProfileForm';

import {
  useDeleteAccountMutation,
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useUploadProfilePictureMutation,
  useUpdatePasswordMutation,
  useVerifyIdentityMutation
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
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const initialPhone = currentUser?.phone ? currentUser.phone.replace(COUNTRY_CODE, '').trim() : '';
  const [form, setForm] = useState({
    name: currentUser?.name || '',
    phone: initialPhone, 
    vehicleModel: currentUser?.vehicle?.model || '',
    vehiclePlate: currentUser?.vehicle?.plate || '',
    vehicleType: currentUser?.vehicle?.type || 'salonie',
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

      setForm(prev => ({
        ...prev,
        name: p.name || '',
        phone: localPhone,
        vehicleModel: p.vehicle?.model || '',
        vehiclePlate: p.vehicle?.plate || '',
        vehicleType: p.vehicle?.type || prev.vehicleType || 'salonie',
      }));
    }
  }, [profileData]);

  const handlePickIdCardFront = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      dispatch(showErrorToast({ 
        title: 'Permission refusee', 
        message: 'L\'acces a vos photos est necessaire pour selectionner votre piece d\'identite.' 
      }));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setForm(prev => ({ ...prev, idCardFront: result.assets[0].uri }));
    }
  };

  const handlePickIdCardBack = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      dispatch(showErrorToast({ 
        title: 'Permission refusee', 
        message: 'L\'acces a vos photos est necessaire pour selectionner votre piece d\'identite.' 
      }));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setForm(prev => ({ ...prev, idCardBack: result.assets[0].uri }));
    }
  };

  const handleSubmitVerification = async () => {
    if (!form.idCardFront || !form.idCardBack || !form.vehicleType) {
      dispatch(showErrorToast({
        title: 'Champs requis',
        message: 'Veuillez selectionner le recto et le verso de votre piece d\'identite.'
      }));
      return;
    }

    const formData = new FormData();
    formData.append('vehicleType', form.vehicleType);

    const frontFilename = form.idCardFront.split('/').pop() || 'id_front.jpg';
    const frontMatch = /\.(\w+)$/.exec(frontFilename);
    const frontType = frontMatch ? `image/${frontMatch[1]}` : `image/jpeg`;

    formData.append('idCardFront', {
      uri: form.idCardFront,
      name: frontFilename,
      type: frontType,
    });

    const backFilename = form.idCardBack.split('/').pop() || 'id_back.jpg';
    const backMatch = /\.(\w+)$/.exec(backFilename);
    const backType = backMatch ? `image/${backMatch[1]}` : `image/jpeg`;

    formData.append('idCardBack', {
      uri: form.idCardBack,
      name: backFilename,
      type: backType,
    });

    try {
      const res = await verifyIdentity(formData).unwrap();
      dispatch(updateUserInfo({ 
        verificationStatus: 'pending',
        vehicle: {
          ...currentUser?.vehicle,
          type: form.vehicleType
        }
      }));
      refetch();
      dispatch(showSuccessToast({
        title: 'Demande soumise',
        message: 'Vos documents ont ete envoyes pour validation avec succes.'
      }));
    } catch (error) {
      dispatch(showErrorToast({
        title: 'Echec de l\'envoi',
        message: error?.data?.message || 'Une erreur est survenue lors de la soumission de vos pieces d\'identite.'
      }));
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      dispatch(showErrorToast({ 
        title: 'Permission refusee', 
        message: 'L\'acces a vos photos est necessaire pour modifier votre avatar.' 
      }));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
    });

    if (!result.canceled && result.assets.length > 0) {
      submitPhoto(result.assets[0]);
    }
  };

  const submitPhoto = async (imageAsset) => {
    const formData = new FormData();
    const filename = imageAsset.uri.split('/').pop() || 'profile.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    if (Platform.OS === 'web') {
      try {
        const response = await fetch(imageAsset.uri);
        const blob = await response.blob();
        formData.append('profilePicture', blob, filename);
      } catch (err) {
        console.error('[PROFILE] Web image conversion error:', err);
        // Fallback
        formData.append('profilePicture', {
          uri: imageAsset.uri,
          name: filename,
          type: type,
        });
      }
    } else {
      formData.append('profilePicture', {
        uri: imageAsset.uri,
        name: filename,
        type: type,
      });
    }

    try {
      const res = await uploadPhoto(formData).unwrap();
      dispatch(updateUserInfo({ profilePicture: res.data.profilePicture }));
      refetch();
      dispatch(showSuccessToast({ 
        title: 'Succes', 
        message: 'Votre photo de profil a ete mise a jour avec succes.' 
      }));
    } catch (error) {
      dispatch(showErrorToast({ 
        title: 'Erreur', 
        message: 'Nous n\'avons pas pu enregistrer votre photo. Veuillez reessayer.' 
      }));
    }
  };

  const handleSave = async () => {
    try {
      const cleanLocalPhone = form.phone.replace(/\s/g, '');
      const fullPhone = `${COUNTRY_CODE}${cleanLocalPhone}`;
      
      const payload = { name: form.name, phone: fullPhone };
      if (isDriver) {
        payload.vehicle = { model: form.vehicleModel, plate: form.vehiclePlate };
      }
      
      const res = await updateProfile(payload).unwrap();
      dispatch(updateUserInfo(res.data));
      dispatch(showSuccessToast({ 
        title: 'Profil a jour', 
        message: 'Vos informations personnelles ont bien ete enregistrees.' 
      }));
    } catch (error) {
      dispatch(showErrorToast({ 
        title: 'Sauvegarde impossible', 
        message: error?.data?.message || 'Impossible de sauvegarder vos modifications pour le moment.' 
      }));
    }
  };

  const confirmDeleteAccount = async () => {
    try {
      await deleteAccount().unwrap();
      setIsDeleteModalVisible(false);
      dispatch(showSuccessToast({ 
        title: 'Au revoir', 
        message: 'Votre compte a ete definitivement supprime. A bientot !' 
      }));
      dispatch(logout());
    } catch (error) {
      setIsDeleteModalVisible(false);
      dispatch(showErrorToast({ 
        title: 'Erreur', 
        message: 'Une erreur est survenue lors de la suppression de votre compte.' 
      }));
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      dispatch(showErrorToast({ 
        title: 'Champs requis', 
        message: 'Veuillez remplir tous les champs.' 
      }));
      return;
    }

    if (newPassword.length < 8) {
      dispatch(showErrorToast({ 
        title: 'Mot de passe court', 
        message: 'Le nouveau mot de passe doit faire au moins 8 caractères.' 
      }));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      dispatch(showErrorToast({ 
        title: 'Validation', 
        message: 'Le nouveau mot de passe et sa confirmation ne correspondent pas.' 
      }));
      return;
    }

    try {
      await updatePassword({ currentPassword, newPassword }).unwrap();
      
      dispatch(showSuccessToast({ 
        title: 'Succès', 
        message: 'Votre mot de passe a été modifié avec succès.' 
      }));
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setIsPasswordModalVisible(false);
    } catch (error) {
      dispatch(showErrorToast({ 
        title: 'Erreur', 
        message: error?.data?.message || 'Une erreur est survenue lors de la mise à jour de votre mot de passe.' 
      }));
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
                onPickImage={handlePickImage}
              />

              <ProfileForm 
                form={form}
                setForm={setForm}
                isDriver={isDriver}
                isSeller={isSeller}
                verificationStatus={profileData?.data?.verificationStatus || currentUser?.verificationStatus || 'none'}
                rejectionReason={profileData?.data?.rejectionReason || currentUser?.rejectionReason || ''}
                onPickFront={handlePickIdCardFront}
                onPickBack={handlePickIdCardBack}
                onSubmitVerification={handleSubmitVerification}
                isSubmittingVerification={isSubmittingVerification}
              />

              <GoldButton 
                title="SAUVEGARDER" 
                onPress={handleSave} 
                isLoading={isUpdating}
                style={styles.saveBtn}
              />

              <GlassCard style={[styles.card, { marginTop: 20 }]}>
                <Text style={styles.sectionTitle}>Sécurité</Text>
                <Text style={styles.securityText}>
                  Vous pouvez mettre à jour votre mot de passe pour assurer la sécurité de votre compte.
                </Text>
                <GoldButton 
                  title="MODIFIER LE MOT DE PASSE" 
                  onPress={() => setIsPasswordModalVisible(true)} 
                  variant="secondary"
                />
              </GlassCard>

              <TouchableOpacity 
                style={styles.deleteBtn} 
                onPress={() => setIsDeleteModalVisible(true)} 
                disabled={isDeleting}
              >
                <Ionicons name="trash-outline" size={20} color={THEME.COLORS.danger} />
                <Text style={styles.deleteText}>Supprimer mon compte</Text>
              </TouchableOpacity>
            </>
          )}
        </GlobalSkeleton>
      </ScrollView>

      <GlassModal visible={isDeleteModalVisible} onClose={() => setIsDeleteModalVisible(false)} position="center">
        <View style={styles.modalIconContainer}>
          <Ionicons name="warning" size={48} color={THEME.COLORS.danger} />
        </View>
        <Text style={styles.modalTitle}>Zone de danger</Text>
        <Text style={styles.modalText}>
          Etes-vous sur de vouloir supprimer definitivement votre compte Yely ? Cette action est irreversible et effacera vos donnees.
        </Text>
        
        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsDeleteModalVisible(false)} disabled={isDeleting}>
            <Text style={styles.modalCancelText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmDeleteAccount} disabled={isDeleting}>
            {isDeleting ? <ActivityIndicator color={THEME.COLORS.pureWhite} size="small" /> : <Text style={styles.modalConfirmText}>Supprimer</Text>}
          </TouchableOpacity>
        </View>
      </GlassModal>

      <GlassModal visible={isPasswordModalVisible} onClose={() => setIsPasswordModalVisible(false)} position="center">
        <View style={styles.modalIconContainer}>
          <Ionicons name="key-outline" size={48} color={THEME.COLORS.champagneGold} />
        </View>
        <Text style={styles.modalTitlePassword}>Modifier mon mot de passe</Text>
        
        <View style={styles.modalForm}>
          <Text style={styles.modalLabel}>Mot de passe actuel</Text>
          <GlassInput 
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Saisissez votre mot de passe actuel"
            secureTextEntry={true}
            editable={!isUpdatingPassword}
          />

          <Text style={styles.modalLabel}>Nouveau mot de passe</Text>
          <GlassInput 
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Minimum 8 caractères (lettre + chiffre)"
            secureTextEntry={true}
            editable={!isUpdatingPassword}
          />

          <Text style={styles.modalLabel}>Confirmer le nouveau mot de passe</Text>
          <GlassInput 
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            placeholder="Confirmez votre nouveau mot de passe"
            secureTextEntry={true}
            editable={!isUpdatingPassword}
          />
        </View>
        
        <View style={styles.modalActions}>
          <TouchableOpacity 
            style={styles.modalCancelBtn} 
            onPress={() => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmNewPassword('');
              setIsPasswordModalVisible(false);
            }} 
            disabled={isUpdatingPassword}
          >
            <Text style={styles.modalCancelText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modalConfirmBtn, { backgroundColor: THEME.COLORS.champagneGold }]} 
            onPress={handleChangePassword} 
            disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmNewPassword}
          >
            {isUpdatingPassword ? (
              <ActivityIndicator color={THEME.COLORS.deepAsphalt || '#121418'} size="small" />
            ) : (
              <Text style={[styles.modalConfirmText, { color: THEME.COLORS.deepAsphalt || '#121418' }]}>Valider</Text>
            )}
          </TouchableOpacity>
        </View>
      </GlassModal>

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

  saveBtn: { marginTop: 10 },
  deleteBtn: { 
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, padding: 15,
      borderWidth: 1, borderColor: THEME.COLORS.danger, borderRadius: THEME.BORDERS.radius.pill, backgroundColor: 'rgba(231, 76, 60, 0.03)',
  },
  deleteText: { color: THEME.COLORS.danger, fontSize: 16, fontWeight: 'bold', marginLeft: 10 },

  modalIconContainer: { alignItems: 'center', marginBottom: 15 },
  modalTitle: { color: THEME.COLORS.danger, fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  modalText: { color: THEME.COLORS.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 25 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalCancelBtn: { flex: 1, paddingVertical: 15, borderRadius: THEME.BORDERS.radius.pill, borderWidth: 1, borderColor: THEME.COLORS.border, alignItems: 'center', marginRight: 10 },
  modalCancelText: { color: THEME.COLORS.textPrimary, fontWeight: 'bold', fontSize: 16 },
  modalConfirmBtn: { flex: 1, paddingVertical: 15, borderRadius: THEME.BORDERS.radius.pill, backgroundColor: THEME.COLORS.danger, alignItems: 'center', marginLeft: 10 },
  modalConfirmText: { color: THEME.COLORS.pureWhite, fontWeight: 'bold', fontSize: 16 },
  modalTitlePassword: { color: THEME.COLORS.champagneGold, fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  modalLabel: { color: THEME.COLORS.textSecondary, fontSize: 12, marginBottom: 5, marginLeft: 5 },
  modalForm: { width: '100%', marginBottom: 15 },
  securityText: { color: THEME.COLORS.textSecondary, fontSize: 14, marginBottom: 15, marginLeft: 5 },
});

export default ProfileScreen;