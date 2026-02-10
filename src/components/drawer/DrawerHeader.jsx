// src/components/drawer/DrawerHeader.jsx

import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { BORDERS, COLORS, FONTS, SPACING } from '../../theme/theme';
import { getInitials, getRoleLabel } from './menuConfig';

const DrawerHeader = ({ user, role }) => {
  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
        </View>
        <View style={styles.onlineIndicator} />
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {user?.name || 'Utilisateur'}
        </Text>
        <Text style={styles.userPhone} numberOfLines={1}>
          {user?.phone || user?.email || ''}
        </Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{getRoleLabel(role)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: BORDERS.width.medium,
    borderColor: COLORS.champagneGold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.champagneGold,
    fontSize: FONTS.sizes.h4,
    fontWeight: FONTS.weights.bold,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.glassDark,
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  userName: {
    color: COLORS.moonlightWhite,
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.semiBold,
  },
  userPhone: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.caption,
    marginTop: SPACING.xxs,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: BORDERS.radius.pill,
    borderWidth: BORDERS.width.thin,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  roleBadgeText: {
    color: COLORS.champagneGold,
    fontSize: FONTS.sizes.micro,
    fontWeight: FONTS.weights.semiBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default DrawerHeader;