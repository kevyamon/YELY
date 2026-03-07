// src/screens/admin/MapManagement.jsx
// GESTION GÉOSPATIALE - Interface SuperAdmin (POIs)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import React, { useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import { ConfirmModal } from '../../components/admin/AdminModals';
import PoiFormModal from '../../components/admin/PoiFormModal';
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import GlassInput from '../../components/ui/GlassInput';
import GlobalSkeleton from '../../components/ui/GlobalSkeleton';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { useBulkImportPOIsMutation, useDeletePOIMutation, useGetAllPOIsQuery } from '../../store/api/poiApiSlice';
import { showToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const MapManagement = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets(); 
  const flatListRef = useRef(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [editingPoi, setEditingPoi] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [poiToDelete, setPoiToDelete] = useState(null);

  const { data: poiResponse, isLoading: isFetching } = useGetAllPOIsQuery();
  const [deletePOI] = useDeletePOIMutation();
  const [bulkImport, { isLoading: isImporting }] = useBulkImportPOIsMutation();

  const pois = poiResponse?.data || [];

  const filteredPois = useMemo(() => {
    return pois.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [pois, searchQuery]);

  const handleScroll = (event) => {
    // Calcul dynamique de la moitie de l'ecran pour declencher le bouton
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const halfScreenHeight = layoutMeasurement.height / 2;
    setShowScrollTop(contentOffset.y > halfScreenHeight);
  };

  const scrollToTop = () => {
    // Securite: on ne scroll que si on a des resultats
    if (filteredPois && filteredPois.length > 0) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const openAddModal = () => {
    setEditingPoi(null);
    setIsFormModalVisible(true);
  };

  const openEditModal = (poi) => {
    setEditingPoi(poi);
    setIsFormModalVisible(true);
  };

  const confirmDelete = (poi) => {
    setPoiToDelete(poi);
    setDeleteModalVisible(true);
  };

  const executeDelete = async () => {
    if (!poiToDelete) return;
    try {
      await deletePOI(poiToDelete._id).unwrap();
      dispatch(showToast({ message: 'Lieu supprimé de la base', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: 'Erreur lors de la suppression', type: 'error' }));
    } finally {
      setDeleteModalVisible(false);
      setPoiToDelete(null);
    }
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
        <Ionicons name={item.icon} size={28} color={item.iconColor} />
      </View>
      <View style={styles.poiInfo}>
        <Text style={styles.poiName}>{item.name}</Text>
        <Text style={styles.poiCoords}>Lat: {item.latitude.toFixed(5)} | Lng: {item.longitude.toFixed(5)}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editBtn}>
          <Ionicons name="create-outline" size={22} color={THEME.COLORS.info} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => confirmDelete(item)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={22} color={THEME.COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenWrapper>
      <View style={[styles.customHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.textPrimary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Gestion de la Carte</Text>
        
        <TouchableOpacity onPress={handleBulkImport} style={styles.bulkBtn}>
          <Ionicons name="cloud-upload" size={20} color={THEME.COLORS.champagneGold} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.searchWrapper}>
          <GlassInput
            placeholder="Rechercher un lieu enregistré..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            icon="search-outline"
          />
        </View>

        {isFetching || isImporting ? (
          <View style={styles.loader}>
            <GlobalSkeleton visible={true} fullScreen={false} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredPois}
            keyExtractor={(item) => item._id}
            renderItem={renderPoiItem}
            contentContainerStyle={styles.listContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucun lieu enregistré ou trouvé</Text>}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={openAddModal}>
        <Ionicons name="add" size={32} color={THEME.COLORS.background} />
      </TouchableOpacity>

      <PoiFormModal 
        visible={isFormModalVisible}
        onClose={() => setIsFormModalVisible(false)}
        editingPoi={editingPoi}
      />

      <ConfirmModal 
        visible={deleteModalVisible}
        title="Supprimer ce lieu ?"
        message={`Êtes-vous sûr de vouloir supprimer "${poiToDelete?.name}" ? Il disparaîtra immédiatement de la carte des clients.`}
        isDestructive={true}
        onConfirm={executeDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />

      <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  customHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, backgroundColor: THEME.COLORS.background, zIndex: 10 },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  bulkBtn: { padding: 8, backgroundColor: THEME.COLORS.glassLight, borderRadius: 12 },
  content: { flex: 1, paddingHorizontal: 20 },
  searchWrapper: { marginBottom: 15 },
  listContent: { paddingBottom: 100 },
  poiCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.COLORS.glassDark, marginBottom: 12, padding: 15, borderRadius: 20, borderWidth: 1, borderColor: THEME.COLORS.glassBorder },
  iconContainer: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  poiInfo: { flex: 1, marginLeft: 15 },
  poiName: { color: THEME.COLORS.textPrimary, fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  poiCoords: { color: THEME.COLORS.textSecondary, fontSize: 12 },
  actionButtons: { flexDirection: 'row' },
  editBtn: { padding: 10, backgroundColor: 'rgba(52, 152, 219, 0.1)', borderRadius: 12, marginRight: 8 },
  deleteBtn: { padding: 10, backgroundColor: 'rgba(231, 76, 60, 0.1)', borderRadius: 12 },
  loader: { marginTop: 50 },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 64, height: 64, borderRadius: 32, backgroundColor: THEME.COLORS.champagneGold, justifyContent: 'center', alignItems: 'center', ...THEME.SHADOWS.strong },
  emptyText: { textAlign: 'center', color: THEME.COLORS.textTertiary, marginTop: 40, fontSize: 14 }
});

export default MapManagement;