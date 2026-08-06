// src/components/marketplace/CategoriesModal.jsx
// MODALE CATEGORIES MARKETPLACE - Zero Latence & Ultra-Fluide
// CSCSM Level: Bank Grade / React.memo Optimized

import React, { memo, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Platform 
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import THEME from '../../theme/theme';

const CATEGORY_ITEMS = [
  { key: 'Food', label: 'Nourriture', icon: 'food-apple', color: '#E67E22', bg: 'rgba(230, 126, 34, 0.12)', border: 'rgba(230, 126, 34, 0.4)' },
  { key: 'Supermarket', label: 'Supermarché', icon: 'cart', color: '#27AE60', bg: 'rgba(39, 174, 96, 0.12)', border: 'rgba(39, 174, 96, 0.4)' },
  { key: 'Cosmetics', label: 'Cosmétiques', icon: 'lipstick', color: '#9B59B6', bg: 'rgba(155, 89, 182, 0.12)', border: 'rgba(155, 89, 182, 0.4)' },
  { key: 'Electronics', label: 'Électronique', icon: 'laptop', color: '#2980B9', bg: 'rgba(41, 128, 185, 0.12)', border: 'rgba(41, 128, 185, 0.4)' },
  { key: 'Home', label: 'Maison & Déco', icon: 'home-variant', color: '#F1C40F', bg: 'rgba(241, 196, 15, 0.12)', border: 'rgba(241, 196, 15, 0.4)' },
  { key: 'Fashion', label: 'Mode & Chaussures', icon: 'tshirt-crew', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.4)' },
  { key: 'Sports', label: 'Sport & Loisirs', icon: 'soccer', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.4)' },
  { key: 'Tools', label: 'Bricolage & Outils', icon: 'hammer-wrench', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.4)' },
  { key: 'Toys', label: 'Jeux & Jouets', icon: 'toy-brick', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.4)' },
  { key: 'Automotive', label: 'Auto & Accessoires', icon: 'car-sports', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.4)' },
  { key: 'Office', label: 'Bureau & Papeterie', icon: 'lead-pencil', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.4)' },
  { key: 'Other', label: 'Autres', icon: 'dots-horizontal', color: '#95A5A6', bg: 'rgba(149, 165, 166, 0.12)', border: 'rgba(149, 165, 166, 0.4)' }
];

const CategoriesModal = memo(({
  isVisible,
  onClose,
  selectedCategoryFilter,
  handleSelectCategory,
}) => {
  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalCardContainer} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Catégories</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={THEME.COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalGrid}>
            <TouchableOpacity
              style={[
                styles.modalCatItem, 
                !selectedCategoryFilter && styles.modalCatItemActive
              ]}
              onPress={() => handleSelectCategory(null)}
              activeOpacity={0.7}
            >
              <View style={[styles.modalCatIconBg, { backgroundColor: 'rgba(214, 175, 55, 0.15)' }]}>
                <MaterialCommunityIcons name="all-inclusive" size={22} color={THEME.COLORS.primary} />
              </View>
              <Text 
                style={[styles.modalCatLabel, !selectedCategoryFilter && { color: THEME.COLORS.primary }]}
                numberOfLines={1}
              >
                Tout voir
              </Text>
            </TouchableOpacity>

            {CATEGORY_ITEMS.map((item) => {
              const isSelected = selectedCategoryFilter === item.key;

              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.modalCatItem, 
                    isSelected && { backgroundColor: item.bg, borderColor: item.border }
                  ]}
                  onPress={() => handleSelectCategory(item.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.modalCatIconBg, { backgroundColor: item.bg }]}>
                    <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
                  </View>
                  <Text 
                    style={[styles.modalCatLabel, isSelected && { color: item.color }]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
    ...Platform.select({
      web: {
        justifyContent: 'center',
        alignItems: 'center',
      }
    })
  },
  modalCardContainer: {
    backgroundColor: THEME.COLORS.glassModal,
    borderTopLeftRadius: THEME.BORDERS.radius.xxl,
    borderTopRightRadius: THEME.BORDERS.radius.xxl,
    padding: THEME.SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : THEME.SPACING.xxl,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    ...Platform.select({
      web: {
        borderRadius: THEME.BORDERS.radius.xl,
        width: '90%',
        maxWidth: 500,
      }
    })
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SPACING.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalCatItem: {
    width: '30%',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: THEME.BORDERS.radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
  },
  modalCatItemActive: {
    borderColor: THEME.COLORS.primary,
    backgroundColor: 'rgba(214, 175, 55, 0.12)',
  },
  modalCatIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalCatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.COLORS.textPrimary,
    textAlign: 'center',
    width: '100%',
  },
  closeButton: {
    padding: THEME.SPACING.xs,
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
  }
});

export default CategoriesModal;
