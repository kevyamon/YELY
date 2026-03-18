// src/components/admin/IconPickerModal.jsx
// PICKER DYNAMIQUE - Zéro Hardcodage, Aspiration Native
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';
import GlassModal from '../ui/GlassModal';

// LE TRICK SENIOR++ : On aspire TOUT le dictionnaire interne de la librairie au démarrage.
// Aucune icône n'est tapée à la main. On a instantanément accès aux ~1300 icônes Ionicons.
// Si glyphMap n'est pas dispo, on fallback sur un tableau vide, mais dans Expo c'est garanti.
const ALL_ICONS = Ionicons.glyphMap ? Object.keys(Ionicons.glyphMap) : [];

const IconPickerModal = ({ visible, onClose, onSelectIcon }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Moteur de recherche hyper-optimisé en mémoire
  const filteredIcons = useMemo(() => {
    // Si la recherche est vide, on n'affiche que 60 icônes pour éviter de faire ramer le téléphone
    if (!searchQuery) return ALL_ICONS.slice(0, 60); 
    
    // Sinon, on filtre en direct sur les 1300+ icônes
    return ALL_ICONS.filter(name => 
      name.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 100);
  }, [searchQuery]);

  const openExpoDirectory = () => {
    // Si l'admin veut voir tout le catalogue visuellement sur grand écran
    Linking.openURL('https://icons.expo.fyi/Index?iconFamily=Ionicons');
  };

  const renderIconItem = ({ item }) => (
    <TouchableOpacity style={styles.iconItem} onPress={() => {
      onSelectIcon(item);
      onClose();
    }}>
      <Ionicons name={item} size={32} color={THEME.COLORS.champagneGold} />
      <Text style={styles.iconName} numberOfLines={1} ellipsizeMode="tail">{item}</Text>
    </TouchableOpacity>
  );

  return (
    <GlassModal visible={visible} onClose={onClose} title="Choisir une icône">
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={THEME.COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher (ex: car, hospital, food...)"
          placeholderTextColor={THEME.COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity style={styles.webLinkButton} onPress={openExpoDirectory}>
        <Ionicons name="globe-outline" size={18} color={THEME.COLORS.textPrimary} />
        <Text style={styles.webLinkText}>Explorer le catalogue complet (Web)</Text>
      </TouchableOpacity>

      <FlatList
        data={filteredIcons}
        keyExtractor={(item) => item}
        renderItem={renderIconItem}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucune icône trouvée pour "{searchQuery}"</Text>
        }
      />
    </GlassModal>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    color: THEME.COLORS.textPrimary,
    paddingVertical: 12,
    fontSize: 16,
  },
  webLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  webLinkText: {
    color: THEME.COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  listContainer: { paddingBottom: 20 },
  iconItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)',
    aspectRatio: 1,
  },
  iconName: {
    color: THEME.COLORS.textSecondary,
    fontSize: 10,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: THEME.COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  }
});

export default IconPickerModal;