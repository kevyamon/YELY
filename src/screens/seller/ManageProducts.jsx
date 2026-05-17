// src/screens/seller/ManageProducts.jsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useRef } from 'react';
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import { 
  ActivityIndicator, 
  Alert, 
  FlatList, 
  Image, 
  KeyboardAvoidingView, 
  Modal, 
  Platform, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  useCreateProductMutation, 
  useDeleteProductMutation, 
  useGetMyProductsQuery, 
  useUpdateProductMutation,
  useToggleSoldOutMutation
} from '../../store/api/marketplaceApiSlice';
import { showToast, showErrorToast } from '../../store/slices/uiSlice';
import useMarketplaceSocketEvents from '../../hooks/useMarketplaceSocketEvents';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useDispatch } from 'react-redux';
import THEME from '../../theme/theme';

const ManageProducts = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  useMarketplaceSocketEvents();
  const { data: productsData, isLoading, refetch } = useGetMyProductsQuery();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [toggleSoldOut] = useToggleSoldOutMutation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const listRef = useRef(null);
  const modalScrollRef = useRef(null);

  const handleScroll = (event) => {
    setShowScrollTop(event.nativeEvent.contentOffset.y > 150);
  };

  const scrollToTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Food',
    images: [], // Tableau d'images
  });

  const CATEGORIES = [
    { label: 'Nourriture', value: 'Food' },
    { label: 'Supermarché', value: 'Supermarket' },
    { label: 'Cosmétiques', value: 'Cosmetics' },
    { label: 'Électronique', value: 'Electronics' },
    { label: 'Maison', value: 'Home' },
    { label: 'Autres', value: 'Other' },
  ];

  const products = productsData?.data || [];

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      dispatch(showToast({ type: 'warning', title: 'Accès refusé', message: 'Nous avons besoin des permissions pour accéder à vos photos.' }));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      selectionLimit: 10 - form.images.length, // Limite dynamique
      quality: 0.6,
    });

    if (!result.canceled) {
      const newImages = [...form.images, ...result.assets];
      setForm({ ...form, images: newImages.slice(0, 10) });
    }
  };

  const removeImage = (index) => {
    const newImages = [...form.images];
    newImages.splice(index, 1);
    setForm({ ...form, images: newImages });
  };

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', category: 'Food', images: [] });
    setEditingProduct(null);
    setModalVisible(false);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    // On transforme l'image unique (ou le tableau d'images existant) en format compatible
    const existingImages = Array.isArray(product.images) 
      ? product.images.map(img => ({ uri: img })) 
      : (product.image ? [{ uri: product.image }] : []);

    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category || 'Food',
      images: existingImages,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || form.images.length === 0 || !form.category) {
      dispatch(showToast({ type: 'warning', title: 'Données manquantes', message: 'Veuillez remplir tous les champs et ajouter au moins une image.' }));
      return;
    }

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('description', form.description || 'Pas de description'); // Valeur par defaut si vide
    formData.append('price', Number(form.price)); // Forcer le type Number
    formData.append('category', form.category);

    if (__DEV__) console.log('[MARKETPLACE] Submitting FormData for category:', form.category);

    for (let index = 0; index < form.images.length; index++) {
      const img = form.images[index];
      if (img.uri) {
        if (!img.uri.startsWith('http')) {
          const filename = img.uri.split('/').pop() || `image_${index}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;

          if (Platform.OS === 'web') {
            try {
              const response = await fetch(img.uri);
              const blob = await response.blob();
              formData.append('images', blob, filename);
            } catch (err) {
              console.error('[MARKETPLACE] Web image conversion error:', err);
              // Fallback
              formData.append('images', { uri: img.uri, name: filename, type: type });
            }
          } else {
            formData.append('images', {
              uri: img.uri,
              name: filename,
              type: type,
            });
          }
        } else {
          // Pour les images déjà sur le serveur
          formData.append('existingImages', img.uri);
        }
      }
    }

    try {
      if (editingProduct) {
        await updateProduct({ id: editingProduct._id, data: formData }).unwrap();
        dispatch(showToast({ type: 'success', title: 'Mis à jour', message: 'Le produit a été modifié avec succès.' }));
      } else {
        await createProduct(formData).unwrap();
        dispatch(showToast({ type: 'success', title: 'Publié', message: 'Votre produit est désormais en ligne.' }));
      }
      resetForm();
    } catch (error) {
      console.error('[MANAGE_PRODUCTS] Submit error:', error);
      const msg = error.data?.message || error.message || 'Impossible d\'enregistrer le produit.';
      dispatch(showErrorToast({ message: msg }));
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete).unwrap();
      dispatch(showToast({ type: 'success', title: 'Supprimé', message: 'Produit supprimé avec succès.' }));
      setShowDeleteModal(false);
    } catch (error) {
      dispatch(showErrorToast({ message: 'Impossible de supprimer ce produit.' }));
      setShowDeleteModal(false);
    }
  };

  const handleDelete = (id) => {
    setProductToDelete(id);
    setShowDeleteModal(true);
  };

  const renderProduct = ({ item }) => (
    <View style={[styles.productCard, item.isSoldOut && styles.soldOutCard]}>
      <Image 
        source={{ uri: item.image || (item.images && item.images[0]) || 'https://via.placeholder.com/150' }} 
        style={styles.productImage} 
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>{item.price} FCFA</Text>
        {item.isSoldOut && <Text style={styles.soldOutText}>RUPTURE</Text>}
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity onPress={() => toggleSoldOut(item._id)} style={styles.actionBtn}>
          <MaterialCommunityIcons 
            name={item.isSoldOut ? "eye-outline" : "eye-off-outline"} 
            size={22} 
            color={THEME.COLORS.textSecondary} 
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
          <MaterialCommunityIcons name="pencil-outline" size={22} color={THEME.COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.actionBtn}>
          <MaterialCommunityIcons name="trash-can-outline" size={22} color={THEME.COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: THEME.COLORS.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={[styles.header, { paddingTop: insets.top + THEME.SPACING.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Mes Produits</Text>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <MaterialCommunityIcons name="plus" size={24} color={THEME.COLORS.textInverse} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.COLORS.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          data={products}
          renderItem={renderProduct}
          keyExtractor={item => item._id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="package-variant" size={64} color={THEME.COLORS.textTertiary} />
              <Text style={styles.emptyText}>Aucun produit en vente</Text>
              <TouchableOpacity style={styles.shopBtn} onPress={() => setModalVisible(true)}>
                <Text style={styles.shopBtnText}>Ajouter mon premier produit</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} />

      {/* MODAL AJOUT/EDITION */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={resetForm}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
              </Text>
              <TouchableOpacity onPress={resetForm}>
                <MaterialCommunityIcons name="close" size={24} color={THEME.COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView ref={modalScrollRef} showsVerticalScrollIndicator={false}>
              <View style={[styles.formGroup, { marginTop: THEME.SPACING.xs }]}>
                <Text style={styles.label}>Photos du produit * <Text style={styles.subLabel}>(au moins 1 obligatoire)</Text></Text>
                <View style={styles.imagesGrid}>
                  {form.images.map((img, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image source={{ uri: img.uri }} style={styles.gridImage} />
                      <TouchableOpacity 
                        style={styles.removeImageBtn} 
                        onPress={() => removeImage(index)}
                      >
                        <MaterialCommunityIcons name="close-circle" size={24} color={THEME.COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  {form.images.length < 10 && (
                    <TouchableOpacity style={styles.addImageCard} onPress={handlePickImage}>
                      <MaterialCommunityIcons name="camera-plus" size={32} color={THEME.COLORS.primary} />
                      <Text style={styles.addImageText}>{form.images.length}/10</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Catégorie *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity 
                      key={cat.value} 
                      style={[styles.catPill, form.category === cat.value && styles.catPillActive]}
                      onPress={() => setForm({...form, category: cat.value})}
                    >
                      <Text style={[styles.catPillText, form.category === cat.value && styles.catPillTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nom du produit *</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="Ex: Burger Spécial"
                  placeholderTextColor={THEME.COLORS.textTertiary}
                  value={form.name}
                  onChangeText={(t) => setForm({...form, name: t})}
                  onFocus={() => setTimeout(() => modalScrollRef.current?.scrollTo({ y: 140, animated: true }), 100)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Prix (FCFA) *</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="Ex: 2500"
                  placeholderTextColor={THEME.COLORS.textTertiary}
                  keyboardType="numeric"
                  value={form.price}
                  onChangeText={(t) => setForm({...form, price: t})}
                  onFocus={() => setTimeout(() => modalScrollRef.current?.scrollTo({ y: 240, animated: true }), 100)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput 
                  style={[styles.input, styles.textArea]}
                  placeholder="Détails du produit..."
                  placeholderTextColor={THEME.COLORS.textTertiary}
                  multiline
                  numberOfLines={3}
                  value={form.description}
                  onChangeText={(t) => setForm({...form, description: t})}
                  onFocus={() => setTimeout(() => modalScrollRef.current?.scrollTo({ y: 340, animated: true }), 100)}
                />
              </View>

              <TouchableOpacity 
                style={[styles.submitBtn, (isCreating || isUpdating) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editingProduct ? 'METTRE À JOUR' : 'PUBLIER LE PRODUIT'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmModal 
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Supprimer le produit ?"
        message="Cette action est irréversible. Vos clients ne verront plus ce produit."
        confirmText="Oui, supprimer"
        type="danger"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.xl,
    paddingBottom: THEME.SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.COLORS.glassSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: THEME.FONTS.sizes.h3,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...THEME.SHADOWS.gold,
  },
  listContent: { padding: THEME.SPACING.xl },
  productCard: {
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: 16,
    padding: THEME.SPACING.md,
    marginBottom: THEME.SPACING.md,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    alignItems: 'center',
  },
  soldOutCard: { opacity: 0.5 },
  productImage: { width: 60, height: 60, borderRadius: 12, backgroundColor: THEME.COLORS.overlay },
  productInfo: { flex: 1, marginLeft: THEME.SPACING.md },
  productName: { fontSize: 16, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  productPrice: { color: THEME.COLORS.primary, fontWeight: 'bold', marginTop: 2 },
  soldOutText: { fontSize: 10, color: THEME.COLORS.danger, fontWeight: '900', marginTop: 4 },
  productActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: THEME.COLORS.textTertiary, marginTop: 15 },
  shopBtn: { marginTop: 20, backgroundColor: THEME.COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
  shopBtnText: { color: THEME.COLORS.textInverse, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { 
    backgroundColor: THEME.COLORS.background, 
    borderRadius: 28, 
    padding: 24, 
    maxHeight: '85%',
    width: '92%',
    maxWidth: 550,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...THEME.SHADOWS.strong,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  subLabel: { fontSize: 11, fontWeight: 'normal', color: THEME.COLORS.textTertiary },
  
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  imageWrapper: { width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', position: 'relative', backgroundColor: THEME.COLORS.glassSurface },
  gridImage: { width: '100%', height: '100%' },
  removeImageBtn: { position: 'absolute', top: 2, right: 2, zIndex: 5 },
  addImageCard: { width: '31%', aspectRatio: 1, borderRadius: 12, borderWhidth: 1, borderColor: THEME.COLORS.primary, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(212, 175, 55, 0.05)', borderWidth: 1 },
  addImageText: { color: THEME.COLORS.primary, fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  
  formGroup: { marginBottom: 20 },
  label: { color: THEME.COLORS.textSecondary, marginBottom: 8, fontSize: 14, fontWeight: '600' },
  catScroll: { gap: 10, paddingBottom: 10 },
  catPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: THEME.COLORS.glassSurface, borderWidth: 1, borderColor: THEME.COLORS.border },
  catPillActive: { backgroundColor: THEME.COLORS.primary, borderColor: THEME.COLORS.primary },
  catPillText: { color: THEME.COLORS.textTertiary, fontSize: 12, fontWeight: '600' },
  catPillTextActive: { color: THEME.COLORS.deepAsphalt },
  input: { backgroundColor: THEME.COLORS.glassSurface, borderRadius: 12, padding: 14, color: THEME.COLORS.textPrimary, borderWidth: 1, borderColor: THEME.COLORS.border },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: THEME.COLORS.primary, paddingVertical: 18, borderRadius: THEME.BORDERS.radius.pill, alignItems: 'center', marginTop: 10, ...THEME.SHADOWS.gold },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: THEME.COLORS.deepAsphalt, fontWeight: '900', letterSpacing: 1 },
});

export default ManageProducts;
