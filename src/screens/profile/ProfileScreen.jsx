// src/screens/profile/ProfileScreen.jsx
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import GlassCard from '../../components/ui/GlassCard';
import GlassInput from '../../components/ui/GlassInput';
import GlassModal from '../../components/ui/GlassModal';
import GoldButton from '../../components/ui/GoldButton';
import ScreenWrapper from '../../components/ui/ScreenWrapper';

import {
    useDeleteAccountMutation,
    useGetUserProfileQuery,
    useUpdateUserProfileMutation,
    useUploadProfilePictureMutation
} from '../../store/api/usersApiSlice';
import { logout, selectCurrentUser, updateUserInfo } from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const isDriver = currentUser?.role === 'driver';

  const { data: profileData, isLoading: isFetching, refetch } = useGetUserProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateUserProfileMutation();
  const [uploadPhoto, { isLoading: isUploading }] = useUploadProfilePictureMutation();
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    vehicleModel: '',
    vehiclePlate: '',
  });

  useEffect(() => {
    if (profileData?.data) {
      const p = profileData.data;
      setForm({
        name: p.name || '',
        phone: p.phone || '',
        vehicleModel: p.vehicle?.model || '',
        vehiclePlate: p.vehicle?.plate || '',
      });
    }
  }, [profileData]);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      dispatch(showErrorToast({ title: 'Permission refusée', message: 'Accès à la galerie requis.' }));
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
      dispatch(showSuccessToast({ title: 'Succès', message: 'Photo mise à jour.' }));
    } catch (error) {
      dispatch(showErrorToast({ title: 'Erreur', message: 'Échec de l\'envoi de la photo.' }));
    }
  };

  const handleSave = async () => {
    try {
      const payload = { name: form.name, phone: form.phone };
      if (isDriver) {
        payload.vehicle = { model: form.vehicleModel, plate: form.vehiclePlate };
      }
      const res = await updateProfile(payload).unwrap();
      dispatch(updateUserInfo(res.data));
      dispatch(showSuccessToast({ title: 'Profil à jour', message: 'Vos informations sont sauvegardées.' }));
    } catch (error) {
      dispatch(showErrorToast({ title: 'Erreur', message: error?.data?.message || 'Échec de la sauvegarde.' }));
    }
  };

  const confirmDeleteAccount = async () => {
    try {
      await deleteAccount().unwrap();
      setIsDeleteModalVisible(false);
      dispatch(showSuccessToast({ title: 'Adieu', message: 'Votre compte a été supprimé avec succès.' }));
      dispatch(logout());
    } catch (error) {
      setIsDeleteModalVisible(false);
      dispatch(showErrorToast({ title: 'Erreur', message: 'Impossible de supprimer le compte.' }));
    }
  };

  if (isFetching) {
    return (
      <ScreenWrapper style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.COLORS.primary} />
      </ScreenWrapper>
    );
  }

  const userPhoto = profileData?.data?.profilePicture || currentUser?.profilePicture;

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
          <Text style={styles.headerTitle}>Mon Profil</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* AVATAR SECTION */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} disabled={isUploading}>
            <View style={styles.avatarContainer}>
              {userPhoto ? (
                <Image source={{ uri: userPhoto }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={60} color={THEME.COLORS.textSecondary} />
              )}
              {isUploading && (
                <View style={styles.avatarLoader}>
                  <ActivityIndicator size="small" color={THEME.COLORS.primary} />
                </View>
              )}
            </View>
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={16} color={THEME.COLORS.background} />
            </View>
          </TouchableOpacity>
          <Text style={styles.emailText}>{profileData?.data?.email || currentUser?.email}</Text>
          <Text style={styles.roleText}>{isDriver ? 'Chauffeur Partenaire' : 'Passager'}</Text>
        </View>

        {/* INFO SECTION */}
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Informations Personnelles</Text>
          
          <Text style={styles.label}>Nom complet</Text>
          <GlassInput 
            value={form.name}
            onChangeText={(txt) => setForm({...form, name: txt})}
            placeholder="Votre nom"
          />

          <Text style={styles.label}>Téléphone</Text>
          <GlassInput 
            value={form.phone}
            onChangeText={(txt) => setForm({...form, phone: txt})}
            placeholder="Votre numéro"
            keyboardType="phone-pad"
          />
        </GlassCard>

        {/* DRIVER SECTION */}
        {isDriver && (
          <GlassCard style={styles.card}>
            <Text style={styles.sectionTitle}>Véhicule</Text>
            
            <Text style={styles.label}>Modèle</Text>
            <GlassInput 
              value={form.vehicleModel}
              onChangeText={(txt) => setForm({...form, vehicleModel: txt})}
              placeholder="Ex: Toyota Corolla"
            />

            <Text style={styles.label}>Plaque d'immatriculation</Text>
            <GlassInput 
              value={form.vehiclePlate}
              onChangeText={(txt) => setForm({...form, vehiclePlate: txt})}
              placeholder="Ex: 1234 AB 01"
              autoCapitalize="characters"
            />
          </GlassCard>
        )}

        <GoldButton 
          title="SAUVEGARDER" 
          onPress={handleSave} 
          isLoading={isUpdating}
          style={styles.saveBtn}
        />

        {/* DANGER ZONE */}
        <TouchableOpacity style={styles.deleteBtn} onPress={() => setIsDeleteModalVisible(true)} disabled={isDeleting}>
          <Ionicons name="trash-outline" size={20} color={THEME.COLORS.danger} />
          <Text style={styles.deleteText}>Supprimer mon compte</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* MODALE DE CONFIRMATION DE SUPPRESSION AVEC GLASSMORPHISM */}
      <GlassModal
        visible={isDeleteModalVisible}
        onClose={() => setIsDeleteModalVisible(false)}
        position="center"
      >
        <View style={styles.modalIconContainer}>
          <Ionicons name="warning" size={48} color={THEME.COLORS.danger} />
        </View>
        <Text style={styles.modalTitle}>Zone de danger</Text>
        <Text style={styles.modalText}>
          Êtes-vous sûr de vouloir supprimer définitivement votre compte Yély ? Cette action est irréversible et effacera vos données.
        </Text>
        
        <View style={styles.modalActions}>
          <TouchableOpacity 
            style={styles.modalCancelBtn} 
            onPress={() => setIsDeleteModalVisible(false)}
            disabled={isDeleting}
          >
            <Text style={styles.modalCancelText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.modalConfirmBtn} 
            onPress={confirmDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color={THEME.COLORS.pureWhite} size="small" />
            ) : (
              <Text style={styles.modalConfirmText}>Supprimer</Text>
            )}
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
  
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: THEME.COLORS.glassSurface, 
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden', 
    borderWidth: 2, 
    borderColor: THEME.COLORS.primary 
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarLoader: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: THEME.COLORS.overlayMedium, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  editBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    backgroundColor: THEME.COLORS.primary, 
    width: 30, 
    height: 30, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: THEME.COLORS.background 
  },
  emailText: { color: THEME.COLORS.textPrimary, fontSize: 16, marginTop: 15, fontWeight: '500' },
  roleText: { color: THEME.COLORS.textSecondary, fontSize: 14, marginTop: 5 },
  
  card: { padding: 20, marginBottom: 20 },
  sectionTitle: { color: THEME.COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  label: { color: THEME.COLORS.textSecondary, fontSize: 12, marginBottom: 5, marginLeft: 5 },
  
  saveBtn: { marginTop: 10 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, padding: 15 },
  deleteText: { color: THEME.COLORS.danger, fontSize: 16, fontWeight: 'bold', marginLeft: 10 },

  // STYLES DE LA MODALE
  modalIconContainer: { alignItems: 'center', marginBottom: 15 },
  modalTitle: { color: THEME.COLORS.danger, fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  modalText: { color: THEME.COLORS.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 25 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalCancelBtn: { 
    flex: 1, 
    paddingVertical: 15, 
    borderRadius: THEME.BORDERS.radius.pill, 
    borderWidth: 1, 
    borderColor: THEME.COLORS.border, 
    alignItems: 'center', 
    marginRight: 10 
  },
  modalCancelText: { color: THEME.COLORS.textPrimary, fontWeight: 'bold', fontSize: 16 },
  modalConfirmBtn: { 
    flex: 1, 
    paddingVertical: 15, 
    borderRadius: THEME.BORDERS.radius.pill, 
    backgroundColor: THEME.COLORS.danger, 
    alignItems: 'center', 
    marginLeft: 10 
  },
  modalConfirmText: { color: THEME.COLORS.pureWhite, fontWeight: 'bold', fontSize: 16 },
});

export default ProfileScreen;