// src/components/ui/DestinationSearchSheet.jsx
// LE TIROIR DE RECHERCHE - Phase 4 (Version OpenStreetMap)
// S'ouvre avec un effet Spring pour permettre au Rider de taper sa destination.

import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Keyboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MapService from '../../services/mapService';
import THEME from '../../theme/theme';
import GlassInput from './GlassInput';

/**
 * Composant Bottom Sheet pour la recherche de destination.
 */
const DestinationSearchSheet = forwardRef(({ onDestinationSelect }, ref) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const snapPoints = useMemo(() => ['25%', '85%'], []);

  // CORRECTION UX : Backdrop plus sombre pour un meilleur focus
  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0} // Commence à apparaître dès le premier niveau d'ouverture
        disappearsOnIndex={-1}
        opacity={0.7} // Opacité augmentée pour un effet plus "focus" (0.5 -> 0.7)
      />
    ),
    []
  );

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

  // Lors du clic sur une suggestion
  const handleSelectPlace = (item) => {
    Keyboard.dismiss(); 
    
    // On referme le tiroir
    if (ref && ref.current) {
      ref.current.collapse(); 
    }
    
    // On envoie directement les coordonnées au parent
    onDestinationSelect({
      address: item.mainText,
      fullAddress: item.description,
      latitude: item.latitude,
      longitude: item.longitude
    });
    
    // Nettoyage de l'interface
    setSearchQuery('');
    setSuggestions([]);
  };

  const renderSuggestionItem = useCallback(({ item }) => (
    <TouchableOpacity 
      style={styles.suggestionItem} 
      onPress={() => handleSelectPlace(item)}
    >
      <View style={styles.suggestionIcon}>
        <Ionicons name="location" size={20} color={THEME.COLORS.textSecondary} />
      </View>
      <View style={styles.suggestionTextContainer}>
        <Text style={styles.mainText} numberOfLines={1}>{item.mainText}</Text>
        <Text style={styles.secondaryText} numberOfLines={1}>{item.secondaryText}</Text>
      </View>
    </TouchableOpacity>
  ), []);

  return (
    <BottomSheet
      ref={ref}
      index={-1} 
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      keyboardBehavior="interactive"
    >
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Où allons-nous ?</Text>

        <View style={styles.inputWrapper}>
          <GlassInput
            placeholder="Rechercher une destination..."
            value={searchQuery}
            onChangeText={handleTextChange}
            autoFocus={false}
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

        <BottomSheetFlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          renderItem={renderSuggestionItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={() => (
            searchQuery.length > 2 && !isLoading ? (
              <Text style={styles.emptyText}>Aucun résultat trouvé en Côte d'Ivoire.</Text>
            ) : null
          )}
        />
      </View>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: THEME.COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    // Ajout d'une ombre portée sur le haut du tiroir pour le détacher du fond sombre
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 10,
  },
  handleIndicator: {
    backgroundColor: THEME.COLORS.border,
    width: 50,
    height: 5,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: THEME.LAYOUT.spacing.lg,
    paddingTop: THEME.LAYOUT.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.COLORS.textPrimary,
    marginBottom: THEME.LAYOUT.spacing.md,
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
  listContent: {
    paddingBottom: 40,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.glassBorder,
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.COLORS.glassSurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  mainText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.COLORS.textPrimary,
    marginBottom: 4,
  },
  secondaryText: {
    fontSize: 14,
    color: THEME.COLORS.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: THEME.COLORS.textTertiary,
    marginTop: 20,
    fontStyle: 'italic',
  }
});

export default DestinationSearchSheet;