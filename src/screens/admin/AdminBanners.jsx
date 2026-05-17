// src/screens/admin/AdminBanners.jsx
// CONSOLE D'ADMINISTRATION BANNIÈRES - Gestion du Carrousel Marketplace
// STANDARD: Industriel (Design Premium, Sûreté des types & Synchro temps réel)

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  Platform,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';

import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { showToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';
import {
  useGetAllBannersAdminQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useToggleBannerStatusMutation,
  useDeleteBannerMutation
} from '../../store/api/marketplaceApiSlice';

const { width } = Dimensions.get('window');

const GlassCard = ({ children, style }) => (
  <View style={[styles.glassContainer, style]}>
    <BlurView intensity={45} tint="default" style={StyleSheet.absoluteFill} />
    <View style={styles.glassContent}>{children}</View>
  </View>
);

const AdminBanners = ({ navigation }) => {
  const dispatch = useDispatch();
  const listRef = useRef(null);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingBanner, setEditingBanner] = useState(null);

  // Formulaire d'ajout/édition
  const [form, setForm] = useState({
    title: '',
    body: '',
    badge: 'NOUVEAU',
    animationType: 'none',
    order: '0',
    isActive: true,
    image: null // Uri ou objet uri
  });

  // Queries & Mutations
  const { data: response, isLoading, refetch, isFetching } = useGetAllBannersAdminQuery();
  const banners = response?.data || response || [];

  const [createBanner, { isLoading: isCreating }] = useCreateBannerMutation();
  const [updateBanner, { isLoading: isUpdating }] = useUpdateBannerMutation();
  const [toggleStatus] = useToggleBannerStatusMutation();
  const [deleteBanner, { isLoading: isDeleting }] = useDeleteBannerMutation();

  const handleScroll = (event) => {
    setShowScrollTop(event.nativeEvent.contentOffset.y > 100);
  };

  const scrollToTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // Sélection d'image via la bibliothèque
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      dispatch(showToast({
        type: 'warning',
        title: 'Permission requise',
        message: 'Nous avons besoin des accès pour charger une image de bannière.'
      }));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.6
    });

    if (!result.canceled) {
      setForm({ ...form, image: result.assets[0] });
    }
  };

  // Lancement du formulaire d'édition
  const handleStartEdit = (banner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title,
      body: banner.body,
      badge: banner.badge || 'NOUVEAU',
      animationType: banner.animationType || 'none',
      order: (banner.order || 0).toString(),
      isActive: banner.isActive,
      image: banner.image ? { uri: banner.image } : null
    });
    setModalVisible(true);
  };

  // Lancement du formulaire d'ajout
  const handleStartAdd = () => {
    setEditingBanner(null);
    setForm({
      title: '',
      body: '',
      badge: 'NOUVEAU',
      animationType: 'none',
      order: '0',
      isActive: true,
      image: null
    });
    setModalVisible(true);
  };

  // Envoi du formulaire
  const handleSubmit = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      dispatch(showToast({ type: 'warning', title: 'Champs requis', message: 'Veuillez remplir le titre et le texte descriptif.' }));
      return;
    }

    if (!editingBanner && !form.image) {
      dispatch(showToast({ type: 'warning', title: 'Image manquante', message: 'L\'image de la bannière est obligatoire.' }));
      return;
    }

    const formData = new FormData();
    formData.append('title', form.title.trim());
    formData.append('body', form.body.trim());
    formData.append('badge', form.badge.trim().toUpperCase());
    formData.append('animationType', form.animationType);
    formData.append('order', Number(form.order) || 0);
    formData.append('isActive', form.isActive);

    // Si une nouvelle image a été sélectionnée (locale)
    if (form.image && form.image.uri && !form.image.uri.startsWith('http')) {
      const filename = form.image.uri.split('/').pop() || 'banner.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      if (Platform.OS === 'web') {
        try {
          const res = await fetch(form.image.uri);
          const blob = await res.blob();
          formData.append('image', blob, filename);
        } catch (err) {
          console.error('[BANNERS] Web image conversion error:', err);
          formData.append('image', { uri: form.image.uri, name: filename, type });
        }
      } else {
        formData.append('image', {
          uri: form.image.uri,
          name: filename,
          type
        });
      }
    }

    try {
      if (editingBanner) {
        await updateBanner({ id: editingBanner._id, data: formData }).unwrap();
        dispatch(showToast({ type: 'success', title: 'Diapositive modifiée 🚀', message: 'La diapositive de la bannière a été mise à jour.' }));
      } else {
        await createBanner(formData).unwrap();
        dispatch(showToast({ type: 'success', title: 'Diapositive créée 🎉', message: 'La nouvelle diapositive a été ajoutée.' }));
      }
      setModalVisible(false);
      setEditingBanner(null);
    } catch (error) {
      console.error(error);
      dispatch(showToast({ type: 'danger', title: 'Erreur', message: error.data?.message || 'Erreur lors de la sauvegarde.' }));
    }
  };

  // Suppression définitive d'un slide
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteBanner(deleteTargetId).unwrap();
      dispatch(showToast({ type: 'success', title: 'Diapositive supprimée 🗑️', message: 'La diapositive a été nettoyée avec succès.' }));
      setDeleteTargetId(null);
    } catch (error) {
      dispatch(showToast({ type: 'danger', title: 'Erreur', message: 'Impossible de supprimer la diapositive.' }));
    }
  };

  const getAnimationLabel = (type) => {
    switch (type) {
      case 'bubbles': return '🫧 Bulles';
      case 'confetti': return '🎉 Confettis';
      case 'stars': return '✨ Étoiles';
      default: return '❌ Aucune';
    }
  };

  const renderBannerItem = ({ item }) => (
    <GlassCard style={styles.bannerItemCard}>
      <View style={styles.cardHeader}>
        <View style={styles.badgeWrapper}>
          <Text style={styles.badgeText}>{item.badge || 'INFO'}</Text>
        </View>
        <View style={styles.activeRow}>
          <Text style={[styles.activeStatusLabel, { color: item.isActive ? THEME.COLORS.success : THEME.COLORS.textTertiary }]}>
            {item.isActive ? 'Active' : 'Masquée'}
          </Text>
          <Switch
            value={item.isActive}
            onValueChange={() => toggleStatus(item._id)}
            trackColor={{ false: '#333', true: 'rgba(212,175,55,0.4)' }}
            thumbColor={item.isActive ? THEME.COLORS.primary : '#555'}
          />
        </View>
      </View>

      <View style={styles.cardBody}>
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
        )}
        <View style={styles.cardDetails}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardBodyText} numberOfLines={2}>{item.body}</Text>
          <View style={styles.cardMeta}>
            <View style={[styles.metaPill, { backgroundColor: 'rgba(212,175,55,0.1)' }]}>
              <Text style={styles.metaText}>{getAnimationLabel(item.animationType)}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>Ordre : {item.order}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => handleStartEdit(item)}>
          <Ionicons name="create-outline" size={18} color={THEME.COLORS.primary} />
          <Text style={styles.editBtnText}>Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => setDeleteTargetId(item._id)}>
          <Ionicons name="trash-outline" size={18} color={THEME.COLORS.danger} />
        </TouchableOpacity>
      </View>
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Gestion Bannières</Text>
            <Text style={styles.headerSubtitle}>Carrousel dynamique temps réel</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleStartAdd}>
          <Ionicons name="add" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* CONTENU PRINCIPAL */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.COLORS.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={banners}
          renderItem={renderBannerItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={THEME.COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="image-multiple-outline" size={64} color="rgba(255,255,255,0.1)" />
              <Text style={styles.emptyText}>Aucune diapositive configurée.</Text>
              <Text style={styles.emptySubText}>Créez votre première diapo à l'aide du bouton +</Text>
            </View>
          }
        />
      )}

      {/* MODAL AJOUT / MODIFICATION */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBg}
        >
          <View style={styles.modalCard}>
            <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingBanner ? 'Modifier Diapositive' : 'Nouvelle Diapositive'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={THEME.COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              
              {/* IMAGE PICKER */}
              <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImage}>
                {form.image ? (
                  <View style={styles.imageSelectedContainer}>
                    <Image source={{ uri: form.image.uri }} style={styles.imagePreview} />
                    <View style={styles.changeImageOverlay}>
                      <Ionicons name="camera-outline" size={24} color="#FFF" />
                      <Text style={styles.changeImageText}>Changer l'image</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={40} color={THEME.COLORS.textSecondary} />
                    <Text style={styles.imagePlaceholderText}>Sélectionner une photo *</Text>
                    <Text style={styles.imagePlaceholderSubText}>Recommandé format 16:9</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* INPUT TITRE */}
              <Text style={styles.inputLabel}>Titre de la News * ({form.title.length}/80)</Text>
              <TextInput
                value={form.title}
                onChangeText={(val) => setForm({ ...form, title: val.slice(0, 80) })}
                placeholder="Ex: Livraison Yély Express"
                placeholderTextColor="rgba(255,255,255,0.2)"
                style={styles.textInput}
              />

              {/* INPUT CORPS */}
              <Text style={styles.inputLabel}>Corps de texte descriptif * ({form.body.length}/200)</Text>
              <TextInput
                value={form.body}
                onChangeText={(val) => setForm({ ...form, body: val.slice(0, 200) })}
                placeholder="Ex: Faites vos courses sans bouger. Nos chauffeurs s'occupent de tout..."
                placeholderTextColor="rgba(255,255,255,0.2)"
                multiline={true}
                numberOfLines={3}
                style={[styles.textInput, styles.multilineInput]}
              />

              {/* CHIPS ANIMATION */}
              <Text style={styles.inputLabel}>Effets & Animations Spéciales</Text>
              <View style={styles.chipsContainer}>
                {['none', 'bubbles', 'confetti', 'stars'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setForm({ ...form, animationType: type })}
                    style={[
                      styles.chip,
                      form.animationType === type ? styles.chipActive : styles.chipInactive
                    ]}
                  >
                    <Text style={[
                      styles.chipText,
                      form.animationType === type ? styles.chipTextActive : styles.chipTextInactive
                    ]}>
                      {getAnimationLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* BADGE ET ORDRE */}
              <View style={styles.inputRow}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Badge</Text>
                  <TextInput
                    value={form.badge}
                    onChangeText={(val) => setForm({ ...form, badge: val })}
                    placeholder="Ex: NOUVEAU, PROMO"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    style={styles.textInput}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Ordre (Triage)</Text>
                  <TextInput
                    value={form.order}
                    onChangeText={(val) => setForm({ ...form, order: val.replace(/[^0-9]/g, '') })}
                    placeholder="Ex: 0, 1"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    keyboardType="numeric"
                    style={styles.textInput}
                  />
                </View>
              </View>

              {/* COMMUTATEUR ACTIF */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Activer immédiatement cette diapo</Text>
                <Switch
                  value={form.isActive}
                  onValueChange={(val) => setForm({ ...form, isActive: val })}
                  trackColor={{ false: '#333', true: 'rgba(212,175,55,0.4)' }}
                  thumbColor={form.isActive ? THEME.COLORS.primary : '#555'}
                />
              </View>

              {/* BOUTON ENREGISTRER */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSubmit}
                disabled={isCreating || isUpdating}
                style={styles.submitBtn}
              >
                {isCreating || isUpdating ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editingBanner ? 'Sauvegarder les modifications' : 'Créer et diffuser'}
                  </Text>
                )}
              </TouchableOpacity>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        visible={!!deleteTargetId}
        title="Supprimer la diapositive ?"
        message="Cette action est irréversible. L'image associée sur Cloudinary sera également détruite définitivement."
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.background
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingHorizontal: THEME.SPACING.xl,
    paddingBottom: THEME.SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backBtn: {
    marginRight: THEME.SPACING.md,
    padding: 4
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.COLORS.textPrimary
  },
  headerSubtitle: {
    fontSize: 12,
    color: THEME.COLORS.textSecondary,
    marginTop: 2
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...THEME.SHADOWS.md
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContent: {
    padding: THEME.SPACING.xl,
    paddingBottom: 100
  },
  glassContainer: {
    overflow: 'hidden',
    borderRadius: THEME.BORDERS.radius.xl,
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.border,
    backgroundColor: THEME.COLORS.overlay,
    marginBottom: THEME.SPACING.md,
    ...THEME.SHADOWS.md
  },
  glassContent: {
    padding: THEME.SPACING.lg
  },
  bannerItemCard: {
    marginBottom: THEME.SPACING.lg
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    paddingBottom: THEME.SPACING.xs
  },
  badgeWrapper: {
    backgroundColor: THEME.COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.BORDERS.radius.sm
  },
  badgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold'
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  activeStatusLabel: {
    fontSize: 12,
    marginRight: 6
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: THEME.BORDERS.radius.lg,
    marginRight: THEME.SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  cardDetails: {
    flex: 1,
    justifyContent: 'center'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.COLORS.textPrimary,
    marginBottom: 4
  },
  cardBodyText: {
    fontSize: 12,
    color: THEME.COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: 6
  },
  cardMeta: {
    flexDirection: 'row'
  },
  metaPill: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.BORDERS.radius.md,
    marginRight: 6
  },
  metaText: {
    fontSize: 10,
    color: THEME.COLORS.textTertiary
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: THEME.SPACING.md,
    paddingTop: THEME.SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)'
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: THEME.BORDERS.radius.md,
    marginLeft: THEME.SPACING.sm
  },
  editBtn: {
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)'
  },
  editBtnText: {
    color: THEME.COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6
  },
  deleteBtn: {
    backgroundColor: 'rgba(231,76,60,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.15)',
    width: 32,
    height: 32,
    padding: 0
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80
  },
  emptyText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: THEME.SPACING.md
  },
  emptySubText: {
    color: THEME.COLORS.textTertiary,
    fontSize: 12,
    marginTop: 4
  },
  
  // MODAL STYLES
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    height: '85%',
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.COLORS.primary
  },
  closeBtn: {
    padding: 4
  },
  modalScroll: {
    padding: THEME.SPACING.lg,
    paddingBottom: 60
  },
  imagePickerBtn: {
    width: '100%',
    height: 150,
    borderRadius: THEME.BORDERS.radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: THEME.SPACING.lg
  },
  imagePlaceholder: {
    alignItems: 'center'
  },
  imagePlaceholderText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.COLORS.textSecondary,
    marginTop: 8
  },
  imagePlaceholderSubText: {
    fontSize: 10,
    color: THEME.COLORS.textTertiary,
    marginTop: 2
  },
  imageSelectedContainer: {
    width: '100%',
    height: '100%',
    position: 'relative'
  },
  imagePreview: {
    width: '100%',
    height: '100%'
  },
  changeImageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  changeImageText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.COLORS.textSecondary,
    marginBottom: 6,
    marginTop: THEME.SPACING.md
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: THEME.BORDERS.radius.lg,
    paddingHorizontal: THEME.SPACING.md,
    paddingVertical: THEME.SPACING.md,
    color: THEME.COLORS.textPrimary,
    fontSize: 14
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top'
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.BORDERS.radius.md,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1
  },
  chipActive: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderColor: THEME.COLORS.primary
  },
  chipInactive: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.05)'
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600'
  },
  chipTextActive: {
    color: THEME.COLORS.primary
  },
  chipTextInactive: {
    color: THEME.COLORS.textTertiary
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: THEME.SPACING.md
  },
  halfInput: {
    width: '48%'
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: THEME.SPACING.lg,
    paddingVertical: THEME.SPACING.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)'
  },
  switchLabel: {
    fontSize: 14,
    color: THEME.COLORS.textSecondary,
    fontWeight: '500'
  },
  submitBtn: {
    backgroundColor: THEME.COLORS.primary,
    borderRadius: THEME.BORDERS.radius.lg,
    paddingVertical: THEME.SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: THEME.SPACING.xl,
    ...THEME.SHADOWS.md
  },
  submitBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold'
  }
});

export default AdminBanners;
