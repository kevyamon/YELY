// src/components/ui/ScreenHeader.jsx

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BORDERS, COLORS, FONTS, SPACING } from '../../theme/theme';

const ScreenHeader = ({
  // Contenu gauche (zone principale)
  leftIcon,
  leftIconColor = COLORS.champagneGold,
  leftContent,
  leftText,

  // Bouton droit (hamburger par défaut)
  rightIcon = 'menu-outline',
  rightIconColor = COLORS.champagneGold,
  onRightPress,

  // Personnalisation
  backgroundColor = COLORS.deepAsphalt,
  borderBottom = false,
  style,
  children,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.safeArea,
        { paddingTop: insets.top + SPACING.sm },
        { backgroundColor },
        borderBottom && styles.withBorder,
        style,
      ]}
    >
      <View style={styles.content}>
        {/* ─── Zone gauche (flexible) ─── */}
        {children ? (
          <View style={styles.leftSection}>{children}</View>
        ) : leftContent ? (
          <View style={styles.leftSection}>{leftContent}</View>
        ) : (
          <View style={styles.leftContainer}>
            {leftIcon && (
              <View style={[styles.leftIconDot, leftIcon === 'status-online' && styles.leftIconDotOnline]}>
                {leftIcon === 'status-online' || leftIcon === 'status-offline' ? (
                  <View
                    style={[
                      styles.statusDot,
                      leftIcon === 'status-online' && styles.statusDotOnline,
                    ]}
                  />
                ) : (
                  <Ionicons name={leftIcon} size={16} color={leftIconColor} />
                )}
              </View>
            )}
            {leftText && (
              <Text numberOfLines={1} style={styles.leftText}>{leftText}</Text>
            )}
          </View>
        )}

        {/* ─── Bouton droit ─── */}
        {onRightPress && (
          <TouchableOpacity
            style={styles.rightButton}
            onPress={onRightPress}
            activeOpacity={0.7}
          >
            <Ionicons name={rightIcon} size={26} color={rightIconColor} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    paddingBottom: SPACING.sm,
  },
  withBorder: {
    borderBottomWidth: BORDERS.width.thin,
    borderBottomColor: COLORS.glassBorder,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },

  // ─── GAUCHE ───
  leftSection: {
    flex: 1,
    marginRight: SPACING.md,
  },
  leftContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDERS.radius.lg,
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.glassBorder,
    marginRight: SPACING.md,
  },
  leftIconDot: {
    flexShrink: 0,
  },
  leftIconDotOnline: {},
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.textTertiary,
  },
  statusDotOnline: {
    backgroundColor: COLORS.success,
  },
  leftText: {
    color: COLORS.moonlightWhite,
    marginLeft: SPACING.sm,
    fontSize: FONTS.sizes.bodySmall,
    flex: 1,
  },

  // ─── DROITE ───
  rightButton: {
    width: 46,
    height: 46,
    backgroundColor: COLORS.glassDark,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.glassBorder,
  },
});

export default ScreenHeader;