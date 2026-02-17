// src/components/ui/DestinationSearchModal.jsx
// MODALE DE RECHERCHE - Phase 4 (UX Pivot : Remplacement du BottomSheet)

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MapService from '../../services/mapService';
import THEME from '../../theme/theme';
import GlassInput from './GlassInput';
import GlassModal from './GlassModal'; // Utilisation de ton composant premium

const DestinationSearchModal = ({ visible, onClose, onDestinationSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fonction de recherche via OpenStreetMap
  const handleTextChange = async (text) => {
    setSearchQuery(text);
    if (text.length > 2) {
      setIsLoading(true);
      try {
        const results = await MapService.getPlaceSuggestions(text);
        setSuggestions(results);
      } catch (error) {
        console.error("Erreur Autocomplete:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSuggestions([]); 
    }
  };

  // Lors de la sélection d'une adresse
  const handleSelectPlace = (item) => {
    Keyboard.dismiss(); // Baisse le clavier
    
    // Ferme la modale via le parent
    onClose(); 
    
    // Envoie les données au parent pour tracer la route
    onDestinationSelect({
      address: item.mainText,
      fullAddress: item.description,
      latitude: item.latitude,
      longitude: item.longitude
    });
    
    // Nettoyage pour la prochaine ouverture
    setSearchQuery('');
    setSuggestions([]);
  };

  const renderSuggestionItem = useCallback(({ item }) => (
    <TouchableOpacity 
      style={styles.suggestionItem} 
      onPress={() => handleSelectPlace(item)}
    >
      <View style={styles.suggestionIcon}>
        <Ionicons name="location" size={20} color={THEME.COLORS.champagneGold} />
      </View>
      <View style={styles.suggestionTextContainer}>
        <Text style={styles.mainText} numberOfLines={1}>{item.mainText}</Text>
        <Text style={styles.secondaryText} numberOfLines={1}>{item.secondaryText}</Text>
      </View>
    </TouchableOpacity>
  ), []);

  return (
    <GlassModal
      visible={visible}
      onClose={onClose}
      position="top" // S'affiche en haut pour éviter le clavier
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
          placeholder="Rechercher une destination..."
          value={searchQuery}
          onChangeText={handleTextChange}
          autoFocus={true} // Ouvre le clavier directement
          icon="search-outline"
        />
        {isLoading && (
           <ActivityIndicator 
             style={styles.loader} 
             size="small" 
             color={THEME.COLORS.champagneGold} 
           />
        )}
      </View>

      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        renderItem={renderSuggestionItem}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled" // Permet de cliquer même si le clavier est ouvert
        style={styles.listContainer}
        ListEmptyComponent={() => (
          searchQuery.length > 2 && !isLoading ? (
            <Text style={styles.emptyText}>Aucun résultat trouvé.</Text>
          ) : null
        )}
      />
    </GlassModal>
  );
};

const styles = StyleSheet.create({
  modalStyle: {
    padding: THEME.LAYOUT.spacing.md,
    maxHeight: '80%', // Empêche la modale de prendre tout l'écran
    marginTop: 50, // Laisse un peu de place en haut
    backgroundColor: THEME.COLORS.glassDark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.LAYOUT.spacing.md,
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
    position: 'relative',
    marginBottom: THEME.LAYOUT.spacing.md,
  },
  loader: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  listContainer: {
    // Si la liste est longue, on limite sa taille pour garder le scroll interne propre
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
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
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