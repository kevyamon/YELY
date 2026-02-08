// src/components/ui/SearchBar.jsx

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

import { BORDERS, COLORS, FONTS, SHADOWS, SPACING } from '../../theme/theme';

const SearchBar = ({
  label = 'On va où ?',
  hint = 'Saisissez votre destination',
  icon = 'search',
  actionIcon = 'arrow-forward',
  onPress,
  glow = true,
  disabled = false,
  style,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.container,
        glow && styles.containerGlow,
        style,
      ]}
    >
      {/* Icône gauche */}
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={18} color={COLORS.champagneGold} />
      </View>

      {/* Textes */}
      <View style={styles.textContainer}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        {hint && <Text style={styles.hint} numberOfLines={1}>{hint}</Text>}
      </View>

      {/* Icône droite */}
      {actionIcon && (
        <View style={styles.actionContainer}>
          <Ionicons name={actionIcon} size={16} color={COLORS.textTertiary} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassMedium,
    borderRadius: BORDERS.radius.xl,
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.soft,
  },
  containerGlow: {
    borderColor: COLORS.glassBorderActive,
    ...SHADOWS.goldSoft,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    color: COLORS.moonlightWhite,
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.semiBold,
  },
  hint: {
    color: COLORS.textTertiary,
    fontSize: FONTS.sizes.caption,
    marginTop: SPACING.xxs,
  },
  actionContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(242, 244, 246, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
});

export default SearchBar;