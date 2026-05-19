import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, useColorScheme } from 'react-native';

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
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const { height: screenHeight } = useWindowDimensions();
  const isSmallScreen = screenHeight < 700;

  // 🚀 THEME RESPONSIVE SYSTEM
  const dynamicBg = isDarkMode ? 'rgba(15, 15, 15, 0.94)' : 'rgba(255, 255, 255, 0.96)';
  const dynamicBorder = isDarkMode ? 'rgba(212, 175, 55, 0.35)' : 'rgba(212, 175, 55, 0.45)';
  const dynamicTitleColor = isDarkMode ? '#FFFFFF' : '#1A1A1A';
  const dynamicSubtitleColor = isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
  const dynamicItemBg = isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
  const dynamicItemBorder = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
  const dynamicCloseBtnBg = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  const dynamicCloseBtnBorder = isDarkMode ? 'rgba(212, 175, 55, 0.3)' : 'rgba(212, 175, 55, 0.4)';
  const dynamicLoaderColor = THEME.COLORS.champagneGold || '#D4AF37';

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
      style={[
        styles.suggestionItem, 
        { backgroundColor: dynamicItemBg, borderColor: dynamicItemBorder },
        isSmallScreen && { paddingVertical: 10 }
      ]} 
      onPress={() => handleSelectPlace(item)}
    >
      <View style={[styles.suggestionIcon, { backgroundColor: item.iconColor ? `${item.iconColor}15` : 'rgba(212, 175, 55, 0.1)' }]}>
        <UniversalIcon 
          iconString={item.icon || "Ionicons/location"} 
          size={isSmallScreen ? 14 : 16} 
          color={item.iconColor || THEME.COLORS.champagneGold || '#D4AF37'} 
        />
      </View>
      <View style={styles.suggestionTextContainer}>
        <Text style={[styles.mainText, { color: dynamicTitleColor }, isSmallScreen && { fontSize: 13 }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.secondaryText, { color: dynamicSubtitleColor }, isSmallScreen && { fontSize: 11 }]} numberOfLines={1}>Maféré, Côte d'Ivoire</Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={isDarkMode ? 'rgba(212, 175, 55, 0.6)' : 'rgba(212, 175, 55, 0.8)'} />
    </TouchableOpacity>
  ), [handleSelectPlace, isSmallScreen, isDarkMode, dynamicItemBg, dynamicItemBorder, dynamicTitleColor, dynamicSubtitleColor]);

  const dynamicMaxHeight = screenHeight * (isSmallScreen ? 0.22 : 0.28);

  return (
    <GlassModal
      visible={visible}
      onClose={onClose}
      position="center"
      fullWidth={false}
      style={[styles.modalStyle, { backgroundColor: dynamicBg, borderColor: dynamicBorder }]}
    >
      <View style={[styles.header, isSmallScreen && { marginBottom: 6 }]}>
        <Text style={[styles.title, { color: dynamicTitleColor }, isSmallScreen && { fontSize: 16 }]}>Où allons-nous ?</Text>
        <TouchableOpacity 
          onPress={onClose} 
          style={[styles.closeButton, { backgroundColor: dynamicCloseBtnBg, borderColor: dynamicCloseBtnBorder }]}
        >
          <Ionicons name="close" size={16} color={THEME.COLORS.champagneGold || '#D4AF37'} />
        </TouchableOpacity>
      </View>

      <View style={[styles.inputWrapper, isSmallScreen && { marginBottom: 6 }]}>
        <GlassInput
          placeholder="Ex: Marché de Maféré..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={true}
          icon="search-outline"
        />
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderDot} />
        <Text style={styles.sectionTitle}>
          {searchQuery ? "Résultats" : "Lieux suggérés"}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={dynamicLoaderColor} />
          <Text style={styles.loadingText}>Synchronisation de la carte...</Text>
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: dynamicSubtitleColor }]}>Impossible de charger les lieux pour le moment.</Text>
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
            <Text style={[styles.emptyText, { color: dynamicSubtitleColor }]}>Aucun lieu trouvé pour "{searchQuery}"</Text>
          )}
        />
      )}
    </GlassModal>
  );
};

const styles = StyleSheet.create({
  modalStyle: {
    padding: 14,
    borderWidth: 1.5,
    borderRadius: 22,
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
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 2,
  },
  sectionHeaderDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: THEME.COLORS.champagneGold || '#D4AF37',
    marginRight: 6,
  },
  sectionTitle: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: THEME.COLORS.champagneGold || '#D4AF37', 
    letterSpacing: 1.2, 
    textTransform: 'uppercase',
  },
  listContainer: {
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  suggestionTextContainer: {
    flex: 1,
  },
  mainText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  secondaryText: {
    fontSize: 11,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  centerContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: THEME.COLORS.champagneGold,
    marginTop: 10,
    fontSize: 13,
    fontWeight: '500',
  }
});

export default DestinationSearchModal;