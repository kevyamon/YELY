// src/components/ui/DestinationSearchModal.jsx
// MODALE DE RECHERCHE - UX Liquid Glass + POIs Dynamiques + Hyper-Responsive
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

import { useGetAllPOIsQuery } from '../../store/api/poiApiSlice';
import THEME from '../../theme/theme';
import GlassInput from './GlassInput';
import GlassModal from './GlassModal';
import UniversalIcon from './UniversalIcon'; // AJOUT : Import du composant universel (même dossier)

const normalizeSearchText = (text) => {
  if (!text) return '';
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const DestinationSearchModal = ({ visible, onClose, onPlaceSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const { height: screenHeight } = useWindowDimensions();
  const isSmallScreen = screenHeight < 700;

  const { data: poiResponse, isLoading, isError } = useGetAllPOIsQuery(undefined, {
    skip: !visible, 
    refetchOnMountOrArgChange: true, 
  });

  const pois = poiResponse?.data || [];

  const filteredPOIs = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery);
    
    if (!normalizedQuery) {
      return pois.slice(0, 5);
    }

    const results = pois.filter(poi =>
      normalizeSearchText(poi.name).includes(normalizedQuery)
    );

    return results.slice(0, 10);
  }, [pois, searchQuery]);

  const handleSelectPlace = useCallback((item) => {
    Keyboard.dismiss(); 
    
    onPlaceSelect({
      address: item.name,
      latitude: item.latitude,
      longitude: item.longitude
    });
    
    setSearchQuery('');
    onClose(); 
  }, [onPlaceSelect, onClose]);

  const renderSuggestionItem = useCallback(({ item }) => (
    <TouchableOpacity 
      style={[styles.suggestionItem, isSmallScreen && { paddingVertical: 10 }]} 
      onPress={() => handleSelectPlace(item)}
    >
      <View style={[styles.suggestionIcon, { backgroundColor: item.iconColor ? `${item.iconColor}15` : 'rgba(212, 175, 55, 0.1)' }]}>
        {/* CORRECTION MAJEURE : On utilise l'UniversalIcon pour décoder le "Famille/Nom" de l'icône */}
        <UniversalIcon 
          iconString={item.icon || "Ionicons/location"} 
          size={isSmallScreen ? 18 : 20} 
          color={item.iconColor || THEME.COLORS.champagneGold} 
        />
      </View>
      <View style={styles.suggestionTextContainer}>
        <Text style={[styles.mainText, isSmallScreen && { fontSize: 14 }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.secondaryText, isSmallScreen && { fontSize: 12 }]} numberOfLines={1}>Mafere, Cote d'Ivoire</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={THEME.COLORS.textTertiary} />
    </TouchableOpacity>
  ), [handleSelectPlace, isSmallScreen]);

  const dynamicMaxHeight = screenHeight * (isSmallScreen ? 0.35 : 0.50);

  return (
    <GlassModal
      visible={visible}
      onClose={onClose}
      position="top"
      fullWidth={true}
      style={styles.modalStyle}
    >
      <View style={[styles.header, isSmallScreen && { marginBottom: 8 }]}>
        <Text style={[styles.title, isSmallScreen && { fontSize: 18 }]}>Ou allons-nous ?</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close-circle" size={isSmallScreen ? 24 : 28} color={THEME.COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.inputWrapper, isSmallScreen && { marginBottom: 8 }]}>
        <GlassInput
          placeholder="Ex: Marche de Mafere..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={true}
          icon="search-outline"
        />
      </View>

      <Text style={[styles.sectionTitle, isSmallScreen && { marginBottom: 4 }]}>
        {searchQuery ? "Resultats" : "Lieux suggeres"}
      </Text>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
          <Text style={styles.loadingText}>Synchronisation de la carte...</Text>
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Impossible de charger les lieux pour le moment.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPOIs}
          keyExtractor={(item) => item._id || item.id} 
          renderItem={renderSuggestionItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled" 
          style={[styles.listContainer, { maxHeight: dynamicMaxHeight }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>Aucun lieu trouve pour "{searchQuery}"</Text>
          )}
        />
      )}
    </GlassModal>
  );
};

const styles = StyleSheet.create({
  modalStyle: {
    padding: THEME.SPACING.md,
    maxHeight: '100%', 
    backgroundColor: THEME.COLORS.glassDark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SPACING.md,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.COLORS.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  inputWrapper: {
    marginBottom: THEME.SPACING.md,
  },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: THEME.COLORS.textSecondary, 
    letterSpacing: 1, 
    marginBottom: 8, 
    textTransform: 'uppercase',
    paddingHorizontal: 4
  },
  listContainer: {
  },
  listContent: {
    paddingBottom: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.glassBorder,
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  mainText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.COLORS.textPrimary,
    marginBottom: 4,
  },
  secondaryText: {
    fontSize: 13,
    color: THEME.COLORS.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: THEME.COLORS.textTertiary,
    marginTop: 20,
    fontStyle: 'italic',
  },
  centerContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: THEME.COLORS.champagneGold,
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  }
});

export default DestinationSearchModal;