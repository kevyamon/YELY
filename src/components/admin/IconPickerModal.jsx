// src/components/admin/IconPickerModal.jsx
// PICKER UNIVERSEL - 5 Familles, 15 000+ Icônes
// CSCSM Level: Bank Grade

import { AntDesign, Feather, FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';
import GlassModal from '../ui/GlassModal';

// Dictionnaire global des familles
export const ICON_FAMILIES = {
  Ionicons,
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
  AntDesign
};

// Fusion de tous les dictionnaires (Ex: "FontAwesome5/car")
const ALL_ICONS = [];
Object.keys(ICON_FAMILIES).forEach(familyName => {
  const familyComponent = ICON_FAMILIES[familyName];
  if (familyComponent.glyphMap) {
    Object.keys(familyComponent.glyphMap).forEach(iconName => {
      ALL_ICONS.push(`${familyName}/${iconName}`);
    });
  }
});

const IconPickerModal = ({ visible, onClose, onSelectIcon }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIcons = useMemo(() => {
    if (!searchQuery) return ALL_ICONS.slice(0, 40); // Limite stricte pour la RAM
    const lowerQuery = searchQuery.toLowerCase();
    
    return ALL_ICONS.filter(fullName => 
      fullName.toLowerCase().includes(lowerQuery)
    ).slice(0, 100);
  }, [searchQuery]);

  const openExpoDirectory = () => {
    Linking.openURL('https://icons.expo.fyi/Index');
  };

  const renderIconItem = ({ item }) => {
    const [familyName, iconName] = item.split('/');
    const IconComponent = ICON_FAMILIES[familyName];

    return (
      <TouchableOpacity style={styles.iconItem} onPress={() => {
        onSelectIcon(item); // Envoie "Famille/Nom" à la base de données
        onClose();
      }}>
        <IconComponent name={iconName} size={28} color={THEME.COLORS.champagneGold} />
        <Text style={styles.iconName} numberOfLines={1}>{iconName}</Text>
        <Text style={styles.familyName} numberOfLines={1}>{familyName}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <GlassModal visible={visible} onClose={onClose} title="Catalogue Multi-Familles">
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={THEME.COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Chercher (ex: hospital, car...)"
          placeholderTextColor={THEME.COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity style={styles.webLinkButton} onPress={openExpoDirectory}>
        <Ionicons name="information-circle-outline" size={18} color={THEME.COLORS.textPrimary} />
        <Text style={styles.webLinkText}>Voir le catalogue global Expo</Text>
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

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Fermer</Text>
      </TouchableOpacity>
    </GlassModal>
  );
};

const styles = StyleSheet.create({
  // ... (Garde exactement les mêmes styles que dans mon message précédent)
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, paddingHorizontal: 15, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: THEME.COLORS.textPrimary, paddingVertical: 12, fontSize: 16 },
  webLinkButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(212, 175, 55, 0.15)', paddingVertical: 10, borderRadius: 8, marginBottom: 15, gap: 8 },
  webLinkText: { color: THEME.COLORS.textPrimary, fontSize: 12, fontWeight: '600' },
  listContainer: { paddingBottom: 10 },
  iconItem: { flex: 1, alignItems: 'center', justifyContent: 'center', margin: 5, padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.02)', aspectRatio: 1 },
  iconName: { color: THEME.COLORS.textSecondary, fontSize: 10, marginTop: 8, textAlign: 'center', fontWeight: 'bold' },
  familyName: { color: 'rgba(255,255,255,0.3)', fontSize: 8, marginTop: 2, textAlign: 'center' },
  emptyText: { color: THEME.COLORS.textSecondary, textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  closeButton: { backgroundColor: 'rgba(231, 76, 60, 0.2)', borderWidth: 1, borderColor: THEME.COLORS.error, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  closeButtonText: { color: THEME.COLORS.error, fontWeight: 'bold', fontSize: 16 }
});

export default IconPickerModal;