// src/components/marketplace/CategoriesModal.jsx
// NOUVEAU COMPOSANT CATEGORIES - Reconstruit à zéro (0ms Latence, 1-Clic Auto Close)
// CSCSM Level: Masterpiece Clean Code / Bank Grade

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ScrollView,
  Platform 
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import THEME from '../../theme/theme';

const CATEGORIES_LIST = [
  { id: null, label: 'Toutes les catégories', icon: 'all-inclusive', color: THEME.COLORS.primary },
  { id: 'Food', label: 'Nourriture & Repas', icon: 'food-apple', color: '#E67E22' },
  { id: 'Supermarket', label: 'Supermarché', icon: 'cart', color: '#27AE60' },
  { id: 'Cosmetics', label: 'Cosmétiques & Beauté', icon: 'lipstick', color: '#9B59B6' },
  { id: 'Electronics', label: 'Électronique & High-Tech', icon: 'laptop', color: '#2980B9' },
  { id: 'Home', label: 'Maison & Décoration', icon: 'home-variant', color: '#F1C40F' },
  { id: 'Fashion', label: 'Mode & Chaussures', icon: 'tshirt-crew', color: '#EC4899' },
  { id: 'Sports', label: 'Sport & Loisirs', icon: 'soccer', color: '#3B82F6' },
  { id: 'Tools', label: 'Bricolage & Outils', icon: 'hammer-wrench', color: '#F59E0B' },
  { id: 'Toys', label: 'Jeux & Jouets', icon: 'toy-brick', color: '#10B981' },
  { id: 'Automotive', label: 'Auto & Accessoires', icon: 'car-sports', color: '#EF4444' },
  { id: 'Office', label: 'Bureau & Papeterie', icon: 'lead-pencil', color: '#6366F1' },
  { id: 'Other', label: 'Autres Catégories', icon: 'dots-horizontal', color: '#95A5A6' }
];

export default function CategoriesModal({ isVisible, onClose, selectedCategoryFilter, handleSelectCategory }) {
  if (!isVisible) return null;

  const onSelect = (catId) => {
    handleSelectCategory(catId);
    onClose();
  };

  return (
    <Modal visible={isVisible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheetContainer} onStartShouldSetResponder={() => true}>
          <View style={styles.topPill} />
          
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Catégories</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
            {CATEGORIES_LIST.map((item) => {
              const isSelected = selectedCategoryFilter === item.id;
              return (
                <TouchableOpacity
                  key={item.id || 'all'}
                  style={[styles.itemRow, isSelected && styles.itemRowActive]}
                  onPress={() => onSelect(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconBox, { backgroundColor: isSelected ? 'rgba(214, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.05)' }]}>
                    <MaterialCommunityIcons name={item.icon} size={22} color={isSelected ? THEME.COLORS.primary : item.color} />
                  </View>
                  
                  <Text style={[styles.itemLabel, isSelected && styles.itemLabelActive]}>
                    {item.label}
                  </Text>

                  {isSelected && <Ionicons name="checkmark" size={20} color={THEME.COLORS.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
    ...Platform.select({
      web: { justifyContent: 'center', alignItems: 'center' }
    })
  },
  sheetContainer: {
    backgroundColor: '#121418',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: THEME.SPACING.lg,
    paddingTop: THEME.SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 36 : THEME.SPACING.xl,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      web: { borderRadius: 16, width: '90%', maxWidth: 440, maxHeight: '80%' }
    })
  },
  topPill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: THEME.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: THEME.SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 4,
    ...Platform.select({ web: { cursor: 'pointer' } })
  },
  list: {
    paddingBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    ...Platform.select({ web: { cursor: 'pointer' } })
  },
  itemRowActive: {
    backgroundColor: 'rgba(214, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(214, 175, 55, 0.3)',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  itemLabelActive: {
    color: THEME.COLORS.primary,
    fontWeight: '900',
  }
});
