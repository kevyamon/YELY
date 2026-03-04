// src/components/ui/DestinationSearchModal.jsx [MODIFIÉ]
// MODALE DE RECHERCHE - UX Liquid Glass + POIs Dynamiques + Limitation de rendu
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import THEME from '../../theme/theme';
import GlassInput from './GlassInput';
import GlassModal from './GlassModal';

// IMPORT DU PONT RÉSEAU 
import { useGetAllPOIsQuery } from '../../store/api/poiApiSlice';

// Fonction utilitaire pour normaliser le texte (retire les accents et met en minuscules)
const normalizeSearchText = (text) => {
  if (!text) return '';
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const DestinationSearchModal = ({ visible, onClose, onDestinationSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // LOGIQUE MÉTIER : Récupération avec forçage de mise à jour à l'ouverture (bypass cache)
  const { data: poiResponse, isLoading, isError } = useGetAllPOIsQuery(undefined, {
    skip: !visible, 
    refetchOnMountOrArgChange: true, 
  });

  const pois = poiResponse?.data || [];

  // Filtrage optimisé, tolérant aux fautes d'accents ET limité en nombre pour la performance
  const filteredPOIs = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery);
    
    // Si le champ de recherche est vide : on affiche seulement 5 lieux maximum
    if (!normalizedQuery) {
      return pois.slice(0, 5);
    }

    // Sinon, on filtre selon la recherche
    const results = pois.filter(poi =>
      normalizeSearchText(poi.name).includes(normalizedQuery)
    );

    // On limite les résultats de recherche à 10 maximum pour protéger la RAM du téléphone
    return results.slice(0, 10);
  }, [pois, searchQuery]);

  // Stabilisation de la fonction de sélection pour éviter les re-rendus inutiles
  const handleSelectPlace = useCallback((item) => {
    Keyboard.dismiss(); 
    
    onDestinationSelect({
      address: item.name,
      latitude: item.latitude,
      longitude: item.longitude
    });
    
    setSearchQuery('');
    onClose(); 
  }, [onDestinationSelect, onClose]);

  const renderSuggestionItem = useCallback(({ item }) => (
    <TouchableOpacity 
      style={styles.suggestionItem} 
      onPress={() => handleSelectPlace(item)}
    >
      <View style={[styles.suggestionIcon, { backgroundColor: item.iconColor ? `${item.iconColor}15` : 'rgba(212, 175, 55, 0.1)' }]}>
        <Ionicons name={item.icon || "location"} size={20} color={item.iconColor || THEME.COLORS.champagneGold} />
      </View>
      <View style={styles.suggestionTextContainer}>
        <Text style={styles.mainText} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.secondaryText} numberOfLines={1}>Maféré, Côte d'Ivoire</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={THEME.COLORS.textTertiary} />
    </TouchableOpacity>
  ), [handleSelectPlace]);

  return (
    <GlassModal
      visible={visible}
      onClose={onClose}
      position="top"
      fullWidth={true}
      style={styles.modalStyle}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Où allons-nous ?</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close-circle" size={28} color={THEME.COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.inputWrapper}>
        <GlassInput
          placeholder="Ex: Marché de Maféré..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={true}
          icon="search-outline"
        />
      </View>

      <Text style={styles.sectionTitle}>
        {searchQuery ? "Résultats" : "Lieux suggérés"}
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
          style={styles.listContainer}
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
    padding: THEME.SPACING.md,
    maxHeight: '85%',
    marginTop: 60,
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
    maxHeight: 400, 
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