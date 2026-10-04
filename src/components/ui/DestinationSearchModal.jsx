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

import MapService from '../../services/mapService';
import { useGetAllPOIsQuery, useSearchPOIsQuery, useResolveExternalPOIMutation } from '../../store/api/poiApiSlice';
import { showLoading, hideLoading } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';
import GlassInput from './GlassInput';
import GlassModal from './GlassModal';
import UniversalIcon from './UniversalIcon';

const FALLBACK_SUGGESTIONS = [
  { _id: 'fb_1', name: 'Marché Central', latitude: 5.41589, longitude: -3.02878, icon: 'Ionicons/basket-outline', iconColor: THEME.COLORS.champagneGold },
  { _id: 'fb_2', name: 'Mairie de Maféré', latitude: 5.40611, longitude: -3.03740, icon: 'Ionicons/business-outline', iconColor: THEME.COLORS.champagneGold },
  { _id: 'fb_3', name: 'Hôpital Général de Maféré', latitude: 5.41387, longitude: -3.03267, icon: 'Ionicons/medkit-outline', iconColor: '#2ECC71' },
  { _id: 'fb_4', name: 'Gare routière de Maféré', latitude: 5.41496, longitude: -3.02818, icon: 'Ionicons/bus-outline', iconColor: '#3498DB' },
  { _id: 'fb_5', name: 'Pharmacie Ste Hélène', latitude: 5.41718, longitude: -3.02811, icon: 'Ionicons/fitness-outline', iconColor: '#E74C3C' },
  { _id: 'fb_6', name: 'Grand terrain de Maféré', latitude: 5.42132, longitude: -3.03378, icon: 'Ionicons/football-outline', iconColor: '#F39C12' },
];

const normalizeSearchText = (text) => {
  if (!text) return '';
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const DestinationSearchModal = ({ visible, onClose, onPlaceSelect, onPickOnMap = null }) => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [osmResults, setOsmResults] = useState([]);
  const [isOsmSearching, setIsOsmSearching] = useState(false);
  const { height: screenHeight } = useWindowDimensions();
  const isSmallScreen = screenHeight < 700;

  const { data: poiResponse, isLoading, isFetching } = useGetAllPOIsQuery(undefined, {
    skip: !visible,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: searchResponse, isFetching: isSearching } = useSearchPOIsQuery(debouncedQuery, {
    skip: !visible || debouncedQuery.length < 2,
    refetchOnMountOrArgChange: true,
  });

  const [resolveExternal] = useResolveExternalPOIMutation();
  const backendPois = poiResponse?.data || [];
  const effectivePois = backendPois.length > 0 ? backendPois : FALLBACK_SUGGESTIONS;

  useEffect(() => {
    let isMounted = true;
    if (debouncedQuery.length >= 2) {
      setIsOsmSearching(true);
      MapService.searchPlaces(debouncedQuery).then((results) => {
        if (isMounted) {
          const formatted = (results || []).map(r => ({
            _id: r.placeId || `osm_${r.latitude}_${r.longitude}`,
            name: r.mainText || r.description?.split(',')[0] || r.description,
            description: r.secondaryText || r.description,
            latitude: Number(r.latitude),
            longitude: Number(r.longitude),
            icon: 'Ionicons/location-outline',
            iconColor: THEME.COLORS.champagneGold,
            isExternal: true,
          }));
          setOsmResults(formatted);
          setIsOsmSearching(false);
        }
      }).catch(() => {
        if (isMounted) setIsOsmSearching(false);
      });
    } else {
      setOsmResults([]);
      setIsOsmSearching(false);
    }
    return () => { isMounted = false; };
  }, [debouncedQuery]);

  const filteredPOIs = useMemo(() => {
    if (debouncedQuery.length >= 2) {
      const serverData = searchResponse?.data || [];
      const combined = [...serverData];
      for (const osm of osmResults) {
        const exists = combined.some(p => 
          p.name?.toLowerCase() === osm.name?.toLowerCase() ||
          (Math.abs(Number(p.latitude) - Number(osm.latitude)) < 0.0004 && Math.abs(Number(p.longitude) - Number(osm.longitude)) < 0.0004)
        );
        if (!exists) combined.push(osm);
      }
      if (combined.length > 0) return combined;
      const normalized = normalizeSearchText(debouncedQuery);
      return effectivePois.filter(p => normalizeSearchText(p.name).includes(normalized)).slice(0, 8);
    }

    const normalized = normalizeSearchText(searchQuery);
    if (!normalized) return effectivePois.slice(0, 6);
    return effectivePois.filter(p => normalizeSearchText(p.name).includes(normalized)).slice(0, 8);
  }, [effectivePois, searchQuery, debouncedQuery, searchResponse, osmResults]);

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
        if (res?.data) finalItem = res.data;
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
          {item.description || (item.isExternal ? "Point suggéré (OSM)" : "Maféré, Côte d'Ivoire")}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={THEME.COLORS.champagneGold} />
    </TouchableOpacity>
  ), [handleSelectPlace]);

  const isSearchingActive = (isSearching || isOsmSearching) && debouncedQuery.length >= 2;
  const isInitialLoading = (isLoading || isFetching) && backendPois.length === 0 && !searchQuery;
  const isLoaderActive = isSearchingActive || isInitialLoading;

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
          <Text style={styles.loadingText}>{isSearchingActive ? "Recherche du lieu..." : "Synchronisation..."}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPOIs}
          keyExtractor={(item) => String(item._id || item.id || item.name)}
          renderItem={renderSuggestionItem}
          keyboardShouldPersistTaps="handled"
          style={{ maxHeight: isSmallScreen ? 180 : 220 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => {
            if (!searchQuery.trim()) {
              return (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="small" color={THEME.COLORS.champagneGold} />
                  <Text style={styles.loadingText}>Synchronisation des lieux...</Text>
                </View>
              );
            }
            return <Text style={styles.emptyText}>Aucun lieu trouvé pour "{searchQuery}"</Text>;
          }}
        />
      )}
    </GlassModal>
  );
};

