// src/screens/seller/ManageProducts.jsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
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
import THEME from '../../theme/theme';

const ManageProducts = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { data: productsData, isLoading, refetch } = useGetMyProductsQuery();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [toggleSoldOut] = useToggleSoldOutMutation();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    image: null,
  });

  const products = productsData?.data || [];

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Désolé', 'Nous avons besoin des permissions pour accéder à vos photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setForm({ ...form, image: result.assets[0] });
    }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', image: null });
    setEditingProduct(null);
    setModalVisible(false);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image: { uri: product.image },
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.image) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('description', form.description);
    formData.append('price', form.price);

    // Si c'est une nouvelle image (objet asset)
    if (form.image.uri && !form.image.uri.startsWith('http')) {
      const filename = form.image.uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      formData.append('image', {
        uri: form.image.uri,
        name: filename,
        type: type,
      });
    }

    try {
      if (editingProduct) {
        await updateProduct({ id: editingProduct._id, data: formData }).unwrap();
        Alert.alert('Succès', 'Produit mis à jour.');
      } else {
        await createProduct(formData).unwrap();
        Alert.alert('Succès', 'Produit créé.');
      }
      resetForm();
    } catch (error) {
      Alert.alert('Erreur', error.data?.message || 'Impossible d\'enregistrer le produit.');
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous vraiment supprimer ce produit ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(id).unwrap();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer.');
            }
          }
        }
      ]
    );
  };

  const renderProduct = ({ item }) => (
    <View style={[styles.productCard, item.isSoldOut && styles.soldOutCard]}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
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
          onPress={() => setModalVisible(true)}
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

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
                {form.image ? (
                  <Image source={{ uri: form.image.uri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialCommunityIcons name="camera-plus" size={40} color={THEME.COLORS.textTertiary} />
                    <Text style={styles.imagePlaceholderText}>Ajouter une photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nom du produit *</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="Ex: Burger Spécial"
                  placeholderTextColor={THEME.COLORS.textTertiary}
                  value={form.name}
                  onChangeText={(t) => setForm({...form, name: t})}
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: THEME.COLORS.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  imagePicker: { width: '100%', height: 180, borderRadius: 16, backgroundColor: THEME.COLORS.glassSurface, borderWidth: 1, borderColor: THEME.COLORS.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 24, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center' },
  imagePlaceholderText: { color: THEME.COLORS.textTertiary, marginTop: 8 },
  formGroup: { marginBottom: 20 },
  label: { color: THEME.COLORS.textSecondary, marginBottom: 8, fontSize: 14, fontWeight: '600' },
  input: { backgroundColor: THEME.COLORS.glassSurface, borderRadius: 12, padding: 14, color: THEME.COLORS.textPrimary, borderWidth: 1, borderColor: THEME.COLORS.border },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: THEME.COLORS.primary, paddingVertical: 18, borderRadius: THEME.BORDERS.radius.pill, alignItems: 'center', marginTop: 10, ...THEME.SHADOWS.gold },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: THEME.COLORS.deepAsphalt, fontWeight: '900', letterSpacing: 1 },
});

export default ManageProducts;
