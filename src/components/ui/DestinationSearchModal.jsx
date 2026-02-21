// src/components/ui/DestinationSearchModal.jsx
// MODALE DE RECHERCHE - UX Liquid Glass (iOS 26) + POIs Locaux
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { FlatList, Keyboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import THEME from '../../theme/theme';
import { MAFERE_POIS } from '../../utils/maferePOIs'; // 🚀 IMPORT DES LIEUX EN DUR
import GlassInput from './GlassInput';
import GlassModal from './GlassModal';

const DestinationSearchModal = ({ visible, onClose, onDestinationSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // 🚀 LOGIQUE MÉTIER : On filtre nos lieux en dur selon la saisie
  const filteredPOIs = MAFERE_POIS.filter(poi =>
    poi.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Lors de la sélection d'une adresse
  const handleSelectPlace = (item) => {
    Keyboard.dismiss(); // Baisse le clavier
    
    // Envoie les données au parent pour tracer la route
    onDestinationSelect({
      address: item.name,
      latitude: item.latitude,
      longitude: item.longitude
    });
    
    // Nettoyage pour la prochaine ouverture
    setSearchQuery('');
    
    // Ferme la modale via le parent
    onClose(); 
  };

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
  ), []);

  return (
    <GlassModal
      visible={visible}
      onClose={onClose}
      position="top" // 🚀 L'EFFET PREMIUM : S'affiche en haut et floute le fond
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
          autoFocus={true} // Ouvre le clavier directement
          icon="search-outline"
        />
      </View>

      <Text style={styles.sectionTitle}>Lieux connus</Text>

      <FlatList
        data={filteredPOIs}
        keyExtractor={(item) => item.id}
        renderItem={renderSuggestionItem}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled" // Permet de cliquer même si le clavier est ouvert
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>Aucun lieu trouvé pour "{searchQuery}"</Text>
        )}
      />
    </GlassModal>
  );
};

const styles = StyleSheet.create({
  modalStyle: {
    padding: THEME.SPACING.md,
    maxHeight: '85%', // Empêche la modale de prendre tout l'écran
    marginTop: 60, // Laisse la place à l'encoche du téléphone (Notch)
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
  }
});

export default DestinationSearchModal;