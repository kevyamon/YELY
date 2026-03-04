// src/screens/admin/MapManagement.jsx [NOUVEAU]
// GESTION GÉOSPATIALE - Interface SuperAdmin (POIs)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { useDispatch } from 'react-redux';
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import GlassInput from '../../components/ui/GlassInput';
import GoldButton from '../../components/ui/GoldButton';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import SearchBar from '../../components/ui/SearchBar';
import {
    useBulkImportPOIsMutation,
    useCreatePOIMutation,
    useDeletePOIMutation,
    useGetAllPOIsQuery,
    useUpdatePOIMutation
} from '../../store/api/poiApiSlice';
import { showToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const MapManagement = () => {
  const dispatch = useDispatch();
  const flatListRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPoi, setEditingPoi] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Formulaire
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    icon: 'location',
    iconColor: THEME.COLORS.champagneGold
  });

  // API Hooks
  const { data: poiResponse, isLoading: isFetching } = useGetAllPOIsQuery();
  const [createPOI, { isLoading: isCreating }] = useCreatePOIMutation();
  const [updatePOI, { isLoading: isUpdating }] = useUpdatePOIMutation();
  const [deletePOI] = useDeletePOIMutation();
  const [bulkImport, { isLoading: isImporting }] = useBulkImportPOIsMutation();

  const pois = poiResponse?.data || [];

  // Algorithme de suggestion de couleur basé sur l'icône
  const suggestColor = (iconName) => {
    const iconKey = iconName.toLowerCase();
    if (iconKey.includes('bus') || iconKey.includes('car') || iconKey.includes('airplane')) return '#3498db';
    if (iconKey.includes('restaurant') || iconKey.includes('cafe') || iconKey.includes('pizza')) return '#e67e22';
    if (iconKey.includes('medical') || iconKey.includes('hospital') || iconKey.includes('medkit')) return '#e74c3c';
    if (iconKey.includes('cart') || iconKey.includes('basket') || iconKey.includes('shop')) return '#9b59b6';
    if (iconKey.includes('tree') || iconKey.includes('leaf') || iconKey.includes('park')) return '#2ecc71';
    return THEME.COLORS.champagneGold;
  };

  const handleIconChange = (icon) => {
    const color = suggestColor(icon);
    setFormData(prev => ({ ...prev, icon, iconColor: color }));
  };

  const filteredPois = useMemo(() => {
    return pois.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [pois, searchQuery]);

  const resetForm = () => {
    setFormData({
      name: '',
      latitude: '',
      longitude: '',
      icon: 'location',
      iconColor: THEME.COLORS.champagneGold
    });
    setEditingPoi(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.latitude || !formData.longitude) {
      dispatch(showToast({ message: 'Veuillez remplir tous les champs', type: 'error' }));
      return;
    }

    try {
      const payload = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      };

      if (editingPoi) {
        await updatePOI({ id: editingPoi._id, ...payload }).unwrap();
        dispatch(showToast({ message: 'Lieu mis à jour', type: 'success' }));
      } else {
        await createPOI(payload).unwrap();
        dispatch(showToast({ message: 'Nouveau lieu ajouté', type: 'success' }));
      }
      setIsModalVisible(false);
      resetForm();
    } catch (err) {
      dispatch(showToast({ message: err.data?.message || 'Erreur lors de l\'enregistrement', type: 'error' }));
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Confirmation",
      "Voulez-vous supprimer ce lieu ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: async () => {
          try {
            await deletePOI(id).unwrap();
            dispatch(showToast({ message: 'Lieu supprimé', type: 'success' }));
          } catch (err) {
            dispatch(showToast({ message: 'Erreur lors de la suppression', type: 'error' }));
          }
        }}
      ]
    );
  };

  const handleBulkImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const response = await fetch(fileUri);
      const jsonData = await response.json();

      if (jsonData.pois && Array.isArray(jsonData.pois)) {
        await bulkImport(jsonData).unwrap();
        dispatch(showToast({ message: 'Importation en masse réussie', type: 'success' }));
      } else {
        dispatch(showToast({ message: 'Format JSON invalide (clé pois attendue)', type: 'error' }));
      }
    } catch (err) {
      dispatch(showToast({ message: 'Erreur lors de l\'importation', type: 'error' }));
    }
  };

  const renderPoiItem = ({ item }) => (
    <View style={styles.poiCard}>
      <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor}15` }]}>
        <Ionicons name={item.icon} size={24} color={item.iconColor} />
      </View>
      <View style={styles.poiInfo}>
        <Text style={styles.poiName}>{item.name}</Text>
        <Text style={styles.poiCoords}>{item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity onPress={() => {
          setEditingPoi(item);
          setFormData({
            name: item.name,
            latitude: item.latitude.toString(),
            longitude: item.longitude.toString(),
            icon: item.icon,
            iconColor: item.iconColor
          });
          setIsModalVisible(true);
        }} style={styles.editBtn}>
          <Ionicons name="create-outline" size={20} color={THEME.COLORS.info} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color={THEME.COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Gestion de la Carte</Text>
        <TouchableOpacity onPress={handleBulkImport} style={styles.bulkBtn}>
          <Ionicons name="cloud-upload-outline" size={20} color={THEME.COLORS.champagneGold} />
          <Text style={styles.bulkText}>Import JSON</Text>
        </TouchableOpacity>
      </View>

      <SearchBar
        placeholder="Rechercher un lieu..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {isFetching || isImporting ? (
        <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} style={styles.loader} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredPois}
          keyExtractor={(item) => item._id}
          renderItem={renderPoiItem}
          contentContainerStyle={styles.listContent}
          onScroll={(e) => setShowScrollTop(e.nativeEvent.contentOffset.y > 300)}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun lieu enregistré</Text>}
        />
      )}

      <GoldButton
        title="Ajouter une position"
        onPress={() => { resetForm(); setIsModalVisible(true); }}
        style={styles.floatingBtn}
      />

      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingPoi ? 'Editer le lieu' : 'Nouveau lieu'}</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <GlassInput
                placeholder="Nom du lieu"
                value={formData.name}
                onChangeText={(val) => setFormData(p => ({ ...p, name: val }))}
              />
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <GlassInput
                    placeholder="Latitude"
                    keyboardType="numeric"
                    value={formData.latitude}
                    onChangeText={(val) => setFormData(p => ({ ...p, latitude: val }))}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <GlassInput
                    placeholder="Longitude"
                    keyboardType="numeric"
                    value={formData.longitude}
                    onChangeText={(val) => setFormData(p => ({ ...p, longitude: val }))}
                  />
                </View>
              </View>

              <Text style={styles.label}>Icône & Couleur</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconPicker}>
                {['location', 'bus', 'restaurant', 'cart', 'hospital', 'cafe', 'school', 'home', 'construct'].map(ico => (
                  <TouchableOpacity
                    key={ico}
                    onPress={() => handleIconChange(ico)}
                    style={[styles.iconOption, formData.icon === ico && styles.selectedIcon]}
                  >
                    <Ionicons name={ico} size={24} color={formData.icon === ico ? THEME.COLORS.champagneGold : THEME.COLORS.textTertiary} />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>Aperçu :</Text>
                <Ionicons name={formData.icon} size={30} color={formData.iconColor} />
                <Text style={[styles.previewText, { color: formData.iconColor }]}>{formData.name || 'Nom du lieu'}</Text>
              </View>

              <GoldButton
                title={editingPoi ? "Mettre à jour" : "Ajouter au catalogue"}
                onPress={handleSubmit}
                loading={isCreating || isUpdating}
              />
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showScrollTop && (
        <ScrollToTopButton onPress={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })} />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  bulkBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.COLORS.glassLight, padding: 8, borderRadius: 12 },
  bulkText: { color: THEME.COLORS.champagneGold, marginLeft: 6, fontSize: 12, fontWeight: '600' },
  listContent: { paddingBottom: 100 },
  poiCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.COLORS.glassLight, marginBottom: 12, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: THEME.COLORS.glassBorder },
  iconContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  poiInfo: { flex: 1, marginLeft: 12 },
  poiName: { color: THEME.COLORS.textPrimary, fontWeight: 'bold', fontSize: 16 },
  poiCoords: { color: THEME.COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  actionButtons: { flexDirection: 'row' },
  editBtn: { padding: 8 },
  deleteBtn: { padding: 8 },
  loader: { marginTop: 50 },
  floatingBtn: { position: 'absolute', bottom: 30, left: 20, right: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: THEME.COLORS.glassDark, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.COLORS.champagneGold, marginBottom: 20, textAlign: 'center' },
  row: { flexDirection: 'row' },
  label: { color: THEME.COLORS.textSecondary, fontSize: 14, marginTop: 15, marginBottom: 10 },
  iconPicker: { marginBottom: 20 },
  iconOption: { width: 50, height: 50, borderRadius: 12, backgroundColor: THEME.COLORS.glassLight, justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: THEME.COLORS.glassBorder },
  selectedIcon: { borderColor: THEME.COLORS.champagneGold, backgroundColor: 'rgba(212, 175, 55, 0.1)' },
  previewContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 12, marginBottom: 25 },
  previewLabel: { color: THEME.COLORS.textTertiary, marginRight: 10 },
  previewText: { marginLeft: 10, fontWeight: '600' },
  cancelBtn: { marginTop: 15, padding: 15, alignItems: 'center' },
  cancelText: { color: THEME.COLORS.error, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: THEME.COLORS.textTertiary, marginTop: 40 }
});

export default MapManagement;