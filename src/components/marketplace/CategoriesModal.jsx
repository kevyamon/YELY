// src/components/marketplace/CategoriesModal.jsx
import React from 'react';
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

const CATEGORY_LABELS = {
  'Food': 'Nourriture',
  'Supermarket': 'Supermarché',
  'Cosmetics': 'Cosmétiques',
  'Electronics': 'Électronique',
  'Home': 'Maison & Déco',
  'Fashion': 'Mode & Chaussures',
  'Sports': 'Sport & Loisirs',
  'Tools': 'Bricolage & Outils',
  'Toys': 'Jeux & Jouets',
  'Automotive': 'Auto & Accessoires',
  'Office': 'Bureau & Papeterie',
  'Other': 'Autres'
};

const CATEGORY_ICONS = {
  'Electronics': { icon: 'laptop', color: '#2980B9' },
  'Cosmetics': { icon: 'lipstick', color: '#9B59B6' },
  'Home': { icon: 'home-variant', color: '#F1C40F' },
  'Food': { icon: 'food-apple', color: '#E67E22' },
  'Supermarket': { icon: 'cart', color: '#27AE60' },
  'Fashion': { icon: 'tshirt-crew', color: '#EC4899' },
  'Sports': { icon: 'soccer', color: '#3B82F6' },
  'Tools': { icon: 'hammer-wrench', color: '#F59E0B' },
  'Toys': { icon: 'toy-brick', color: '#10B981' },
  'Automotive': { icon: 'car-sports', color: '#EF4444' },
  'Office': { icon: 'lead-pencil', color: '#6366F1' },
  'Other': { icon: 'dots-horizontal', color: '#95A5A6' }
};

const CategoriesModal = ({
  isVisible,
  onClose,
  selectedCategoryFilter,
  handleSelectCategory,
}) => {
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalCardContainer}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Catégories</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={THEME.COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalGrid}>
            <TouchableOpacity
              style={[
                styles.modalCatItem, 
                !selectedCategoryFilter && styles.modalCatItemActive,
                {
                  backgroundColor: !selectedCategoryFilter ? 'rgba(214, 175, 55, 0.22)' : 'rgba(255, 255, 255, 0.03)',
                  borderColor: !selectedCategoryFilter ? THEME.COLORS.primary : 'rgba(255, 255, 255, 0.06)'
                }
              ]}
              onPress={() => handleSelectCategory(null)}
            >
              <View style={[styles.modalCatIconBg, { backgroundColor: 'rgba(214, 175, 55, 0.15)' }]}>
                <MaterialCommunityIcons name="all-inclusive" size={24} color={THEME.COLORS.primary} />
              </View>
              <Text 
                style={[styles.modalCatLabel, { color: !selectedCategoryFilter ? THEME.COLORS.primary : THEME.COLORS.textPrimary }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                Tout voir
              </Text>
            </TouchableOpacity>

            {Object.keys(CATEGORY_LABELS).map(key => {
              const label = CATEGORY_LABELS[key];
              const config = CATEGORY_ICONS[key] || { icon: 'package-variant', color: '#95A5A6' };
              const isSelected = selectedCategoryFilter === key;

              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.modalCatItem, 
                    isSelected && styles.modalCatItemActive,
                    {
                      backgroundColor: isSelected ? config.color + '22' : 'rgba(255, 255, 255, 0.03)',
                      borderColor: isSelected ? config.color : 'rgba(255, 255, 255, 0.06)'
                    }
                  ]}
                  onPress={() => handleSelectCategory(key)}
                >
                  <View style={[styles.modalCatIconBg, { backgroundColor: config.color + '1C' }]}>
                    <MaterialCommunityIcons name={config.icon} size={24} color={config.color} />
                  </View>
                  <Text 
                    style={[styles.modalCatLabel, { color: isSelected ? config.color : THEME.COLORS.textPrimary }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
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
    marginBottom: THEME.SPACING.xl,
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
    gap: 12,
  },
  modalCatItem: {
    width: '30%',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: THEME.BORDERS.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
  },
  modalCatItemActive: {
    borderColor: THEME.COLORS.primary,
    backgroundColor: 'rgba(214, 175, 55, 0.08)',
  },
  modalCatIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalCatLabel: {
    fontSize: 9.5,
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
