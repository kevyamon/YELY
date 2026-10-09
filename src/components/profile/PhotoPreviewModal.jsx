// src/components/profile/PhotoPreviewModal.jsx
// MODALE DE PRÉVISUALISATION ET VALIDATION EXPLICITE DE PHOTO
// CSCSM Level: Bank Grade / Conforme règle < 270 lignes

import React from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../theme/theme';

const PhotoPreviewModal = ({
  visible = false,
  imageUri = null,
  title = 'Confirmer votre photo',
  subtitle = 'Vérifiez la netteté et le cadrage avant de valider votre envoi.',
  isCircular = true,
  isLoading = false,
  onConfirm = () => {},
  onChangePhoto = () => {},
  onCancel = () => {},
}) => {
  if (!visible || !imageUri) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={isLoading ? undefined : onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.badgeIcon}>
              <Ionicons
                name="shield-checkmark"
                size={22}
                color={THEME.COLORS.champagneGold}
              />
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>

          <Text style={styles.subtitle}>{subtitle}</Text>

          <View
            style={[
              styles.imageContainer,
              isCircular ? styles.imageCircular : styles.imageRectangular,
            ]}
          >
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          </View>

          <TouchableOpacity
            style={styles.changeBtn}
            onPress={onChangePhoto}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Ionicons
              name="camera-reverse-outline"
              size={18}
              color={THEME.COLORS.champagneGold}
              style={styles.btnIcon}
            />
            <Text style={styles.changeBtnText}>Changer de photo</Text>
          </TouchableOpacity>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, isLoading && styles.confirmBtnDisabled]}
              onPress={onConfirm}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator
                  size="small"
                  color={THEME.COLORS.textInverse}
                />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color={THEME.COLORS.textInverse}
                    style={styles.btnIcon}
                  />
                  <Text style={styles.confirmBtnText}>VALIDER LA PHOTO</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeIcon: {
    marginRight: 10,
  },
  title: {
    fontSize: THEME.FONTS.sizes.h4,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.champagneGold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: THEME.FONTS.sizes.caption,
    color: THEME.COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  imageContainer: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: THEME.COLORS.champagneGold,
    backgroundColor: THEME.COLORS.glassSurface,
    marginBottom: 16,
    ...THEME.SHADOWS.goldSoft,
  },
  imageCircular: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  imageRectangular: {
    width: '100%',
    height: 180,
    borderRadius: THEME.BORDERS.radius.lg,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: THEME.BORDERS.radius.pill,
    backgroundColor: THEME.COLORS.overlay,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    marginBottom: 20,
  },
  changeBtnText: {
    color: THEME.COLORS.champagneGold,
    fontSize: THEME.FONTS.sizes.caption,
    fontWeight: THEME.FONTS.weights.semiBold,
  },
  btnIcon: {
    marginRight: 6,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
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
  confirmBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: THEME.BORDERS.radius.pill,
    backgroundColor: THEME.COLORS.champagneGold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...THEME.SHADOWS.goldSoft,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: THEME.COLORS.textInverse,
    fontSize: THEME.FONTS.sizes.caption,
    fontWeight: THEME.FONTS.weights.bold,
    letterSpacing: 0.5,
  },
});

export default React.memo(PhotoPreviewModal);