const styles = StyleSheet.create({
  modalStyle: { padding: 14, borderWidth: 1.5, borderColor: THEME.COLORS.champagneGold, borderRadius: 22, width: '92%', maxWidth: 380, backgroundColor: THEME.COLORS.background, shadowColor: THEME.COLORS.champagneGold, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 17, fontWeight: '800', color: THEME.COLORS.textPrimary, letterSpacing: 0.4 },
  closeButton: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: THEME.COLORS.border, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.COLORS.glassSurface },
  inputWrapper: { marginBottom: 8 },
  pickOnMapBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.COLORS.glassSurface, borderWidth: 1, borderColor: THEME.COLORS.champagneGold, borderRadius: 12, paddingVertical: 8, marginBottom: 10 },
  pickOnMapText: { color: THEME.COLORS.champagneGold, fontSize: 12, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  sectionHeaderDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: THEME.COLORS.champagneGold, marginRight: 6 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: THEME.COLORS.champagneGold, letterSpacing: 1.2, textTransform: 'uppercase' },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: THEME.COLORS.border, backgroundColor: THEME.COLORS.glassSurface, marginBottom: 6 },
  suggestionIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.25)', backgroundColor: 'rgba(0, 0, 0, 0.1)' },
  suggestionTextContainer: { flex: 1 },
  mainText: { fontSize: 13, fontWeight: '700', color: THEME.COLORS.textPrimary },
  secondaryText: { fontSize: 10.5, color: THEME.COLORS.textSecondary, marginTop: 1 },
  emptyText: { textAlign: 'center', marginTop: 12, fontStyle: 'italic', color: THEME.COLORS.textSecondary, fontSize: 12 },
  centerContainer: { padding: 16, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: THEME.COLORS.champagneGold, marginTop: 6, fontSize: 12, fontWeight: '600' },
});

export default DestinationSearchModal;