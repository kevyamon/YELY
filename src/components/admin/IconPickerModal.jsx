// src/components/admin/IconPickerModal.jsx

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import THEME from '../../theme/theme';
import GlassInput from '../ui/GlassInput';

// DICTIONNAIRE INTELLIGENT ULTRA-COMPLET
// Base de donnees massive d'icones avec vocabulaire local et synonymes.
const AVAILABLE_ICONS = [
  // Transports
  { name: 'car', tags: 'voiture auto taxi vehicule parking woro-woro yango uber vtc' },
  { name: 'bus', tags: 'bus transport car autocar station gbaka sotra gare voyage' },
  { name: 'airplane', tags: 'avion vol aeroport voyage ciel piste' },
  { name: 'boat', tags: 'bateau navire port mer lac pinasse eau' },
  { name: 'train', tags: 'train metro gare chemin fer wagon' },
  { name: 'bicycle', tags: 'velo bicyclette cycliste sport' },
  { name: 'walk', tags: 'marche pieton promeneur' },

  // Lieux & Navigation
  { name: 'location', tags: 'lieu position adresse gps point repere carte' },
  { name: 'pin', tags: 'epingle marqueur repere' },
  { name: 'map', tags: 'carte plan ville' },
  { name: 'compass', tags: 'boussole direction nord sud est ouest' },
  { name: 'navigate', tags: 'navigation trajet itineraire' },

  // Restauration & Boissons
  { name: 'restaurant', tags: 'restaurant manger nourriture plat resto allocodrome garba garbadrome faim' },
  { name: 'fast-food', tags: 'fast-food hamburger burger macdo frites chawarma' },
  { name: 'pizza', tags: 'pizza pizzeria italie four' },
  { name: 'cafe', tags: 'cafe boire boisson bar tasse kiosque the dejeuner' },
  { name: 'beer', tags: 'biere alcool bar maquis pub boisson cave fete' },
  { name: 'wine', tags: 'vin cave alcool bar maquis boisson bouteille' },
  { name: 'water', tags: 'eau goutte fontaine source soif pompe' },
  { name: 'nutrition', tags: 'nutrition dietetique sain legume fruit' },
  { name: 'ice-cream', tags: 'glace dessert sucre glacier' },

  // Sante & Securite
  { name: 'medkit', tags: 'sante pharmacie hopital medecin soin urgence trousse chu clinique dispensaire' },
  { name: 'medical', tags: 'croix hopital centre medical soin' },
  { name: 'pulse', tags: 'pouls coeur battement vie' },
  { name: 'shield', tags: 'bouclier securite police gendarmerie commissariat garde protection' },
  { name: 'shield-checkmark', tags: 'securise valide sur' },
  { name: 'warning', tags: 'attention danger alerte urgence risque' },

  // Commerces & Argent
  { name: 'cart', tags: 'panier courses supermarche achat magasin marche mall hypermarche' },
  { name: 'basket', tags: 'panier courses marche boutique epicerie' },
  { name: 'bag', tags: 'sac boutique shopping sachet' },
  { name: 'storefront', tags: 'boutique magasin echoppe commerce vitrine' },
  { name: 'wallet', tags: 'portefeuille argent paiement tresor caisse' },
  { name: 'cash', tags: 'billet argent espece banque guichet atm distributeur monnaie' },
  { name: 'card', tags: 'carte bancaire credit visa mastercard paiement tpe' },
  { name: 'pricetag', tags: 'prix etiquette solde promotion' },

  // Education & Administration
  { name: 'school', tags: 'ecole universite lycee education college campus faculte institut' },
  { name: 'library', tags: 'bibliotheque livre lecture etude' },
  { name: 'book', tags: 'livre cahier manuel' },
  { name: 'business', tags: 'entreprise immeuble bureau societe mairie ministere prefecture institution batiment' },
  { name: 'briefcase', tags: 'valise travail emploi affaire patron' },

  // Religion & Domicile
  { name: 'home', tags: 'maison domicile residence foyer' },
  { name: 'add', tags: 'croix eglise temple paroisse religion plus ajout catholique chretien' },
  { name: 'moon', tags: 'lune nuit soiree islam mosquee musulman' },
  { name: 'bed', tags: 'lit hotel dormir repos chambre auberge motel' },

  // Nature & Animaux
  { name: 'leaf', tags: 'feuille nature ecologie arbre foret plante' },
  { name: 'flower', tags: 'fleur parc jardin plante botanique' },
  { name: 'paw', tags: 'patte animal chien chat veterinaire zoo bête' },
  { name: 'sunny', tags: 'soleil meteo jour chaud plage lumiere' },
  { name: 'partly-sunny', tags: 'nuage eclaircie meteo' },
  { name: 'rainy', tags: 'pluie parapluie averse eau' },
  { name: 'earth', tags: 'terre monde globe planete pays' },

  // Sport & Divertissement
  { name: 'fitness', tags: 'sport fitness musculation salle gym' },
  { name: 'football', tags: 'football ballon sport stade match' },
  { name: 'basketball', tags: 'basketball ballon sport' },
  { name: 'tennisball', tags: 'tennis balle sport' },
  { name: 'trophy', tags: 'trophee coupe victoire sport stade champion' },
  { name: 'medal', tags: 'medaille recompense or' },
  { name: 'game-controller', tags: 'jeu video console jouer arcade' },
  { name: 'musical-notes', tags: 'musique note concert spectacle fete' },
  { name: 'headset', tags: 'casque ecouteur musique son' },
  { name: 'radio', tags: 'radio emission frequence' },

  // Objets & Outils
  { name: 'camera', tags: 'appareil photo photographie studio image' },
  { name: 'videocam', tags: 'video camera film cinema tournage' },
  { name: 'cut', tags: 'ciseaux coiffeur salon beaute tresse couture' },
  { name: 'shirt', tags: 'vetement chemise boutique mode couturier tailleur friperie' },
  { name: 'glasses', tags: 'lunettes vue opticien soleil' },
  { name: 'watch', tags: 'montre heure temps bijoutier' },
  { name: 'construct', tags: 'travaux chantier construction outil reparation garage' },
  { name: 'hammer', tags: 'marteau bricolage menuisier' },
  { name: 'key', tags: 'cle serrure securite' },
  { name: 'lock-closed', tags: 'cadenas ferme securite' },

  // Communication & Tech
  { name: 'call', tags: 'telephone appel contact cabine numero' },
  { name: 'mail', tags: 'courrier poste lettre message email' },
  { name: 'chatbubbles', tags: 'discussion message sms forum' },
  { name: 'phone-portrait', tags: 'smartphone portable mobile' },
  { name: 'desktop', tags: 'ordinateur pc bureau cyber' },
  { name: 'laptop', tags: 'ordinateur portable laptop tech' },
  { name: 'wifi', tags: 'wifi internet connexion reseau' },

  // Personnes & Divers
  { name: 'people', tags: 'foule groupe assemblee reunion public' },
  { name: 'person', tags: 'personne humain homme femme client' },
  { name: 'body', tags: 'corps humain personne pieton' },
  { name: 'star', tags: 'etoile favori monument tourisme' },
  { name: 'heart', tags: 'coeur amour sante vie' },
  { name: 'information-circle', tags: 'information info aide renseignement accueil' },
  { name: 'help-circle', tags: 'aide question support' }
];

// L'ALGORITHME DE NETTOYAGE
// Cette fonction enleve tous les accents d'un mot et le met en minuscule.
// Exemple: "Eglise" devient "eglise"
const normalizeString = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

const IconPickerModal = ({ visible, onClose, onSelect }) => {
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(() => {
    const query = normalizeString(search);
    
    // Si la barre de recherche est vide, on affiche tout
    if (!query) return AVAILABLE_ICONS;
    
    // Sinon, on cherche dans notre dictionnaire nettoye
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
            <Text style={styles.title}>Choisir une icone</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close-circle" size={28} color={THEME.COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrapper}>
            <GlassInput
              placeholder="Ex: eglise, maquis, ecole, gbaka..."
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
              <Text style={styles.emptyText}>Aucune icone trouvee pour "{search}"</Text>
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