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
import UniversalIcon from './UniversalIcon'; // AJOUT : Import du moteur universel

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
        {/* CORRECTION : Utilisation de UniversalIcon au lieu de Ionicons pur */}
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
      fullWidth={false}
      style={styles.modalStyle}
    >
      <View style={[styles.header, isSmallScreen && { marginBottom: 8 }]}>
        <Text style={[styles.title, isSmallScreen && { fontSize: 18 }]}>Ou allons-nous ?</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={18} color={THEME.COLORS.champagneGold || '#D4AF37'} />
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

      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderDot} />
        <Text style={styles.sectionTitle}>
          {searchQuery ? "Resultats" : "Lieux suggeres"}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME.COLORS.champagneGold || '#D4AF37'} />
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
    padding: 20,
    backgroundColor: 'rgba(15, 15, 15, 0.94)',
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderWidth: 1.5,
    borderRadius: 28,
    width: '92%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionHeaderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.COLORS.champagneGold || '#D4AF37',
    marginRight: 8,
  },
  sectionTitle: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: THEME.COLORS.champagneGold || '#D4AF37', 
    letterSpacing: 1.5, 
    textTransform: 'uppercase',
  },
  listContainer: {
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 10,
  },
  suggestionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  suggestionTextContainer: {
    flex: 1,
  },
  mainText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  secondaryText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
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