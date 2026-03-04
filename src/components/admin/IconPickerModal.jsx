// src/components/admin/IconPickerModal.jsx [MODIFIÉ]
// SÉLECTEUR D'ICÔNES - Moteur de recherche NLP & Dictionnaire Culturel
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import THEME from '../../theme/theme';
import GlassInput from '../ui/GlassInput';

// 🚀 DICTIONNAIRE INTELLIGENT
// Il associe l'icône technique à une multitude de mots-clés, y compris le vocabulaire local.
const AVAILABLE_ICONS = [
  { name: 'location', tags: 'lieu position adresse gps point repere' },
  { name: 'pin', tags: 'epingle marqueur repere' },
  { name: 'map', tags: 'carte plan ville' },
  { name: 'bus', tags: 'bus transport car autocar station gbaka sotra gare' },
  { name: 'car', tags: 'voiture auto taxi vehicule parking woro-woro yango uber' },
  { name: 'airplane', tags: 'avion vol aeroport voyage' },
  { name: 'boat', tags: 'bateau navire port mer lac pinasse' },
  { name: 'restaurant', tags: 'restaurant manger nourriture plat resto allocodrome garba garbadrome' },
  { name: 'cafe', tags: 'cafe boire boisson bar tasse kiosque the' },
  { name: 'beer', tags: 'biere alcool bar maquis pub boisson cave' },
  { name: 'wine', tags: 'vin cave alcool bar maquis boisson' },
  { name: 'fast-food', tags: 'fast-food hamburger burger macdo frites chawarma' },
  { name: 'pizza', tags: 'pizza pizzeria italie' },
  { name: 'water', tags: 'eau goutte fontaine source' },
  { name: 'medkit', tags: 'sante pharmacie hopital medecin soin urgence trousse chu clinique dispensaire' },
  { name: 'fitness', tags: 'sport fitness musculation salle' },
  { name: 'heart', tags: 'coeur amour sante vie' },
  { name: 'cart', tags: 'panier courses supermarche achat magasin marché marche mall' },
  { name: 'basket', tags: 'panier courses marche boutique epicerie' },
  { name: 'bag', tags: 'sac boutique shopping' },
  { name: 'wallet', tags: 'portefeuille argent paiement banque tresor' },
  { name: 'cash', tags: 'billet argent espece banque guichet atm' },
  { name: 'card', tags: 'carte bancaire credit visa mastercard paiement' },
  { name: 'school', tags: 'ecole universite lycee education college campus faculte' },
  { name: 'library', tags: 'bibliotheque livre lecture' },
  { name: 'business', tags: 'entreprise immeuble bureau societe mairie ministere prefecture' },
  { name: 'home', tags: 'maison domicile residence foyer eglise temple mosquee paroisse religion' },
  { name: 'bed', tags: 'lit hotel dormir repos chambre auberge motel' },
  { name: 'leaf', tags: 'feuille nature ecologie arbre foret' },
  { name: 'flower', tags: 'fleur parc jardin plante botanique' },
  { name: 'paw', tags: 'patte animal chien chat veterinaire zoo' },
  { name: 'sunny', tags: 'soleil meteo jour chaud plage' },
  { name: 'moon', tags: 'lune nuit soiree' },
  { name: 'construct', tags: 'travaux chantier construction outil reparation garage' },
  { name: 'cut', tags: 'ciseaux coiffeur salon beaute tresse' },
  { name: 'shirt', tags: 'vetement chemise boutique mode couturier tailleur friperie' },
  { name: 'key', tags: 'cle serrure securite' },
  { name: 'camera', tags: 'appareil photo photographie studio' },
  { name: 'musical-notes', tags: 'musique note concert spectacle' },
  { name: 'game-controller', tags: 'jeu video console jouer arcade' },
  { name: 'trophy', tags: 'trophee coupe victoire sport stade' },
  { name: 'star', tags: 'etoile favori monument tourisme' },
  { name: 'shield', tags: 'bouclier securite police gendarmerie commissariat garde' },
  { name: 'warning', tags: 'attention danger alerte urgence' },
  { name: 'information-circle', tags: 'information info aide renseignement accueil' }
];

// 🚀 L'ALGORITHME DE NETTOYAGE
// Cette fonction enlève tous les accents d'un mot et le met en minuscule.
// Exemple: "Églisé" devient "eglise"
const normalizeString = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

const IconPickerModal = ({ visible, onClose, onSelect }) => {
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(() => {
    const query = normalizeString(search);
    
    // Si la barre de recherche est vide, on affiche tout
    if (!query) return AVAILABLE_ICONS;
    
    // Sinon, on cherche dans notre dictionnaire nettoyé
    return AVAILABLE_ICONS.filter(icon => {
      const normalizedName = normalizeString(icon.name);
      const normalizedTags = normalizeString(icon.tags);
      
      return normalizedName.includes(query) || normalizedTags.includes(query);
    });
  }, [search]);

  const handleSelect = (iconName) => {
    onSelect(iconName);
    setSearch('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Choisir une icône</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close-circle" size={28} color={THEME.COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrapper}>
            <GlassInput
              placeholder="Ex: église, maquis, école, gbaka..."
              value={search}
              onChangeText={setSearch}
              icon="search-outline"
            />
          </View>

          <FlatList
            data={filteredIcons}
            keyExtractor={(item) => item.name}
            numColumns={4}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.row}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.iconItem} onPress={() => handleSelect(item.name)}>
                <Ionicons name={item.name} size={30} color={THEME.COLORS.textPrimary} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Aucune icône trouvée pour "{search}"</Text>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  container: { backgroundColor: THEME.COLORS.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, height: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  closeBtn: { padding: 5 },
  searchWrapper: { marginBottom: 20 },
  row: { justifyContent: 'space-between', marginBottom: 15 },
  iconItem: { width: '22%', aspectRatio: 1, backgroundColor: THEME.COLORS.glassLight, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.COLORS.glassBorder },
  emptyText: { textAlign: 'center', color: THEME.COLORS.textTertiary, marginTop: 40, fontStyle: 'italic' }
});

export default IconPickerModal;