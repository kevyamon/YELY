// src/components/ui/DestinationSearchModal.jsx
// MODALE DE RECHERCHE - Connectée aux POI de Maféré

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';
import { MAFERE_POIS } from '../../utils/maferePOIs'; // 🚀 IMPORT DU NOUVEAU FICHIER

const DestinationSearchModal = ({ visible, onClose, onDestinationSelect }) => {
  const [searchText, setSearchText] = useState('');

  // 🚀 LOGIQUE : Filtre les POIs en fonction de la recherche du client
  const filteredPOIs = MAFERE_POIS.filter(poi =>
    poi.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.poiItem}
      onPress={() => {
        onDestinationSelect({
          address: item.name,
          latitude: item.latitude,
          longitude: item.longitude
        });
        setSearchText(''); // On nettoie pour la prochaine fois
        onClose();
      }}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.iconColor ? `${item.iconColor}15` : 'rgba(212, 175, 55, 0.1)' }]}>
        <Ionicons name={item.icon || "location"} size={22} color={item.iconColor || THEME.COLORS.champagneGold} />
      </View>
      <View style={styles.poiInfo}>
        <Text style={styles.poiName}>{item.name}</Text>
        <Text style={styles.poiSub}>Maféré, Côte d'Ivoire</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={THEME.COLORS.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
        <View style={styles.modalContent}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={THEME.COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Où allez-vous ?</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={20} color={THEME.COLORS.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Ex: Marché de Maféré..."
              placeholderTextColor={THEME.COLORS.textTertiary}
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
          </View>

          <View style={styles.listContainer}>
            <Text style={styles.sectionTitle}>Lieux connus à Maféré</Text>
            <FlatList
              data={filteredPOIs}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={() => (
                <Text style={styles.emptyText}>Aucun lieu trouvé pour "{searchText}"</Text>
              )}
            />
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: THEME.COLORS.background, height: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: THEME.SPACING.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.SPACING.xl },
  closeButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.COLORS.glassSurface, borderRadius: 12, paddingHorizontal: 12, height: 50, borderWidth: 1, borderColor: THEME.COLORS.border, marginBottom: THEME.SPACING.lg },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: THEME.COLORS.textPrimary, fontSize: 16 },
  listContainer: { flex: 1 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: THEME.COLORS.textSecondary, letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  poiItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: THEME.COLORS.glassBorder },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  poiInfo: { flex: 1 },
  poiName: { fontSize: 16, fontWeight: 'bold', color: THEME.COLORS.textPrimary, marginBottom: 2 },
  poiSub: { fontSize: 12, color: THEME.COLORS.textTertiary },
  emptyText: { textAlign: 'center', color: THEME.COLORS.textTertiary, marginTop: 20, fontStyle: 'italic' }
});

export default DestinationSearchModal;