// src/components/ui/DestinationSearchModal.jsx
// MODALE DE RECHERCHE DE DESTINATION — RECHERCHE HYBRIDE & TOUCHER SUR CARTE
// CSCSM Level: Bank Grade (Strictement modulaire < 270 lignes, Sans Emojis)

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useDispatch } from 'react-redux';

import { useGetAllPOIsQuery, useSearchPOIsQuery, useResolveExternalPOIMutation } from '../../store/api/poiApiSlice';
import { showLoading, hideLoading } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';
import GlassInput from './GlassInput';
import GlassModal from './GlassModal';
import UniversalIcon from './UniversalIcon';

const normalizeSearchText = (text) => {
  if (!text) return '';
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const DestinationSearchModal = ({
  visible,
  onClose,
  onPlaceSelect,
  onPickOnMap = null,
}) => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { height: screenHeight } = useWindowDimensions();
  const isSmallScreen = screenHeight < 700;

  const { data: poiResponse, isLoading } = useGetAllPOIsQuery(undefined, {
    skip: !visible,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: searchResponse, isFetching: isSearching } = useSearchPOIsQuery(debouncedQuery, {
    skip: !visible || debouncedQuery.length < 2,
    refetchOnMountOrArgChange: true,
  });

  const [resolveExternal] = useResolveExternalPOIMutation();
  const pois = poiResponse?.data || [];

  const filteredPOIs = useMemo(() => {
    if (debouncedQuery.length >= 2) return searchResponse?.data || [];
    const normalized = normalizeSearchText(searchQuery);
    if (!normalized) return pois.slice(0, 6);
    return pois.filter(p => normalizeSearchText(p.name).includes(normalized)).slice(0, 8);
  }, [pois, searchQuery, debouncedQuery, searchResponse]);

  const handleSelectPlace = useCallback(async (item) => {
    Keyboard.dismiss();
    let finalItem = item;
    if (item.isExternal) {
      try {
        dispatch(showLoading({ message: 'Validation du lieu...' }));
        const res = await resolveExternal({
          name: item.name,
          latitude: item.latitude,
          longitude: item.longitude,
          icon: item.icon,
          iconColor: item.iconColor,
        }).unwrap();
        if (res.data) finalItem = res.data;
      } catch (_) {
      } finally {
        dispatch(hideLoading());
      }
    }

    onPlaceSelect({
      address: finalItem.name,
      latitude: finalItem.latitude,
      longitude: finalItem.longitude,
    });
    setSearchQuery('');
    onClose();
  }, [onPlaceSelect, onClose, resolveExternal, dispatch]);

  const renderSuggestionItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSelectPlace(item)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionIcon}>
        <UniversalIcon
          iconString={item.icon || "Ionicons/location"}
          size={16}
          color={item.iconColor || THEME.COLORS.champagneGold}
        />
      </View>
      <View style={styles.suggestionTextContainer}>
        <Text style={styles.mainText} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.secondaryText} numberOfLines={1}>
          {item.isExternal ? "Point suggéré" : "Maféré, Côte d'Ivoire"}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={THEME.COLORS.champagneGold} />
    </TouchableOpacity>
  ), [handleSelectPlace]);

  const isLoaderActive = isLoading || (isSearching && searchQuery.length >= 2);

  return (
    <GlassModal visible={visible} onClose={onClose} position="center" fullWidth={false} style={styles.modalStyle}>
      <View style={styles.header}>
        <Text style={styles.title}>Où allons-nous ?</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={16} color={THEME.COLORS.champagneGold} />
        </TouchableOpacity>
      </View>

      {/* Recherche Textuelle */}
      <View style={styles.inputWrapper}>
        <GlassInput
          placeholder="Rechercher une destination..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={true}
          icon="search-outline"
        />
      </View>

      {/* Définir sur la carte */}
      {onPickOnMap && (
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.pickOnMapBtn}
          onPress={() => {
            onClose();
            onPickOnMap();
          }}
        >
          <Ionicons name="map-outline" size={15} color={THEME.COLORS.champagneGold} style={{ marginRight: 6 }} />
          <Text style={styles.pickOnMapText}>Choisir la destination sur la carte</Text>
        </TouchableOpacity>
      )}

      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderDot} />
        <Text style={styles.sectionTitle}>{searchQuery ? "Résultats" : "Lieux suggérés"}</Text>
      </View>

      {isLoaderActive ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={THEME.COLORS.champagneGold} />
          <Text style={styles.loadingText}>Synchronisation...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPOIs}
          keyExtractor={(item) => String(item._id || item.id || item.name)}
          renderItem={renderSuggestionItem}
          keyboardShouldPersistTaps="handled"
          style={{ maxHeight: isSmallScreen ? 180 : 220 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>Aucun lieu trouvé pour "{searchQuery}"</Text>
          )}
        />
      )}
    </GlassModal>
  );
};

const styles = StyleSheet.create({
  modalStyle: {
    padding: 14, borderWidth: 1.5, borderColor: THEME.COLORS.champagneGold,
    borderRadius: 22, width: '92%', maxWidth: 380, backgroundColor: THEME.COLORS.background,
    shadowColor: THEME.COLORS.champagneGold, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 20,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 17, fontWeight: '800', color: THEME.COLORS.textPrimary, letterSpacing: 0.4 },
  closeButton: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: THEME.COLORS.border,
    justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.COLORS.glassSurface,
  },
  inputWrapper: { marginBottom: 8 },
  pickOnMapBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: THEME.COLORS.glassSurface, borderWidth: 1, borderColor: THEME.COLORS.champagneGold,
    borderRadius: 12, paddingVertical: 8, marginBottom: 10,
  },
  pickOnMapText: { color: THEME.COLORS.champagneGold, fontSize: 12, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  sectionHeaderDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: THEME.COLORS.champagneGold, marginRight: 6 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: THEME.COLORS.champagneGold, letterSpacing: 1.2, textTransform: 'uppercase' },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10,
    borderRadius: 12, borderWidth: 1, borderColor: THEME.COLORS.border, backgroundColor: THEME.COLORS.glassSurface, marginBottom: 6,
  },
  suggestionIcon: {
    width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
    marginRight: 8, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.25)', backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  suggestionTextContainer: { flex: 1 },
  mainText: { fontSize: 13, fontWeight: '700', color: THEME.COLORS.textPrimary },
  secondaryText: { fontSize: 10.5, color: THEME.COLORS.textSecondary, marginTop: 1 },
  emptyText: { textAlign: 'center', marginTop: 12, fontStyle: 'italic', color: THEME.COLORS.textSecondary, fontSize: 12 },
  centerContainer: { padding: 16, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: THEME.COLORS.champagneGold, marginTop: 6, fontSize: 12, fontWeight: '600' },
});

export default DestinationSearchModal;