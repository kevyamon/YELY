// src/screens/profile/ProfileScreen.jsx
// ECRAN PROFIL - Orchestrateur Modulaire
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import GlassModal from '../../components/ui/GlassModal';
import GlobalSkeleton from '../../components/ui/GlobalSkeleton';
import GoldButton from '../../components/ui/GoldButton';
import ScreenWrapper from '../../components/ui/ScreenWrapper';

import ProfileAvatar from '../../components/profile/ProfileAvatar';
import ProfileForm from '../../components/profile/ProfileForm';

import {
  useDeleteAccountMutation,
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useUploadProfilePictureMutation
} from '../../store/api/usersApiSlice';
import { logout, selectCurrentUser, updateUserInfo } from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const COUNTRY_CODE = '+225';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const isDriver = currentUser?.role === 'driver';
  
  const userRole = currentUser?.role || 'rider';

  const { data: profileData, isLoading: isFetching, refetch } = useGetUserProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateUserProfileMutation();
  const [uploadPhoto, { isLoading: isUploading }] = useUploadProfilePictureMutation();
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  // Initialisation instantanee avec les donnees en cache (currentUser)
  const initialPhone = currentUser?.phone ? currentUser.phone.replace(COUNTRY_CODE, '').trim() : '';
  const [form, setForm] = useState({
    name: currentUser?.name || '',
    phone: initialPhone, 
    vehicleModel: currentUser?.vehicle?.model || '',
    vehiclePlate: currentUser?.vehicle?.plate || '',
  });

  // Mise a jour avec les donnees fraiches du serveur quand elles arrivent
  useEffect(() => {
    if (profileData?.data) {
      const p = profileData.data;
      let localPhone = p.phone || '';
      
      if (localPhone.startsWith(COUNTRY_CODE)) {
          localPhone = localPhone.replace(COUNTRY_CODE, '').trim();
      }

      setForm({
        name: p.name || '',
        phone: localPhone,
        vehicleModel: p.vehicle?.model || '',
        vehiclePlate: p.vehicle?.plate || '',
      });
    }
  }, [profileData]);

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
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets.length > 0) {
      submitPhoto(result.assets[0]);
    }
  };

  const submitPhoto = async (imageAsset) => {
    const formData = new FormData();
    const filename = imageAsset.uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append('profilePicture', {
      uri: imageAsset.uri,
      name: filename || 'profile.jpg',
      type: type,
    });

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

  if (isFetching && !currentUser) {
    return (
      <ScreenWrapper style={styles.centerContainer}>
        <GlobalSkeleton visible={true} fullScreen={false} />
      </ScreenWrapper>
    );
  }

  const userPhoto = profileData?.data?.profilePicture || currentUser?.profilePicture;
  const userEmail = profileData?.data?.email || currentUser?.email;
  const serverRole = profileData?.data?.role || userRole;

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
          <Text style={styles.headerTitle}>Mon Profil</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
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
        />

        <GoldButton 
          title="SAUVEGARDER" 
          onPress={handleSave} 
          isLoading={isUpdating}
          style={styles.saveBtn}
        />

        <TouchableOpacity 
          style={styles.deleteBtn} 
          onPress={() => setIsDeleteModalVisible(true)} 
          disabled={isDeleting}
        >
          <Ionicons name="trash-outline" size={20} color={THEME.COLORS.danger} />
          <Text style={styles.deleteText}>Supprimer mon compte</Text>
        </TouchableOpacity>

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

    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: THEME.COLORS.primary, fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 50 },
  
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
});

export default ProfileScreen;