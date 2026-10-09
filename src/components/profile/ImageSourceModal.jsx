// src/components/profile/ImageSourceModal.jsx
// MODALE DE CHOIX DE SOURCE D'IMAGE (APPAREIL PHOTO OU GALERIE)
// CSCSM Level: Bank Grade / Conforme règle < 270 lignes

import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../theme/theme';

const ImageSourceModal = ({
  visible = false,
  title = 'Sélectionner une photo',
  subtitle = 'Choisissez la méthode d\'importation de votre image.',
  onSelectCamera = () => {},
  onSelectGallery = () => {},
  onCancel = () => {},
}) => {
  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={onSelectCamera}
              activeOpacity={0.8}
            >
              <View style={styles.iconCircle}>
                <Ionicons
                  name="camera-outline"
                  size={26}
                  color={THEME.COLORS.champagneGold}
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Prendre une photo</Text>
                <Text style={styles.optionDesc}>
                  Utiliser l'appareil photo de votre téléphone
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={THEME.COLORS.textTertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={onSelectGallery}
              activeOpacity={0.8}
            >
              <View style={styles.iconCircle}>
                <Ionicons
                  name="images-outline"
                  size={26}
                  color={THEME.COLORS.champagneGold}
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Choisir dans la galerie</Text>
                <Text style={styles.optionDesc}>
                  Importer depuis vos albums photos
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={THEME.COLORS.textTertiary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.COLORS.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  card: {
    backgroundColor: THEME.COLORS.glassModal,
    borderRadius: THEME.BORDERS.radius.xxl,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    ...THEME.SHADOWS.strong,
  },
  title: {
    fontSize: THEME.FONTS.sizes.h4,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.champagneGold,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: THEME.FONTS.sizes.caption,
    color: THEME.COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    borderRadius: THEME.BORDERS.radius.xl,
    padding: 14,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: THEME.COLORS.overlay,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: THEME.FONTS.sizes.bodySmall,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: THEME.FONTS.sizes.caption,
    color: THEME.COLORS.textTertiary,
  },
  cancelBtn: {
    width: '100%',
    height: 46,
    borderRadius: THEME.BORDERS.radius.pill,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.overlay,
  },
  cancelBtnText: {
    color: THEME.COLORS.textPrimary,
    fontSize: THEME.FONTS.sizes.bodySmall,
    fontWeight: THEME.FONTS.weights.semiBold,
  },
});

export default React.memo(ImageSourceModal);
